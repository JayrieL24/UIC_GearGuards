from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin (Management)"
        HANDLER = "HANDLER", "User Handler"
        STUDENT = "STUDENT", "Student (Borrower)"
        PERSONNEL = "PERSONNEL", "Personnel (Borrower)"
        USER = "USER", "User (Borrower)"  # Legacy role, kept for backwards compatibility

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.USER)
    requested_role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.USER)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_profiles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Category(models.Model):
    """Equipment categories like Devices, Computer Parts, etc."""
    class CategoryType(models.TextChoices):
        DEVICES = "DEVICES", "Devices"
        COMPUTER_PARTS = "COMPUTER_PARTS", "Computer Parts"
        EJECTABLES = "EJECTABLES", "Ejectables"
        ROBOTICS_PARTS = "ROBOTICS_PARTS", "Robotics Parts"
    
    name = models.CharField(max_length=50, choices=CategoryType.choices, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.get_name_display()


class Item(models.Model):
    """Item type/template (e.g., 'Laptop', 'Mouse')"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="items", null=True, blank=True)
    quantity = models.IntegerField(default=1)
    available = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.category})"


class ItemInstance(models.Model):
    """Individual physical item with unique reference ID"""
    class ItemStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        IN_USE = "IN_USE", "In Use"
        FAULTY = "FAULTY", "Faulty"
        IN_REPAIR = "IN_REPAIR", "In Repair"
        OUT_OF_STOCK = "OUT_OF_STOCK", "Out of Stock"
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="instances")
    reference_id = models.CharField(max_length=50, unique=True, help_text="Unique reference ID (e.g., LAP001)")
    status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.AVAILABLE)
    notes = models.TextField(blank=True, help_text="Additional notes about this specific item")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['reference_id']

    def __str__(self):
        return f"{self.item.name} - {self.reference_id}"


class Borrow(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Approval"
        ACTIVE = "ACTIVE", "Active"
        RETURNED = "RETURNED", "Returned"
        LATE = "LATE", "Late"
        NOT_RETURNED = "NOT_RETURNED", "Not Returned"
        REJECTED = "REJECTED", "Rejected"

    class NotReturnedReason(models.TextChoices):
        LOST = "LOST", "Lost"
        DAMAGED = "DAMAGED", "Damaged"
        NO_CONTACT = "NO_CONTACT", "No Contact"

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="borrows")
    item_instance = models.ForeignKey(ItemInstance, on_delete=models.SET_NULL, null=True, blank=True, related_name="borrows")
    borrower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="borrows",
    )
    handler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="handled_borrows",
    )
    borrow_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    return_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    not_returned_reason = models.CharField(
        max_length=20,
        choices=NotReturnedReason.choices,
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.borrower.username} - {self.item.name}"


class BorrowLog(models.Model):
    """Timeline log of all actions performed on a borrow transaction"""
    class ActionType(models.TextChoices):
        CREATED = "CREATED", "Borrow Created"
        REQUESTED = "REQUESTED", "Borrow Requested"
        APPROVED = "APPROVED", "Approved by Handler"
        REJECTED = "REJECTED", "Rejected by Handler"
        RETURNED = "RETURNED", "Item Returned"
        MARKED_LATE = "MARKED_LATE", "Marked as Late"
        MARKED_NOT_RETURNED = "MARKED_NOT_RETURNED", "Marked as Not Returned"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        NOTE_ADDED = "NOTE_ADDED", "Note Added"
        DUE_DATE_EXTENDED = "DUE_DATE_EXTENDED", "Due Date Extended"
    
    borrow = models.ForeignKey(Borrow, on_delete=models.CASCADE, related_name="logs")
    action = models.CharField(max_length=30, choices=ActionType.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="borrow_actions"
    )
    description = models.TextField(help_text="Description of the action")
    metadata = models.JSONField(null=True, blank=True, help_text="Additional data like old/new values")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.borrow.id} - {self.action} by {self.performed_by}"
