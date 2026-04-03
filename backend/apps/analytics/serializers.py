from rest_framework import serializers
from .models import ConversionEvent


class TrackEventSerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(choices=ConversionEvent.EventType.choices)
    product_id = serializers.UUIDField(required=False, allow_null=True)
    order_id = serializers.UUIDField(required=False, allow_null=True)
    metadata = serializers.DictField(required=False, default=dict)
