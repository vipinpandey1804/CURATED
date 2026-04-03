from django.urls import path
from . import views

urlpatterns = [
    path("create-session/", views.CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("webhook/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
]
