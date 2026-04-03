from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from apps.core.models import TimestampedModel


class Review(TimestampedModel):
    class ModerationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="review",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    moderation_status = models.CharField(
        max_length=10, choices=ModerationStatus.choices, default=ModerationStatus.PENDING
    )

    class Meta:
        db_table = "reviews_review"
        ordering = ["-created_at"]
        unique_together = [("product", "user")]
        indexes = [
            models.Index(fields=["product", "moderation_status"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"Review by {self.user.email} for {self.product.name} ({self.rating}★)"


class ReviewImage(TimestampedModel):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reviews/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "reviews_review_image"
        ordering = ["sort_order"]
