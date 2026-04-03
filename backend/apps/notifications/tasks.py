"""
Async notification tasks — dispatched via Django-Q (django_q.tasks.async_task).

Usage:
    from django_q.tasks import async_task
    async_task('apps.notifications.tasks.send_order_confirmed', order_id=str(order.id))
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
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


def _send_email(to_email, subject, body):
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, "DEFAULT_FROM_EMAIL") else "noreply@curated.com",
        recipient_list=[to_email],
        fail_silently=False,
    )


# ─── Order events ─────────────────────────────────────────────────────────────

def send_order_confirmed(order_id: str):
    """Email + SMS after order is confirmed (payment webhook fires)."""
    from apps.orders.models import Order
    try:
        order = Order.objects.select_related("user").get(id=order_id)
    except Order.DoesNotExist:
        logger.error("send_order_confirmed: order %s not found", order_id)
        return

    user = order.user
    subject = f"Order Confirmed — {order.order_number}"
    body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"Your order {order.order_number} has been confirmed.\n"
        f"Total: {order.total}\n\n"
        "Thank you for shopping with CURATED."
    )

    try:
        _send_email(user.email, subject, body)
        _log_notification(user.id, "EMAIL", "order_confirmed", subject, body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_order_confirmed email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "order_confirmed", subject, body, "FAILED", str(exc))


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
    body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"Your order {order.order_number} is on its way!\n"
        f"Carrier: {shipment.carrier or 'N/A'}\n"
        f"Tracking: {shipment.tracking_number or 'N/A'}\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, body)
        _log_notification(user.id, "EMAIL", "order_shipped", subject, body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_order_shipped email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "order_shipped", subject, body, "FAILED", str(exc))


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
    body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"A refund of {amount} has been processed for order {order.order_number}.\n"
        "Please allow 5-10 business days for it to appear.\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, body)
        _log_notification(user.id, "EMAIL", "refund_processed", subject, body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_refund_processed email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "refund_processed", subject, body, "FAILED", str(exc))


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
    body = (
        f"Hi {user.full_name or user.email},\n\n"
        f"Your return request for order {rr.order.order_number} has been approved.\n"
        "Please ship the items back within 7 days.\n\n"
        "CURATED Team"
    )

    try:
        _send_email(user.email, subject, body)
        _log_notification(user.id, "EMAIL", "return_approved", subject, body, "SENT")
    except Exception as exc:  # noqa: BLE001
        logger.exception("send_return_approved email failed: %s", exc)
        _log_notification(user.id, "EMAIL", "return_approved", subject, body, "FAILED", str(exc))


# ─── Inventory: activate reservoir after payment ──────────────────────────────

def commit_stock_reservations(order_id: str):
    """
    Convert StockReservations into committed InventoryMovement(SALE) records.
    Called after checkout.session.completed webhook is processed.
    """
    from django.db import transaction
    from apps.inventory.models import StockReservation, InventoryMovement

    reservations = StockReservation.objects.filter(
        cart__order__id=order_id,
        is_active=True,
    ).select_related("cart", "variant")

    with transaction.atomic():
        for res in reservations:
            InventoryMovement.objects.create(
                variant=res.variant,
                movement_type=InventoryMovement.MovementType.SALE,
                quantity_change=-res.quantity,
                reference=f"ORDER:{order_id}",
            )
            res.is_active = False
            res.save(update_fields=["is_active"])
