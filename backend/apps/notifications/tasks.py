"""
Async notification tasks — dispatched via Django-Q (django_q.tasks.async_task).

Usage:
    from django_q.tasks import async_task
    async_task('apps.notifications.tasks.send_order_confirmed', order_id=str(order.id))
"""
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _log_notification(user_id, channel, event_type, subject, body_preview, status, error=""):
    """Persist a NotificationLog record after each dispatch attempt."""
    from apps.notifications.models import NotificationLog
    NotificationLog.objects.create(
        user_id=user_id,
        channel=channel,
        event_type=event_type,
        subject=subject,
        body_preview=body_preview[:500],
        status=status,
        error_message=error,
        sent_at=timezone.now() if status == NotificationLog.Status.SENT else None,
    )


def _send_email(to_email, subject, html_body, text_body):
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@curated.com"),
        to=[to_email],
    )
    email.attach_alternative(html_body, "text/html")
    email.send(fail_silently=False)


def _send_sms(to_phone, body):
    """Send SMS via Twilio."""
    twilio_sid   = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    twilio_from  = getattr(settings, "TWILIO_PHONE_NUMBER", "")
    if not (twilio_sid and twilio_token and twilio_from):
        logger.info("DEV MODE — SMS to %s: %s", to_phone, body)
        return
    from twilio.rest import Client
    Client(twilio_sid, twilio_token).messages.create(
        body=body,
        from_=twilio_from,
        to=to_phone,
    )


# ─── Order events ─────────────────────────────────────────────────────────────

def send_order_confirmed(order_id: str):
    """
    Notify user after order is placed — dispatched via Django Q.
    - Has email  → send HTML email
    - Phone only → send SMS with order summary + link
    """
    from apps.orders.models import Order
    try:
        order = Order.objects.select_related("user").prefetch_related("items").get(id=order_id)
    except Order.DoesNotExist:
        logger.error("send_order_confirmed: order %s not found", order_id)
        return

    user      = order.user
    user_name = user.full_name or "there"
    order_url = f"{settings.FRONTEND_URL}/order-confirmation?order={order.order_number}"

    # ── Email path ────────────────────────────────────────────────────────────
    if user.email:
        subject  = f"Order Confirmed — {order.order_number}"
        context  = {"order": order, "user_name": user_name, "frontend_url": settings.FRONTEND_URL}
        html_body = render_to_string("emails/order_confirmed.html", context)
        text_body = (
            f"Hi {user_name},\n\n"
            f"Your order {order.order_number} has been placed.\n"
            f"Total: {order.total}\n\n"
            f"View your order: {order_url}\n\n"
            f"CURATED Team"
        )
        try:
            _send_email(user.email, subject, html_body, text_body)
            _log_notification(user.id, "EMAIL", "order_confirmed", subject, text_body, "SENT")
            logger.info("send_order_confirmed: email sent to %s", user.email)
        except Exception as exc:
            logger.exception("send_order_confirmed email failed: %s", exc)
            _log_notification(user.id, "EMAIL", "order_confirmed", subject, text_body, "FAILED", str(exc))
        return

    # ── SMS path (phone-only user) ────────────────────────────────────────────
    if user.phone_number:
        # Build compact item summary (max 3 items to keep SMS short)
        items = list(order.items.all())
        item_lines = ""
        for item in items[:3]:
            item_lines += f"  {item.product_name} x{item.quantity} — {item.line_total}\n"
        if len(items) > 3:
            item_lines += f"  ...and {len(items) - 3} more item(s)\n"

        sms_body = (
            f"CURATED — Order Confirmed!\n"
            f"Order: {order.order_number}\n"
            f"{item_lines}"
            f"Total: {order.total}\n"
            f"View: {order_url}"
        )
        try:
            _send_sms(user.phone_number, sms_body)
            _log_notification(user.id, "SMS", "order_confirmed", f"Order Confirmed — {order.order_number}", sms_body, "SENT")
            logger.info("send_order_confirmed: SMS sent to %s", user.phone_number)
        except Exception as exc:
            logger.exception("send_order_confirmed SMS failed: %s", exc)
            _log_notification(user.id, "SMS", "order_confirmed", f"Order Confirmed — {order.order_number}", sms_body, "FAILED", str(exc))
        return

    logger.warning("send_order_confirmed: user %s has no email or phone, skipping", user.id)


