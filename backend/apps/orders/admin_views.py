from django.utils import timezone
from rest_framework import serializers, viewsets, generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Order, OrderItem, OrderStatusHistory


# ─── Serializers ──────────────────────────────────────────────────────────────

class AdminOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product_name", "variant_name", "sku",
            "unit_price", "unit_price_currency",
            "quantity", "line_total", "line_total_currency",
            "product_image_url",
        ]


class AdminOrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True, default=None)

    class Meta:
        model = OrderStatusHistory
        fields = ["id", "old_status", "new_status", "changed_by_email", "note", "created_at"]


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)
    status_history = AdminOrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "user_email", "user_name",
            "status", "payment_status", "fulfillment_status",
            "subtotal", "subtotal_currency",
            "shipping_cost", "shipping_cost_currency",
            "discount_amount", "discount_amount_currency",
            "total", "total_currency",
            "shipping_full_name", "shipping_address_line_1", "shipping_address_line_2",
            "shipping_city", "shipping_state", "shipping_postal_code", "shipping_country",
            "shipping_phone", "coupon_code", "notes",
            "items", "status_history", "created_at", "updated_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class AdminOrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view — no items/history."""
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "user_email", "user_name",
            "status", "payment_status", "fulfillment_status",
            "total", "total_currency", "item_count", "created_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_item_count(self, obj):
        return obj.items.count()


class AdminOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.OrderStatus.choices, required=False)
    payment_status = serializers.ChoiceField(choices=Order.PaymentStatus.choices, required=False)
    fulfillment_status = serializers.ChoiceField(choices=Order.FulfillmentStatus.choices, required=False)
    note = serializers.CharField(required=False, allow_blank=True, default="")


# ─── Views ────────────────────────────────────────────────────────────────────

class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Order.objects.select_related("user").prefetch_related("items", "status_history__changed_by").order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "payment_status", "fulfillment_status"]
    search_fields = ["order_number", "user__email", "user__first_name", "user__last_name"]
    ordering_fields = ["created_at", "total"]

    def get_serializer_class(self):
        if self.action == "list":
            return AdminOrderListSerializer
        return AdminOrderSerializer


class AdminOrderStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderStatusUpdateSerializer
    queryset = Order.objects.all()
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        old_status = order.status
        changed = False

        if "status" in data and data["status"] != order.status:
            OrderStatusHistory.objects.create(
                order=order,
                old_status=order.status,
                new_status=data["status"],
                changed_by=request.user,
                note=data.get("note", ""),
            )
            order.status = data["status"]
            changed = True

        if "payment_status" in data:
            order.payment_status = data["payment_status"]
            changed = True

        if "fulfillment_status" in data:
            order.fulfillment_status = data["fulfillment_status"]
            changed = True

        if changed:
            order.save()

        return Response(AdminOrderSerializer(order, context={"request": request}).data)
