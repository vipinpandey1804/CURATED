from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


class CouponCode(TimestampedModel):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage"
        FIXED = "FIXED", "Fixed Amount"

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=12, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD",
        null=True, blank=True, help_text="Cap for percentage discounts",
    )
    min_order_amount = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD",
        null=True, blank=True,
    )
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "marketing_coupon_code"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code


class NewsletterSubscription(TimestampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "marketing_newsletter_subscription"

    def __str__(self):
        return self.email
