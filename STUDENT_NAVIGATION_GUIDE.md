# Student/Personnel Navigation Guide

## Correct URLs for Students and Personnel

When logged in as a STUDENT or PERSONNEL user, you should ONLY access these URLs:

### ✅ CORRECT URLs (New Borrower Interface):
1. **Dashboard**: `http://localhost:5173/borrower/dashboard`
2. **Browse Items**: `http://localhost:5173/borrower/browse`
3. **My Borrows**: `http://localhost:5173/borrower/my-borrows`
4. **Notifications**: `http://localhost:5173/borrower/notifications`
5. **Account**: `http://localhost:5173/borrower/account`

### ❌ WRONG URLs (Old Interface - Will Redirect):
- `http://localhost:5173/dashboard` → Redirects to `/borrower/dashboard`
- `http://localhost:5173/Borrow` → Redirects to `/borrower/browse`
- `http://localhost:5173/Return` → Redirects to `/borrower/my-borrows`
- `http://localhost:5173/Account` → Redirects to `/borrower/account`

## Navigation Items

The correct sidebar navigation for students/personnel should show:

1. 🏠 **Dashboard** - View stats and recent borrows
2. 🔍 **Browse Items** - Browse and request items by category
3. 📋 **My Borrows** - View active, pending, and history
4. 🔔 **Notifications** - View notifications (with red badge showing count)
5. 👤 **Account** - View profile and settings

## How to Verify You're on the Correct Interface

### Check the URL:
- Should start with `/borrower/`
- Example: `http://localhost:5173/borrower/dashboard`

### Check the Navigation:
- Should have 5 items (not 4)
- Should include "Browse Items", "My Borrows", and "Notifications"
- Should NOT include "Borrow" or "Return"

### Check the Page Title:
- Should say "Student Portal" or "Personnel Portal" under "GearGuard"
- Should NOT say "Equipment Tracker"

## Test Accounts

- **Student**: username: `student1`, password: `StudentPass123!`
- **Personnel**: username: `personnel1`, password: `PersonnelPass123!`

## Troubleshooting

If you see the old interface:
1. Check the URL in the address bar
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+F5)
4. Logout and login again
5. Make sure you're not manually typing `/dashboard` in the URL

If you see an infinite loop:
1. The old `/dashboard` page has a health check that can loop
2. Students should never access `/dashboard`
3. Always use `/borrower/dashboard` instead
