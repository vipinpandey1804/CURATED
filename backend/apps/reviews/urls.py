from django.urls import path
from . import views

urlpatterns = [
    path("products/<uuid:product_id>/", views.ProductReviewsView.as_view(), name="product-reviews"),
    path("products/<uuid:product_id>/summary/", views.ProductRatingSummaryView.as_view(), name="product-rating-summary"),
    path("create/", views.CreateReviewView.as_view(), name="create-review"),
]
