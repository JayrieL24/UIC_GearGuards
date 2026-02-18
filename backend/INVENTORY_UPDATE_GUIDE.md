# Inventory System Update Guide

## Overview
This update adds a comprehensive inventory management system with:
- **Categories**: Devices, Computer Parts, Ejectables, Robotics Parts
- **Item Instances**: Individual trackable items with unique reference IDs
- **Status Management**: Available, In Use, Faulty, In Repair, Out of Stock
- **Admin Controls**: Add stock, edit stock, mark status

## Database Changes

### New Models
1. **Category** - Equipment categories
2. **ItemInstance** - Individual physical items with unique reference IDs

### Updated Models
1. **Item** - Now linked to Category
2. **Borrow** - Now can track specific ItemInstance

## Migration Steps

### 1. Create Migration
```bash
cd backend
.\.venv\Scripts\python manage.py makemigrations
```

### 2. Apply Migration
```bash
.\.venv\Scripts\python manage.py migrate
```

### 3. Create Initial Categories (Django Shell)
```bash
.\.venv\Scripts\python manage.py shell
```

Then run:
```python
from api.models import Category

# Create categories
categories = [
    ('DEVICES', 'Electronic devices like laptops, tablets, phones'),
    ('COMPUTER_PARTS', 'Computer components like RAM, hard drives, keyboards'),
    ('EJECTABLES', 'Removable storage like USB drives, SD cards'),
    ('ROBOTICS_PARTS', 'Robotics components like sensors, motors, controllers'),
]

for name, desc in categories:
    Category.objects.get_or_create(name=name, defaults={'description': desc})
    print(f"Created category: {name}")

exit()
```

### 4. Update Admin Panel
```bash
.\.venv\Scripts\python manage.py shell
```

```python
from django.contrib import admin
from api.models import Category, ItemInstance

# Register new models in admin
admin.site.register(Category)
admin.site.register(ItemInstance)
```

## API Endpoints to Add

### Categories
- `GET /api/admin/categories/` - List all categories
- `GET /api/admin/categories/<id>/items/` - Get items in category

### Item Instances
- `GET /api/admin/items/<item_id>/instances/` - List instances of an item
- `POST /api/admin/items/<item_id>/instances/` - Add new instance
- `PATCH /api/admin/item-instances/<id>/` - Update instance status
- `DELETE /api/admin/item-instances/<id>/` - Remove instance

## Frontend Updates Needed

### Inventory Page Structure
```
Categories (Tabs/Accordion)
├── Devices
│   ├── Laptop (5 total, 3 available)
│   │   ├── Laptop 1 (REF: LAP001) - Available
│   │   ├── Laptop 2 (REF: LAP002) - In Use
│   │   └── Laptop 3 (REF: LAP003) - Faulty
│   └── Tablet (3 total, 2 available)
├── Computer Parts
│   ├── Mouse (10 total, 8 available)
│   └── Keyboard (8 total, 6 available)
├── Ejectables
│   └── USB Drive (20 total, 15 available)
└── Robotics Parts
    └── Sensor (15 total, 12 available)
```

### Item Instance Modal
When clicking an item instance, show modal with:
- Reference ID
- Current Status (dropdown)
- Notes (textarea)
- Actions: Save, Delete

## Example Data Structure

### Category
```json
{
  "id": 1,
  "name": "DEVICES",
  "display_name": "Devices",
  "description": "Electronic devices",
  "item_count": 5
}
```

### Item with Instances
```json
{
  "id": 1,
  "name": "Laptop",
  "category": "DEVICES",
  "total_quantity": 5,
  "instances": [
    {
      "id": 1,
      "reference_id": "LAP001",
      "status": "AVAILABLE",
      "notes": "Dell XPS 15"
    },
    {
      "id": 2,
      "reference_id": "LAP002",
      "status": "IN_USE",
      "notes": "MacBook Pro"
    }
  ]
}
```

## Next Steps

1. Run migrations
2. Create categories
3. Update admin.py to register new models
4. Create API endpoints for inventory management
5. Update frontend Inventory page with new structure
6. Add modal for item instance management

## Notes

- Existing Item and Borrow data will be preserved
- You'll need to manually create ItemInstances for existing Items
- The system is backward compatible - items without instances will still work
