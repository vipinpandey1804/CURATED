from rest_framework import viewsets, permissions
from .models import StockLevel, InventoryMovement
from .serializers import StockLevelSerializer, InventoryMovementSerializer


class StockLevelViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StockLevelSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return StockLevel.objects.select_related("variant__product").all()


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryMovementSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return InventoryMovement.objects.select_related("stock_level__variant").all()
