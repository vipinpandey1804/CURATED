from django.urls import path
from . import views

urlpatterns = [
    path("shipping-rules/", views.ShippingRuleListView.as_view(), name="shipping-rules"),
    path("orders/<str:order_number>/shipments/", views.OrderShipmentsView.as_view(), name="order-shipments"),
]
