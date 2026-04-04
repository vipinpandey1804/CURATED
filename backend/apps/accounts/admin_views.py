from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from rest_framework import serializers, viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.orders.models import Order
from apps.returns.models import ReturnRequest
from apps.catalog.models import Product
from .models import Profile

User = get_user_model()


# ─── Serializers ──────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "phone_number", "full_name",
            "first_name", "last_name",
            "date_of_birth", "avatar",
            "is_verified", "is_staff", "is_active",
            "date_joined",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_date_of_birth(self, obj):
        try:
            profile = obj.profile
        except Profile.DoesNotExist:
            return None
        return profile.date_of_birth

    def get_avatar(self, obj):
        try:
            profile = obj.profile
        except Profile.DoesNotExist:
            return ""
        avatar = getattr(profile, "avatar", None)
        if not avatar:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(avatar.url) if request else avatar.url


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number", "is_verified", "is_staff", "is_active", "date_of_birth"]

    def update(self, instance, validated_data):
        date_of_birth = validated_data.pop("date_of_birth", serializers.empty)
        instance = super().update(instance, validated_data)

        if date_of_birth is not serializers.empty:
            profile, _ = Profile.objects.get_or_create(user=instance)
            profile.date_of_birth = date_of_birth
            profile.save(update_fields=["date_of_birth"])

        return instance


class AdminUserPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)


# ─── Views ────────────────────────────────────────────────────────────────────

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_staff", "is_active", "is_verified"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering_fields = ["date_joined", "email"]
    http_method_names = ["get", "patch", "post", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminUserUpdateSerializer
        return AdminUserSerializer

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response(
                {"detail": "You cannot delete your own admin account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_destroy(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        user = self.get_object()
        serializer = AdminUserPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save(update_fields=["password"])

        email_sent = False
        detail = "Password updated successfully."
        if user.email:
            send_mail(
                subject="Your CURATED password has been changed",
                message=(
                    f"Hello {user.first_name or 'there'},\n\n"
                    "An administrator updated the password for your CURATED account.\n"
                    f"Temporary password: {new_password}\n\n"
                    "Please sign in and change your password as soon as possible."
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
            email_sent = True
            detail = "Password updated and notification email sent."
        else:
            detail = "Password updated, but the user has no email address for notification."

        return Response({"detail": detail, "email_sent": email_sent})


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    PERIOD_DAYS = {
        "day": 1,
        "today": 1,
        "week": 7,
        "7d": 7,
        "month": 30,
        "30d": 30,
        "quarter": 90,
        "90d": 90,
    }

    def _get_period_range(self, request, today_start):
        raw_period = (request.query_params.get("period") or "week").lower().strip()
        if raw_period == "custom":
            start_raw = request.query_params.get("start_date")
            end_raw = request.query_params.get("end_date")
            try:
                start_date = datetime.strptime(start_raw, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_raw, "%Y-%m-%d").date()
            except (TypeError, ValueError):
                return today_start.date() - timedelta(days=6), today_start.date(), "week"
            if start_date > end_date:
                start_date, end_date = end_date, start_date
            return start_date, end_date, "custom"

        period_days = self.PERIOD_DAYS.get(raw_period, 7)
        start_date = today_start.date() - timedelta(days=period_days - 1)
        return start_date, today_start.date(), raw_period if raw_period in self.PERIOD_DAYS else "week"

    def _get_order_status(self, request):
        status = (request.query_params.get("order_status") or "").upper().strip()
        valid = {choice[0] for choice in Order.OrderStatus.choices}
        return status if status in valid else ""

    def _get_return_status(self, request):
        status = (request.query_params.get("return_status") or "").upper().strip()
        valid = {choice[0] for choice in ReturnRequest.ReturnStatus.choices}
        return status if status in valid else ""

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        range_start, range_end, period_key = self._get_period_range(request, today_start)
        period_days = (range_end - range_start).days + 1
        order_status_filter = self._get_order_status(request)
        return_status_filter = self._get_return_status(request)

        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        trend_start = timezone.make_aware(datetime.combine(range_start, datetime.min.time()), timezone.get_current_timezone())
        trend_end = timezone.make_aware(datetime.combine(range_end + timedelta(days=1), datetime.min.time()), timezone.get_current_timezone())
        trend_days = [range_start + timedelta(days=offset) for offset in range(period_days)]

        total_products = Product.objects.filter(is_active=True).count()
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__gte=today_start).count()
        users_in_period = User.objects.filter(date_joined__gte=trend_start, date_joined__lt=trend_end)
        orders_queryset = Order.objects.filter(created_at__gte=trend_start, created_at__lt=trend_end)
        returns_queryset = ReturnRequest.objects.filter(created_at__gte=trend_start, created_at__lt=trend_end)

        if order_status_filter:
            orders_queryset = orders_queryset.filter(status=order_status_filter)
        if return_status_filter:
            returns_queryset = returns_queryset.filter(status=return_status_filter)

        orders_by_status = {
            s: orders_queryset.filter(status=s).count()
            for s in [c[0] for c in Order.OrderStatus.choices]
        }
        pending_returns = returns_queryset.filter(
            status=ReturnRequest.ReturnStatus.REQUESTED
        ).count()
        returns_by_status = {
            status: returns_queryset.filter(status=status).count()
            for status in [choice[0] for choice in ReturnRequest.ReturnStatus.choices]
        }

        def revenue_for_period(start, queryset=None):
            base_queryset = queryset or Order.objects.all()
            result = base_queryset.filter(
                payment_status=Order.PaymentStatus.PAID,
                created_at__gte=start,
            ).aggregate(total=Sum("total"))
            return float(result["total"] or 0)

        paid_order_trend = {
            row["day"]: float(row["revenue"] or 0)
            for row in orders_queryset.filter(
                payment_status=Order.PaymentStatus.PAID,
            )
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"))
        }
        order_count_trend = {
            row["day"]: row["orders"]
            for row in orders_queryset
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(orders=Count("id"))
        }
        user_growth_trend = {
            row["day"]: row["users"]
            for row in users_in_period
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
            "total_orders": orders_queryset.count(),
            "pending_returns": pending_returns,
            "sales_trend": sales_trend,
            "user_growth": user_growth,
            "summary": {
                "period_days": period_days,
                "orders_in_range": orders_queryset.count(),
                "returns_in_range": returns_queryset.count(),
                "users_in_range": users_in_period.count(),
                "revenue_in_range": revenue_for_period(trend_start, queryset=orders_queryset),
            },
            "applied_filters": {
                "period": period_key,
                "order_status": order_status_filter,
                "return_status": return_status_filter,
                "start_date": range_start.isoformat(),
                "end_date": range_end.isoformat(),
            },
            "revenue": {
                "today": revenue_for_period(today_start, queryset=orders_queryset),
                "last_7_days": revenue_for_period(week_start, queryset=orders_queryset),
                "last_30_days": revenue_for_period(month_start, queryset=orders_queryset),
            },
        })
