from django.urls import path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminUserViewSet, AdminStatsView

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")

urlpatterns = router.urls + [
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
]
