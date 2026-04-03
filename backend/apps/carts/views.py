from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import ProductVariant
from apps.marketing.models import CouponCode
from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemCreateSerializer,
    CartItemUpdateSerializer,
    ApplyCouponSerializer,
)


def get_or_create_cart(request):
    """Get active cart for authenticated user or session."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(
            user=request.user, status=Cart.CartStatus.ACTIVE
        )
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        cart, _ = Cart.objects.get_or_create(
            session_key=session_key, status=Cart.CartStatus.ACTIVE, user__isnull=True
        )
    return cart


class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data)


class CartItemAddView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CartItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        variant_id = serializer.validated_data["variant_id"]
        quantity = serializer.validated_data["quantity"]

        try:
            variant = ProductVariant.objects.get(id=variant_id, is_active=True)
        except ProductVariant.DoesNotExist:
            return Response(
                {"error": "VARIANT_NOT_FOUND", "detail": "Product variant not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check stock
        if hasattr(variant, "stock"):
            available = variant.stock.quantity_available
            if available < quantity:
                return Response(
                    {"error": "INSUFFICIENT_STOCK", "detail": f"Only {available} available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        cart = get_or_create_cart(request)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, variant=variant, defaults={"quantity": quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save(update_fields=["quantity"])

        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemUpdateView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, item_id):
        serializer = CartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "ITEM_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        item.quantity = serializer.validated_data["quantity"]
        item.save(update_fields=["quantity"])
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request, item_id):
        cart = get_or_create_cart(request)
        deleted, _ = CartItem.objects.filter(id=item_id, cart=cart).delete()
        if not deleted:
            return Response(
                {"error": "ITEM_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartClearView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response(CartSerializer(cart, context={"request": request}).data)


class ApplyCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        try:
            coupon = CouponCode.objects.get(
                code__iexact=code,
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

        cart = get_or_create_cart(request)
        cart.coupon = coupon
        cart.save(update_fields=["coupon"])
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.coupon = None
        cart.save(update_fields=["coupon"])
        return Response(CartSerializer(cart, context={"request": request}).data)
