from rest_framework import serializers
from .models import StockLevel, InventoryMovement


class StockLevelSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    quantity_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = StockLevel
        fields = ["id", "variant_sku", "variant_name", "product_name", "quantity_available"]


class InventoryMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryMovement
        fields = [
            "id", "stock_level", "movement_type", "quantity_change",
            "reference", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
