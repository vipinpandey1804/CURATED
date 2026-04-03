from django.db import models
from django.conf import settings

from apps.core.models import TimestampedModel


class StockLevel(TimestampedModel):
    """Tracks current stock for a product variant. quantity_available is computed."""

    variant = models.OneToOneField(
        "catalog.ProductVariant", on_delete=models.CASCADE, related_name="stock"
    )

    class Meta:
        db_table = "inventory_stock_level"

    def __str__(self):
        return f"Stock({self.variant}) = {self.quantity_available}"

    @property
    def quantity_available(self):
        """Computed from InventoryMovement records — never stored."""
        from django.db.models import Sum

        result = self.movements.aggregate(total=Sum("quantity_change"))
        total = result["total"] or 0
        reserved = self.reservations.filter(is_active=True).aggregate(
            total=Sum("quantity")
        )["total"] or 0
        return total - reserved


class InventoryMovement(TimestampedModel):
    """Immutable ledger entry. Positive = stock in, negative = stock out."""

    class MovementType(models.TextChoices):
        PURCHASE = "PURCHASE", "Purchase / Restock"
        SALE = "SALE", "Sale"
        RETURN = "RETURN", "Return"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        DAMAGE = "DAMAGE", "Damage / Loss"

    stock_level = models.ForeignKey(
        StockLevel, on_delete=models.CASCADE, related_name="movements"
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity_change = models.IntegerField(help_text="Positive=in, negative=out")
    reference = models.CharField(
        max_length=255, blank=True, help_text="Order ID, PO number, etc."
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="inventory_movements",
    )

    class Meta:
        db_table = "inventory_movement"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["stock_level", "movement_type"]),
            models.Index(fields=["movement_type", "created_at"]),
        ]

    def __str__(self):
        return f"{self.movement_type} {self.quantity_change:+d} for {self.stock_level.variant}"


class StockReservation(TimestampedModel):
    """Temporary hold on stock during checkout (15-min TTL)."""

    stock_level = models.ForeignKey(
        StockLevel, on_delete=models.CASCADE, related_name="reservations"
    )
    quantity = models.PositiveIntegerField()
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    order_reference = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "inventory_stock_reservation"
        indexes = [
            models.Index(fields=["is_active", "expires_at"]),
        ]

    def __str__(self):
        status = "active" if self.is_active else "released"
        return f"Reserve {self.quantity}x {self.stock_level.variant} ({status})"
