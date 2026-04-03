from django.db import models
from apps.core.models import TimestampedModel


class SearchQuery(TimestampedModel):
    """Log search queries for analytics and autocomplete."""

    query = models.CharField(max_length=500, db_index=True)
    results_count = models.PositiveIntegerField(default=0)
    user_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "search_query"
        verbose_name_plural = "search queries"

    def __str__(self):
        return self.query
