from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile, Item, Borrow, BorrowLog

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


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ("id", "name", "description", "quantity", "available", "created_at", "updated_at")


class BorrowSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_reference_id = serializers.CharField(source="item_instance.reference_id", read_only=True, allow_null=True)
    borrower_username = serializers.CharField(source="borrower.username", read_only=True)
    borrower_email = serializers.EmailField(source="borrower.email", read_only=True)
    handler_username = serializers.CharField(source="handler.username", read_only=True, allow_null=True)

    class Meta:
        model = Borrow
        fields = (
            "id",
            "item",
            "item_name",
            "item_instance",
            "item_reference_id",
            "borrower",
            "borrower_username",
            "borrower_email",
            "handler",
            "handler_username",
            "borrow_date",
            "due_date",
            "return_date",
            "status",
            "not_returned_reason",
            "notes",
            "created_at",
            "updated_at",
        )


class BorrowLogSerializer(serializers.ModelSerializer):
    performed_by_username = serializers.CharField(source="performed_by.username", read_only=True, allow_null=True)
    performed_by_role = serializers.CharField(source="performed_by.profile.role", read_only=True, allow_null=True)
    
    class Meta:
        model = BorrowLog
        fields = (
            "id",
            "action",
            "performed_by",
            "performed_by_username",
            "performed_by_role",
            "description",
            "metadata",
            "created_at",
        )


class BorrowDetailSerializer(serializers.ModelSerializer):
    """Detailed borrow serializer with all related information and logs"""
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_description = serializers.CharField(source="item.description", read_only=True)
    item_category = serializers.CharField(source="item.category.name", read_only=True)
    item_reference_id = serializers.CharField(source="item_instance.reference_id", read_only=True, allow_null=True)
    item_instance_notes = serializers.CharField(source="item_instance.notes", read_only=True, allow_null=True)
    
    borrower_username = serializers.CharField(source="borrower.username", read_only=True)
    borrower_email = serializers.EmailField(source="borrower.email", read_only=True)
    borrower_role = serializers.CharField(source="borrower.profile.role", read_only=True)
    
    handler_username = serializers.CharField(source="handler.username", read_only=True, allow_null=True)
    handler_email = serializers.EmailField(source="handler.email", read_only=True, allow_null=True)
    
    logs = BorrowLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Borrow
        fields = (
            "id",
            "item",
            "item_name",
            "item_description",
            "item_category",
            "item_instance",
            "item_reference_id",
            "item_instance_notes",
            "borrower",
            "borrower_username",
            "borrower_email",
            "borrower_role",
            "handler",
            "handler_username",
            "handler_email",
            "borrow_date",
            "due_date",
            "return_date",
            "status",
            "not_returned_reason",
            "notes",
            "logs",
            "created_at",
            "updated_at",
        )
