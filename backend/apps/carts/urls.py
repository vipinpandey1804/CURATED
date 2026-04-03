from django.urls import path
from . import views

urlpatterns = [
    path("", views.CartView.as_view(), name="cart-detail"),
    path("items/", views.CartItemAddView.as_view(), name="cart-add-item"),
    path("items/<uuid:item_id>/", views.CartItemUpdateView.as_view(), name="cart-update-item"),
    path("clear/", views.CartClearView.as_view(), name="cart-clear"),
    path("coupon/", views.ApplyCouponView.as_view(), name="cart-coupon"),
]
