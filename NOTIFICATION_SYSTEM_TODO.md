# Notification System for Pre-Borrow Approvals

## Overview
When Admin/Handler approves a pre-borrow request, automatically notify the borrower that their item is ready for pickup at the lab.

## Current Flow:
1. Student/Personnel submits pre-borrow request online → Status: PENDING
2. Admin/Handler reviews in "Borrow Transactions" page
3. Admin/Handler clicks "Approve & Mark Borrowed"
4. Status changes to ACTIVE
5. **[TO IMPLEMENT]** → Send notification to borrower

## Notification Requirements

### Notification Channels:

#### 1. In-App Notification (Priority 1)
- **Bell icon** in borrower's dashboard
- **Notification badge** showing unread count
- **Notification list** with:
  - Title: "Pre-Borrow Request Approved!"
  - Message: "Your request for [Item Name] has been approved. Please visit the lab to complete the transaction."
  - Timestamp
  - Item details
  - Approved by (Handler/Admin name)
  - Action button: "View Details"

#### 2. Email Notification (Priority 2)
- Send email to borrower's registered email
- Subject: "GearGuard: Your Pre-Borrow Request is Approved"
- Body includes:
  - Item name and reference ID
  - Approval date/time
  - Instructions to visit the lab
  - Lab hours/location
  - Due date (3 days from approval)
  - Contact information

#### 3. SMS Notification (Priority 3 - Optional)
- Send SMS if phone number is available
- Short message: "Your GearGuard pre-borrow for [Item] is approved. Visit the lab to complete pickup."

### Notification Types:

1. **Approval Notification**
   - Trigger: When pre-borrow request is approved
   - Message: "Your pre-borrow request for [Item Name] has been approved! Please visit the lab to complete the transaction."

2. **Rejection Notification**
   - Trigger: When pre-borrow request is rejected
   - Message: "Your pre-borrow request for [Item Name] was not approved. Reason: [Rejection Reason]"

3. **Pickup Reminder** (Optional)
   - Trigger: 24 hours after approval if not picked up
   - Message: "Reminder: Your approved item [Item Name] is waiting for pickup at the lab."

4. **Pickup Deadline** (Optional)
   - Trigger: If not picked up within 48 hours
   - Message: "Your pre-borrow reservation for [Item Name] will expire soon. Please pick up by [Date/Time]."

## Database Schema

### Notification Model:

```python
class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BORROW_APPROVED = "BORROW_APPROVED", "Pre-Borrow Approved"
        BORROW_REJECTED = "BORROW_REJECTED", "Pre-Borrow Rejected"
        PICKUP_REMINDER = "PICKUP_REMINDER", "Pickup Reminder"
        PICKUP_DEADLINE = "PICKUP_DEADLINE", "Pickup Deadline Warning"
        EXTENSION_APPROVED = "EXTENSION_APPROVED", "Extension Approved"
        EXTENSION_REJECTED = "EXTENSION_REJECTED", "Extension Rejected"
        RETURN_REMINDER = "RETURN_REMINDER", "Return Reminder"
        OVERDUE_WARNING = "OVERDUE_WARNING", "Overdue Warning"
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    borrow = models.ForeignKey(Borrow, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.notification_type}"
```

### Email Log Model (Optional):

```python
class EmailLog(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending')
    ])
    error_message = models.TextField(blank=True)
```

## Backend Implementation

### 1. Notification Service:

```python
# api/services/notification_service.py

from django.core.mail import send_mail
from django.conf import settings
from ..models import Notification, Borrow

class NotificationService:
    
    @staticmethod
    def send_borrow_approval_notification(borrow):
        """Send notification when pre-borrow is approved"""
        # Create in-app notification
        notification = Notification.objects.create(
            user=borrow.borrower,
            notification_type=Notification.NotificationType.BORROW_APPROVED,
            title="Pre-Borrow Request Approved!",
            message=f"Your request for {borrow.item.name} has been approved. "
                   f"Please visit the lab to complete the transaction. "
                   f"Due date: {borrow.due_date.strftime('%B %d, %Y')}",
            borrow=borrow
        )
        
        # Send email
        NotificationService.send_approval_email(borrow)
        
        return notification
    
    @staticmethod
    def send_approval_email(borrow):
        """Send email notification for approval"""
        subject = "GearGuard: Your Pre-Borrow Request is Approved"
        message = f"""
        Hello {borrow.borrower.username},
        
        Great news! Your pre-borrow request has been approved.
        
        Item Details:
        - Item: {borrow.item.name}
        - Reference ID: {borrow.item_instance.reference_id if borrow.item_instance else 'N/A'}
        - Due Date: {borrow.due_date.strftime('%B %d, %Y at %I:%M %p')}
        
        Next Steps:
        Please visit the lab to complete the transaction and pick up your item.
        
        Lab Information:
        - Location: [Lab Location]
        - Hours: [Lab Hours]
        - Contact: [Lab Contact]
        
        Important: Please pick up your item within 48 hours, or your reservation may be cancelled.
        
        Thank you for using GearGuard!
        
        Best regards,
        GearGuard Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [borrow.borrower.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
    
    @staticmethod
    def send_borrow_rejection_notification(borrow, reason):
        """Send notification when pre-borrow is rejected"""
        notification = Notification.objects.create(
            user=borrow.borrower,
            notification_type=Notification.NotificationType.BORROW_REJECTED,
            title="Pre-Borrow Request Not Approved",
            message=f"Your request for {borrow.item.name} was not approved. "
                   f"Reason: {reason}",
            borrow=borrow
        )
        
        # Send email
        subject = "GearGuard: Pre-Borrow Request Update"
        message = f"""
        Hello {borrow.borrower.username},
        
        We regret to inform you that your pre-borrow request was not approved.
        
        Item: {borrow.item.name}
        Reason: {reason}
        
        You may submit a new request or contact the lab for more information.
        
        Best regards,
        GearGuard Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [borrow.borrower.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
        
        return notification
```

