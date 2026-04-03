from rest_framework import serializers
from .models import ReturnRequest, ReturnLineItem


class ReturnLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="order_item.product_name", read_only=True)

    class Meta:
        model = ReturnLineItem
        fields = ["id", "order_item", "product_name", "quantity", "reason_code", "notes"]


class ReturnRequestSerializer(serializers.ModelSerializer):
    line_items = ReturnLineItemSerializer(many=True, read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            "id", "order", "status", "reason", "line_items",
            "created_at", "reviewed_at",
        ]
        read_only_fields = ["id", "status", "reviewed_at"]


class CreateReturnRequestSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=20)
    reason = serializers.CharField(required=False, default="", allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(), min_length=1,
        help_text="List of {order_item_id, quantity, reason_code, notes}",
    )

    def validate_items(self, value):
        for item in value:
            if "order_item_id" not in item or "quantity" not in item or "reason_code" not in item:
                raise serializers.ValidationError(
                    "Each item must have order_item_id, quantity, and reason_code."
                )
        return value
