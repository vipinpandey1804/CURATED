from rest_framework import serializers
from .models import Shipment, ShipmentItem, ShippingRule


class ShipmentItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="order_item.product_name", read_only=True)

    class Meta:
        model = ShipmentItem
        fields = ["id", "product_name", "quantity"]


class ShipmentSerializer(serializers.ModelSerializer):
    items = ShipmentItemSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id", "carrier", "tracking_number", "status",
            "shipped_at", "delivered_at", "items", "created_at",
        ]


class ShippingRuleSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source="zone.name", read_only=True)

    class Meta:
        model = ShippingRule
        fields = [
            "id", "zone_name", "name", "base_rate", "base_rate_currency",
            "free_above", "free_above_currency",
            "estimated_days_min", "estimated_days_max",
        ]
