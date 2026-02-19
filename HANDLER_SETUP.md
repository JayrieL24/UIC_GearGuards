# Handler Role Setup

## Overview
Handlers have access to view and manage borrows, inventory, and reports - but NOT user approvals (admin-only).

## Handler Capabilities

### ✅ Can Access:
- **Dashboard** (`/handler/dashboard`) - View borrow statistics and activity
- **Inventory** (`/handler/inventory`) - View all equipment and availability
- **Borrows** (`/handler/borrows`) - View and manage all borrow transactions
- **Reports** (`/handler/reports`) - View analytics and AI-powered insights

### ❌ Cannot Access:
- **Approvals** - Only admins can approve/reject user registrations
- **System Settings** - Admin-only configuration

## Handler Account

**Username:** `handler1`  
**Password:** `HandlerPass123!`  
**Role:** HANDLER

## Routes

### Frontend Routes:
- `/handler/dashboard` - Handler Dashboard
- `/handler/inventory` - Inventory Management
- `/handler/borrows` - Borrow Management
- `/handler/reports` - Reports & Analytics

### Backend API Endpoints (Handler Access):
- `GET /api/admin/dashboard/stats/` - Dashboard statistics
- `GET /api/admin/borrows/active/` - Active borrows
- `GET /api/admin/borrows/archived/` - Archived borrows
- `GET /api/admin/categories/` - Equipment categories
- `GET /api/admin/category-items/<id>/` - Items in category
- `GET /api/admin/reports/analytics/` - Analytics data
- `GET /api/admin/ai/recommendations/` - AI recommendations
- `GET /api/admin/ai/inventory-analysis/` - AI inventory analysis
- `GET /api/admin/ai/borrow-analysis/` - AI borrow analysis

## Login Flow

When a handler logs in:
1. System checks role
2. Redirects to `/handler/dashboard`
3. Handler panel loads with appropriate navigation
4. All handler-accessible features are available

## Differences from Admin

| Feature | Admin | Handler |
|---------|-------|---------|
| Dashboard | ✅ | ✅ |
| Inventory View | ✅ | ✅ |
| Borrows View | ✅ | ✅ |
| Reports & Analytics | ✅ | ✅ |
| AI Insights | ✅ | ✅ |
| User Approvals | ✅ | ❌ |
| Add/Edit Inventory | ✅ | ❌ (View only) |
| System Settings | ✅ | ❌ |

## Testing

1. Log out if currently logged in
2. Go to `/login`
3. Enter credentials:
   - Username: `handler1`
   - Password: `HandlerPass123!`
4. You'll be redirected to `/handler/dashboard`
5. Navigate through Dashboard, Inventory, Borrows, and Reports
6. Notice "Approvals" is not in the navigation (admin-only)
