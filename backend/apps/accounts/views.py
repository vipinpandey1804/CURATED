import logging
import random
import string

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, OTPRequest
from .serializers import (
    AddressSerializer,
    ChangePasswordSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


def _send_otp(email, phone, code):
    """Send OTP via email (SMTP) or SMS (Twilio). Returns True on success."""
    if email:
        send_mail(
            subject="Your CURATED verification code",
            message=(
                f"Your verification code is: {code}\n\n"
                "This code expires in 10 minutes. Do not share it with anyone."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True

    if phone:
        twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
        twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
        twilio_from = getattr(settings, "TWILIO_PHONE_NUMBER", "")
        if twilio_sid and twilio_token and twilio_from:
            try:
                from twilio.rest import Client
                client = Client(twilio_sid, twilio_token)
                client.messages.create(
                    body=f"Your CURATED verification code is: {code}",
                    from_=twilio_from,
                    to=phone,
                )
                return True
            except Exception as exc:
                logger.warning("Twilio send failed: %s", exc)
        else:
            # Development: log to console
            logger.info("DEV MODE — OTP for %s: %s", phone, code)
            return True

    return False


class RegisterView(APIView):
    """POST /api/v1/auth/register/ — create account and send OTP for verification."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        email = serializer.validated_data.get("email", "")
        phone = serializer.validated_data.get("phone_number", "")

        # Create and send OTP
        code = "".join(random.choices(string.digits, k=6))
        otp = OTPRequest(
            phone_number=phone or "",
            email=email or "",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        otp.set_code(code)
        otp.save()

        try:
            _send_otp(email, phone, code)
        except Exception as exc:
            logger.warning("OTP delivery failed (user still created): %s", exc)

        identifier = email or phone
        identifier_type = "email" if email else "phone"
        return Response(
            {
                "detail": f"Verification code sent to your {identifier_type}.",
                "identifier": identifier,
                "identifierType": identifier_type,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/v1/auth/login/ — authenticate with (email or phone) + password."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").lower().strip()
        phone = (request.data.get("phone_number") or "").strip()
        password = request.data.get("password", "")

        if not (email or phone) or not password:
            return Response(
                {"error": "MISSING_CREDENTIALS", "detail": "Email or phone number and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email:
            user = authenticate(request, username=email, password=password)
        else:
            user = authenticate(request, phone_number=phone, password=password)

        if user is None:
            return Response(
                {"error": "INVALID_CREDENTIALS", "detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Password updated."})


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        address = serializer.save(user=self.request.user)
        if address.is_default:
            Address.objects.filter(
                user=self.request.user, address_type=address.address_type
            ).exclude(pk=address.pk).update(is_default=False)

    def perform_update(self, serializer):
        address = serializer.save()
        if address.is_default:
            Address.objects.filter(
                user=self.request.user, address_type=address.address_type
            ).exclude(pk=address.pk).update(is_default=False)

    @action(detail=False, methods=["get"])
    def default(self, request):
        addr = Address.objects.filter(user=request.user, is_default=True).first()
        if addr is None:
            return Response({"detail": "No default address."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AddressSerializer(addr).data)


class OTPRequestView(APIView):
    """POST /api/v1/auth/otp/request/ — send OTP via email or SMS."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get("email", "")
        phone = serializer.validated_data.get("phone_number", "")

        # Rate limit: max 5 per identifier per hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        if email:
            recent_count = OTPRequest.objects.filter(
                email=email, created_at__gte=one_hour_ago
            ).count()
        else:
            recent_count = OTPRequest.objects.filter(
                phone_number=phone, created_at__gte=one_hour_ago
            ).count()

        if recent_count >= 5:
            return Response(
                {"error": "OTP_RATE_LIMIT", "detail": "Too many OTP requests. Try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code = "".join(random.choices(string.digits, k=6))
        otp = OTPRequest(
            phone_number=phone,
            email=email,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        otp.set_code(code)
        otp.save()

        _send_otp(email, phone, code)
        return Response({"detail": "OTP sent."})


class OTPVerifyView(APIView):
    """POST /api/v1/auth/otp/verify/ — verify OTP and return tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get("email", "")
        phone = serializer.validated_data.get("phone_number", "")
        code = serializer.validated_data["code"]

        user = authenticate(request, email=email, phone_number=phone, otp_code=code)
        if user is None:
            return Response(
                {"error": "INVALID_OTP", "detail": "Invalid or expired OTP code."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Mark user as verified on first successful OTP
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=["is_verified"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )



