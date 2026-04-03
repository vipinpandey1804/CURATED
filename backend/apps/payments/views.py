import stripe
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from .models import StripeSession, PaymentTransaction, WebhookEvent
from .serializers import CreateCheckoutSessionSerializer, StripeSessionSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    """
    POST /api/v1/payments/create-session/
    Creates a Stripe Checkout Session for the given order.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(
                order_number=serializer.validated_data["order_number"],
                user=request.user,
                payment_status=Order.PaymentStatus.UNPAID,
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "ORDER_NOT_FOUND", "detail": "Order not found or already paid."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Build line items from snapshotted order items
        line_items = []
        for item in order.items.all():
            line_items.append({
                "price_data": {
                    "currency": str(order.total_currency).lower(),
                    "product_data": {
                        "name": item.product_name,
                        "description": item.variant_name or "",
                    },
                    "unit_amount": int(item.unit_price.amount * 100),
                },
                "quantity": item.quantity,
            })

        # Add shipping as a line item if > 0
        if order.shipping_cost.amount > 0:
            line_items.append({
                "price_data": {
                    "currency": str(order.total_currency).lower(),
                    "product_data": {"name": "Shipping"},
                    "unit_amount": int(order.shipping_cost.amount * 100),
                },
                "quantity": 1,
            })

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/order-confirmation?order={order.order_number}",
                cancel_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/cart",
                client_reference_id=str(order.id),
                customer_email=request.user.email,
                metadata={
                    "order_number": order.order_number,
                    "order_id": str(order.id),
                },
            )
        except stripe.error.StripeError as e:
            return Response(
                {"error": "STRIPE_ERROR", "detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Save session record
        StripeSession.objects.create(
            order=order,
            stripe_session_id=checkout_session.id,
            checkout_url=checkout_session.url,
            status="created",
        )

        return Response(
            {"checkout_url": checkout_session.url, "session_id": checkout_session.id},
            status=status.HTTP_201_CREATED,
        )


class StripeWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/
    Handles Stripe webhook events. Verifies signature.
    Returns 200 immediately; processes synchronously in atomic block.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return HttpResponse(status=400)

        # Idempotency: reject duplicate events
        event_id = event["id"]
        if WebhookEvent.objects.filter(stripe_event_id=event_id).exists():
            return HttpResponse(status=200)

        webhook_event = WebhookEvent.objects.create(
            stripe_event_id=event_id,
            event_type=event["type"],
            payload=event["data"],
        )

        try:
            with transaction.atomic():
                self._process_event(event, webhook_event)
                webhook_event.processed_at = timezone.now()
                webhook_event.status = "processed"
                webhook_event.save(update_fields=["processed_at", "status"])
        except Exception as e:
            webhook_event.status = "failed"
            webhook_event.error_message = str(e)
            webhook_event.save(update_fields=["status", "error_message"])

        return HttpResponse(status=200)

    def _process_event(self, event, webhook_event):
        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(data)
        elif event_type == "payment_intent.payment_failed":
            self._handle_payment_failed(data)

    def _handle_checkout_completed(self, session_data):
        session_id = session_data["id"]
        stripe_session = StripeSession.objects.select_related("order").get(
            stripe_session_id=session_id
        )
        order = stripe_session.order

        stripe_session.status = "complete"
        stripe_session.stripe_payment_intent_id = session_data.get("payment_intent", "")
        stripe_session.save(update_fields=["status", "stripe_payment_intent_id"])

        PaymentTransaction.objects.create(
            order=order,
            transaction_type=PaymentTransaction.TransactionType.CHARGE,
            status=PaymentTransaction.TransactionStatus.SUCCEEDED,
            stripe_payment_intent_id=session_data.get("payment_intent", ""),
            amount=order.total,
        )

        order.payment_status = Order.PaymentStatus.PAID
        order.status = Order.OrderStatus.CONFIRMED
        order.save(update_fields=["payment_status", "status"])

        # Dispatch async tasks via Django-Q
        from django_q.tasks import async_task
        async_task("apps.notifications.tasks.commit_stock_reservations", str(order.id))
        async_task("apps.notifications.tasks.send_order_confirmed", str(order.id))

    def _handle_payment_failed(self, data):
        payment_intent_id = data.get("id", "")
        session = StripeSession.objects.filter(
            stripe_payment_intent_id=payment_intent_id
        ).select_related("order").first()
        if session:
            order = session.order
            PaymentTransaction.objects.create(
                order=order,
                transaction_type=PaymentTransaction.TransactionType.CHARGE,
                status=PaymentTransaction.TransactionStatus.FAILED,
                stripe_payment_intent_id=payment_intent_id,
                amount=order.total,
                failure_reason=data.get("last_payment_error", {}).get("message", ""),
            )
            order.payment_status = Order.PaymentStatus.FAILED
            order.save(update_fields=["payment_status"])
