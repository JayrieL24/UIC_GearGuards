from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)
def ensure_profile_for_user(sender, instance, created, **kwargs):
    if created:
        default_role = UserProfile.Roles.ADMIN if instance.is_superuser else UserProfile.Roles.USER
        UserProfile.objects.create(
            user=instance,
            role=default_role,
            requested_role=default_role,
            is_approved=instance.is_superuser,
        )
        if instance.is_superuser and not instance.is_active:
            instance.is_active = True
            instance.save(update_fields=["is_active"])
        return

    if hasattr(instance, "profile") and instance.is_superuser and instance.profile.role != UserProfile.Roles.ADMIN:
        instance.profile.role = UserProfile.Roles.ADMIN
        instance.profile.requested_role = UserProfile.Roles.ADMIN
        instance.profile.is_approved = True
        instance.profile.save(update_fields=["role", "requested_role", "is_approved"])
