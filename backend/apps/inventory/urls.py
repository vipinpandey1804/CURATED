from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("stock", views.StockLevelViewSet, basename="stock")
router.register("movements", views.InventoryMovementViewSet, basename="movement")

urlpatterns = [
    path("", include(router.urls)),
]
