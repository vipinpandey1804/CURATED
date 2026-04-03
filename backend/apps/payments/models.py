from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


class StripeSession(TimestampedModel):
    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="stripe_sessions"
    )
    stripe_session_id = models.CharField(max_length=255, unique=True, db_index=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=50, default="created")
    checkout_url = models.URLField(blank=True)

    class Meta:
        db_table = "payments_stripe_session"

    def __str__(self):
        return f"StripeSession({self.stripe_session_id[:20]}...) for {self.order.order_number}"


class PaymentTransaction(TimestampedModel):
    class TransactionType(models.TextChoices):
        CHARGE = "CHARGE", "Charge"
        REFUND = "REFUND", "Refund"

    class TransactionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="payment_transactions"
    )
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    status = models.CharField(max_length=15, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, db_index=True)

    # Amount in customer's currency
    amount = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    # Settled amount (what Stripe deposited)
    settled_amount = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD",
        null=True, blank=True,
    )

    failure_reason = models.TextField(blank=True)

    class Meta:
        db_table = "payments_transaction"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "transaction_type"]),
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} ({self.status})"


class WebhookEvent(TimestampedModel):
    stripe_event_id = models.CharField(max_length=255, unique=True, db_index=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="received")
    error_message = models.TextField(blank=True)

    class Meta:
        db_table = "payments_webhook_event"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["stripe_event_id"]),
            models.Index(fields=["event_type", "status"]),
        ]

    def __str__(self):
        return f"WebhookEvent({self.event_type}: {self.stripe_event_id[:20]}...)"
