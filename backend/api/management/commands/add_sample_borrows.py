from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from api.models import Item, ItemInstance, Borrow, BorrowLog

User = get_user_model()


class Command(BaseCommand):
    help = "Add sample items and borrows for testing"

    def handle(self, *args, **options):
        # Get existing items from inventory
        laptop = Item.objects.filter(name="Laptop").first()
        projector = Item.objects.filter(name="Projector").first()
        camera = Item.objects.filter(name="Camera").first()
        mouse = Item.objects.filter(name="Mouse").first()
        keyboard = Item.objects.filter(name="Keyboard").first()
        
        if not all([laptop, projector, camera, mouse, keyboard]):
            self.stdout.write(
                self.style.ERROR("Required items not found. Run 'add_sample_inventory' first.")
            )
            return
        
        items = [laptop, projector, camera, mouse, keyboard]
        self.stdout.write(self.style.SUCCESS("✓ Found existing items"))

        # Get users
        student = User.objects.filter(username="student1").first()
        personnel = User.objects.filter(username="personnel1").first()
        handler = User.objects.filter(username="handler1").first()

        if not all([student, personnel, handler]):
            self.stdout.write(
                self.style.ERROR("Sample users not found. Run 'add_sample_users' first.")
            )
            return

        now = timezone.now()

        # Sample borrows with item instances
        # Get some item instances
        laptop_instance = ItemInstance.objects.filter(item__name="Laptop", status="IN_USE").first()
        tripod_instance = ItemInstance.objects.filter(item__name="Tripod", reference_id="PRJ001").first()
        
        borrows_data = [
            {
                "item": items[0],
                "item_instance": laptop_instance,
                "borrower": student,
                "handler": handler,
                "borrow_date": now - timedelta(days=5),
                "due_date": now + timedelta(days=2),
                "status": Borrow.Status.ACTIVE,
                "notes": "For project work",
            },
            {
                "item": items[1],
                "item_instance": tripod_instance,
                "borrower": personnel,
                "handler": handler,
                "borrow_date": now - timedelta(days=10),
                "due_date": now - timedelta(days=2),
                "return_date": now - timedelta(days=1),
                "status": Borrow.Status.RETURNED,
                "notes": "Presentation completed",
            },
            {
                "item": items[2],
                "item_instance": None,
                "borrower": student,
                "handler": handler,
                "borrow_date": now - timedelta(days=15),
                "due_date": now - timedelta(days=5),
                "status": Borrow.Status.LATE,
                "notes": "Still in use",
            },
            {
                "item": items[3],
                "item_instance": None,
                "borrower": personnel,
                "handler": handler,
                "borrow_date": now - timedelta(days=20),
                "due_date": now - timedelta(days=10),
                "return_date": now - timedelta(days=8),
                "status": Borrow.Status.NOT_RETURNED,
                "not_returned_reason": Borrow.NotReturnedReason.LOST,
                "notes": "Lost during event",
            },
            {
                "item": items[4],
                "item_instance": None,
                "borrower": student,
                "handler": handler,
                "borrow_date": now - timedelta(days=3),
                "due_date": now + timedelta(days=4),
                "status": Borrow.Status.ACTIVE,
                "notes": "Recording session",
            },
        ]

        for borrow_data in borrows_data:
            borrow, created = Borrow.objects.get_or_create(
                item=borrow_data["item"],
                borrower=borrow_data["borrower"],
                borrow_date=borrow_data["borrow_date"],
                defaults={
                    "item_instance": borrow_data.get("item_instance"),
                    "handler": borrow_data.get("handler"),
                    "due_date": borrow_data["due_date"],
                    "return_date": borrow_data.get("return_date"),
                    "status": borrow_data["status"],
                    "not_returned_reason": borrow_data.get("not_returned_reason"),
                    "notes": borrow_data.get("notes", ""),
                },
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Created borrow: {borrow.borrower.username} - {borrow.item.name} ({borrow.status})"
                    )
                )
                
                # Create logs for this borrow
                self._create_borrow_logs(borrow, borrow_data, handler, now)

        self.stdout.write(self.style.SUCCESS("\nAll sample data created successfully!"))

    def _create_borrow_logs(self, borrow, borrow_data, handler, now):
        """Create timeline logs for a borrow"""
        logs = []
        
        # Log 1: Borrow created
        logs.append(BorrowLog(
            borrow=borrow,
            action=BorrowLog.ActionType.CREATED,
            performed_by=borrow.borrower,
            description=f"Borrow request created for {borrow.item.name}",
            metadata={"item_name": borrow.item.name},
            created_at=borrow.borrow_date
        ))
        
        # Log 2: Approved by handler
        if borrow.handler:
            logs.append(BorrowLog(
                borrow=borrow,
                action=BorrowLog.ActionType.APPROVED,
                performed_by=borrow.handler,
                description=f"Borrow approved by {borrow.handler.username}",
                metadata={"handler": borrow.handler.username},
                created_at=borrow.borrow_date + timedelta(minutes=30)
            ))
        
        # Log 3: Status-specific logs
        if borrow.status == Borrow.Status.RETURNED and borrow.return_date:
            logs.append(BorrowLog(
                borrow=borrow,
                action=BorrowLog.ActionType.RETURNED,
                performed_by=borrow.handler,
                description=f"Item returned in good condition",
                metadata={"return_date": str(borrow.return_date)},
                created_at=borrow.return_date
            ))
        elif borrow.status == Borrow.Status.LATE:
            logs.append(BorrowLog(
                borrow=borrow,
                action=BorrowLog.ActionType.MARKED_LATE,
                performed_by=None,
                description=f"Item marked as late. Due date was {borrow.due_date.strftime('%Y-%m-%d')}",
                metadata={"due_date": str(borrow.due_date)},
                created_at=borrow.due_date + timedelta(days=1)
            ))
        elif borrow.status == Borrow.Status.NOT_RETURNED:
            logs.append(BorrowLog(
                borrow=borrow,
                action=BorrowLog.ActionType.MARKED_NOT_RETURNED,
                performed_by=borrow.handler,
                description=f"Item marked as not returned. Reason: {borrow.not_returned_reason}",
                metadata={
                    "reason": borrow.not_returned_reason,
                    "notes": borrow.notes
                },
                created_at=borrow.return_date if borrow.return_date else now
            ))
        
        # Bulk create logs
        BorrowLog.objects.bulk_create(logs)
        self.stdout.write(f"  → Created {len(logs)} log entries")
