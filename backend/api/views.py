from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile
from .serializers import (
    ApprovalSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


def _is_admin_user(user):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return hasattr(user, "profile") and user.profile.role == UserProfile.Roles.ADMIN and user.profile.is_approved


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "django-backend"})


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(
        {
            "message": "Registration submitted. Wait for admin approval before login.",
            "user_id": user.id,
            "requested_role": user.profile.requested_role,
            "is_approved": user.profile.is_approved,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if not hasattr(user, "profile") or not user.profile.is_approved:
        return Response(
            {"detail": "Account is pending admin approval."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not user.is_active:
        return Response(
            {"detail": "Account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "username": user.username,
            "role": user.profile.role,
            "is_superuser": user.is_superuser,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    profile = request.user.profile
    return Response(
        {
            "username": request.user.username,
            "email": request.user.email,
            "role": profile.role,
            "is_approved": profile.is_approved,
            "is_superuser": request.user.is_superuser,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_registrations(request):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    pending = UserProfile.objects.filter(is_approved=False).select_related("user").order_by("created_at")
    data = UserProfileSerializer(pending, many=True).data
    return Response({"pending": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_registration(request, user_id):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ApprovalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        target_user = User.objects.select_related("profile").get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    target_user.profile.role = serializer.validated_data["role"]
    target_user.profile.is_approved = True
    target_user.profile.approved_by = request.user
    target_user.profile.save(update_fields=["role", "is_approved", "approved_by", "updated_at"])
    target_user.is_active = True
    target_user.save(update_fields=["is_active"])

    return Response(
        {
            "message": "User approved.",
            "user_id": target_user.id,
            "role": target_user.profile.role,
            "is_approved": target_user.profile.is_approved,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_registration(request, user_id):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.select_related("profile").get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    target_user.is_active = False
    target_user.save(update_fields=["is_active"])
    target_user.profile.is_approved = False
    target_user.profile.approved_by = request.user
    target_user.profile.save(update_fields=["is_approved", "approved_by", "updated_at"])

    return Response({"message": "Registration rejected.", "user_id": target_user.id})
