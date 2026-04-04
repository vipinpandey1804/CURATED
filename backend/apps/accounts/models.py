import uuid
import hashlib
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone

from apps.core.models import TimestampedModel


class UserManager(BaseUserManager):
    def create_user(self, email=None, password=None, phone_number=None, **extra_fields):
        if not email and not phone_number:
            raise ValueError("Email or phone number is required")
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email or None, phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, blank=True, null=True, default=None)
    phone_number = models.CharField(max_length=20, unique=True, blank=True, null=True, default=None)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "accounts_user"

    def __str__(self):
        return self.email or self.phone_number or str(self.id)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Profile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)

    class Meta:
        db_table = "accounts_profile"

    def __str__(self):
        return f"Profile({self.user.email})"


class Address(TimestampedModel):
    class AddressType(models.TextChoices):
        SHIPPING = "SHIPPING", "Shipping"
        BILLING = "BILLING", "Billing"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.CharField(max_length=10, choices=AddressType.choices, default=AddressType.SHIPPING)
    full_name = models.CharField(max_length=300)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2")
    phone = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "accounts_address"
        verbose_name_plural = "addresses"
        indexes = [
            models.Index(fields=["user", "address_type"]),
        ]

    def __str__(self):
        return f"{self.full_name}, {self.city}"


class OTPRequest(TimestampedModel):
    phone_number = models.CharField(max_length=20, blank=True, db_index=True)
    email = models.EmailField(blank=True, db_index=True)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "accounts_otp_request"
        indexes = [
            models.Index(fields=["phone_number", "created_at"]),
            models.Index(fields=["email", "created_at"]),
        ]

    def set_code(self, code: str):
        self.code_hash = hashlib.sha256(code.encode()).hexdigest()

    def verify_code(self, code: str) -> bool:
        return self.code_hash == hashlib.sha256(code.encode()).hexdigest()

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at
