from django.contrib import admin
from .models import Review, ReviewImage


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "moderation_status", "created_at"]
    list_filter = ["moderation_status", "rating", "created_at"]
    search_fields = ["product__name", "user__email", "title"]
    inlines = [ReviewImageInline]
    actions = ["approve_reviews", "reject_reviews"]

    @admin.action(description="Approve selected reviews")
    def approve_reviews(self, request, queryset):
        queryset.update(moderation_status=Review.ModerationStatus.APPROVED)

    @admin.action(description="Reject selected reviews")
    def reject_reviews(self, request, queryset):
        queryset.update(moderation_status=Review.ModerationStatus.REJECTED)
