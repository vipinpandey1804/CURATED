from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class WishlistItem(TimestampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist_items"
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="wishlisted_by"
    )

    class Meta:
        db_table = "wishlists_wishlist_item"
        unique_together = [("user", "product")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} ♥ {self.product.name}"
