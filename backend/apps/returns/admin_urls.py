from django.urls import path
from rest_framework.routers import DefaultRouter

from .admin_views import AdminReturnRequestViewSet, AdminReturnApproveView, AdminReturnRejectView

router = DefaultRouter()
router.register(r"", AdminReturnRequestViewSet, basename="admin-return")

urlpatterns = router.urls + [
    path("<uuid:pk>/approve/", AdminReturnApproveView.as_view(), name="admin-return-approve"),
    path("<uuid:pk>/reject/", AdminReturnRejectView.as_view(), name="admin-return-reject"),
]
