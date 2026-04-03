from rest_framework import serializers


class SearchSerializer(serializers.Serializer):
    q = serializers.CharField(max_length=500)
    category = serializers.CharField(required=False, allow_blank=True)
    min_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
    max_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, allow_null=True)
    sort = serializers.ChoiceField(
        choices=["relevance", "price_asc", "price_desc", "newest"],
        default="relevance",
        required=False,
    )
