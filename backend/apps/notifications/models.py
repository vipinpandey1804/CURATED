from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class DeviceToken(TimestampedModel):
    class Platform(models.TextChoices):
        WEB = "WEB", "Web"
        ANDROID = "ANDROID", "Android"
        IOS = "IOS", "iOS"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens"
    )
    token = models.CharField(max_length=500)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "notifications_device_token"
        unique_together = [("user", "token")]

    def __str__(self):
        return f"DeviceToken({self.user.email}, {self.platform})"


class NotificationPreference(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preferences"
    )
    email_order_updates = models.BooleanField(default=True)
    email_promotions = models.BooleanField(default=True)
    sms_order_updates = models.BooleanField(default=True)
    sms_promotions = models.BooleanField(default=False)
    push_order_updates = models.BooleanField(default=True)
    push_promotions = models.BooleanField(default=True)

    class Meta:
        db_table = "notifications_preference"

    def __str__(self):
        return f"Preferences({self.user.email})"


class NotificationLog(TimestampedModel):
    class Channel(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        PUSH = "PUSH", "Push"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_logs"
    )
    channel = models.CharField(max_length=5, choices=Channel.choices)
    event_type = models.CharField(max_length=100, help_text="e.g. order_confirmed, shipment_update")
    subject = models.CharField(max_length=500, blank=True)
    body_preview = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications_log"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel} → {self.user.email} ({self.event_type})"
