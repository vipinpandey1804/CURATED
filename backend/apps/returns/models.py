from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class ReturnRequest(TimestampedModel):
    class ReturnStatus(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        RECEIVED = "RECEIVED", "Received"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="return_requests"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="return_requests"
    )
    status = models.CharField(
        max_length=15, choices=ReturnStatus.choices, default=ReturnStatus.REQUESTED
    )
    reason = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_returns",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "returns_return_request"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Return for {self.order.order_number} ({self.status})"


class ReturnLineItem(TimestampedModel):
    class ReasonCode(models.TextChoices):
        DEFECTIVE = "DEFECTIVE", "Defective"
        WRONG_ITEM = "WRONG_ITEM", "Wrong Item"
        WRONG_SIZE = "WRONG_SIZE", "Wrong Size"
        NOT_AS_DESCRIBED = "NOT_AS_DESCRIBED", "Not As Described"
        CHANGED_MIND = "CHANGED_MIND", "Changed Mind"
        OTHER = "OTHER", "Other"

    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name="line_items"
    )
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.CASCADE, related_name="return_line_items"
    )
    quantity = models.PositiveIntegerField()
    reason_code = models.CharField(max_length=20, choices=ReasonCode.choices)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "returns_return_line_item"

    def __str__(self):
        return f"Return {self.quantity}x {self.order_item.product_name}"
