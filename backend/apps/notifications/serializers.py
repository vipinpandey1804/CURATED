from rest_framework import serializers
from .models import DeviceToken, NotificationPreference


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["id", "token", "platform", "is_active"]
        read_only_fields = ["id"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "email_order_updates", "email_promotions",
            "sms_order_updates", "sms_promotions",
            "push_order_updates", "push_promotions",
        ]
