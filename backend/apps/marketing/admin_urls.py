from rest_framework.routers import DefaultRouter

from .admin_views import AdminCouponViewSet

router = DefaultRouter()
router.register(r"coupons", AdminCouponViewSet, basename="admin-coupon")

urlpatterns = router.urls
