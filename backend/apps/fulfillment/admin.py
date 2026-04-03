from django.contrib import admin
from .models import ShippingZone, ShippingRule, Shipment, ShipmentItem


class ShippingRuleInline(admin.TabularInline):
    model = ShippingRule
    extra = 1


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]
    inlines = [ShippingRuleInline]


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ["order", "carrier", "tracking_number", "status", "shipped_at"]
    list_filter = ["status", "carrier"]
    search_fields = ["order__order_number", "tracking_number"]
    inlines = [ShipmentItemInline]
