from django.contrib.auth.backends import BaseBackend, ModelBackend
from django.utils import timezone

from .models import User, OTPRequest


class OTPAuthBackend(BaseBackend):
    """Authenticate users via OTP code (email or phone)."""

    def authenticate(self, request, email=None, phone_number=None, otp_code=None, **kwargs):
        if not otp_code or (not email and not phone_number):
            return None

        try:
            # Look up the most recent unused, unexpired OTP for this identifier
            if email:
                otp = (
                    OTPRequest.objects.filter(
                        email=email,
                        is_used=False,
                        expires_at__gt=timezone.now(),
                    )
                    .order_by("-created_at")
                    .first()
                )
            else:
                otp = (
                    OTPRequest.objects.filter(
                        phone_number=phone_number,
                        is_used=False,
                        expires_at__gt=timezone.now(),
                    )
                    .order_by("-created_at")
                    .first()
                )

            if otp is None or not otp.verify_code(otp_code):
                if otp:
                    otp.attempts += 1
                    otp.save(update_fields=["attempts"])
                return None

            otp.is_used = True
            otp.save(update_fields=["is_used"])

            # Resolve user by email or phone_number on User model directly
            if email:
                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={"email": email},
                )
                return user

            # Phone: look up directly on User model
            try:
                return User.objects.get(phone_number=phone_number)
            except User.DoesNotExist:
                from apps.accounts.models import Profile
                user = User.objects.create_user(phone_number=phone_number)
                Profile.objects.get_or_create(user=user)
                return user

        except Exception:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


class PhonePasswordAuthBackend(BaseBackend):
    """Authenticate users via phone number + password."""

    def authenticate(self, request, phone_number=None, password=None, **kwargs):
        if not phone_number or not password:
            return None
        try:
            user = User.objects.get(phone_number=phone_number)
            if user.check_password(password) and user.is_active:
                return user
        except User.DoesNotExist:
            # Run same number of queries to prevent timing attacks
            User().set_password(password)
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
