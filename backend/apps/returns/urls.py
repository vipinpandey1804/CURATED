from django.urls import path
from . import views

urlpatterns = [
    path("", views.ReturnRequestListView.as_view(), name="return-list"),
    path("create/", views.CreateReturnRequestView.as_view(), name="return-create"),
    path("<uuid:pk>/", views.ReturnRequestDetailView.as_view(), name="return-detail"),
]
