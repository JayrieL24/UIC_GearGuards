# Borrower Interface (Students & Personnel)

## Overview
The borrower interface allows Students and Personnel to browse available equipment, submit borrow requests, and manage their active borrows.

---

## User Roles
- **STUDENT**: Student borrowers
- **PERSONNEL**: Faculty/Staff borrowers

Both roles have identical interface and permissions.

---

## Features

### 1. Dashboard (`/borrower/dashboard`)
**Overview page with quick stats and actions**

**Stats Cards**:
- Active Borrows - Currently borrowed items
- Pending Requests - Requests awaiting approval
- Overdue Items - Items past due date (highlighted in red)
- Total Borrowed - Lifetime borrow count

**Quick Actions**:
- Browse Items button
- My Borrows button

**Recent Borrows Table**:
- Shows last 5 borrows
- Displays item name, reference ID, status, due date

---

### 2. Browse Items (`/borrower/browse`)
**Search and request available equipment**

**Features**:
- Search bar for filtering items
- Category tabs (Laptops, Peripherals, etc.)
- Item cards showing:
  - Item name and description
  - Available count
  - In-use count
  - "Request to Borrow" button

**Request Modal**:
- Item details
- Available count
- Optional notes field
- First-come, first-serve notice
- Submit button

**Workflow**:
1. Browse categories or search
2. Click "Request to Borrow" on available item
3. Add optional notes
4. Submit request
5. Wait for Admin/Handler approval
6. Receive notification when approved

---

### 3. My Borrows (`/borrower/my-borrows`)
**View and manage borrow history**

**Three Tabs**:

**Active Borrows**:
- Currently borrowed items
- Shows due dates
- Overdue warnings (red border + alert)
- Item details and notes

**Pending Requests**:
- Requests awaiting approval
- Shows request date
- Can view request details

**History**:
- Past borrows (returned items)
- Shows borrow and return dates
- Complete borrow history

**Borrow Card Information**:
- Item name and reference ID
- Status badge (color-coded)
- Borrowed date
- Due date (with overdue indicator)
- Return date (if returned)
- Notes

**Overdue Handling**:
- Red border on card
- Exclamation icon on due date
- Warning message: "This item is overdue. Please return it as soon as possible."

---

### 4. Account (`/borrower/account`)
**User profile and settings** (uses existing Account page)

---

## Navigation

**Sidebar Menu**:
- Dashboard (home icon)
- Browse Items (search icon)
- My Borrows (list icon)
- Account (user icon)
- Logout button at bottom

**Brand Header**:
- "GearGuard" logo
- "Student Portal" or "Personnel Portal" subtitle

---

## Backend API Endpoints

### Required Endpoints:

```
GET /api/borrower/stats/
Response: {
  active_borrows: number,
  pending_requests: number,
  overdue_items: number,
  total_borrowed: number
}

GET /api/borrower/my-borrows/?limit=5
Response: {
  borrows: [
    {
      id: number,
      item_name: string,
      reference_id: string,
      status: string,
      borrow_date: datetime,
      due_date: datetime,
      return_date: datetime | null,
      notes: string
    }
  ]
}

GET /api/borrower/categories/
Response: {
  categories: [
    {
      id: number,
      name: string,
      display_name: string,
      available_count: number,
      total_instances: number
    }
  ]
}

GET /api/borrower/categories/{id}/items/
Response: {
  items: [
    {
      id: number,
      name: string,
      description: string,
      available_count: number,
      in_use_count: number,
      faulty_count: number
    }
  ]
}

POST /api/borrower/request-borrow/
Body: {
  item_id: number,
  notes: string (optional)
}
Response: {
  message: string,
  borrow_id: number
}

GET /api/borrower/my-borrows/?status={active|pending|history}
Response: {
  borrows: [...]
}
```

---

## User Experience

### For Students/Personnel:

**First Time Login**:
1. Login with credentials
2. Redirected to `/borrower/dashboard`
3. See welcome message and empty stats
4. Click "Browse Items" to start

**Requesting an Item**:
1. Navigate to "Browse Items"
2. Search or browse categories
3. Find available item
4. Click "Request to Borrow"
5. Add optional notes
6. Submit request
7. See success message
8. Request appears in "Pending Requests" tab

