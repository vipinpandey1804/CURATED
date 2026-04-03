from django.db.models import Avg, Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from .models import Review
from .serializers import (
    ReviewSerializer,
    CreateReviewSerializer,
    ProductRatingSummarySerializer,
)


class ProductReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return (
            Review.objects.filter(
                product_id=product_id,
                moderation_status=Review.ModerationStatus.APPROVED,
            )
            .select_related("user")
            .prefetch_related("images")
        )


class CreateReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data["product_id"]

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"error": "PRODUCT_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND
            )

        if Review.objects.filter(product=product, user=request.user).exists():
            return Response(
                {"error": "ALREADY_REVIEWED", "detail": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review.objects.create(
            product=product,
            user=request.user,
            rating=serializer.validated_data["rating"],
            title=serializer.validated_data.get("title", ""),
            body=serializer.validated_data.get("body", ""),
        )

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ProductRatingSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        stats = Review.objects.filter(
            product_id=product_id,
            moderation_status=Review.ModerationStatus.APPROVED,
        ).aggregate(
            average_rating=Avg("rating"),
            review_count=Count("id"),
        )
        stats["average_rating"] = stats["average_rating"] or 0
        return Response(ProductRatingSummarySerializer(stats).data)
