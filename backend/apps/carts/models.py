from django.conf import settings
from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


class Cart(TimestampedModel):
    class CartStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        MERGED = "MERGED", "Merged"
        CHECKED_OUT = "CHECKED_OUT", "Checked Out"
        ABANDONED = "ABANDONED", "Abandoned"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="carts", null=True, blank=True,
    )
    session_key = models.CharField(max_length=255, blank=True, db_index=True)
    status = models.CharField(max_length=15, choices=CartStatus.choices, default=CartStatus.ACTIVE)
    coupon = models.ForeignKey(
        "marketing.CouponCode", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="carts",
    )

    class Meta:
        db_table = "carts_cart"
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        owner = self.user.email if self.user else self.session_key[:8]
        return f"Cart({owner}) — {self.status}"

    @property
    def subtotal(self):
        from djmoney.money import Money
        total = Money(0, "USD")
        for item in self.items.select_related("variant__product"):
            total += item.line_total
        return total

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(TimestampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "carts_cart_item"
        unique_together = [("cart", "variant")]

    def __str__(self):
        return f"{self.quantity}x {self.variant}"

    @property
    def unit_price(self):
        return self.variant.effective_price

    @property
    def line_total(self):
        return self.variant.effective_price * self.quantity
