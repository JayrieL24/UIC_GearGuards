# Borrower API Implementation

## Overview
Backend API endpoints have been implemented to provide inventory access and borrow request functionality for Students and Personnel.

---

## Implemented Endpoints

### 1. Borrower Stats
**Endpoint**: `GET /api/borrower/stats/`  
**Authentication**: Required (Token)  
**Permissions**: STUDENT or PERSONNEL role

**Response**:
```json
{
  "active_borrows": 2,
  "pending_requests": 1,
  "overdue_items": 0,
  "total_borrowed": 15
}
```

**Description**: Returns dashboard statistics for the logged-in borrower.

---

### 2. My Borrows
**Endpoint**: `GET /api/borrower/my-borrows/`  
**Authentication**: Required (Token)  
**Permissions**: STUDENT or PERSONNEL role

**Query Parameters**:
- `status` (optional): Filter by status
  - `active` - Active borrows
  - `pending` - Pending requests
  - `history` - Returned/Rejected borrows
- `limit` (optional): Limit number of results (e.g., `?limit=5`)

**Response**:
```json
{
  "borrows": [
    {
      "id": 1,
      "item_name": "Dell Laptop",
      "reference_id": "LAP001",
      "status": "ACTIVE",
      "borrow_date": "2024-02-15T10:30:00Z",
      "due_date": "2024-02-18T10:30:00Z",
      "return_date": null,
      "notes": "For project work"
    }
  ]
}
```

**Description**: Returns borrower's borrows with optional filtering.

---

### 3. Browse Categories
**Endpoint**: `GET /api/borrower/categories/`  
**Authentication**: Required (Token)  
**Permissions**: STUDENT or PERSONNEL role

**Response**:
```json
{
  "categories": [
    {
      "id": 1,
      "name": "laptops",
      "display_name": "Laptops",
      "available_count": 5,
      "total_instances": 10
    },
    {
      "id": 2,
      "name": "peripherals",
      "display_name": "Peripherals",
      "available_count": 15,
      "total_instances": 20
    }
  ]
}
```

**Description**: Returns all categories with availability counts.

---

### 4. Category Items
**Endpoint**: `GET /api/borrower/categories/{category_id}/items/`  
**Authentication**: Required (Token)  
**Permissions**: STUDENT or PERSONNEL role

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Dell Laptop",
      "description": "Dell Inspiron 15, 8GB RAM, 256GB SSD",
      "available_count": 3,
      "in_use_count": 5,
      "faulty_count": 1,
      "total_quantity": 10
    }
  ]
}
```

**Description**: Returns all items in a category with availability info.

---

### 5. Request Borrow
**Endpoint**: `POST /api/borrower/request-borrow/`  
**Authentication**: Required (Token)  
**Permissions**: STUDENT or PERSONNEL role (must be approved)

**Request Body**:
```json
{
  "item_id": 1,
  "notes": "Need for class project" // optional
}
```

**Response** (Success - 201):
```json
{
  "message": "Borrow request submitted successfully",
  "borrow_id": 42,
  "item_name": "Dell Laptop",
  "status": "PENDING"
}
```

**Response** (Error - 400):
```json
{
  "detail": "No available instances of this item."
}
```

**Response** (Error - 400):
```json
{
  "detail": "You already have a pending request for this item."
}
```

**Response** (Error - 403):
```json
{
  "detail": "Your account is not approved yet."
}
```

**Description**: Creates a borrow request with PENDING status. Automatically assigns an available instance and sets due date to 3 days from now.

**Business Logic**:
1. Checks if user is approved
2. Validates item exists
3. Checks for available instances
4. Prevents duplicate pending requests for same item
5. Creates borrow with PENDING status
6. Creates audit log entry
7. Returns success response

---

## Helper Function

### `_is_borrower(user)`
**Purpose**: Check if user has STUDENT or PERSONNEL role  
**Returns**: Boolean

**Usage**:
```python
if not _is_borrower(request.user):
    return Response({"detail": "Borrower access required."}, status=403)