### 2. Update Approval View:

```python
# In api/views.py - approve_borrow_request function

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_borrow_request(request, borrow_id):
    """Approve a pending borrow request"""
    if not _is_handler_or_admin(request.user):
        return Response({"detail": "Admin or Handler access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        borrow = Borrow.objects.get(id=borrow_id, status=Borrow.Status.PENDING)
    except Borrow.DoesNotExist:
        return Response({"detail": "Borrow request not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

    # Update status to ACTIVE and assign handler
    borrow.status = Borrow.Status.ACTIVE
    borrow.handler = request.user
    borrow.save()

    # Create log entry
    BorrowLog.objects.create(
        borrow=borrow,
        action=BorrowLog.ActionType.APPROVED,
        performed_by=request.user,
        description=f"Borrow request approved by {request.user.username}",
        metadata={"approved_at": borrow.updated_at.isoformat()}
    )
    
    # **[NEW]** Send notification to borrower
    from .services.notification_service import NotificationService
    NotificationService.send_borrow_approval_notification(borrow)

    return Response({
        "message": "Borrow request approved successfully. Borrower has been notified.",
        "borrow": BorrowSerializer(borrow).data
    })
```

## API Endpoints Needed

### For Borrowers:

1. **GET /api/notifications/**
   - Get all notifications for logged-in user
   - Query params: `?unread=true` (filter unread only)
   - Response: List of notifications with count

2. **GET /api/notifications/unread-count/**
   - Get count of unread notifications
   - Response: `{"count": 5}`

3. **POST /api/notifications/<id>/mark-read/**
   - Mark notification as read
   - Response: Updated notification

4. **POST /api/notifications/mark-all-read/**
   - Mark all notifications as read
   - Response: Success message

5. **DELETE /api/notifications/<id>/**
   - Delete a notification
   - Response: Success message

## Frontend Implementation

### 1. Notification Bell Component:

```jsx
// components/NotificationBell.jsx

import { useState, useEffect } from 'react';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const response = await fetch('/api/notifications/unread-count/');
    const data = await response.json();
    setUnreadCount(data.count);
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setShowDropdown(!showDropdown)}>
        <i className="pi pi-bell" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {showDropdown && (
        <NotificationDropdown 
          notifications={notifications}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
```

### 2. Borrower Dashboard:

```jsx
// Pages/Borrower/Dashboard.jsx

export function BorrowerDashboard() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const response = await fetch('/api/notifications/');
    const data = await response.json();
    setNotifications(data.notifications);
  };

  return (
    <div>
      <NotificationBell />
      <h2>My Notifications</h2>
      <NotificationList notifications={notifications} />
    </div>
  );
}
```

## Email Configuration

### Django Settings:

```python
# settings.py

# Email configuration (example using Gmail)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = 'GearGuard <noreply@gearguard.com>'

# Or use console backend for development
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### Environment Variables:

```env
# .env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## Implementation Phases

### Phase 1: In-App Notifications (Essential)
- Create Notification model
- Add notification service
- Update approval/rejection views
- Create notification API endpoints
- Add notification bell to borrower dashboard

### Phase 2: Email Notifications
- Configure email settings
- Create email templates
- Add email sending to notification service
- Test email delivery

### Phase 3: Advanced Features
- Pickup reminders (24 hours after approval)
- Pickup deadline warnings (48 hours)
- Return reminders
- Overdue warnings
- SMS notifications (optional)

### Phase 4: Real-time Updates (Optional)
- WebSocket integration
- Push notifications
- Real-time notification updates without polling

## Testing Checklist

- [ ] Notification created when pre-borrow approved
- [ ] Notification created when pre-borrow rejected
- [ ] Email sent on approval
- [ ] Email sent on rejection
- [ ] Notification appears in borrower dashboard
- [ ] Unread count updates correctly
- [ ] Mark as read functionality works
- [ ] Delete notification works
- [ ] Email contains correct information
- [ ] Email links work correctly

## Notes

- Notifications are critical for user experience
- Email is backup for in-app notifications
- Consider rate limiting for email sending
- Store email logs for debugging
- Add unsubscribe option for emails
- Comply with email regulations (CAN-SPAM, GDPR)
