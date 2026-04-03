from django.urls import path
from . import views

urlpatterns = [
    path("coupons/validate/", views.ValidateCouponView.as_view(), name="coupon-validate"),
    path("newsletter/subscribe/", views.NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
]
