from django.urls import path, include

urlpatterns = [
    path("catalog/", include("apps.catalog.admin_urls")),
    path("orders/", include("apps.orders.admin_urls")),
    path("returns/", include("apps.returns.admin_urls")),
    path("marketing/", include("apps.marketing.admin_urls")),
    path("", include("apps.accounts.admin_urls")),
]
