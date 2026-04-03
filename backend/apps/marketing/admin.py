from django.contrib import admin
from .models import CouponCode, NewsletterSubscription


@admin.register(CouponCode)
class CouponCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "discount_value", "is_active", "times_used", "max_uses", "valid_until"]
    list_filter = ["discount_type", "is_active"]
    search_fields = ["code"]


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["email", "is_active", "created_at", "unsubscribed_at"]
    list_filter = ["is_active"]
    search_fields = ["email"]
