from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ["variant", "quantity"]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "item_count", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["user__email", "session_key"]
    inlines = [CartItemInline]
