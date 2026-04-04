from rest_framework.routers import DefaultRouter

from .admin_views import (
    AdminCategoryViewSet,
    AdminProductViewSet,
    AdminProductImageViewSet,
    AdminProductVariantViewSet,
    AdminAttributeTypeViewSet,
    AdminAttributeValueViewSet,
)

router = DefaultRouter()
router.register(r"categories", AdminCategoryViewSet, basename="admin-category")
router.register(r"products", AdminProductViewSet, basename="admin-product")
router.register(r"attributes", AdminAttributeTypeViewSet, basename="admin-attributetype")
router.register(r"attribute-values", AdminAttributeValueViewSet, basename="admin-attributevalue")
router.register(
    r"products/(?P<product_id>[^/.]+)/images",
    AdminProductImageViewSet,
    basename="admin-product-image",
)
router.register(
    r"products/(?P<product_id>[^/.]+)/variants",
    AdminProductVariantViewSet,
    basename="admin-product-variant",
)

urlpatterns = router.urls
