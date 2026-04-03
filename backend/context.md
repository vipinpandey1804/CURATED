# Backend Context — Nordic Commerce
**Last Updated**: 03-04-2026  
**Status**: Active Development

---

## Tech Stack
- **Framework**: Django 5.1.15 + Django REST Framework 3.17.1
- **Database**: PostgreSQL — db: `curated_db`, user: `postgres`, password: `admin@123`
- **Test DB**: `curated_test` (auto-created/destroyed by pytest)
- **Auth**: JWT (simplejwt) + custom authentication backends
- **Admin**: Unfold-themed Django admin (`/admin/`)
- **Task Queue**: django-q2 + Redis
- **Payments**: Stripe
- **Email**: Gmail SMTP — `testinguser1110@gmail.com` / `zaxnorjkmhjxjjdv`
- **SMS**: Twilio (credentials in `.env` as placeholders — real values needed for production)
- **Python venv**: `e:\ecom-project\backend\venv\`

---

## Running the Server
```powershell
$env:DJANGO_SETTINGS_MODULE="config.settings.dev"
e:\ecom-project\backend\venv\Scripts\python.exe e:\ecom-project\backend\manage.py runserver 0.0.0.0:8000
```

## Running Tests
```powershell
Remove-Item Env:DJANGO_SETTINGS_MODULE -ErrorAction SilentlyContinue
e:\ecom-project\backend\venv\Scripts\pytest.exe tests/ -v
```
**Current result**: 49/49 PASSED

---

## Project Structure
```
backend/
├── apps/
│   ├── accounts/       ← Auth, User, OTP, Address
│   ├── catalog/        ← Categories, Products, Variants
│   ├── carts/          ← Cart, CartItem, Coupons
│   ├── orders/         ← Orders, OrderItems
│   ├── payments/       ← Stripe integration
│   ├── fulfillment/    ← Shipping, Tracking
│   ├── inventory/      ← Stock management
│   ├── reviews/        ← Product reviews
│   ├── wishlists/      ← User wishlists
│   ├── marketing/      ← Promotions, Coupons
│   ├── notifications/  ← User notifications
│   ├── analytics/      ← Event tracking
│   ├── returns/        ← Return requests
│   ├── search/         ← Search functionality
│   └── core/           ← Shared utilities
├── config/
│   └── settings/
│       ├── base.py     ← Shared settings
│       ├── dev.py      ← Development overrides
│       └── test.py     ← Test overrides
├── tests/
│   ├── test_accounts.py   ← 24 tests ✅
│   ├── test_cart.py       ← 11 tests ✅
│   └── test_catalog.py    ← 14 tests ✅
├── requirements/
│   ├── base.txt
│   └── dev.txt
├── .env                ← Local secrets (not committed)
└── manage.py
```

---

## Completed Features

### Authentication (`apps/accounts/`)
- **User model** — email (primary), `phone_number` (unique, nullable), `is_verified`, standard fields
- **UserManager** — `create_user()` accepts email OR phone_number; generates placeholder email for phone-only users
- **RegisterView** — accepts email OR phone_number + password + first/last name; creates OTP; sends via SMTP or Twilio; returns `{detail, identifier, identifierType}` (no tokens until OTP verified)
- **LoginView** — accepts `{email, password}` OR `{phoneNumber, password}`; returns JWT tokens + user
- **OTPRequestView** — rate-limited (5/hour); sends OTP via email (SMTP) or phone (Twilio/console)
- **OTPVerifyView** — verifies OTP, marks `user.is_verified = True`, returns JWT tokens
- **MeView** — GET/PATCH authenticated user profile
- **ChangePasswordView** — authenticated password change
- **AddressViewSet** — full CRUD for user addresses with default address support
- **OTPAuthBackend** — authenticates by OTP code (email or phone)
- **PhonePasswordAuthBackend** — authenticates by phone_number + password ← NEW
- **EmailPasswordBackend** — standard email + password (via Django default)

### Admin (`apps/accounts/admin.py`)
- Unfold-themed admin at `/admin/`
- `User` list: `email`, `phone_number`, `first_name`, `last_name`, `is_verified`, `is_active`, `is_staff`, `date_joined`
- Fieldsets include `phone_number` and `is_verified`

### Catalog (`apps/catalog/`)
- Categories, Products, ProductVariants — fully tested
- Filters: category slug, new arrivals, featured, search query
- Pagination working

### Cart (`apps/carts/`)
- Cart management: add, update quantity, remove, clear
- Coupon application/removal
- Unauthenticated access returns 401

### Migrations Applied
- `accounts 0001` — initial
- `accounts 0002` — add email to OTPRequest
- `accounts 0003` — add `is_verified` + `phone_number` to User ← NEW

---

## Settings Summary (`config/settings/base.py`)
```python
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "apps.accounts.backends.OTPAuthBackend",
    "apps.accounts.backends.PhonePasswordAuthBackend",   # NEW
]
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")
```

---

## API Endpoints (`/api/v1/`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register/` | Create account (email or phone), sends OTP |
| POST | `/auth/login/` | Login with email+pass or phone+pass → JWT |
| POST | `/auth/otp/request/` | Request new OTP (rate limited 5/hr) |
| POST | `/auth/otp/verify/` | Verify OTP → JWT tokens + sets is_verified |
| GET/PATCH | `/auth/me/` | Authenticated user profile |
| POST | `/auth/password/change/` | Change password |
| GET/POST/PATCH/DELETE | `/auth/addresses/` | Address CRUD |
| GET | `/catalog/categories/` | Category list |
| GET | `/catalog/products/` | Product list with filters |
| GET | `/catalog/products/{slug}/` | Product detail |
| GET/POST | `/cart/` | Cart operations |

---

## In Progress
- Nothing active — all implemented features tested and passing

## Next Steps (Planned)
- Orders app — create order from cart, order history
- Payments — Stripe checkout integration
- Reviews — product review submission
- Wishlists — add/remove products
- Password reset via email (forgot password flow)
- Real Twilio credentials for SMS OTP in production

---

## Key Files Changed in Last Session
| File | Change |
|------|--------|
| `apps/accounts/models.py` | Added `phone_number`, `is_verified` to User; updated UserManager |
| `apps/accounts/backends.py` | Added `PhonePasswordAuthBackend`; fixed OTPAuthBackend phone lookup |
| `apps/accounts/serializers.py` | RegisterSerializer accepts email OR phone; UserSerializer exposes new fields |
| `apps/accounts/views.py` | Full rewrite — email/phone registration, OTP send, phone login |
| `apps/accounts/admin.py` | Added `phone_number`, `is_verified` to list_display and fieldsets |
| `config/settings/base.py` | Added PhonePasswordAuthBackend + Twilio settings |
| `.env` | Email SMTP credentials active; Twilio placeholders added |
| `apps/accounts/migrations/0003_*` | Migration for phone_number + is_verified |
| `tests/test_accounts.py` | Updated for new register/login API shape; added phone tests |
