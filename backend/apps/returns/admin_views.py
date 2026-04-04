from django.utils import timezone
from rest_framework import serializers, viewsets, generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import ReturnRequest, ReturnLineItem
from apps.inventory.models import StockLevel, InventoryMovement


# ─── Serializers ──────────────────────────────────────────────────────────────

class AdminReturnLineItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="order_item.product_name", read_only=True)
    sku = serializers.CharField(source="order_item.sku", read_only=True)

    class Meta:
        model = ReturnLineItem
        fields = ["id", "product_name", "sku", "quantity", "reason_code", "notes"]


class AdminReturnRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    line_items = AdminReturnLineItemSerializer(many=True, read_only=True)
    reviewed_by_email = serializers.EmailField(source="reviewed_by.email", read_only=True, default=None)

    class Meta:
        model = ReturnRequest
        fields = [
            "id", "order_number", "user_email", "user_name",
            "status", "reason", "admin_notes",
            "reviewed_by_email", "reviewed_at",
            "line_items", "created_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class AdminReturnActionSerializer(serializers.Serializer):
    admin_notes = serializers.CharField(required=False, allow_blank=True, default="")


# ─── Views ────────────────────────────────────────────────────────────────────

class AdminReturnRequestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReturnRequestSerializer
    queryset = ReturnRequest.objects.select_related(
        "user", "order", "reviewed_by"
    ).prefetch_related("line_items__order_item").order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["status"]
    search_fields = ["order__order_number", "user__email"]


class AdminReturnApproveView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReturnActionSerializer
    queryset = ReturnRequest.objects.all()
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        return_request = self.get_object()

        if return_request.status != ReturnRequest.ReturnStatus.REQUESTED:
            return Response(
                {"detail": "Only REQUESTED returns can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return_request.status = ReturnRequest.ReturnStatus.APPROVED
        return_request.reviewed_by = request.user
        return_request.reviewed_at = timezone.now()
        if serializer.validated_data.get("admin_notes"):
            return_request.admin_notes = serializer.validated_data["admin_notes"]
        return_request.save()

        # Restock inventory for each line item
        for line_item in return_request.line_items.select_related("order_item__variant").all():
            variant = line_item.order_item.variant
            if variant:
                stock_level, _ = StockLevel.objects.get_or_create(variant=variant)
                InventoryMovement.objects.create(
                    stock_level=stock_level,
                    movement_type=InventoryMovement.MovementType.RETURN,
                    quantity_change=line_item.quantity,
                    reference=str(return_request.id),
                    notes=f"Return approved by {request.user.email}",
                    created_by=request.user,
                )

        return Response(AdminReturnRequestSerializer(return_request, context={"request": request}).data)


class AdminReturnRejectView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminReturnActionSerializer
    queryset = ReturnRequest.objects.all()
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        return_request = self.get_object()

        if return_request.status != ReturnRequest.ReturnStatus.REQUESTED:
            return Response(
                {"detail": "Only REQUESTED returns can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return_request.status = ReturnRequest.ReturnStatus.REJECTED
        return_request.reviewed_by = request.user
        return_request.reviewed_at = timezone.now()
        if serializer.validated_data.get("admin_notes"):
            return_request.admin_notes = serializer.validated_data["admin_notes"]
        return_request.save()

        return Response(AdminReturnRequestSerializer(return_request, context={"request": request}).data)
