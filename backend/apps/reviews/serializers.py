from django.db.models import Avg, Count
from rest_framework import serializers
from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):
    url = serializers.ImageField(source="image", read_only=True)

    class Meta:
        model = ReviewImage
        fields = ["id", "url", "sort_order"]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product", "user_name", "rating", "title", "body",
            "moderation_status", "images", "created_at",
        ]
        read_only_fields = ["id", "moderation_status", "created_at"]

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.email.split("@")[0]


class CreateReviewSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=200, required=False, default="", allow_blank=True)
    body = serializers.CharField(required=False, default="", allow_blank=True)


class ProductRatingSummarySerializer(serializers.Serializer):
    average_rating = serializers.FloatField()
    review_count = serializers.IntegerField()
