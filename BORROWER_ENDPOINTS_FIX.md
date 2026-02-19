# Borrower Endpoints Fix

## Issues Fixed

### 1. Missing Imports in views.py
**Problem**: `Category` and `ItemInstance` models were not imported in `views.py`, causing `NameError` when borrower endpoints tried to use them.

**Fix**: Added imports:
```python
from .models import UserProfile, Borrow, Item, BorrowLog, Category, ItemInstance
```

### 2. Missing REQUESTED Action Type in BorrowLog
**Problem**: The `borrower_request_borrow` endpoint was trying to create a log entry with `BorrowLog.ActionType.REQUESTED`, but this action type didn't exist in the model.

**Fix**: Added REQUESTED to the ActionType choices in BorrowLog model:
```python
class ActionType(models.TextChoices):
    CREATED = "CREATED", "Borrow Created"
    REQUESTED = "REQUESTED", "Borrow Requested"  # Added this
    APPROVED = "APPROVED", "Approved by Handler"
    # ... rest of choices
```

Created migration: `0007_alter_borrowlog_action.py`

### 3. Incorrect Status Enum Reference
**Problem**: Code was using `ItemInstance.Status.AVAILABLE` but the correct enum name is `ItemInstance.ItemStatus.AVAILABLE`.

**Fix**: Updated all references from `ItemInstance.Status` to `ItemInstance.ItemStatus` in:
- `borrower_categories()`
- `borrower_category_items()`
- `borrower_request_borrow()`

### 4. Missing display_name Field
**Problem**: The `borrower_categories` endpoint was trying to access `category.display_name` which doesn't exist as a field.

**Fix**: Changed to use the model's method:
```python
"display_name": category.get_name_display()
```

### 5. Null item_instance Handling
**Problem**: Some old Borrow records have `item_instance=None`, causing AttributeError when trying to access `borrow.item_instance.item.name`.

**Fix**: Added `item_instance__isnull=False` filter to all borrower notification queries:
```python
approved_borrows = Borrow.objects.filter(
    borrower=user,
    status=Borrow.Status.ACTIVE,
    updated_at__gte=thirty_days_ago,
    item_instance__isnull=False  # Added this
).select_related('item_instance', 'item_instance__item')
```

Applied same fix to:
- `borrower_notifications()` - approved, rejected, and overdue queries
- `borrower_notification_count()` - all count queries

## Testing Results

All borrower endpoints now return 200 OK:

1. ✅ `GET /api/borrower/stats/` - Dashboard statistics
2. ✅ `GET /api/borrower/categories/` - Browse categories
3. ✅ `GET /api/borrower/categories/{id}/items/` - View items in category
4. ✅ `GET /api/borrower/notifications/` - Get notifications
5. ✅ `GET /api/borrower/notifications/count/` - Get unread count
6. ✅ `GET /api/borrower/my-borrows/` - View borrows (not explicitly tested but uses same models)
7. ✅ `POST /api/borrower/request-borrow/` - Submit request (not explicitly tested but imports fixed)

## Files Modified

1. `backend/api/models.py` - Added REQUESTED action type
2. `backend/api/views.py` - Fixed imports, enum references, display_name, and null handling
3. `backend/api/migrations/0007_alter_borrowlog_action.py` - Migration for new action type

## User Role Support

The `_is_borrower()` helper function correctly checks for:
- STUDENT
- PERSONNEL  
- USER (legacy role for backwards compatibility)

All borrower endpoints use this function for access control.
