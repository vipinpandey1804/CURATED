from django.contrib import admin
from .models import ReturnRequest, ReturnLineItem


class ReturnLineItemInline(admin.TabularInline):
    model = ReturnLineItem
    extra = 0


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ["order", "user", "status", "created_at", "reviewed_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["order__order_number", "user__email"]
    inlines = [ReturnLineItemInline]
