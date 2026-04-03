from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer, ToggleWishlistSerializer


class WishlistView(generics.ListAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            WishlistItem.objects.filter(user=self.request.user)
            .select_related("product__category")
            .prefetch_related("product__images")
        )


class ToggleWishlistView(APIView):
    """POST to toggle a product in the wishlist. Returns added/removed status."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ToggleWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"error": "PRODUCT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND
            )

        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=product
        )
        if not created:
            item.delete()
            return Response({"status": "removed", "product_id": str(product_id)})

        return Response(
            {"status": "added", "product_id": str(product_id)},
            status=status.HTTP_201_CREATED,
        )


class WishlistCheckView(APIView):
    """GET /api/v1/wishlists/check/<product_id>/ — check if product is wishlisted."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_id):
        is_wishlisted = WishlistItem.objects.filter(
            user=request.user, product_id=product_id
        ).exists()
        return Response({"is_wishlisted": is_wishlisted})
