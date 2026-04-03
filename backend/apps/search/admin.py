from django.contrib import admin
from .models import SearchQuery


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ["query", "results_count", "created_at"]
    search_fields = ["query"]
    readonly_fields = ["query", "results_count", "user_id", "created_at"]
