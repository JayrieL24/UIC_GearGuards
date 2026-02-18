from django.core.management.base import BaseCommand
from api.models import Category, Item, ItemInstance


class Command(BaseCommand):
    help = 'Add sample inventory items and instances'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample inventory...'))

        # Get categories
        devices = Category.objects.get(name='DEVICES')
        computer_parts = Category.objects.get(name='COMPUTER_PARTS')
        ejectables = Category.objects.get(name='EJECTABLES')
        robotics = Category.objects.get(name='ROBOTICS_PARTS')

        # Sample data structure
        sample_data = {
            devices: [
                {
                    'name': 'Laptop',
                    'description': 'High-performance laptops for development and design work',
                    'instances': [
                        ('LAP001', 'AVAILABLE', 'Dell XPS 15, 16GB RAM, 512GB SSD'),
                        ('LAP002', 'IN_USE', 'MacBook Pro 14", M1 Pro, 16GB RAM'),
                        ('LAP003', 'AVAILABLE', 'Lenovo ThinkPad X1 Carbon'),
                        ('LAP004', 'FAULTY', 'HP Pavilion - Screen issue'),
                        ('LAP005', 'IN_REPAIR', 'ASUS ROG - Battery replacement'),
                    ]
                },
                {
                    'name': 'Tablet',
                    'description': 'Tablets for presentations and mobile work',
                    'instances': [
                        ('TAB001', 'AVAILABLE', 'iPad Pro 11" 2021'),
                        ('TAB002', 'IN_USE', 'Samsung Galaxy Tab S8'),
                        ('TAB003', 'AVAILABLE', 'iPad Air 2022'),
                    ]
                },
                {
                    'name': 'Smartphone',
                    'description': 'Test devices for mobile development',
                    'instances': [
                        ('PHN001', 'AVAILABLE', 'iPhone 13 Pro'),
                        ('PHN002', 'IN_USE', 'Samsung Galaxy S22'),
                        ('PHN003', 'AVAILABLE', 'Google Pixel 6'),
                        ('PHN004', 'AVAILABLE', 'iPhone 12'),
                    ]
                },
                {
                    'name': 'Camera',
                    'description': 'Digital cameras for documentation and media',
                    'instances': [
                        ('CAM001', 'AVAILABLE', 'Canon EOS R6'),
                        ('CAM002', 'IN_USE', 'Sony A7 III'),
                    ]
                },
                {
                    'name': 'Projector',
                    'description': 'Projectors for presentations',
                    'instances': [
                        ('PRJ001', 'AVAILABLE', 'Epson PowerLite 1080p'),
                        ('PRJ002', 'IN_REPAIR', 'BenQ - Lamp replacement needed'),
                    ]
                },
            ],
            computer_parts: [
                {
                    'name': 'Mouse',
                    'description': 'Wireless and wired computer mice',
                    'instances': [
                        ('MOU001', 'AVAILABLE', 'Logitech MX Master 3'),
                        ('MOU002', 'AVAILABLE', 'Razer DeathAdder V2'),
                        ('MOU003', 'IN_USE', 'Logitech G502'),
                        ('MOU004', 'AVAILABLE', 'Microsoft Surface Mouse'),
                        ('MOU005', 'AVAILABLE', 'Apple Magic Mouse'),
                        ('MOU006', 'FAULTY', 'Generic mouse - scroll wheel broken'),
                    ]
                },
                {
                    'name': 'Keyboard',
                    'description': 'Mechanical and membrane keyboards',
                    'instances': [
                        ('KEY001', 'AVAILABLE', 'Keychron K2 Mechanical'),
                        ('KEY002', 'IN_USE', 'Corsair K95 RGB'),
                        ('KEY003', 'AVAILABLE', 'Logitech K380'),
                        ('KEY004', 'AVAILABLE', 'Apple Magic Keyboard'),
                    ]
                },
                {
                    'name': 'Monitor',
                    'description': '24" and 27" displays',
                    'instances': [
                        ('MON001', 'AVAILABLE', 'Dell UltraSharp 27" 4K'),
                        ('MON002', 'IN_USE', 'LG 27" IPS'),
                        ('MON003', 'AVAILABLE', 'ASUS ProArt 24"'),
                        ('MON004', 'IN_USE', 'BenQ 27" Gaming'),
                    ]
                },
                {
                    'name': 'Webcam',
                    'description': 'HD webcams for video conferencing',
                    'instances': [
                        ('WEB001', 'AVAILABLE', 'Logitech C920 HD Pro'),
                        ('WEB002', 'IN_USE', 'Razer Kiyo'),
                        ('WEB003', 'AVAILABLE', 'Logitech Brio 4K'),
                    ]
                },
                {
                    'name': 'Headset',
                    'description': 'Audio headsets with microphones',
                    'instances': [
                        ('HDS001', 'AVAILABLE', 'Sony WH-1000XM4'),
                        ('HDS002', 'IN_USE', 'HyperX Cloud II'),
                        ('HDS003', 'AVAILABLE', 'Bose QC35 II'),
                        ('HDS004', 'AVAILABLE', 'SteelSeries Arctis 7'),
                    ]
                },
            ],
            ejectables: [
                {
                    'name': 'USB Flash Drive',
                    'description': 'Portable USB storage devices',
                    'instances': [
                        ('USB001', 'AVAILABLE', 'SanDisk 64GB USB 3.0'),
                        ('USB002', 'AVAILABLE', 'Kingston 128GB'),
                        ('USB003', 'IN_USE', 'Samsung 32GB'),
                        ('USB004', 'AVAILABLE', 'SanDisk 64GB'),
                        ('USB005', 'AVAILABLE', 'Kingston 64GB'),
                    ]
                },
                {
                    'name': 'SD Card',
                    'description': 'Memory cards for cameras and devices',
                    'instances': [
                        ('SD001', 'AVAILABLE', 'SanDisk Extreme 128GB'),
                        ('SD002', 'IN_USE', 'Samsung EVO 64GB'),
                        ('SD003', 'AVAILABLE', 'Lexar 256GB'),
                    ]
                },
                {
                    'name': 'External Hard Drive',
                    'description': 'Portable external storage',
                    'instances': [
                        ('HDD001', 'AVAILABLE', 'WD My Passport 2TB'),
                        ('HDD002', 'IN_USE', 'Seagate Backup Plus 4TB'),
                        ('HDD003', 'AVAILABLE', 'Samsung T7 SSD 1TB'),
                    ]
                },
                {
                    'name': 'MicroSD Card',
                    'description': 'MicroSD cards with adapters',
                    'instances': [
                        ('MSD001', 'AVAILABLE', 'SanDisk 64GB'),
                        ('MSD002', 'AVAILABLE', 'Samsung 128GB'),
                        ('MSD003', 'IN_USE', 'Kingston 32GB'),
                    ]
                },
            ],
            robotics: [
                {
                    'name': 'Arduino Board',
                    'description': 'Arduino microcontroller boards',
                    'instances': [
                        ('ARD001', 'AVAILABLE', 'Arduino Uno R3'),
                        ('ARD002', 'IN_USE', 'Arduino Mega 2560'),
                        ('ARD003', 'AVAILABLE', 'Arduino Nano'),
                        ('ARD004', 'AVAILABLE', 'Arduino Uno R3'),
                    ]
                },
                {
                    'name': 'Raspberry Pi',
                    'description': 'Single-board computers',
                    'instances': [
                        ('RPI001', 'AVAILABLE', 'Raspberry Pi 4 Model B 8GB'),
                        ('RPI002', 'IN_USE', 'Raspberry Pi 4 Model B 4GB'),
                        ('RPI003', 'AVAILABLE', 'Raspberry Pi 3 Model B+'),
                    ]
                },
                {
                    'name': 'Servo Motor',
                    'description': 'Precision servo motors',
                    'instances': [
                        ('SRV001', 'AVAILABLE', 'SG90 Micro Servo'),
                        ('SRV002', 'AVAILABLE', 'MG996R High Torque'),
                        ('SRV003', 'IN_USE', 'SG90 Micro Servo'),
                        ('SRV004', 'AVAILABLE', 'SG90 Micro Servo'),
                        ('SRV005', 'FAULTY', 'MG996R - Gear stripped'),
                    ]
                },
                {
                    'name': 'Ultrasonic Sensor',
                    'description': 'Distance measurement sensors',
                    'instances': [
                        ('USS001', 'AVAILABLE', 'HC-SR04'),
                        ('USS002', 'IN_USE', 'HC-SR04'),
                        ('USS003', 'AVAILABLE', 'HC-SR04'),
                        ('USS004', 'AVAILABLE', 'HC-SR04'),
                    ]
                },
                {
                    'name': 'Motor Driver',
                    'description': 'DC motor driver modules',
                    'instances': [
                        ('MTD001', 'AVAILABLE', 'L298N Dual H-Bridge'),
                        ('MTD002', 'IN_USE', 'L298N Dual H-Bridge'),
                        ('MTD003', 'AVAILABLE', 'DRV8825 Stepper Driver'),
                    ]
                },
                {
                    'name': 'Breadboard',
                    'description': 'Solderless breadboards for prototyping',
                    'instances': [
                        ('BRD001', 'AVAILABLE', '830 Point Breadboard'),
                        ('BRD002', 'IN_USE', '830 Point Breadboard'),
                        ('BRD003', 'AVAILABLE', '400 Point Mini Breadboard'),
                        ('BRD004', 'AVAILABLE', '830 Point Breadboard'),
                    ]
                },
            ],
        }

        # Create items and instances
        for category, items_list in sample_data.items():
            self.stdout.write(f'\n{category.get_name_display()}:')
            
            for item_data in items_list:
                # Create or get item
                item, created = Item.objects.get_or_create(
                    name=item_data['name'],
                    category=category,
                    defaults={'description': item_data['description']}
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created item: {item.name}'))
                else:
                    self.stdout.write(self.style.WARNING(f'  - Item exists: {item.name}'))
                
                # Create instances
                for ref_id, status, notes in item_data['instances']:
                    instance, created = ItemInstance.objects.get_or_create(
                        reference_id=ref_id,
                        defaults={
                            'item': item,
                            'status': status,
                            'notes': notes
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'    ✓ Added: {ref_id} ({status})')
                    else:
                        self.stdout.write(f'    - Exists: {ref_id}')
                
                # Update item counts
                item.quantity = item.instances.count()
                item.available = item.instances.filter(status='AVAILABLE').count()
                item.save()

        self.stdout.write(self.style.SUCCESS('\n✓ Sample inventory created successfully!'))
        self.stdout.write(self.style.SUCCESS('Total items created across all categories'))
