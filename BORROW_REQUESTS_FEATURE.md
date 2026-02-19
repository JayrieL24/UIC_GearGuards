# Borrow Requests Feature

## Overview
Added a pre-borrow request system where borrowers (Students/Personnel) can request to borrow items, and Admins/Handlers can approve or reject these requests.

## New Borrow Statuses

The Borrow model now includes these statuses:
- `PENDING` - Waiting for admin/handler approval (default for new requests)
- `ACTIVE` - Approved and currently borrowed
- `RETURNED` - Item has been returned
- `LATE` - Overdue return
- `NOT_RETURNED` - Item not returned
- `REJECTED` - Request was rejected by admin/handler

## Backend Changes

### New API Endpoints:

1. **GET `/api/borrow-requests/`** - Get all pending borrow requests (Admin/Handler only)
2. **POST `/api/borrow-requests/<id>/approve/`** - Approve a borrow request (Admin/Handler only)
3. **POST `/api/borrow-requests/<id>/reject/`** - Reject a borrow request with reason (Admin/Handler only)
4. **POST `/api/borrow-requests/create/`** - Create a new borrow request (All authenticated users)

### Database Migration:
- Migration `0005_add_pending_status.py` adds PENDING and REJECTED statuses

### Workflow:
1. Borrower creates a request → Status: PENDING
2. Item instance is reserved (status: IN_USE)
3. Admin/Handler reviews request
4. If approved → Status: ACTIVE, handler assigned
5. If rejected → Status: REJECTED, reason logged

## Frontend Changes

### New Pages:

**Admin:**
- `/admin/borrow-requests` - Review and approve/reject requests

**Handler:**
- `/handler/borrow-requests` - Review and approve/reject requests

### Navigation Updated:
All Admin and Handler pages now include "Borrow Requests" in the sidebar navigation.

## Features

### For Admins/Handlers:
- View all pending borrow requests
- See borrower details, requested item, due date, and notes
- Approve requests (assigns handler, activates borrow)
- Reject requests with reason
- Real-time request count badge

### For Borrowers (Future):
- Create borrow requests from inventory
- View request status (pending/approved/rejected)
- Receive notifications on approval/rejection

## Usage

### As Admin/Handler:
1. Log in with admin1 or handler1
2. Navigate to "Borrow Requests" in sidebar
3. Review pending requests
4. Click "Approve" to activate the borrow
5. Click "Reject" and provide a reason to deny

### Testing:
Currently, you can test by:
1. Creating sample borrow requests via API
2. Or updating existing borrows to PENDING status in database
3. Then approve/reject them through the UI

## Next Steps (Optional Enhancements):

1. **Borrower UI** - Add a page for students/personnel to browse inventory and create requests
2. **Notifications** - Email/in-app notifications for request status changes
3. **Request History** - Show approved/rejected requests history
4. **Bulk Actions** - Approve/reject multiple requests at once
5. **Request Filters** - Filter by borrower, item, date range
6. **Auto-rejection** - Automatically reject requests after X days

## Database Schema

```python
class Borrow:
    status = PENDING | ACTIVE | RETURNED | LATE | NOT_RETURNED | REJECTED
    borrower = ForeignKey(User)
    handler = ForeignKey(User, null=True)  # Assigned on approval
    item = ForeignKey(Item)
    item_instance = ForeignKey(ItemInstance)
    due_date = DateTimeField()
    notes = TextField()  # Includes rejection reason if rejected
```

## Logs

All actions are logged in BorrowLog:
- Request created
- Request approved (with handler info)
- Request rejected (with reason)
