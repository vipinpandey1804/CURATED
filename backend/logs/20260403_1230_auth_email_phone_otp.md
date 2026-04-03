# Auth System — Email/Phone Registration, OTP, Login

**Date**: 03-04-2026 12:30  
**Feature**: Full authentication backend

## What Was Built
1. **User model** — added `phone_number` (unique, nullable CharField) and `is_verified` BooleanField; updated `UserManager.create_user()` to accept phone-only registration with placeholder email
2. **PhonePasswordAuthBackend** — new backend in `backends.py`; authenticates `phone_number + password`
3. **OTPAuthBackend** — fixed phone lookup to use `User.phone_number` directly (was using Profile)
4. **RegisterView** — accepts email OR phone; creates + stores OTP; sends via SMTP (email) or Twilio/console log (phone); returns `{detail, identifier, identifierType}` — no JWT until OTP verified
5. **LoginView** — accepts `{email, password}` OR `{phoneNumber, password}`; returns JWT tokens
6. **OTPVerifyView** — verifies OTP code, sets `user.is_verified = True`, returns JWT
7. **admin.py** — `phone_number` and `is_verified` added to list_display and fieldsets
8. **Migration 0003** — applied `phone_number` + `is_verified` to prod DB

## Files Changed
- `apps/accounts/models.py`
- `apps/accounts/backends.py`
- `apps/accounts/serializers.py`
- `apps/accounts/views.py`
- `apps/accounts/admin.py`
- `apps/accounts/migrations/0003_user_is_verified_user_phone_number.py`
- `config/settings/base.py` — added PhonePasswordAuthBackend + TWILIO_* settings
- `.env` — Gmail SMTP active; Twilio placeholders added
- `requirements/base.txt` — added `twilio>=9.0,<10.0`
- `tests/test_accounts.py` — updated for new API shape; added phone register/login tests

## Key Decisions
- Phone-only users get a placeholder email (`phone_{number}@placeholder.curated`) so the email UNIQUE constraint is satisfied
- OTP send failure does NOT block registration — wrapped in try/except, user is always created
- Twilio falls back to `logger.info()` in dev mode (no credentials required to test phone signup)

## Test Results
49/49 backend tests passing (24 accounts, 11 cart, 14 catalog)

## Issues Resolved
- `views.py` had duplicate class definitions (old classes after new ones at bottom of file) — removed old section
