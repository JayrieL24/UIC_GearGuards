from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    requested_role = serializers.ChoiceField(
        choices=[UserProfile.Roles.USER, UserProfile.Roles.HANDLER],
        required=False,
        default=UserProfile.Roles.USER,
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def create(self, validated_data):
        requested_role = validated_data.pop("requested_role", UserProfile.Roles.USER)
        email = validated_data.pop("email", "")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=email,
            password=validated_data["password"],
            is_active=True,
        )
        user.profile.requested_role = requested_role
        user.profile.role = UserProfile.Roles.USER
        user.profile.is_approved = False
        user.profile.save(update_fields=["requested_role", "role", "is_approved"])
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        user = User.objects.filter(username=username).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = UserProfile
        fields = ("user_id", "username", "email", "role", "requested_role", "is_approved", "created_at")


class ApprovalSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserProfile.Roles.choices)
