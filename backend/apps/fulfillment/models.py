from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


class ShippingZone(TimestampedModel):
    name = models.CharField(max_length=200)
    countries = models.JSONField(default=list, help_text="List of ISO 3166-1 alpha-2 codes")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "fulfillment_shipping_zone"

    def __str__(self):
        return self.name


class ShippingRule(TimestampedModel):
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name="rules")
    name = models.CharField(max_length=200, help_text="e.g. 'Standard', 'Express'")
    base_rate = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    free_above = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD",
        null=True, blank=True, help_text="Free shipping threshold",
    )
    estimated_days_min = models.PositiveIntegerField(default=3)
    estimated_days_max = models.PositiveIntegerField(default=7)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "fulfillment_shipping_rule"

    def __str__(self):
        return f"{self.zone.name} — {self.name}"


class Shipment(TimestampedModel):
    class ShipmentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SHIPPED = "SHIPPED", "Shipped"
        IN_TRANSIT = "IN_TRANSIT", "In Transit"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="shipments"
    )
    carrier = models.CharField(max_length=100, blank=True)
    tracking_number = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=15, choices=ShipmentStatus.choices, default=ShipmentStatus.PENDING
    )
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "fulfillment_shipment"

    def __str__(self):
        return f"Shipment for {self.order.order_number} ({self.status})"


class ShipmentItem(TimestampedModel):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name="items")
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.CASCADE, related_name="shipment_items"
    )
    quantity = models.PositiveIntegerField()

    class Meta:
        db_table = "fulfillment_shipment_item"

    def __str__(self):
        return f"{self.quantity}x {self.order_item.product_name}"
