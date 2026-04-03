from django.urls import path
from . import views

urlpatterns = [
    path("events/", views.TrackEventView.as_view(), name="track-event"),
]
