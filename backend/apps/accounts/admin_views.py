from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from rest_framework import serializers, viewsets, generics
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.orders.models import Order
from apps.returns.models import ReturnRequest
from apps.catalog.models import Product

User = get_user_model()


# ─── Serializers ──────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "phone_number", "full_name",
            "first_name", "last_name",
            "is_verified", "is_staff", "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "phone_number", "full_name", "first_name", "last_name", "is_verified", "date_joined"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_staff", "is_active"]


# ─── Views ────────────────────────────────────────────────────────────────────

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_staff", "is_active", "is_verified"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering_fields = ["date_joined", "email"]
    http_method_names = ["get", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminUserUpdateSerializer
        return AdminUserSerializer


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        trend_start = today_start - timedelta(days=6)
        trend_days = [trend_start.date() + timedelta(days=offset) for offset in range(7)]

        total_products = Product.objects.filter(is_active=True).count()
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__gte=today_start).count()

        orders_by_status = {
            s: Order.objects.filter(status=s).count()
            for s in [c[0] for c in Order.OrderStatus.choices]
        }
        pending_returns = ReturnRequest.objects.filter(
            status=ReturnRequest.ReturnStatus.REQUESTED
        ).count()
        returns_by_status = {
            status: ReturnRequest.objects.filter(status=status).count()
            for status in [choice[0] for choice in ReturnRequest.ReturnStatus.choices]
        }

        def revenue_for_period(start):
            result = Order.objects.filter(
                payment_status=Order.PaymentStatus.PAID,
                created_at__gte=start,
            ).aggregate(total=Sum("total"))
            return float(result["total"] or 0)

        paid_order_trend = {
            row["day"]: float(row["revenue"] or 0)
            for row in Order.objects.filter(
                payment_status=Order.PaymentStatus.PAID,
                created_at__gte=trend_start,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"))
        }
        order_count_trend = {
            row["day"]: row["orders"]
            for row in Order.objects.filter(created_at__gte=trend_start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(orders=Count("id"))
        }
        user_growth_trend = {
            row["day"]: row["users"]
            for row in User.objects.filter(date_joined__gte=trend_start)
            .annotate(day=TruncDate("date_joined"))
            .values("day")
            .annotate(users=Count("id"))
        }
        sales_trend = [
            {
                "date": day.isoformat(),
                "revenue": paid_order_trend.get(day, 0.0),
                "orders": order_count_trend.get(day, 0),
            }
            for day in trend_days
        ]
        user_growth = [
            {
                "date": day.isoformat(),
                "users": user_growth_trend.get(day, 0),
            }
            for day in trend_days
        ]

        return Response({
            "total_products": total_products,
            "total_users": total_users,
            "new_users_today": new_users_today,
            "orders_by_status": orders_by_status,
            "returns_by_status": returns_by_status,
            "total_orders": Order.objects.count(),
            "pending_returns": pending_returns,
            "sales_trend": sales_trend,
            "user_growth": user_growth,
            "revenue": {
                "today": revenue_for_period(today_start),
                "last_7_days": revenue_for_period(week_start),
                "last_30_days": revenue_for_period(month_start),
            },
        })