def send_order_shipped(shipment_id: str):
    """Email + SMS when an order is marked shipped."""
    from apps.fulfillment.models import Shipment
    try:
        shipment = Shipment.objects.select_related("order__user").get(id=shipment_id)
    except Shipment.DoesNotExist:
        logger.error("send_order_shipped: shipment %s not found", shipment_id)
        return

    order = shipment.order
    user = order.user
    subject = f"Your Order Has Shipped — {order.order_number}"
    text_body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"Your order {order.order_number} is on its way!\n"
        f"Carrier: {shipment.carrier or 'N/A'}\n"
        f"Tracking: {shipment.tracking_number or 'N/A'}\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, text_body, text_body)
        _log_notification(user.id, "EMAIL", "order_shipped", subject, text_body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_order_shipped email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "order_shipped", subject, text_body, "FAILED", str(exc))


def send_refund_processed(order_id: str, amount: str):
    """Email after a refund is issued."""
    from apps.orders.models import Order
    try:
        order = Order.objects.select_related("user").get(id=order_id)
    except Order.DoesNotExist:
        logger.error("send_refund_processed: order %s not found", order_id)
        return

    user = order.user
    subject = f"Refund Processed — {order.order_number}"
    text_body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"A refund of {amount} has been processed for order {order.order_number}.\n"
        "Please allow 5-10 business days for it to appear.\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, text_body, text_body)
        _log_notification(user.id, "EMAIL", "refund_processed", subject, text_body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_refund_processed email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "refund_processed", subject, text_body, "FAILED", str(exc))


def send_return_approved(return_request_id: str):
    """Email when ops approves a return request."""
    from apps.returns.models import ReturnRequest
    try:
        rr = ReturnRequest.objects.select_related("user", "order").get(id=return_request_id)
    except ReturnRequest.DoesNotExist:
        logger.error("send_return_approved: return request %s not found", return_request_id)
        return

    user = rr.user
    subject = f"Return Approved — {rr.order.order_number}"
    text_body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"Your return request for order {rr.order.order_number} has been approved.\n"
        "Please ship the items back within 7 days.\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, text_body, text_body)
        _log_notification(user.id, "EMAIL", "return_approved", subject, text_body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_return_approved email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "return_approved", subject, text_body, "FAILED", str(exc))


# ─── Inventory: activate reservoir after payment ──────────────────────────────

def commit_stock_reservations(order_id: str):
    """
    Convert StockReservations into committed InventoryMovement(SALE) records.
    Called after checkout.session.completed webhook is processed.
    """
    from django.db import transaction
    from apps.inventory.models import StockReservation, InventoryMovement, StockLevel
    from apps.orders.models import Order

    try:
        order = Order.objects.prefetch_related("items__variant__stock").get(id=order_id)
    except Order.DoesNotExist:
        logger.error("commit_stock_reservations: order %s not found", order_id)
        return

    with transaction.atomic():
        for item in order.items.all():
            if not item.variant:
                continue
            try:
                stock_level = item.variant.stock
            except StockLevel.DoesNotExist:
                logger.warning("commit_stock_reservations: no stock level for variant %s", item.variant_id)
                continue

            # Deactivate matching reservation
            reservation = StockReservation.objects.filter(
                stock_level=stock_level,
                order_reference=str(order_id),
                is_active=True,
            ).first()
            if reservation:
                reservation.is_active = False
                reservation.save(update_fields=["is_active"])

            # Record the sale movement
            InventoryMovement.objects.create(
                stock_level=stock_level,
                movement_type=InventoryMovement.MovementType.SALE,
                quantity_change=-item.quantity,
                reference=f"ORDER:{order.order_number}",
            )
