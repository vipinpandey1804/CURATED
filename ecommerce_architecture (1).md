# E-Commerce Platform — System Architecture

**Version:** 1.1 · July 2025
**Status:** ✅ IN DEVELOPMENT — Backend scaffolded, Frontend integrated
**Stack:** Django + React/Vite · PostgreSQL · Stripe · AWS

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Finalized Technology Stack](#2-finalized-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Django Project & App Structure](#4-django-project--app-structure)
5. [Domain Model Designs](#5-domain-model-designs)
6. [Authentication Architecture](#6-authentication-architecture)
7. [Currency Architecture](#7-currency-architecture)
8. [Key Request & Transaction Flows](#8-key-request--transaction-flows)
9. [Sanity CMS Integration](#9-sanity-cms-integration)
10. [API Design](#10-api-design)
11. [Security Architecture](#11-security-architecture)
12. [Performance Design](#12-performance-design)
13. [Build Order & Phasing](#13-build-order--phasing)
14. [Scaling Roadmap](#14-scaling-roadmap)
15. [Admin Panel Architecture](#15-admin-panel-architecture)
16. [Push Notification Architecture (FCM)](#16-push-notification-architecture-fcm)
17. [Observability](#17-observability)
18. [Implementation Status & Deviations](#18-implementation-status--deviations)

---

## 1. Executive Summary

This document defines the complete, finalized system architecture for a production-ready headless e-commerce platform. All technology choices, domain boundaries, data flows, and build sequencing have been agreed and are locked for implementation.

### 1.1 Platform Overview

| Attribute | Decision |
|---|---|
| Project type | Headless commerce — Django API backend, React/Vite storefront |
| Primary market | India-first with multi-currency readiness from day one |
| Currency handling | django-money (MoneyField) — INR default, extensible |
| Guest checkout | Disabled — registration required before checkout |
| CMS strategy | Sanity (headless) — Free tier, upgrade path available |
| Auth methods | Email+password · Google OAuth · Mobile OTP (Twilio) |
| Payments | Stripe Checkout + signed Webhooks |
| SMS / OTP provider | Twilio (international coverage) |
| Push notifications (mobile) | FCM — Android + iOS via APNs bridge |
| Push notifications (web) | FCM Web Push — browser notifications |
| Storage (current) | Django FileSystemStorage — single persistent volume |
| Storage (future) | AWS S3 + CloudFront — enabled at multi-instance scale |
| Deployment target | AWS — ECS Fargate or EKS |

---

## 2. Finalized Technology Stack

| Layer | Technology | Purpose | Notes |
|---|---|---|---|
| Backend framework | Django 5 + DRF | API, admin, business logic | Python 3.12+ |
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 | Single-page storefront | `frontend/` directory |
| Database | PostgreSQL 16 | Primary data store | Amazon RDS |
| Cache | Redis 7 | Cache, sessions | Elasticache |
| Task queue | Django-Q2 | Async jobs (ORM broker) | Replaces Celery — no Redis required for tasks |
| Currency | django-money | Multi-currency fields | py-moneyed under hood |
| Payments | Stripe | Checkout + Webhooks | Server-side only |
| Auth | django-allauth + custom OTP | All auth channels | 3 methods unified |
| OTP / SMS | Twilio | OTP + order SMS | International coverage |
| Push (mobile) | FCM | Android + iOS push | iOS via APNs bridge |
| Push (web) | FCM Web Push | Browser notifications | Service worker in Next.js |
| CMS | Sanity | Editorial content | Free tier, GROQ API |
| Search (v1) | PostgreSQL FTS | Catalog search | SearchVector + GIN index |
| Search (v2) | OpenSearch | Scale search | Migrate when needed |
| Storage (v1) | FileSystemStorage | Media uploads | Mounted persistent volume |
| Storage (v2) | AWS S3 | Shared object storage | Enable at multi-node |
| Admin UX | django-unfold | Superadmin Django shell access | Replaces default admin |
| Admin CMS (frontend) | React 18 + shadcn/ui | Staff-facing CMS at `/admin-panel/` | Radix UI + Tailwind + CVA |
| Observability | Sentry + OpenTelemetry | Errors + tracing | + CloudWatch |
| Deployment | AWS ECS Fargate / EKS | Container runtime | Blue/green deploys |
| Secrets | AWS Secrets Manager | Credentials | Via SSM Parameter Store |

---

## 3. High-Level Architecture

### 3.1 System Flow

The platform follows a layered, event-driven architecture. The Next.js storefront communicates exclusively through versioned Django REST APIs. Editorial content is served from Sanity via GROQ queries. All payment state flows through Stripe webhooks — never from frontend redirects.

```
User (Web Browser)
  └── CloudFront CDN
        └── React/Vite SPA (S3 static hosting or Amplify)
              └── ALB + Nginx Ingress
                    └── Django API Pods (stateless)
                          ├── PostgreSQL  (primary data + Django-Q task broker)
                          ├── Redis       (cache + sessions)
                          ├── Django-Q Workers (qcluster)
                          │     ├── Email provider
                          │     ├── Twilio  (SMS / OTP)
                          │     └── FCM     (push — mobile + web)
                          ├── Local media storage /media
                          └── Stripe API
                                └── Stripe Webhooks → Django
```

| Layer | Components |
|---|---|
| User entry | Web browser → CloudFront CDN |
| Storefront | React/Vite SPA — static hosting (S3 or Amplify) |
| Ingress | ALB + Nginx Ingress |
| API layer | Django + DRF pods (stateless, horizontally scalable) |
| Async jobs | Django-Q2 workers (`python manage.py qcluster`) — ORM broker via PostgreSQL |
| Data stores | PostgreSQL (primary + task queue) · Redis (cache + sessions) |
| File storage | Mounted persistent volume /media — upgrade to S3 later |
| External services | Stripe · Twilio · FCM · Email provider |
| Observability | Sentry · OpenTelemetry · CloudWatch |

### 3.2 Key Architectural Principles

1. **Every price field uses `MoneyField`** from django-money — never `DecimalField`
2. **All public-facing model primary keys are UUIDs**
3. **Order items are snapshotted at purchase** — live catalog prices never mutate history
4. **Payment state is authoritative from Stripe webhook events** — not frontend redirects
5. **Inventory changes always flow through `InventoryMovement` records** — never direct mutations
6. **All three auth methods resolve to the same unified `User` record** — email is canonical identity
7. **Fulfillment status and payment status are independent state machines** on `Order`
8. **Every refund must be traceable** to a `ReturnRequest` or an admin override with a recorded reason
9. **All external calls run through Django-Q2** — email, SMS, FCM push, search reindex — never inline
10. **Sanity owns all editorial content** — Django `marketing` app is a thin sync/reference layer

---

## 4. Django Project & App Structure

### 4.1 Project Layout

```
ecom-project/
├── backend/                  ← Django project root
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py       ← Django-Q2 Q_CLUSTER config here
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── wsgi.py / asgi.py
│   ├── apps/
│   │   ├── core/
│   │   │   └── management/commands/seed_data.py  ← seed command
│   │   ├── accounts/
│   │   ├── catalog/
│   │   ├── inventory/
│   │   ├── carts/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── fulfillment/
│   │   ├── returns/
│   │   ├── notifications/
│   │   │   └── tasks.py      ← Django-Q2 async tasks
│   │   ├── marketing/
│   │   ├── search/
│   │   └── analytics/
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── manage.py
│   └── venv/
└── frontend/                 ← React/Vite SPA
    ├── src/
    │   ├── services/         ← API service layer
    │   │   ├── api.js        ← axios + JWT auto-refresh
    │   │   ├── authService.js
    │   │   ├── catalogService.js
    │   │   ├── cartService.js
    │   │   ├── orderService.js
    │   │   └── miscServices.js
    │   ├── hooks/
    │   │   └── useApi.js     ← generic data fetching hook
    │   ├── utils/
    │   │   └── normalizers.js
    │   ├── context/          ← AuthContext, CartContext, WishlistContext
    │   └── pages/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

### 4.2 App Responsibilities

| App | Core models | Key responsibilities | Notes |
|---|---|---|---|
| `core` | `BaseModel`, `AuditMixin` | UUIDs, timestamps, soft delete, shared constants | All apps inherit from here |
| `accounts` | `User`, `Address`, `OTPRequest`, `PhoneVerification` | Email+password, Google OAuth, mobile OTP, address book | Email is canonical identity |
| `catalog` | `Product`, `ProductVariant`, `AttributeDefinition`, `AttributeValue`, `ProductImage` | Product tree, variant attributes, SEO metadata, media | Mutable — never affects order history |
| `inventory` | `InventoryMovement`, `StockReservation`, `StockLevel` | Stock ledger, reservations at checkout, committed deductions | Movement-based — no direct mutations |
| `carts` | `Cart`, `CartItem`, `CouponCode`, `CartCoupon` | Cart lifecycle, coupon application, shipping method selection, expiry | Server-side price recalculation always |
| `orders` | `Order`, `OrderItem`, `OrderStatusHistory` | Order creation, immutable item snapshot, status state machine | Paid orders are immutable |
| `payments` | `StripeSession`, `WebhookEvent`, `PaymentTransaction` | Stripe session creation, webhook ingestion, idempotent event storage | Webhook is source of truth |
| `fulfillment` | `ShippingMethod`, `Shipment`, `ShipmentItem` | Shipping method config, shipment creation, carrier + tracking | Independent from payment status |
| `returns` | `ReturnRequest`, `ReturnLineItem`, `ReturnReason` | Return initiation, ops approval flow, refund trigger, inventory restock | Every refund tied to a request |
| `notifications` | `Notification`, `NotificationTemplate`, `DeviceToken` | Channel abstraction (email/SMS/FCM), event-to-template mapping, Celery dispatch | Provider-agnostic layer |
| `marketing` | `ContentSlotReference` | Sanity webhook sync, content slot ID references | Sanity owns the content |
| `search` | `SearchDocument` | PG full-text index, autocomplete feeds, catalog denormalization, reindex tasks | Migrate to OpenSearch at scale |
| `analytics` | `Event`, `ConversionLog` | Product views, cart events, checkout funnel, BI export hooks | Lightweight — not a data warehouse |

---

## 5. Domain Model Designs

### 5.1 accounts — User & Auth

Email is the canonical user identity. All three auth methods resolve to the same `User` record. Phone number is stored on the profile but is not the login identifier.

| Model / Field | Details |
|---|---|
| `User` (AbstractBaseUser) | `id` (UUID PK), `email` (unique), `full_name`, `phone` (nullable), `is_active`, `is_staff`, `date_joined` |
| `Address` | `id`, `user` FK, `full_name`, `line1`, `line2`, `city`, `state`, `pincode`, `country`, `is_default` |
| `OTPRequest` | `id`, `phone`, `code` (hashed), `expires_at`, `used_at` — TTL 10 min, single use |
| `PhoneVerification` | `id`, `user` FK, `phone`, `verified_at` |
| Auth backends | `EmailAuthBackend` (django-allauth) · `GoogleOAuthBackend` (allauth) · `OTPAuthBackend` (custom + Twilio) |

### 5.2 catalog — Products & Variants

Products have typed variant attributes (size, colour, material). The attribute system uses a join-table pattern — no EAV, no JSONField for attributes. This keeps filtering and indexing clean.

| Model / Field | Details |
|---|---|
| `Category` | `id` (UUID), `name`, `slug`, `parent` FK (self), `is_active`, `seo_title`, `seo_description` |
| `Collection` | `id` (UUID), `name`, `slug`, `products` (M2M), `is_active`, `hero_image` |
| `Product` | `id` (UUID), `category` FK, `name`, `slug`, `description`, `is_active`, `currency`, `base_price` (MoneyField), `tax_rate` |
| `AttributeDefinition` | `id`, `name` (e.g. "size"), `product_type` or global flag |
| `AttributeValue` | `id`, `attribute` FK, `value` (e.g. "L", "Red") |
| `ProductVariant` | `id` (UUID), `product` FK, `sku` (unique), `price_override` (MoneyField nullable), `is_active` |
| `VariantAttribute` | `variant` FK, `attribute_value` FK — join table for variant options |
| `ProductImage` | `id`, `product` FK, `variant` FK (nullable), `image` (ImageField), `alt_text`, `order` |

### 5.3 inventory — Stock Ledger

| Model / Field | Details |
|---|---|
| `StockLevel` | `id`, `variant` FK (unique), `quantity_on_hand`, `quantity_reserved`, `quantity_available` (computed) |
| `InventoryMovement` | `id`, `variant` FK, `movement_type` (RESTOCK / SALE / RETURN / ADJUSTMENT), `quantity` (signed), `reference_id`, `created_at` |
| `StockReservation` | `id`, `variant` FK, `cart` FK, `quantity`, `expires_at` — released on cart expiry or order completion |

### 5.4 carts — Cart & Checkout Prep

| Model / Field | Details |
|---|---|
| `Cart` | `id` (UUID), `user` FK (required — no guest carts), `status` (ACTIVE / CHECKED_OUT / EXPIRED), `currency`, `expires_at` |
| `CartItem` | `id`, `cart` FK, `variant` FK, `quantity`, `unit_price` (MoneyField snapshot at add-time) |
| `CouponCode` | `id`, `code` (unique), `discount_type` (PERCENT / FIXED), `discount_value`, `min_order_value` (MoneyField), `max_uses`, `used_count`, `valid_from`, `valid_to` |
| `CartCoupon` | `cart` FK, `coupon` FK, `applied_at`, `discount_amount` (MoneyField) |
| Shipping selection | `cart.shipping_method` FK to `ShippingMethod` — resolved at cart, confirmed at order |

### 5.5 orders — Order Aggregate

Order items are permanently snapshotted at purchase time. The catalog can change freely without affecting order history.

| Model / Field | Details |
|---|---|
| `Order` | `id` (UUID), `user` FK, `status` (PENDING / CONFIRMED / CANCELLED), `payment_status`, `fulfillment_status`, `currency`, `subtotal`, `shipping_amount`, `discount_amount`, `tax_amount`, `total` (all MoneyField), `shipping_address` (JSON snapshot), `created_at` |
| `OrderItem` | `id`, `order` FK, `variant` FK (nullable — reference only), `product_name`, `variant_sku`, `variant_attributes` (JSON snapshot), `unit_price` (MoneyField), `quantity`, `line_total` (MoneyField) |
| `OrderStatusHistory` | `id`, `order` FK, `from_status`, `to_status`, `changed_by`, `reason`, `created_at` |
| Payment status enum | `UNPAID` · `PAID` · `PARTIALLY_REFUNDED` · `FULLY_REFUNDED` · `FAILED` |
| Fulfillment status enum | `UNFULFILLED` · `PARTIALLY_FULFILLED` · `FULFILLED` · `RETURNED` |

### 5.6 payments — Stripe & Webhooks

| Model / Field | Details |
|---|---|
| `StripeSession` | `id`, `order` FK, `stripe_session_id` (unique), `amount` (MoneyField), `currency`, `status`, `created_at`, `expires_at` |
| `WebhookEvent` | `id`, `stripe_event_id` (unique), `event_type`, `payload` (JSON), `received_at`, `processed_at`, `status` (PENDING / PROCESSED / FAILED) |
| `PaymentTransaction` | `id`, `order` FK, `stripe_payment_intent_id`, `amount` (MoneyField), `currency`, `settled_currency`, `settled_amount` (MoneyField), `type` (CHARGE / REFUND), `status`, `created_at` |
| Idempotency rule | `WebhookEvent` stored before processing. Duplicate `stripe_event_id` rejected. Processing runs in atomic transaction. `processed_at` set on success. |

### 5.7 fulfillment — Shipping & Shipments

| Model / Field | Details |
|---|---|
| `ShippingMethod` | `id`, `name`, `base_rate` (MoneyField), `free_above` (MoneyField nullable), `estimated_days_min`, `estimated_days_max`, `is_active` |
| Shipping logic | At checkout: `if cart.total >= method.free_above → shipping = 0 else shipping = base_rate` |
| `Shipment` | `id`, `order` FK, `carrier`, `tracking_number`, `shipped_at`, `estimated_delivery`, `status` (PENDING / SHIPPED / DELIVERED / RETURNED) |
| `ShipmentItem` | `id`, `shipment` FK, `order_item` FK, `quantity` — supports partial fulfillment |

### 5.8 returns — Return Requests

| Model / Field | Details |
|---|---|
| `ReturnRequest` | `id` (UUID), `order` FK, `user` FK, `status` (REQUESTED / APPROVED / REJECTED / COMPLETED), `created_at`, `reviewed_at`, `reviewed_by` |
| `ReturnLineItem` | `id`, `return_request` FK, `order_item` FK, `quantity`, `reason` (WRONG_ITEM / DAMAGED / CHANGED_MIND / DEFECTIVE / OTHER), `notes` |
| Return approval flow | Customer creates request → Ops reviews → Approved: restock via `InventoryMovement` + trigger Stripe refund → `PaymentTransaction` updated |
| Rule | No refund can be issued without a `ReturnRequest` or explicit admin override with recorded reason |

### 5.9 notifications — Channel Abstraction

**Channels: Email · SMS (Twilio) · Push (FCM — mobile + web). WhatsApp is not used.**

```
notifications/
├── channels/
│   ├── email.py       — transactional email provider
│   ├── sms.py         — Twilio SMS
│   └── push.py        — FCM (Android + iOS + Web browser)
├── models.py          — Notification, NotificationTemplate, DeviceToken
├── tasks.py           — Django-Q2 async tasks (async_task() calls)
└── events.py          — maps business events → templates
```

**Django-Q2 task functions in `notifications/tasks.py`:**

| Function | Trigger |
|---|---|
| `send_order_confirmation(order_id)` | Called after `checkout.session.completed` webhook |
| `send_shipment_notification(shipment_id)` | Called when shipment created/updated |
| `send_return_update(return_request_id)` | Called on return approval or rejection |
| `send_refund_notification(transaction_id)` | Called after Stripe refund processed |
| `send_abandoned_cart_reminder(cart_id)` | Scheduled — carts idle > 24h |

| Business Event | Email | SMS (Twilio) | Push (FCM) |
|---|---|---|---|
| Order placed | ✅ | ✅ | ✅ |
| Payment confirmed | ✅ | | ✅ |
| Order shipped | ✅ | ✅ | ✅ |
| Return approved | ✅ | | ✅ |
| Refund processed | ✅ | ✅ | ✅ |
| Abandoned cart reminder | ✅ | | ✅ |
| Flash sale / promo (broadcast) | | | ✅ FCM topic |
| OTP delivery | | ✅ | |
| Low stock alert (internal) | ✅ | | |

**`DeviceToken` model:**

| Field | Detail |
|---|---|
| `id` | UUID primary key |
| `user` | FK to User |
| `token` | FCM registration token — rotates; client must update on refresh |
| `platform` | Enum: `ANDROID` / `IOS` / `WEB` |
| `is_active` | Set to `False` when FCM returns `registration-token-not-registered` |
| `created_at` / `last_seen_at` | Token lifecycle tracking |

> **Architecture note:** Business events map to templates in `events.py` — never to providers directly. Token rotation errors from FCM automatically deactivate stale `DeviceToken` records via `push.py`.

---

## 6. Authentication Architecture

### 6.1 Three Auth Methods — One User

All three authentication paths resolve to the same `User` model. Email is the canonical identity. `django-allauth` handles email+password and Google OAuth. A custom `OTPAuthBackend` handles mobile OTP via Twilio.

| Method | Library / Service | Flow summary | Token output |
|---|---|---|---|
| Email + password | django-allauth | Register → verify email → login | JWT or session |
| Google OAuth | django-allauth (Google provider) | OAuth 2.0 → allauth creates/links User | JWT or session |
| Mobile OTP | Custom backend + Twilio | Phone → Twilio SMS → code verified → login | JWT or session |

### 6.2 OTP Flow Detail

1. Client sends phone number to `POST /api/v1/auth/otp/request/`
2. Django creates `OTPRequest` (hashed code, 10-min TTL), sends SMS via Twilio
3. Client submits code to `POST /api/v1/auth/otp/verify/`
4. Django validates code, marks `OTPRequest` used, creates or retrieves `User`
5. Returns auth token — same format as email/Google auth

> **Security rule:** OTP codes are stored hashed. Rate limiting enforced on `/otp/request/` — max 5 requests per phone per hour. Codes are single-use and expire after 10 minutes.

---

## 7. Currency Architecture

### 7.1 django-money Implementation

Every monetary field across the platform uses `MoneyField` from `django-money`. This stores amount and currency as two database columns and prevents unsafe arithmetic between different currencies.

| Principle | Implementation |
|---|---|
| Default currency | INR — set as default in all MoneyField definitions |
| Model fields | `price = MoneyField(max_digits=12, decimal_places=2, default_currency="INR")` |
| Multi-currency readiness | `currency` column stored on every price field from day one |
| Exchange rates | Manual price-per-currency entry (recommended for physical goods) OR Open Exchange Rates API |
| Stripe settlement | Stripe handles charge in customer currency; settled currency + amount stored on `PaymentTransaction` |
| Arithmetic safety | django-money raises `TypeError` if you add/compare different currencies |

### 7.2 PaymentTransaction Currency Fields

Two currency pairs are stored on every `PaymentTransaction`:

- `amount` + `currency` — the amount charged in the customer's chosen currency
- `settled_amount` + `settled_currency` — what Stripe actually settled to your bank account

---

## 8. Key Request & Transaction Flows

### 8.1 Registration & Login Flow

1. User visits storefront — registration required before any checkout
2. Auth method selected: email+password, Google OAuth, or mobile OTP
3. All paths create or retrieve the same `User` record
4. JWT or session token issued — used for all subsequent API calls

### 8.2 Product Browse Flow

1. Next.js fetches category / product data from Django REST API
2. Frequently accessed product and collection payloads served from Redis cache
3. Editorial content (banners, landing page blocks) fetched from Sanity via GROQ query
4. Media served from Django local media storage — swap to S3 + CDN when scaling

### 8.3 Checkout Flow

1. Cart validated server-side — pricing, stock, and coupon rules recalculated
2. Shipping cost applied: free if `cart.total >= free_above` threshold, else `base_rate`
3. `StockReservation` created for each `CartItem` (expires in 15 min)
4. Django creates `Order` (status=PENDING) and `StripeSession`
5. User completes payment in Stripe Checkout
6. Stripe sends signed webhook to `POST /api/v1/payments/webhook/`
7. `WebhookEvent` stored idempotently — duplicate `stripe_event_id` rejected
8. Payment service updates `PaymentTransaction` and `Order.payment_status = PAID`
9. `StockReservation` converted to committed `InventoryMovement` (SALE type)
3. Django-Q2 dispatches order confirmation via `async_task()`: email + SMS + FCM push to all active user devices

### 8.4 Webhook Processing Flow

1. Stripe signature verified against `STRIPE_WEBHOOK_SECRET`
2. `WebhookEvent` record created if event ID not already stored
3. Duplicate events rejected immediately with `200 OK` response
4. Processing runs inside atomic database transaction
5. `processed_at` and final status set on success
6. Audit log entry created
7. Django-Q2 tasks dispatched for downstream jobs via `async_task()` (notifications, reindex)

### 8.5 Return & Refund Flow

1. Customer submits return request via storefront — `ReturnRequest` created (status=REQUESTED)
2. `ReturnLineItem` records specify which order items and quantities, with reason codes
3. Ops team reviews in Django Admin — approves or rejects
4. On approval: `InventoryMovement` created (RETURN type) to restock items
5. Stripe refund API called — `PaymentTransaction` record created (type=REFUND)
6. `Order.payment_status` updated (PARTIALLY_REFUNDED or FULLY_REFUNDED)
7. Django-Q2 sends refund confirmation via `async_task()`: email + SMS + FCM push to customer devices

---

## 9. Sanity CMS Integration

### 9.1 Editorial Ownership

Sanity owns all editorial and marketing content. Django's `marketing` app is a thin layer that may cache Sanity content slot IDs or sync webhook-triggered updates. Next.js fetches editorial content directly from Sanity via GROQ API — bypassing Django entirely for marketing data.

| Content type | Owner |
|---|---|
| Product data, pricing, inventory | Django (source of truth) |
| Orders, payments, returns | Django (source of truth) |
| User accounts, addresses | Django (source of truth) |
| Hero banners, landing page blocks | Sanity |
| Editorial articles, lookbooks | Sanity |
| Announcement bars, promotional text | Sanity |
| Category editorial copy (optional) | Sanity or Django — decide per case |

### 9.2 Sanity Setup

- **Plan:** Free tier — 10k API requests/day, 3 users, 2 datasets
- **Next.js integration:** `@sanity/client` + `next-sanity` toolkit (official)
- **Content queries:** GROQ — Sanity's native query language
- **Real-time preview:** Sanity Studio embedded in editorial workflow
- **Upgrade trigger:** Editorial team grows beyond 3 users or request volume exceeds free tier

---

## 10. API Design

### 10.1 Public API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/catalog/categories/` | Category tree |
| `GET /api/v1/catalog/products/` | Paginated product list — filter by category, attribute, price |
| `GET /api/v1/catalog/products/{slug}/` | Product detail with variants and attributes |
| `POST /api/v1/auth/register/` | Email+password registration |
| `POST /api/v1/auth/login/` | Email+password login |
| `POST /api/v1/auth/google/` | Google OAuth token exchange |
| `POST /api/v1/auth/otp/request/` | Request OTP to phone number |
| `POST /api/v1/auth/otp/verify/` | Verify OTP and login |
| `POST /api/v1/carts/` | Create cart (authenticated) |
| `POST /api/v1/carts/{id}/items/` | Add item to cart |
| `PATCH /api/v1/carts/{id}/items/{item_id}/` | Update item quantity |
| `POST /api/v1/carts/{id}/coupon/` | Apply coupon code |
| `POST /api/v1/checkout/session/` | Create order + Stripe session |
| `GET /api/v1/orders/` | User's order list |
| `GET /api/v1/orders/{id}/` | Order detail + status |
| `POST /api/v1/returns/` | Submit return request |
| `POST /api/v1/notifications/device-token/` | Register / update FCM device token |
| `POST /api/v1/payments/webhook/` | Stripe webhook receiver |

### 10.2 API Standards

- All APIs versioned under `/api/v1/` — never break existing clients
- List endpoints always paginated — `page_size` default 20, max 100
- Filter only on indexed fields — `slug`, `sku`, `status`, `created_at`, `category`
- Machine-readable error codes in all error responses (e.g. `CART_ITEM_OUT_OF_STOCK`)
- Explicit serializer boundaries — no model serializers leaked to API layer
- Webhook endpoint returns `200 OK` immediately — processing is async via Django-Q2 `async_task()`
- Frontend API base URL: `VITE_API_URL` env var (default: `http://localhost:8000/api/v1`)
- All responses in camelCase via `djangorestframework-camel-case`
- JWT Bearer auth on all authenticated endpoints — auto-refresh on 401 handled client-side

---

## 11. Security Architecture

| Area | Implementation |
|---|---|
| Authentication tokens | JWT for API clients; session auth for Django Admin |
| Django Admin access | MFA enforced; restricted IP allowlist recommended |
| CSRF protection | Enabled for all session-auth endpoints |
| Stripe webhooks | Signature verified against `STRIPE_WEBHOOK_SECRET` on every request |
| OTP rate limiting | Max 5 OTP requests per phone per hour; code single-use, 10-min TTL |
| Public API rate limiting | DRF throttling classes per endpoint category; WAF at ALB level |
| Checkout & coupon endpoints | Stricter throttle limits — most abuse-prone endpoints |
| Object-level authorization | Users can only access their own orders, carts, and return requests |
| Secrets management | AWS Secrets Manager + SSM Parameter Store — never in source code |
| PII handling | Minimized collection; retention policies defined; encrypted at rest (RDS) |
| Audit trail | Admin-sensitive actions logged with actor, timestamp, and change summary |
| WAF | AWS WAF at ALB — SQL injection, XSS, rate abuse protection |

---

## 12. Performance Design

### 12.1 Database Optimisation

- `select_related` and `prefetch_related` on all list views — zero N+1 queries tolerated
- Composite indexes on: `(category, is_active)`, `(status, created_at)`, `(user, status)` on orders
- Unique index on: `slug`, `sku`, `stripe_event_id`, `stripe_session_id`
- DB constraints for correctness — not only application-layer validation
- `StockLevel.quantity_available` computed — not stored — to avoid consistency bugs

### 12.2 Caching Strategy (Redis)

| Cache key | TTL |
|---|---|
| Category tree | 30 min — invalidated on admin category update |
| Product detail | 15 min — invalidated on admin product update |
| Collection landing page | 30 min — invalidated on collection update |
| Site config / currency settings | 60 min |
| Cart summary | 5 min — short-lived, user-scoped |
| Search autocomplete feed | 10 min |

### 12.3 Search Roadmap

| Stage | Approach |
|---|---|
| Launch (Stage 1) | PostgreSQL full-text search — `SearchVector` on product name, description, sku |
| Growth (Stage 2) | Migrate to OpenSearch when catalog exceeds ~2,000 SKUs or FTS query latency exceeds 200ms |
| Tooling | `django-watson` or raw `SearchVector` + GIN index for Stage 1 |

---

## 13. Build Order & Phasing

### Phase 1 — Foundation
*Build first — everything depends on these*

| Step | App | Key deliverables | Depends on |
|---|---|---|---|
| 1 | `core` | `BaseModel` (UUID PK, timestamps, soft delete), `AuditMixin`, shared constants | — |
| 2 | `accounts` | Custom User model, email auth, Google OAuth (allauth), OTP backend (Twilio), Address model | core |
| 3 | `catalog` | Category, Product, ProductVariant, AttributeDefinition, AttributeValue, VariantAttribute, ProductImage | core |
| 4 | `inventory` | StockLevel, InventoryMovement, StockReservation | catalog |

### Phase 2 — Transactional Core
*Revenue path*

| Step | App | Key deliverables | Depends on |
|---|---|---|---|
| 5 | `carts` | Cart, CartItem, CouponCode, CartCoupon, shipping method selection, server-side price recalculation | accounts, catalog, inventory |
| 6 | `orders` | Order, OrderItem (snapshot), OrderStatusHistory, status state machine | carts, fulfillment |
| 7 | `payments` | StripeSession, WebhookEvent (idempotent), PaymentTransaction, Stripe webhook handler | orders |
| 8 | `fulfillment` | ShippingMethod (free-above logic), Shipment, ShipmentItem, fulfillment status | orders |

### Phase 3 — Post-Purchase

| Step | App | Key deliverables | Depends on |
|---|---|---|---|
| 9 | `returns` | ReturnRequest, ReturnLineItem, ReturnReason, approval flow, refund trigger, inventory restock | orders, payments, inventory |
| 10 | `notifications` | NotificationTemplate, DeviceToken, channel backends (email / SMS / FCM push — mobile + web), Django-Q2 task wiring | orders, payments, returns |

### Phase 4 — Growth & Ops

| Step | App | Key deliverables | Depends on |
|---|---|---|---|
| 11 | `marketing` | Sanity integration, content slot references, GROQ query setup in Next.js | Sanity project created |
| 12 | `search` | SearchVector indexes, autocomplete feed, reindex Celery tasks | catalog |
| 13 | `analytics` | Event capture, conversion funnel, export hooks | orders, carts |
| 14 | Admin UX | django-unfold setup, role groups, bulk actions, order timeline, dashboard widgets | All apps |

---

## 14. Scaling Roadmap

| Stage | Configuration |
|---|---|
| **Stage 1 — MVP** | Single region · 1 Django instance · FileSystemStorage with mounted persistent volume · 1 Django-Q worker (`qcluster`) · PostgreSQL primary (also task broker) · Redis single node (cache) |
| **Stage 2 — Growth** | Read replicas for PostgreSQL · Dedicated Celery worker queues (high/low priority) · OpenSearch for catalog search · S3 + CloudFront for media · Image optimization pipeline |
| **Stage 3 — Scale** | Regional failover · Event bus (SNS/SQS) for downstream integrations · Split heavy domains if read/write patterns justify · Multi-region CDN |
| **S3 trigger** | Enable when: running multiple Django instances, using ephemeral containers, or doing rolling deployments without a shared persistent volume |
| **OpenSearch trigger** | Migrate from PostgreSQL FTS when: catalog exceeds ~2,000 SKUs OR search query p95 latency exceeds 200ms |

---

## 15. Admin Panel Architecture

### 15.1 Technology: React Admin CMS + django-unfold

The admin surface is split into two tiers:

| Tier | Technology | URL | Purpose |
|---|---|---|---|
| **Staff CMS** | React 18 + shadcn/ui (Radix UI + Tailwind + CVA) | `/admin-panel/` | Day-to-day catalog/order/user management by staff with `is_staff=true` |
| **Superadmin shell** | django-unfold | `/admin/` | Django ORM-level access for engineers + data ops |

The React CMS uses dedicated DRF endpoints under `/api/v1/admin/` protected by `IsAdminUser`. Auth reuses the existing JWT flow — the `is_staff` flag is exposed on the `/auth/me/` endpoint.

### 15.2 Frontend Admin Panel Structure

```
src/
├── components/admin/
│   ├── AdminRoute.jsx        ← Guards routes by is_staff; redirects non-staff
│   ├── AdminLayout.jsx       ← Sidebar + topbar + <Outlet />
│   ├── AdminSidebar.jsx      ← Dark collapsible nav (bg-gray-900)
│   └── ui/
│       ├── AdminButton.jsx   ← CVA button variants
│       ├── AdminBadge.jsx    ← Status badge + statusVariant() helper
│       ├── AdminDialog.jsx   ← Radix Dialog with overlay/header/footer
│       ├── AdminSelect.jsx   ← Radix Select
│       └── AdminSwitch.jsx   ← Radix Switch
├── pages/admin/
│   ├── AdminDashboardPage.jsx   ← Stat cards + revenue widgets + recent orders
│   ├── AdminProductsPage.jsx    ← Products table with search + delete
│   ├── AdminProductFormPage.jsx ← Create/edit product form with image upload
│   ├── AdminCategoriesPage.jsx  ← Categories table + dialog CRUD
│   ├── AdminAttributesPage.jsx  ← Two-panel attribute types + values
│   ├── AdminOrdersPage.jsx      ← Orders table with status filter
│   ├── AdminOrderDetailPage.jsx ← Full order detail + status update + history timeline
│   ├── AdminReturnsPage.jsx     ← Returns queue with approve/reject dialogs
│   ├── AdminCouponsPage.jsx     ← Coupons CRUD with create/edit dialog
│   └── AdminUsersPage.jsx       ← Users table with is_staff / is_active toggles
└── services/
    ├── adminCatalogService.js   ← Catalog CRUD + image upload
    ├── adminOrderService.js     ← Orders + returns read/approve/reject
    ├── adminMarketingService.js ← Coupon CRUD
    └── adminUserService.js      ← User list/update + stats
```

### 15.3 Admin API Endpoints

All endpoints under `/api/v1/admin/` require `IsAdminUser` (is_staff=True + is_active=True).

| Endpoint | Methods | Description |
|---|---|---|
| `catalog/categories/` | GET, POST, PATCH, DELETE | Category CRUD |
| `catalog/products/` | GET, POST, PATCH, DELETE | Product CRUD |
| `catalog/products/{id}/images/` | GET, POST, DELETE | Product image upload/ordering |
| `catalog/products/{id}/variants/` | GET, POST, PATCH, DELETE | Variant CRUD |
| `catalog/attributes/` | GET, POST, PATCH, DELETE | Attribute types |
| `catalog/attribute-values/` | GET, POST, PATCH, DELETE | Attribute values |
| `orders/` | GET | Order list (lightweight) |
| `orders/{id}/` | GET | Order detail (full with items + history) |
| `orders/{id}/status/` | PATCH | Status update — creates `OrderStatusHistory` record |
| `returns/` | GET | Return request list |
| `returns/{id}/` | GET | Return detail |
| `returns/{id}/approve/` | PATCH | Approve return — restocks inventory via `InventoryMovement` |
| `returns/{id}/reject/` | PATCH | Reject return |
| `marketing/coupons/` | GET, POST, PATCH, DELETE | Coupon CRUD |
| `users/` | GET, PATCH | User list + toggle is_staff/is_active |
| `stats/` | GET | Dashboard stats (revenue, order counts, pending returns) |

### 15.4 Staff Access Model

| Role | Access mechanism | Admin panel sections |
|---|---|---|
| **Staff** | `is_staff=True` on User model | All 10 sections (products, categories, attributes, orders, returns, coupons, users) |
| **Superadmin** | `is_superuser=True` | Django `/admin/` shell + all staff sections |
| **Customer** | `is_staff=False` | Redirected to storefront; "Access Denied" on `/admin-panel/` |

### 15.5 Admin Security

- JWT auth reused — no separate session cookie for admin panel
- Backend validates `is_staff` on every request via DRF `IsAdminUser` permission class
- `is_staff` promotion requires confirmation dialog on frontend (cannot be toggled by accident)
- No user deletion endpoint — only `is_active` deactivation
- All admin API routes return 403 for non-staff tokens
- django-unfold (`/admin/`) still requires Django session auth + superuser flag

### 15.6 django-unfold (Superadmin Shell)

`django-unfold` is installed (`requirements/base.txt`) but wired only to `INSTALLED_APPS` for the Django `/admin/` shell — used by engineers and data ops only. It is NOT the primary CMS interface for staff.

---

## 16. Push Notification Architecture (FCM)

### 16.1 FCM Coverage

Firebase Cloud Messaging (FCM) is used for all push notifications — mobile (Android + iOS) and web browser. iOS delivery goes through APNs via FCM bridge — no separate APNs integration required.

| Platform | Mechanism |
|---|---|
| Android | FCM native — direct delivery |
| iOS | FCM → APNs bridge — configure APNs key in Firebase console |
| Web browser | FCM Web Push — requires service worker in Next.js frontend |

### 16.2 Token Lifecycle

1. App/browser registers with FCM on first load — receives registration token
2. Token sent to Django: `POST /api/v1/notifications/device-token/`
3. `DeviceToken` record created or updated for the user + platform combination
4. FCM rotates tokens periodically — client must send updated token on refresh
5. If FCM returns `registration-token-not-registered` error → `DeviceToken.is_active = False`
6. Celery push tasks skip inactive tokens automatically

> **Multi-device rule:** One user may have multiple active `DeviceToken` records (phone + tablet + browser). Transactional push events fan out to **all** active tokens for that user.

### 16.3 FCM Topic Subscriptions (Broadcast)

| FCM Topic | Who subscribes | Used for |
|---|---|---|
| `all_users` | Every registered user on app install | Platform-wide announcements |
| `sale_alerts` | Users who opt in to promotions | Flash sales, limited-time offers |
| `back_in_stock` | Users who request restock alerts | Product back-in-stock notifications |

Topic subscriptions are managed client-side via the FCM SDK. Django stores opt-in preferences in a `NotificationPreference` model linked to `User` — used for email/SMS opt-outs and to mirror topic state for reporting.

### 16.4 Web Push Setup (Next.js)

- Service worker registered in Next.js — handles background push events
- `firebase-messaging-sw.js` placed in `/public/` directory
- Permission prompt shown after user places first order (higher consent rate at this point)
- VAPID keys generated in Firebase console — stored in AWS Secrets Manager

---

## 17. Observability

### 17.1 Tooling

| Tool | Purpose |
|---|---|
| Sentry | Exception tracking — Django backend and Next.js frontend |
| OpenTelemetry | Distributed tracing across Django, Celery, and external services |
| CloudWatch | Infrastructure metrics, log aggregation, alarms |
| Structured JSON logging | All Django logs in JSON format — queryable in CloudWatch Logs Insights |

### 17.2 Key Business Metrics to Track

- Checkout conversion rate — cart created → order confirmed
- Payment failure rate — failed Stripe sessions by reason code
- Webhook replay count — indicator of processing failures
- Stock mismatch count — reserved vs committed discrepancies
- API p95 latency — per endpoint, alerted above 500ms
- Cart abandonment rate — active carts not checked out within 24h
- Return rate by product — identify quality or expectation issues
- OTP delivery success rate — Twilio delivery confirmations
- FCM push delivery rate — successful vs failed token deliveries per event type

### 17.3 CI/CD Pipeline

1. Lint (`ruff`, `eslint`) + unit tests + migration check on every PR
2. Security scan (`bandit` for Python, `npm audit` for JS)
3. Build and push Docker image via CI pipeline on merge to main
4. Run migrations as a controlled release step before new pods start
5. Smoke tests after deployment: checkout flow, webhook receipt, admin login, FCM token registration

---

## 18. Implementation Status & Deviations

### 18.1 Stack Deviations from Original Design

| Component | Original Design | Actual Implementation | Reason |
|---|---|---|---|
| Frontend framework | Next.js 14 (SSR/ISR) | React 18 + Vite 6 + Tailwind CSS 3 (SPA) | Development velocity; SSR/ISR can be added later |
| Task queue | Celery 5 + Celery Beat | Django-Q2 1.9.0 (ORM broker) | Eliminates Redis as task broker dependency; simpler ops |
| Task broker | Redis | PostgreSQL (via Django-Q2 ORM broker) | No separate Redis instance needed for tasks |
| Editorial CMS | Sanity (headless) | Static mock data (Sanity integration deferred) | Build velocity; Sanity can be wired in Phase 4 |
| Frontend hosting | Vercel / AWS Amplify | Local Vite dev server / `npm run build` static dist | Development phase |

### 18.2 Backend Implementation Status

| App | Models | Migrations | Admin | API Views | Status |
|---|---|---|---|---|---|
| `core` | ✅ BaseModel, AuditMixin | ✅ | ✅ | — | Complete |
| `accounts` | ✅ User, Address, OTPRequest | ✅ | ✅ | ✅ | Complete |
| `catalog` | ✅ Category, Product, ProductVariant, AttributeDefinition, AttributeValue | ✅ | ✅ | ✅ | Complete |
| `inventory` | ✅ StockLevel, InventoryMovement, StockReservation | ✅ | ✅ | ✅ | Complete |
| `carts` | ✅ Cart, CartItem, CouponCode, CartCoupon | ✅ | ✅ | ✅ | Complete |
| `orders` | ✅ Order, OrderItem, OrderStatusHistory | ✅ | ✅ | ✅ | Complete |
| `payments` | ✅ StripeSession, WebhookEvent, PaymentTransaction | ✅ | ✅ | ✅ | Complete |
| `fulfillment` | ✅ ShippingMethod, Shipment, ShipmentItem | ✅ | ✅ | ✅ | Complete |
| `returns` | ✅ ReturnRequest, ReturnLineItem | ✅ | ✅ | ✅ | Complete |
| `notifications` | ✅ Notification, NotificationTemplate, DeviceToken | ✅ | ✅ | Partial | Tasks wired; channels not fully implemented |
| `marketing` | ✅ ContentSlotReference | ✅ | ✅ | — | Stub only; Sanity integration deferred |
| `search` | ✅ SearchDocument | ✅ | ✅ | Partial | FTS index scaffolded |
| `analytics` | ✅ Event, ConversionLog | ✅ | ✅ | — | Models only |

### 18.3 Django-Q2 Configuration

```python
# config/settings/base.py
Q_CLUSTER = {
    "name": "curated",
    "workers": 2,
    "timeout": 60,
    "retry": 120,
    "queue_limit": 50,
    "bulk": 10,
    "orm": "default",          # Uses PostgreSQL — no Redis required
    "ack_failures": True,
    "max_attempts": 3,
    "label": "Django Q",
}
```

**Running the worker:**
```bash
python manage.py qcluster
```

**Dispatching tasks:**
```python
from django_q.tasks import async_task
async_task("apps.notifications.tasks.send_order_confirmation", order.id)
```

### 18.4 Seed Data Command

A management command is available to populate the database with sample content:

```bash
python manage.py seed_data
```

Creates:
- **21 categories** — hierarchical (tops, bottoms, outerwear, etc.)
- **4 attribute definitions** — size, colour, material, fit
- **15 products** — across all major categories
- **150 product variants** — 10 variants per product, 25 units stock each
- **2 shipping zones** — standard and express rules
- **4 coupon codes** — test codes for discount validation

No users are created. Safe to run multiple times (uses `get_or_create` guards).

### 18.5 Frontend API Layer

The React frontend communicates with Django REST Framework via a layered service architecture:

**Service files** (`src/services/`):

| File | Responsibilities |
|---|---|
| `api.js` | Axios instance; JWT Bearer header injection; silent token refresh on 401; concurrent 401 queuing |
| `authService.js` | login, register, getMe, updateProfile, changePassword, logout, requestOtp, verifyOtp, getAddresses, createAddress, updateAddress, deleteAddress |
| `catalogService.js` | getCategories, getProducts(params), getProduct(slug), getNewArrivals(page), getFeatured() |
| `cartService.js` | getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon |
| `orderService.js` | createOrder, getOrders, getOrder(ref), createCheckoutSession, createReturn, getShipments, getShippingRules |
| `miscServices.js` | wishlistService (getWishlist, toggle, check), reviewService (getReviews, getRatingSummary, createReview), searchService |

**Core hooks and utilities:**
- `src/hooks/useApi.js` — `const { data, loading, error, reload } = useApi(fetcher, deps)` — generic data fetching with loading states
- `src/utils/normalizers.js` — `normalizeProduct(p)` maps snake_case API response to camelCase UI shape; `formatPrice(amount)`

**Checkout payment flow:**
1. User confirms cart → `orderService.createOrder()` → Django creates `Order` (status=PENDING)
2. `orderService.createCheckoutSession(orderId)` → Django creates `StripeSession`, returns `sessionUrl`
3. Frontend redirects: `window.location.href = sessionUrl`
4. User completes payment in Stripe-hosted Checkout
5. Stripe webhook → Django → `Order.payment_status = PAID` → Django-Q2 dispatches confirmation tasks
6. Stripe redirects user to `/order-confirmation?order={orderNumber}`

---

*End of document — v1.1 · Updated July 2025*
