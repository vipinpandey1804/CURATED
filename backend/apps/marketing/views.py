from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CouponCode, NewsletterSubscription
from .serializers import (
    CouponValidateSerializer,
    CouponDetailSerializer,
    NewsletterSubscribeSerializer,
)


class ValidateCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            coupon = CouponCode.objects.get(
                code__iexact=serializer.validated_data["code"],
                is_active=True,
                valid_from__lte=timezone.now(),
                valid_until__gte=timezone.now(),
            )
        except CouponCode.DoesNotExist:
            return Response(
                {"error": "INVALID_COUPON", "detail": "Coupon code is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if coupon.max_uses and coupon.times_used >= coupon.max_uses:
            return Response(
                {"error": "COUPON_EXHAUSTED", "detail": "Coupon usage limit reached."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(CouponDetailSerializer(coupon).data)


class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        sub, created = NewsletterSubscription.objects.get_or_create(
            email=email, defaults={"is_active": True}
        )
        if not created and not sub.is_active:
            sub.is_active = True
            sub.unsubscribed_at = None
            sub.save(update_fields=["is_active", "unsubscribed_at"])

        return Response({"detail": "Subscribed successfully."}, status=status.HTTP_201_CREATED)