**When Request is Approved**:
1. Receive notification (future feature)
2. Item moves to "Active Borrows"
3. Can go to lab to pick up item
4. Admin/Handler completes transaction

**Managing Active Borrows**:
1. View in "My Borrows" → "Active Borrows"
2. See due dates
3. Get overdue warnings if late
4. Return items to Admin/Handler

**Viewing History**:
1. Navigate to "My Borrows" → "History"
2. See all past borrows
3. View borrow and return dates

---

## Visual Design

### Color Scheme:
- **Primary**: Teal gradient (#0f766e to #14b8a6)
- **Active**: Green (#10b981)
- **Pending**: Amber (#f59e0b)
- **Overdue**: Red (#ef4444)
- **History**: Gray (#6b7280)

### UI Components:
- Modern card-based design
- Gradient buttons with hover effects
- Color-coded status badges
- Responsive grid layouts
- Clean typography
- Smooth transitions

---

## Permissions & Security

### What Borrowers CAN Do:
- ✅ View available inventory
- ✅ Submit borrow requests
- ✅ View their own borrows
- ✅ View their borrow history
- ✅ Update their account info

### What Borrowers CANNOT Do:
- ❌ View other users' borrows
- ❌ Approve/reject requests
- ❌ Add/edit/delete inventory
- ❌ Process walk-in borrows
- ❌ Generate reports
- ❌ Manage users
- ❌ Access admin/handler features

### Backend Validation:
- All endpoints check authentication
- Role-based access control (STUDENT/PERSONNEL only)
- Users can only see their own data
- Cannot modify inventory or other users' borrows

---

## Future Enhancements

### Planned Features (Documented):
- **Extension Requests** (`EXTENSION_FEATURE_TODO.md`)
  - Request to extend due date
  - Max 2 extensions per borrow
  - Admin/Handler approval required

- **Notifications** (`NOTIFICATION_SYSTEM_TODO.md`)
  - Email when request approved
  - SMS reminders for due dates
  - In-app notification bell
  - "Your item is ready for pickup" message

### Potential Features:
- [ ] QR code for quick pickup
- [ ] Rate/review borrowed items
- [ ] Favorite items for quick request
- [ ] Borrow calendar view
- [ ] Export borrow history to PDF
- [ ] Mobile app version
- [ ] Push notifications
- [ ] Item reservation system

---

## Testing Checklist

### Student Account Testing:
- [ ] Can login and see dashboard
- [ ] Stats display correctly
- [ ] Can browse all categories
- [ ] Can search for items
- [ ] Can submit borrow request
- [ ] Request appears in pending tab
- [ ] Can view active borrows
- [ ] Overdue items show warnings
- [ ] Can view borrow history
- [ ] Cannot access admin/handler pages

### Personnel Account Testing:
- [ ] Same as Student (identical interface)
- [ ] Portal shows "Personnel Portal"

### Edge Cases:
- [ ] No active borrows (empty state)
- [ ] No pending requests (empty state)
- [ ] No history (empty state)
- [ ] All items unavailable
- [ ] Overdue item handling
- [ ] Multiple overdue items
- [ ] Search with no results

---

## Sample Accounts

From `add_sample_users.py`:
```
student1
Password: StudentPass123!
Role: STUDENT

personnel1
Password: PersonnelPass123!
Role: PERSONNEL
```

---

## Related Documentation
- `BORROW_REQUESTS_FEATURE.md` - Pre-borrow request system
- `EXTENSION_FEATURE_TODO.md` - Extension feature (future)
- `NOTIFICATION_SYSTEM_TODO.md` - Notification system (future)
- `HANDLER_SETUP.md` - Handler role documentation

---

## Summary

The borrower interface provides a clean, intuitive experience for Students and Personnel to:
- Browse and request equipment
- Track their active borrows
- View borrow history
- Manage their account

With clear visual feedback, overdue warnings, and a first-come, first-serve request system, borrowers can easily access the equipment they need while maintaining accountability.

**Status**: ✅ Fully Implemented and Ready for Testing
