from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

from .models import Profile, Address

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["phone_number", "date_of_birth", "avatar"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "phone_number", "first_name", "last_name", "date_joined", "is_verified", "is_staff", "profile"]
        read_only_fields = ["id", "email", "phone_number", "date_joined", "is_verified", "is_staff"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get("email") is None:
            data["email"] = ""
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number", "date_of_birth"]

    def update(self, instance, validated_data):
        phone = validated_data.pop("phone_number", None)
        dob = validated_data.pop("date_of_birth", None)
        instance = super().update(instance, validated_data)

        if phone is not None:
            instance.phone_number = phone or None
            instance.save(update_fields=["phone_number"])

        profile, _ = Profile.objects.get_or_create(user=instance)
        if phone is not None:
            profile.phone_number = phone
        if dob is not None:
            profile.date_of_birth = dob
        profile.save()
        return instance


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(max_length=20, required=False)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")

    def validate(self, data):
        if not data.get("email") and not data.get("phone_number"):
            raise serializers.ValidationError("Provide either 'email' or 'phone_number'.")
        return data

    def validate_email(self, value):
        if value:
            existing = User.objects.filter(email__iexact=value).first()
            if existing:
                email_verified = EmailAddress.objects.filter(email__iexact=value, verified=True).exists()
                if email_verified:
                    raise serializers.ValidationError("A user with this email already exists.")
                # Email exists but not verified — allow re-registration, OTP will be resent
        return value.lower() if value else value

    def validate_phone_number(self, value):
        if value:
            existing = User.objects.filter(phone_number=value).first()
            if existing:
                if existing.is_verified:
                    raise serializers.ValidationError("A user with this phone number already exists.")
                # Phone exists but not verified — allow re-registration, OTP will be resent
        return value

    def create(self, validated_data):
        email = validated_data.get("email")
        phone = validated_data.get("phone_number")
        user = User.objects.create_user(
            email=email,
            password=validated_data["password"],
            phone_number=phone or None,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        Profile.objects.get_or_create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect current password.")
        return value


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "address_type", "full_name", "address_line_1", "address_line_2",
            "city", "state", "postal_code", "country", "phone", "is_default",
        ]
        read_only_fields = ["id"]


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(max_length=20, required=False)

    def validate(self, data):
        if not data.get("email") and not data.get("phone_number"):
            raise serializers.ValidationError(
                "Provide either 'email' or 'phone_number'."
            )
        return data


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(max_length=20, required=False)
    code = serializers.CharField(max_length=6)

    def validate(self, data):
        if not data.get("email") and not data.get("phone_number"):
            raise serializers.ValidationError(
                "Provide either 'email' or 'phone_number'."
            )
        return data
