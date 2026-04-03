from rest_framework import serializers
from apps.catalog.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "created_at"]


class ToggleWishlistSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