```

---

## Security & Permissions

### Authentication
- All endpoints require valid authentication token
- Token must be included in Authorization header: `Authorization: Token <token>`

### Role-Based Access Control
- Only users with `STUDENT` or `PERSONNEL` role can access these endpoints
- Admin and Handler roles are explicitly excluded
- Returns 403 Forbidden if wrong role

### Data Isolation
- Borrowers can only see their own borrows
- Cannot view other users' data
- Cannot modify inventory
- Cannot approve/reject requests

### Account Approval
- Borrow requests require approved account
- Checks `user.profile.is_approved` before allowing requests
- Returns 403 if not approved

---

## Database Models Used

### Borrow
- `borrower`: ForeignKey to User
- `item_instance`: ForeignKey to ItemInstance
- `status`: PENDING, ACTIVE, RETURNED, REJECTED
- `borrow_date`: DateTime
- `due_date`: DateTime
- `return_date`: DateTime (nullable)
- `notes`: TextField

### ItemInstance
- `item`: ForeignKey to Item
- `reference_id`: Unique identifier (barcode)
- `status`: AVAILABLE, IN_USE, FAULTY, IN_REPAIR, OUT_OF_STOCK

### Item
- `name`: Item name
- `description`: Item description
- `category`: ForeignKey to Category
- `quantity`: Total count

### Category
- `name`: Internal name
- `display_name`: Display name

### BorrowLog
- `borrow`: ForeignKey to Borrow
- `action`: REQUESTED, APPROVED, REJECTED, etc.
- `performed_by`: ForeignKey to User
- `description`: Action description
- `metadata`: JSON field

---

## URL Routes

Added to `api/urls.py`:
```python
# Borrower endpoints (Students & Personnel)
path("borrower/stats/", borrower_stats, name="borrower-stats"),
path("borrower/my-borrows/", borrower_my_borrows, name="borrower-my-borrows"),
path("borrower/categories/", borrower_categories, name="borrower-categories"),
path("borrower/categories/<int:category_id>/items/", borrower_category_items, name="borrower-category-items"),
path("borrower/request-borrow/", borrower_request_borrow, name="borrower-request-borrow"),
```

---

## Testing

### Test with cURL

**1. Get Stats**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/borrower/stats/
```

**2. Get My Borrows**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/borrower/my-borrows/?status=active
```

**3. Get Categories**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/borrower/categories/
```

**4. Get Category Items**:
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/api/borrower/categories/1/items/
```

**5. Request Borrow**:
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 1, "notes": "Test request"}' \
  http://127.0.0.1:8000/api/borrower/request-borrow/
```

### Test Accounts
From `add_sample_users.py`:
```
Username: student1
Password: StudentPass123!
Role: STUDENT

Username: personnel1
Password: PersonnelPass123!
Role: PERSONNEL
```

---

## Error Handling

### Common Errors

**403 Forbidden**:
- Wrong role (not STUDENT/PERSONNEL)
- Account not approved
- Missing authentication

**404 Not Found**:
- Category doesn't exist
- Item doesn't exist

**400 Bad Request**:
- Missing required fields
- No available instances
- Duplicate pending request
- Invalid data format

**401 Unauthorized**:
- Missing or invalid token
- Token expired

---

## Integration with Frontend

The frontend components are already configured to use these endpoints:

**Dashboard.jsx**:
- Calls `/api/borrower/stats/`
- Calls `/api/borrower/my-borrows/?limit=5`

**BrowseItems.jsx**:
- Calls `/api/borrower/categories/`
- Calls `/api/borrower/categories/{id}/items/`
- Calls `/api/borrower/request-borrow/`

**MyBorrows.jsx**:
- Calls `/api/borrower/my-borrows/?status={active|pending|history}`

---

## Workflow Example

### Borrower Requests an Item:

1. **Browse Items**:
   ```
   GET /api/borrower/categories/
   GET /api/borrower/categories/1/items/
   ```

2. **Submit Request**:
   ```
   POST /api/borrower/request-borrow/
   Body: { "item_id": 5, "notes": "For project" }
   ```

3. **Check Status**:
   ```
   GET /api/borrower/my-borrows/?status=pending
   ```

4. **Admin/Handler Approves**:
   ```
   POST /api/borrow-requests/42/approve/
   ```

5. **View Active Borrow**:
   ```
   GET /api/borrower/my-borrows/?status=active
   ```

6. **Return Item** (Admin/Handler processes):
   - Item status updated to RETURNED
   - Appears in history

7. **View History**:
   ```
   GET /api/borrower/my-borrows/?status=history
   ```

---

## Future Enhancements

### Planned Features:
- [ ] Extension requests endpoint
- [ ] Notification preferences endpoint
- [ ] Favorite items endpoint
- [ ] Borrow history export (PDF/CSV)
- [ ] Item ratings/reviews endpoint
- [ ] Reservation system endpoint

### Potential Improvements:
- [ ] Pagination for large result sets
- [ ] Advanced filtering (date ranges, item types)
- [ ] Search functionality across all items
- [ ] Bulk request submission
- [ ] Request cancellation endpoint
- [ ] Email notifications on status changes

---

## Summary

**Implemented**:
- ✅ 5 borrower endpoints
- ✅ Role-based access control
- ✅ Data isolation and security
- ✅ Account approval checks
- ✅ Duplicate request prevention
- ✅ Audit logging
- ✅ URL routing
- ✅ Error handling

**Status**: ✅ Fully Implemented and Ready for Testing

**Next Steps**:
1. Start Django server: `python manage.py runserver`
2. Login as student1 or personnel1
3. Test all borrower features
4. Verify data isolation
5. Test error cases
