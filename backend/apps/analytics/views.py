from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ConversionEvent
from .serializers import TrackEventSerializer


class TrackEventView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TrackEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ConversionEvent.objects.create(
            event_type=serializer.validated_data["event_type"],
            user_id=request.user.id if request.user.is_authenticated else None,
            product_id=serializer.validated_data.get("product_id"),
            order_id=serializer.validated_data.get("order_id"),
            metadata=serializer.validated_data.get("metadata", {}),
        )
        return Response({"detail": "Event tracked."}, status=status.HTTP_201_CREATED)
