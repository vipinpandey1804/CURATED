from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Admin API namespace (is_staff required)
    path("api/v1/admin/", include("config.admin_urls")),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/catalog/", include("apps.catalog.urls")),
    path("api/v1/inventory/", include("apps.inventory.urls")),
    path("api/v1/cart/", include("apps.carts.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/fulfillment/", include("apps.fulfillment.urls")),
    path("api/v1/returns/", include("apps.returns.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/marketing/", include("apps.marketing.urls")),
    path("api/v1/search/", include("apps.search.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/reviews/", include("apps.reviews.urls")),
    path("api/v1/wishlists/", include("apps.wishlists.urls")),
    # OpenAPI schema
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
