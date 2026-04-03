from django.urls import path
from . import views

urlpatterns = [
    path("", views.WishlistView.as_view(), name="wishlist-list"),
    path("toggle/", views.ToggleWishlistView.as_view(), name="wishlist-toggle"),
    path("check/<uuid:product_id>/", views.WishlistCheckView.as_view(), name="wishlist-check"),
]
