from rest_framework import serializers
from .models import CouponCode, NewsletterSubscription


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)


class CouponDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouponCode
        fields = [
            "code", "discount_type", "discount_value",
            "max_discount", "max_discount_currency",
            "min_order_amount", "min_order_amount_currency",
            "valid_from", "valid_until",
        ]


class NewsletterSubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()
