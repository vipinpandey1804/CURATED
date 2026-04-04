"""
Shared pytest fixtures for all backend tests.
"""
from pathlib import Path

# Load .env before Django settings are imported
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture(autouse=True)
def use_locmem_email(settings):
    """Use in-memory email backend for all tests (no real SMTP)."""
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="testuser@example.com",
        password="securepass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def auth_client(api_client, user):
    """API client authenticated as `user`."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@example.com",
        password="adminpass123",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    """API client authenticated as an admin (is_staff=True) user."""
    api_client.force_authenticate(user=admin_user)
    return api_client
