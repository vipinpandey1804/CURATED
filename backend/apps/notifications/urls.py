from django.urls import path
from . import views

urlpatterns = [
    path("device-token/", views.DeviceTokenView.as_view(), name="device-token"),
    path("preferences/", views.NotificationPreferenceView.as_view(), name="notification-preferences"),
]
