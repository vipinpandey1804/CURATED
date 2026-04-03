from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Profile, Address, OTPRequest


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "phone_number", "first_name", "last_name", "is_verified", "is_active", "is_staff", "date_joined"]
    list_filter = ["is_active", "is_staff", "is_verified", "date_joined"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering = ["-date_joined"]
    inlines = [ProfileInline]

    fieldsets = (
        (None, {"fields": ("email", "phone_number", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "is_verified", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "phone_number", "password1", "password2")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["full_name", "user", "address_type", "city", "country", "is_default"]
    list_filter = ["address_type", "country"]
    search_fields = ["full_name", "city", "user__email"]


@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = ["phone_number", "is_used", "expires_at", "created_at"]
    list_filter = ["is_used"]
    readonly_fields = ["code_hash", "phone_number", "expires_at", "is_used", "attempts", "created_at"]
