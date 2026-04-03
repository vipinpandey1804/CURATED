from django.contrib import admin
from .models import DeviceToken, NotificationPreference, NotificationLog


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "platform", "is_active", "created_at"]
    list_filter = ["platform", "is_active"]
    search_fields = ["user__email"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "email_order_updates", "sms_order_updates", "push_order_updates"]
    search_fields = ["user__email"]


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ["user", "channel", "event_type", "status", "sent_at"]
    list_filter = ["channel", "status", "event_type"]
    search_fields = ["user__email", "event_type"]
