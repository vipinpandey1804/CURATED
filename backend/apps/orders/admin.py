from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product_name", "variant_name", "sku", "unit_price", "quantity", "line_total"]


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ["old_status", "new_status", "changed_by", "note", "created_at"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number", "user", "status", "payment_status",
        "fulfillment_status", "total", "created_at",
    ]
    list_filter = ["status", "payment_status", "fulfillment_status", "created_at"]
    search_fields = ["order_number", "user__email"]
    readonly_fields = ["order_number", "subtotal", "shipping_cost", "discount_amount", "total"]
    inlines = [OrderItemInline, OrderStatusHistoryInline]
