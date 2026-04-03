from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order, OrderItem
from .models import ReturnRequest, ReturnLineItem
from .serializers import (
    ReturnRequestSerializer,
    CreateReturnRequestSerializer,
)


class ReturnRequestListView(generics.ListAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ReturnRequest.objects.filter(user=self.request.user)
            .prefetch_related("line_items__order_item")
        )


class ReturnRequestDetailView(generics.RetrieveAPIView):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ReturnRequest.objects.filter(user=self.request.user)
            .prefetch_related("line_items__order_item")
        )


class CreateReturnRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateReturnRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(
                order_number=serializer.validated_data["order_number"],
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "ORDER_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            return_req = ReturnRequest.objects.create(
                order=order,
                user=request.user,
                reason=serializer.validated_data.get("reason", ""),
            )

            for item_data in serializer.validated_data["items"]:
                try:
                    order_item = OrderItem.objects.get(
                        id=item_data["order_item_id"], order=order
                    )
                except OrderItem.DoesNotExist:
                    continue

                ReturnLineItem.objects.create(
                    return_request=return_req,
                    order_item=order_item,
                    quantity=item_data["quantity"],
                    reason_code=item_data["reason_code"],
                    notes=item_data.get("notes", ""),
                )

        return Response(
            ReturnRequestSerializer(return_req).data,
            status=status.HTTP_201_CREATED,
        )
