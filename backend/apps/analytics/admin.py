from django.contrib import admin
from .models import PageView, ConversionEvent


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ["path", "user_id", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["path"]


@admin.register(ConversionEvent)
class ConversionEventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "user_id", "product_id", "order_id", "created_at"]
    list_filter = ["event_type", "created_at"]
