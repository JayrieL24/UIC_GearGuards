# Borrow Extension Feature (To Be Implemented)

## Overview
Allow borrowers (Students/Personnel) to request extensions for their active borrows.

## Current Setup
- **Default borrow duration:** 3 days (automatically set)
- Due date is calculated as: Current Date + 3 days
- Handler/Admin can manually adjust if needed during transaction

## Feature Requirements (For Later Implementation)

### For Borrowers (Student/Personnel):
1. **View Active Borrows**
   - See all their currently borrowed items
   - Display due date and days remaining
   - Show if item is overdue

2. **Request Extension**
   - Button to request extension on active borrows
   - Specify new due date or additional days needed
   - Add reason for extension
   - Status: PENDING_EXTENSION

3. **Extension History**
   - View past extension requests (approved/rejected)
   - See current extension status

### For Admin/Handler:
1. **Extension Requests Page**
   - View all pending extension requests
   - See borrower details, item, current due date, requested new date
   - Approve or reject with reason

2. **Extension Limits**
   - Maximum extensions per borrow (e.g., 2 extensions max)
   - Maximum total borrow period (e.g., 14 days max)
   - Configurable rules

### Database Changes Needed:

```python
class BorrowExtension(models.Model):
    borrow = ForeignKey(Borrow)
    requested_by = ForeignKey(User)
    current_due_date = DateTimeField()
    requested_due_date = DateTimeField()
    reason = TextField()
    status = CharField(choices=['PENDING', 'APPROVED', 'REJECTED'])
    reviewed_by = ForeignKey(User, null=True)
    review_notes = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)
    reviewed_at = DateTimeField(null=True)
```

### API Endpoints Needed:

**Borrower:**
- `GET /api/my-borrows/` - Get all active borrows
- `POST /api/borrows/<id>/request-extension/` - Request extension
- `GET /api/my-extension-requests/` - View extension request history

**Admin/Handler:**
- `GET /api/extension-requests/` - Get all pending extension requests
- `POST /api/extension-requests/<id>/approve/` - Approve extension
- `POST /api/extension-requests/<id>/reject/` - Reject extension

### Frontend Pages Needed:

**Borrower Dashboard:**
- `/borrower/my-borrows` - View active borrows
- Extension request modal/form
- Extension history section

**Admin/Handler:**
- `/admin/extension-requests` - Manage extension requests
- `/handler/extension-requests` - Manage extension requests

### Business Rules:

1. **Extension Eligibility:**
   - Item must be in ACTIVE status
   - Not overdue (or allow with penalty)
   - Maximum 2 extensions per borrow
   - Total borrow period cannot exceed 14 days

2. **Automatic Actions:**
   - Send notification when extension is approved/rejected
   - Update due date automatically on approval
   - Log all extension activities

3. **Penalties (Optional):**
   - Late fee calculation
   - Suspension after multiple late returns
   - Priority reduction for repeat offenders

## Implementation Priority:
- Phase 1: Basic extension request/approval
- Phase 2: Extension limits and rules
- Phase 3: Notifications and penalties
- Phase 4: Analytics and reporting

## Notes:
- Extension feature is separate from initial borrow
- All extensions require approval (no auto-approval)
- Extension requests are logged for audit trail
- Consider adding email/SMS notifications
