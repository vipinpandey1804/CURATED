import uuid
from django.conf import settings
from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


def generate_order_number():
    """Server-generated order number — never from the client."""
    return f"CUR-{uuid.uuid4().hex[:8].upper()}"


class Order(TimestampedModel):
    class OrderStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PROCESSING = "PROCESSING", "Processing"
        SHIPPED = "SHIPPED", "Shipped"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PAID = "PAID", "Paid"
        PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED", "Partially Refunded"
        FULLY_REFUNDED = "FULLY_REFUNDED", "Fully Refunded"
        FAILED = "FAILED", "Failed"

    class FulfillmentStatus(models.TextChoices):
        UNFULFILLED = "UNFULFILLED", "Unfulfilled"
        PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED", "Partially Fulfilled"
        FULFILLED = "FULFILLED", "Fulfilled"

    order_number = models.CharField(max_length=20, unique=True, default=generate_order_number)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders"
    )
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    payment_status = models.CharField(
        max_length=25, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )
    fulfillment_status = models.CharField(
        max_length=25, choices=FulfillmentStatus.choices, default=FulfillmentStatus.UNFULFILLED
    )

    # Monetary fields — all server-calculated
    subtotal = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    shipping_cost = MoneyField(max_digits=10, decimal_places=2, default_currency="USD", default=0)
    discount_amount = MoneyField(max_digits=10, decimal_places=2, default_currency="USD", default=0)
    total = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")

    # Shipping address — snapshotted at order time
    shipping_full_name = models.CharField(max_length=300)
    shipping_address_line_1 = models.CharField(max_length=255)
    shipping_address_line_2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=2)
    shipping_phone = models.CharField(max_length=20, blank=True)

    # Billing address — snapshotted
    billing_full_name = models.CharField(max_length=300, blank=True)
    billing_address_line_1 = models.CharField(max_length=255, blank=True)
    billing_address_line_2 = models.CharField(max_length=255, blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_state = models.CharField(max_length=100, blank=True)
    billing_postal_code = models.CharField(max_length=20, blank=True)
    billing_country = models.CharField(max_length=2, blank=True)

    coupon_code = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "orders_order"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["payment_status"]),
        ]

    def __str__(self):
        return f"Order {self.order_number}"


class OrderItem(TimestampedModel):
    """
    Snapshotted at purchase time. Catalog changes never mutate order history.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.SET_NULL,
        null=True, related_name="order_items",
    )
    # Snapshotted fields
    product_name = models.CharField(max_length=300)
    variant_name = models.CharField(max_length=300, blank=True)
    sku = models.CharField(max_length=100)
    unit_price = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    quantity = models.PositiveIntegerField()
    line_total = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    product_image_url = models.URLField(blank=True)

    class Meta:
        db_table = "orders_order_item"

    def __str__(self):
        return f"{self.quantity}x {self.product_name} @ {self.unit_price}"


class OrderStatusHistory(TimestampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="order_status_changes",
    )
    note = models.TextField(blank=True)

    class Meta:
        db_table = "orders_order_status_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.order_number}: {self.old_status} → {self.new_status}"
