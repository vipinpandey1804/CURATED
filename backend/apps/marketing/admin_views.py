from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import CouponCode


class AdminCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouponCode
        fields = [
            "id", "code", "description", "discount_type", "discount_value",
            "max_discount", "max_discount_currency",
            "min_order_amount", "min_order_amount_currency",
            "max_uses", "times_used",
            "valid_from", "valid_until", "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "times_used", "created_at"]


class AdminCouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCouponSerializer
    queryset = CouponCode.objects.all().order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["is_active", "discount_type"]
    search_fields = ["code", "description"]
