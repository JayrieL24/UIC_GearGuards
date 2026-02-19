# Role Terminology Update

## Overview
Updated the user-facing terminology throughout the system to use clearer, more intuitive role names.

## Changes Made

### 1. Registration Page (Register.jsx)
**Old terminology:**
- "User (Borrower)"
- "User Handler"

**New terminology:**
- "Student" → STUDENT role
- "Personnel" → PERSONNEL role
- "Staff" → HANDLER role

**Default role:** Changed from USER to STUDENT

**Updated description:**
- "Register as a student, personnel, or staff member"
- "Student/Personnel roles for borrowing equipment"
- "Staff role for delegated operations"

### 2. Admin Approvals Page (Approvals.jsx)
**Old approval buttons:**
- "Approve as User"
- "Approve as Handler"

**New approval buttons:**
- "Approve as Student" → assigns STUDENT role
- "Approve as Personnel" → assigns PERSONNEL role
- "Approve as Staff" → assigns HANDLER role

Admin can now choose the specific role when approving registrations.

### 3. Backend Sample Users
All sample users are pre-approved with `is_approved = True`:

- **admin1** (ADMIN) - AdminPass123!
- **handler1** (HANDLER/Staff) - HandlerPass123!
- **student1** (STUDENT) - StudentPass123! ✅ Approved
- **personnel1** (PERSONNEL) - PersonnelPass123! ✅ Approved

### 4. Login Restrictions
Users with pending approval (`is_approved = False`) cannot log in. The system checks:
1. User must exist
2. User must be active
3. User profile must be approved

## Role Mapping

| User-Facing Term | Backend Role | Access Level |
|-----------------|--------------|--------------|
| Student | STUDENT | Borrower (can request items) |
| Personnel | PERSONNEL | Borrower (can request items) |
| Staff | HANDLER | Handler (can manage borrows, view-only inventory) |
| Admin | ADMIN | Full system access |

## Legacy Support
The system still supports the legacy "USER" role for backwards compatibility:
- Existing USER accounts work as borrowers
- `_is_borrower()` function accepts STUDENT, PERSONNEL, and USER roles

## Files Modified

### Frontend
1. `frontend/src/Pages/Auth/Register.jsx` - Updated role dropdown and descriptions
2. `frontend/src/Pages/Admin/Approvals.jsx` - Updated approval buttons

### Backend
- `backend/api/management/commands/add_sample_users.py` - Already configured correctly with approved users

## Testing
✅ student1 and personnel1 can log in (approved)
✅ New registrations show correct role options
✅ Admin can assign specific roles during approval
✅ Pending users cannot log in until approved
