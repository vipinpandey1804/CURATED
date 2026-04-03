from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product_name", "variant_name", "sku",
            "unit_price", "unit_price_currency", "quantity",
            "line_total", "line_total_currency", "product_image_url",
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True, default=None)

    class Meta:
        model = OrderStatusHistory
        fields = ["id", "old_status", "new_status", "changed_by_email", "note", "created_at"]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "payment_status", "fulfillment_status",
            "total", "total_currency", "item_count", "created_at",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "payment_status", "fulfillment_status",
            "subtotal", "subtotal_currency",
            "shipping_cost", "shipping_cost_currency",
            "discount_amount", "discount_amount_currency",
            "total", "total_currency",
            "shipping_full_name", "shipping_address_line_1", "shipping_address_line_2",
            "shipping_city", "shipping_state", "shipping_postal_code", "shipping_country",
            "shipping_phone",
            "coupon_code", "notes",
            "items", "status_history", "created_at",
        ]


class CreateOrderSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    billing_address_id = serializers.UUIDField(required=False)
    shipping_method = serializers.CharField(max_length=50, default="standard")
    notes = serializers.CharField(required=False, default="", allow_blank=True)
