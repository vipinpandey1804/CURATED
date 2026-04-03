from django.db import transaction
from djmoney.money import Money
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Address
from apps.carts.models import Cart
from apps.carts.views import get_or_create_cart
from apps.fulfillment.models import ShippingRule
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    CreateOrderSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items")
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items", "status_history__changed_by")
        )


class CreateOrderView(APIView):
    """
    POST /api/v1/orders/create/
    Validates cart, calculates prices server-side, creates Order with snapshotted items.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get active cart
        cart = Cart.objects.filter(
            user=request.user, status=Cart.CartStatus.ACTIVE
        ).prefetch_related("items__variant__product__images").first()

        if not cart or not cart.items.exists():
            return Response(
                {"error": "CART_EMPTY", "detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate shipping address
        try:
            shipping_addr = Address.objects.get(
                id=serializer.validated_data["shipping_address_id"],
                user=request.user,
            )
        except Address.DoesNotExist:
            return Response(
                {"error": "ADDRESS_NOT_FOUND", "detail": "Shipping address not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        billing_addr = shipping_addr
        if serializer.validated_data.get("billing_address_id"):
            try:
                billing_addr = Address.objects.get(
                    id=serializer.validated_data["billing_address_id"],
                    user=request.user,
                )
            except Address.DoesNotExist:
                pass

        with transaction.atomic():
            # Server-side price calculation
            subtotal = Money(0, "USD")
            order_items_data = []

            for cart_item in cart.items.select_related("variant__product"):
                variant = cart_item.variant
                price = variant.effective_price
                line = price * cart_item.quantity
                subtotal += line

                img = variant.product.images.first()
                img_url = ""
                if img and img.image:
                    img_url = request.build_absolute_uri(img.image.url)

                order_items_data.append({
                    "variant": variant,
                    "product_name": variant.product.name,
                    "variant_name": variant.name,
                    "sku": variant.sku,
                    "unit_price": price,
                    "quantity": cart_item.quantity,
                    "line_total": line,
                    "product_image_url": img_url,
                })

            # Shipping cost
            shipping_cost = Money(0, "USD")
            try:
                rule = ShippingRule.objects.filter(
                    zone__countries__contains=shipping_addr.country, is_active=True
                ).first()
                if rule:
                    if rule.free_above and subtotal >= rule.free_above:
                        shipping_cost = Money(0, "USD")
                    else:
                        shipping_cost = rule.base_rate
            except Exception:
                pass

            # Discount
            discount = Money(0, "USD")
            coupon_code_str = ""
            if cart.coupon:
                coupon = cart.coupon
                coupon_code_str = coupon.code
                if coupon.discount_type == "PERCENTAGE":
                    discount = subtotal * (coupon.discount_value / 100)
                else:
                    discount = Money(coupon.discount_value, "USD")
                if coupon.max_discount and discount > coupon.max_discount:
                    discount = coupon.max_discount

            total = subtotal + shipping_cost - discount

            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                discount_amount=discount,
                total=total,
                coupon_code=coupon_code_str,
                notes=serializer.validated_data.get("notes", ""),
                shipping_full_name=shipping_addr.full_name,
                shipping_address_line_1=shipping_addr.address_line_1,
                shipping_address_line_2=shipping_addr.address_line_2,
                shipping_city=shipping_addr.city,
                shipping_state=shipping_addr.state,
                shipping_postal_code=shipping_addr.postal_code,
                shipping_country=shipping_addr.country,
                shipping_phone=shipping_addr.phone,
                billing_full_name=billing_addr.full_name,
                billing_address_line_1=billing_addr.address_line_1,
                billing_address_line_2=billing_addr.address_line_2,
                billing_city=billing_addr.city,
                billing_state=billing_addr.state,
                billing_postal_code=billing_addr.postal_code,
                billing_country=billing_addr.country,
            )

            OrderItem.objects.bulk_create([
                OrderItem(order=order, **data) for data in order_items_data
            ])

            OrderStatusHistory.objects.create(
                order=order, old_status="", new_status=Order.OrderStatus.PENDING,
            )

            # Mark cart as checked out
            cart.status = Cart.CartStatus.CHECKED_OUT
            cart.save(update_fields=["status"])

        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
