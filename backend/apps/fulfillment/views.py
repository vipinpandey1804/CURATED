from rest_framework import generics, permissions
from .models import Shipment, ShippingRule
from .serializers import ShipmentSerializer, ShippingRuleSerializer


class OrderShipmentsView(generics.ListAPIView):
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        order_number = self.kwargs["order_number"]
        return (
            Shipment.objects.filter(
                order__order_number=order_number,
                order__user=self.request.user,
            )
            .prefetch_related("items__order_item")
        )


class ShippingRuleListView(generics.ListAPIView):
    serializer_class = ShippingRuleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ShippingRule.objects.filter(is_active=True).select_related("zone")
        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(zone__countries__contains=country)
        return qs
