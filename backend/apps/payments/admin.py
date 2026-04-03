from django.contrib import admin
from .models import StripeSession, PaymentTransaction, WebhookEvent


@admin.register(StripeSession)
class StripeSessionAdmin(admin.ModelAdmin):
    list_display = ["order", "stripe_session_id", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["stripe_session_id", "order__order_number"]
    readonly_fields = ["order", "stripe_session_id", "stripe_payment_intent_id", "status", "checkout_url"]


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ["order", "transaction_type", "status", "amount", "created_at"]
    list_filter = ["transaction_type", "status", "created_at"]
    search_fields = ["order__order_number", "stripe_payment_intent_id"]
    readonly_fields = [
        "order", "transaction_type", "status",
        "amount", "settled_amount", "stripe_payment_intent_id", "failure_reason",
    ]


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ["stripe_event_id", "event_type", "status", "processed_at", "created_at"]
    list_filter = ["event_type", "status"]
    search_fields = ["stripe_event_id"]
    readonly_fields = ["stripe_event_id", "event_type", "payload", "processed_at", "status", "error_message"]
