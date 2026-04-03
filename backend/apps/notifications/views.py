from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import DeviceToken, NotificationPreference
from .serializers import DeviceTokenSerializer, NotificationPreferenceSerializer


class DeviceTokenView(generics.CreateAPIView):
    serializer_class = DeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Upsert: deactivate old token for same platform, create new
        DeviceToken.objects.filter(
            user=self.request.user,
            platform=serializer.validated_data["platform"],
        ).update(is_active=False)
        serializer.save(user=self.request.user)


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
