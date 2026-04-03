from rest_framework import serializers
from .models import StripeSession, PaymentTransaction


class StripeSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StripeSession
        fields = ["id", "stripe_session_id", "status", "checkout_url", "created_at"]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            "id", "transaction_type", "status",
            "amount", "amount_currency",
            "settled_amount", "settled_amount_currency",
            "stripe_payment_intent_id", "created_at",
        ]


class CreateCheckoutSessionSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=20)
