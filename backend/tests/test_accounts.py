"""
Tests for accounts app: registration, login, OTP request/verify,
profile update, and address CRUD.
"""
import pytest
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import OTPRequest


# ─── Registration ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRegister:
    url = "/api/v1/auth/register/"

    def test_register_success(self, api_client):
        payload = {
            "email": "newuser@example.com",
            "password": "strongpass99",
            "firstName": "Jane",
            "lastName": "Doe",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        data = response.json()
        # New flow: returns OTP info, not tokens
        assert "identifier" in data
        assert data["identifierType"] == "email"
        assert data["identifier"] == "newuser@example.com"

    def test_register_with_phone(self, api_client):
        payload = {
            "phoneNumber": "+15551234567",
            "password": "strongpass99",
            "firstName": "Phone",
            "lastName": "User",
        }
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 201
        data = response.json()
        assert data["identifierType"] == "phone"
        assert data["identifier"] == "+15551234567"

    def test_register_duplicate_email(self, api_client, user):
        payload = {"email": user.email, "password": "anotherpass1"}
        response = api_client.post(self.url, payload, format="json")
        assert response.status_code == 400

    def test_register_missing_password(self, api_client):
        response = api_client.post(self.url, {"email": "x@x.com"}, format="json")
        assert response.status_code == 400

    def test_register_short_password(self, api_client):
        response = api_client.post(
            self.url, {"email": "x@x.com", "password": "abc"}, format="json"
        )
        assert response.status_code == 400


# ─── Login ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogin:
    url = "/api/v1/auth/login/"

    def test_login_success(self, api_client, user):
        response = api_client.post(
            self.url,
            {"email": user.email, "password": "securepass123"},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "access" in data["tokens"]
        assert "refresh" in data["tokens"]

    def test_login_wrong_password(self, api_client, user):
        response = api_client.post(
            self.url,
            {"email": user.email, "password": "wrongpassword"},
            format="json",
        )
        assert response.status_code == 401
        assert response.json()["error"] == "INVALID_CREDENTIALS"

    def test_login_unknown_email(self, api_client):
        response = api_client.post(
            self.url,
            {"email": "nobody@example.com", "password": "whatever"},
            format="json",
        )
        assert response.status_code == 401

    def test_login_missing_fields(self, api_client):
        response = api_client.post(self.url, {}, format="json")
        assert response.status_code == 400

    def test_login_with_phone(self, db, api_client):
        """User registered via phone can login with phone + password."""
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        UserModel.objects.create_user(
            phone_number="+15559876543",
            password="phonepass99",
        )
        response = api_client.post(
            self.url,
            {"phoneNumber": "+15559876543", "password": "phonepass99"},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "access" in data["tokens"]


# ─── Me / Profile ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMeView:
    url = "/api/v1/auth/me/"

    def test_get_me_authenticated(self, auth_client, user):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.json()["email"] == user.email

    def test_get_me_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_patch_me(self, auth_client):
        response = auth_client.patch(
            self.url, {"firstName": "Updated"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["firstName"] == "Updated"


# ─── OTP Request ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestOTPRequest:
    url = "/api/v1/auth/otp/request/"

    def test_otp_request_by_email(self, api_client):
        """OTP request with email should create an OTPRequest record and send email."""
        response = api_client.post(
            self.url, {"email": "otp@example.com"}, format="json"
        )
        assert response.status_code == 200
        assert OTPRequest.objects.filter(email="otp@example.com").exists()

    def test_otp_request_missing_identifier(self, api_client):
        response = api_client.post(self.url, {}, format="json")
        assert response.status_code == 400

    def test_otp_rate_limit(self, api_client):
        """After 5 requests in one hour, additional requests should be rejected."""
        email = "ratelimited@example.com"
        now = timezone.now()
        OTPRequest.objects.bulk_create([
            OTPRequest(email=email, phone_number="", code_hash="x", expires_at=now + timedelta(minutes=10))
            for _ in range(5)
        ])
        response = api_client.post(self.url, {"email": email}, format="json")
        assert response.status_code == 429
        assert response.json()["error"] == "OTP_RATE_LIMIT"


# ─── OTP Verify ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestOTPVerify:
    url = "/api/v1/auth/otp/verify/"

    def _make_otp(self, email="otp@example.com", code="123456"):
        otp = OTPRequest(
            email=email,
            phone_number="",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        otp.set_code(code)
        otp.save()
        return otp

    def test_verify_valid_otp(self, api_client):
        self._make_otp(email="verify@example.com", code="654321")
        response = api_client.post(
            self.url,
            {"email": "verify@example.com", "code": "654321"},
            format="json",
        )
        assert response.status_code == 200
        assert "tokens" in response.json()

    def test_verify_wrong_code(self, api_client):
        self._make_otp(email="wrong@example.com", code="111111")
        response = api_client.post(
            self.url,
            {"email": "wrong@example.com", "code": "999999"},
            format="json",
        )
        assert response.status_code == 401
        assert response.json()["error"] == "INVALID_OTP"

    def test_verify_expired_otp(self, api_client):
        otp = OTPRequest(
            email="expired@example.com",
            phone_number="",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        otp.set_code("000000")
        otp.save()
        response = api_client.post(
            self.url,
            {"email": "expired@example.com", "code": "000000"},
            format="json",
        )
        assert response.status_code == 401

    def test_verify_missing_identifier(self, api_client):
        response = api_client.post(self.url, {"code": "123456"}, format="json")
        assert response.status_code == 400


# ─── Addresses ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAddresses:
    url = "/api/v1/auth/addresses/"

    def _address_payload(self, **kwargs):
        base = {
            "addressType": "SHIPPING",
            "fullName": "Test User",
            "addressLine1": "123 Main St",
            "city": "Mumbai",
            "postalCode": "400001",
            "country": "IN",
        }
        base.update(kwargs)
        return base

    def test_create_address(self, auth_client):
        response = auth_client.post(
            self.url, self._address_payload(), format="json"
        )
        assert response.status_code == 201

    def test_list_addresses(self, auth_client):
        auth_client.post(self.url, self._address_payload(), format="json")
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_addresses_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_delete_address(self, auth_client):
        create_resp = auth_client.post(
            self.url, self._address_payload(), format="json"
        )
        address_id = create_resp.json()["id"]
        delete_resp = auth_client.delete(f"{self.url}{address_id}/")
        assert delete_resp.status_code == 204
