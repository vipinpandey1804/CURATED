from django.db import models
from apps.core.models import TimestampedModel


class PageView(TimestampedModel):
    path = models.CharField(max_length=500)
    user_id = models.UUIDField(null=True, blank=True)
    session_key = models.CharField(max_length=255, blank=True)
    referrer = models.URLField(blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = "analytics_page_view"
        indexes = [
            models.Index(fields=["path", "created_at"]),
        ]


class ConversionEvent(TimestampedModel):
    class EventType(models.TextChoices):
        ADD_TO_CART = "ADD_TO_CART", "Add to Cart"
        BEGIN_CHECKOUT = "BEGIN_CHECKOUT", "Begin Checkout"
        PURCHASE = "PURCHASE", "Purchase"
        NEWSLETTER_SIGNUP = "NEWSLETTER_SIGNUP", "Newsletter Signup"

    event_type = models.CharField(max_length=25, choices=EventType.choices)
    user_id = models.UUIDField(null=True, blank=True)
    order_id = models.UUIDField(null=True, blank=True)
    product_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "analytics_conversion_event"
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
        ]
