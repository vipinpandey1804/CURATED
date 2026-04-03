from django.contrib import admin
from .models import StockLevel, InventoryMovement, StockReservation


class InventoryMovementInline(admin.TabularInline):
    model = InventoryMovement
    extra = 0
    readonly_fields = ["movement_type", "quantity_change", "reference", "notes", "created_by", "created_at"]
    can_delete = False


@admin.register(StockLevel)
class StockLevelAdmin(admin.ModelAdmin):
    list_display = ["variant", "quantity_available"]
    search_fields = ["variant__sku", "variant__product__name"]
    inlines = [InventoryMovementInline]


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ["stock_level", "movement_type", "quantity_change", "reference", "created_at"]
    list_filter = ["movement_type", "created_at"]
    readonly_fields = ["stock_level", "movement_type", "quantity_change", "reference", "notes", "created_by", "created_at"]


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = ["stock_level", "quantity", "is_active", "expires_at", "created_at"]
    list_filter = ["is_active"]
