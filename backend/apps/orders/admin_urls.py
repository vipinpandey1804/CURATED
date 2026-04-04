from django.urls import path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminOrderViewSet, AdminOrderStatusUpdateView

router = DefaultRouter()
router.register(r"", AdminOrderViewSet, basename="admin-order")

urlpatterns = router.urls + [
    path("<uuid:pk>/status/", AdminOrderStatusUpdateView.as_view(), name="admin-order-status"),
]
