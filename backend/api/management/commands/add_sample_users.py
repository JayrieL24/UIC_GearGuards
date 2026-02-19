from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Add sample users with different roles"

    def handle(self, *args, **options):
        sample_users = [
            {
                "username": "admin1",
                "email": "admin1@gearguards.com",
                "password": "AdminPass123!",
                "role": UserProfile.Roles.ADMIN,
                "is_superuser": True,
            },
            {
                "username": "handler1",
                "email": "handler1@gearguards.com",
                "password": "HandlerPass123!",
                "role": UserProfile.Roles.HANDLER,
                "is_superuser": False,
            },
            {
                "username": "student1",
                "email": "student1@gearguards.com",
                "password": "StudentPass123!",
                "role": UserProfile.Roles.STUDENT,
                "is_superuser": False,
            },
            {
                "username": "personnel1",
                "email": "personnel1@gearguards.com",
                "password": "PersonnelPass123!",
                "role": UserProfile.Roles.PERSONNEL,
                "is_superuser": False,
            },
        ]

        for user_data in sample_users:
            username = user_data["username"]
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f"User '{username}' already exists. Skipping...")
                )
                continue

            user = User.objects.create_user(
                username=username,
                email=user_data["email"],
                password=user_data["password"],
                is_superuser=user_data["is_superuser"],
                is_active=True,
            )

            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = user_data["role"]
            profile.is_approved = True
            profile.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Created user '{username}' with role '{user_data['role']}'"
                )
            )

        self.stdout.write(
            self.style.SUCCESS("\nAll sample users created successfully!")
        )
        self.stdout.write("\nSample Users:")
        self.stdout.write("  1. admin1 (Admin) - password: AdminPass123!")
        self.stdout.write("  2. handler1 (Handler) - password: HandlerPass123!")
        self.stdout.write("  3. student1 (Borrower/Student) - password: StudentPass123!")
        self.stdout.write("  4. personnel1 (Borrower/Personnel) - password: PersonnelPass123!")
