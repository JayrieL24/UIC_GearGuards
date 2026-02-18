from django.core.management.base import BaseCommand
from api.models import Category


class Command(BaseCommand):
    help = 'Create initial equipment categories'

    def handle(self, *args, **options):
        categories = [
            ('DEVICES', 'Electronic devices like laptops, tablets, phones'),
            ('COMPUTER_PARTS', 'Computer components like RAM, hard drives, keyboards'),
            ('EJECTABLES', 'Removable storage like USB drives, SD cards'),
            ('ROBOTICS_PARTS', 'Robotics components like sensors, motors, controllers'),
        ]

        for name, desc in categories:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={'description': desc}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {category.get_name_display()}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Category already exists: {category.get_name_display()}')
                )

        self.stdout.write(self.style.SUCCESS('\n✓ Categories setup complete!'))
