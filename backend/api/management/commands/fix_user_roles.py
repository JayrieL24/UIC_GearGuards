from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Fix user roles for student1 and personnel1"

    def handle(self, *args, **options):
        # Update student1
        try:
            user = User.objects.get(username="student1")
            profile = user.profile
            profile.role = UserProfile.Roles.STUDENT
            profile.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Updated student1 role to STUDENT"))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("student1 user not found"))

        # Update personnel1
        try:
            user = User.objects.get(username="personnel1")
            profile = user.profile
            profile.role = UserProfile.Roles.PERSONNEL
            profile.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Updated personnel1 role to PERSONNEL"))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING("personnel1 user not found"))

        self.stdout.write(self.style.SUCCESS("\nUser roles updated successfully!"))
