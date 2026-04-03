"""
Test settings: hardcoded PostgreSQL credentials so pytest doesn't need dotenv timing.
Uses the same DB as dev — tests run in a separate transaction that rolls back.
"""
from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "curated_db",
        "USER": "postgres",
        "PASSWORD": "admin@123",
        "HOST": "localhost",
        "PORT": "5432",
        "TEST": {
            "NAME": "curated_test",  # Separate test DB — never touches curated_db
        },
    }
}

# No throttling in tests
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405

# Never send real emails in tests
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Allow all origins in tests
CORS_ALLOW_ALL_ORIGINS = True

# Faster password hashing in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
