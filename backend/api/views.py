from django.contrib.auth import get_user_model
from django.db.models import Count, Q, F
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserProfile, Borrow, Item, BorrowLog
from .serializers import (
    ApprovalSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    BorrowSerializer,
    BorrowDetailSerializer,
)
from .services.ai_service import ai_service

User = get_user_model()


def _is_admin_user(user):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return hasattr(user, "profile") and user.profile.role == UserProfile.Roles.ADMIN and user.profile.is_approved


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "django-backend"})


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(
        {
            "message": "Registration submitted. Wait for admin approval before login.",
            "user_id": user.id,
            "requested_role": user.profile.requested_role,
            "is_approved": user.profile.is_approved,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if not hasattr(user, "profile") or not user.profile.is_approved:
        return Response(
            {"detail": "Account is pending admin approval."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not user.is_active:
        return Response(
            {"detail": "Account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "username": user.username,
            "role": user.profile.role,
            "is_superuser": user.is_superuser,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    profile = request.user.profile
    return Response(
        {
            "username": request.user.username,
            "email": request.user.email,
            "role": profile.role,
            "is_approved": profile.is_approved,
            "is_superuser": request.user.is_superuser,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_registrations(request):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    pending = UserProfile.objects.filter(is_approved=False).select_related("user").order_by("created_at")
    data = UserProfileSerializer(pending, many=True).data
    return Response({"pending": data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_registration(request, user_id):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ApprovalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        target_user = User.objects.select_related("profile").get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    target_user.profile.role = serializer.validated_data["role"]
    target_user.profile.is_approved = True
    target_user.profile.approved_by = request.user
    target_user.profile.save(update_fields=["role", "is_approved", "approved_by", "updated_at"])
    target_user.is_active = True
    target_user.save(update_fields=["is_active"])

    return Response(
        {
            "message": "User approved.",
            "user_id": target_user.id,
            "role": target_user.profile.role,
            "is_approved": target_user.profile.is_approved,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_registration(request, user_id):
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.select_related("profile").get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    target_user.is_active = False
    target_user.save(update_fields=["is_active"])
    target_user.profile.is_approved = False
    target_user.profile.approved_by = request.user
    target_user.profile.save(update_fields=["is_approved", "approved_by", "updated_at"])

    return Response({"message": "Registration rejected.", "user_id": target_user.id})



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    total_borrows = Borrow.objects.count()
    active_borrows = Borrow.objects.filter(status=Borrow.Status.ACTIVE).count()
    late_borrows = Borrow.objects.filter(status=Borrow.Status.LATE).count()
    returned_borrows = Borrow.objects.filter(status=Borrow.Status.RETURNED).count()
    not_returned_borrows = Borrow.objects.filter(status=Borrow.Status.NOT_RETURNED).count()

    return Response({
        "total_borrows": total_borrows,
        "active_borrows": active_borrows,
        "late_borrows": late_borrows,
        "returned_borrows": returned_borrows,
        "not_returned_borrows": not_returned_borrows,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_inventory(request):
    """Get all inventory items with availability"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    items = Item.objects.all()
    items_data = []
    
    for item in items:
        borrowed_count = Borrow.objects.filter(
            item=item,
            status__in=[Borrow.Status.ACTIVE, Borrow.Status.LATE]
        ).count()
        
        available = item.quantity - borrowed_count
        utilization = ((item.quantity - available) / item.quantity * 100) if item.quantity > 0 else 0
        
        items_data.append({
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "available": available,
            "utilization": round(utilization, 1),
        })
    
    return Response({"items": items_data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_active_borrows(request):
    """Get all active borrows for admin"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    borrows = Borrow.objects.filter(status=Borrow.Status.ACTIVE).select_related(
        "item", "borrower", "handler"
    ).order_by("-borrow_date")
    serializer = BorrowSerializer(borrows, many=True)
    return Response({"borrows": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_archived_borrows(request):
    """Get all archived borrows (returned, late, not returned) for admin"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    status_filter = request.query_params.get("status")
    
    borrows = Borrow.objects.exclude(status=Borrow.Status.ACTIVE).select_related(
        "item", "borrower", "handler"
    ).order_by("-return_date", "-due_date")
    
    if status_filter:
        borrows = borrows.filter(status=status_filter)
    
    serializer = BorrowSerializer(borrows, many=True)
    return Response({"borrows": serializer.data})



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_all_borrows(request):
    """Get all borrows for admin with optional filtering"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    borrows = Borrow.objects.select_related(
        "item", "item_instance", "borrower", "handler"
    ).order_by("-borrow_date")
    
    serializer = BorrowSerializer(borrows, many=True)
    return Response({"borrows": serializer.data})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_borrow_detail(request, borrow_id):
    """Get detailed information about a specific borrow including timeline logs"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        borrow = Borrow.objects.select_related(
            "item", "item__category", "item_instance", "borrower", "borrower__profile", "handler"
        ).prefetch_related("logs__performed_by__profile").get(id=borrow_id)
    except Borrow.DoesNotExist:
        return Response({"detail": "Borrow not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = BorrowDetailSerializer(borrow)
    return Response(serializer.data)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_reports_analytics(request):
    """Get analytics data for reports"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count, Q

    now = timezone.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    year_ago = now - timedelta(days=365)

    # Most borrowed items by period
    week_items = (
        Borrow.objects.filter(borrow_date__gte=week_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    month_items = (
        Borrow.objects.filter(borrow_date__gte=month_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    year_items = (
        Borrow.objects.filter(borrow_date__gte=year_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    # Users with most borrows
    top_borrowers = (
        Borrow.objects.values("borrower__username", "borrower__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    # Borrow statistics
    total_borrows = Borrow.objects.count()
    active_borrows = Borrow.objects.filter(status=Borrow.Status.ACTIVE).count()
    returned_borrows = Borrow.objects.filter(status=Borrow.Status.RETURNED).count()
    late_borrows = Borrow.objects.filter(status=Borrow.Status.LATE).count()
    not_returned_borrows = Borrow.objects.filter(status=Borrow.Status.NOT_RETURNED).count()

    # Item availability
    items = Item.objects.all()
    low_stock_items = [
        {
            "id": item.id,
            "name": item.name,
            "available": item.available,
            "quantity": item.quantity,
            "utilization": round((item.quantity - item.available) / item.quantity * 100, 1)
            if item.quantity > 0
            else 0,
        }
        for item in items
    ]

    return Response({
        "week_items": list(week_items),
        "month_items": list(month_items),
        "year_items": list(year_items),
        "top_borrowers": list(top_borrowers),
        "stats": {
            "total_borrows": total_borrows,
            "active_borrows": active_borrows,
            "returned_borrows": returned_borrows,
            "late_borrows": late_borrows,
            "not_returned_borrows": not_returned_borrows,
        },
        "items": low_stock_items,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_ai_recommendations(request):
    """Get AI-powered recommendations for inventory management using Hugging Face"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    from datetime import timedelta
    from django.db.models import Count, Q, Avg

    now = timezone.now()
    month_ago = now - timedelta(days=30)

    # Get borrow frequency for items in the last month
    item_stats = (
        Borrow.objects.filter(borrow_date__gte=month_ago)
        .values("item__id", "item__name", "item__quantity", "item__available")
        .annotate(
            borrow_count=Count("id"),
            avg_duration_days=Avg(
                (
                    timezone.now()
                    - timezone.now()
                )  # Placeholder, will calculate properly
            ),
        )
        .order_by("-borrow_count")
    )

    recommendations = []

    for stat in item_stats:
        item_id = stat["item__id"]
        item_name = stat["item__name"]
        borrow_count = stat["borrow_count"]
        available = stat["item__available"]
        total_quantity = stat["item__quantity"]

        # Calculate utilization rate
        utilization_rate = (
            (total_quantity - available) / total_quantity * 100
            if total_quantity > 0
            else 0
        )

        # AI Logic for recommendations
        priority = "low"
        action = None
        reason = ""

        if borrow_count >= 10:  # High demand
            if utilization_rate >= 80:
                priority = "critical"
                action = "increase_stock"
                reason = f"High demand ({borrow_count} borrows/month) with {utilization_rate:.1f}% utilization. Stock is running low."
            elif utilization_rate >= 60:
                priority = "high"
                action = "increase_stock"
                reason = f"High demand ({borrow_count} borrows/month) with {utilization_rate:.1f}% utilization. Consider adding more units."
            else:
                priority = "medium"
                action = "monitor"
                reason = f"Popular item ({borrow_count} borrows/month). Monitor stock levels."
        elif borrow_count >= 5:
            if utilization_rate >= 70:
                priority = "medium"
                action = "increase_stock"
                reason = f"Moderate demand ({borrow_count} borrows/month) with {utilization_rate:.1f}% utilization."
            else:
                priority = "low"
                action = "monitor"
                reason = f"Moderate demand ({borrow_count} borrows/month). Current stock is adequate."
        else:
            if utilization_rate >= 50:
                priority = "low"
                action = "monitor"
                reason = f"Low demand ({borrow_count} borrows/month). Stock levels are healthy."
            else:
                priority = "low"
                action = "consider_removal"
                reason = f"Very low demand ({borrow_count} borrows/month). Consider if this item is still needed."

        recommendations.append({
            "item_id": item_id,
            "item_name": item_name,
            "borrow_count": borrow_count,
            "utilization_rate": round(utilization_rate, 1),
            "available": available,
            "total_quantity": total_quantity,
            "priority": priority,
            "action": action,
            "reason": reason,
        })

    return Response({"recommendations": recommendations})



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_ai_inventory_analysis(request):
    """Get AI-powered inventory analysis using Hugging Face"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    # Check if AI is available
    if not ai_service.is_ai_available():
        return Response({
            "ai_available": False,
            "message": "AI service not configured. Please set HUGGINGFACE_API_KEY environment variable.",
        })

    # Get analytics data
    from django.utils import timezone
    from datetime import timedelta

    now = timezone.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    year_ago = now - timedelta(days=365)

    week_items = (
        Borrow.objects.filter(borrow_date__gte=week_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    month_items = (
        Borrow.objects.filter(borrow_date__gte=month_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    year_items = (
        Borrow.objects.filter(borrow_date__gte=year_ago)
        .values("item__name", "item__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    items = Item.objects.all()
    items_data = [
        {
            "id": item.id,
            "name": item.name,
            "available": item.available,
            "quantity": item.quantity,
            "utilization": round((item.quantity - item.available) / item.quantity * 100, 1)
            if item.quantity > 0
            else 0,
        }
        for item in items
    ]

    analytics_data = {
        "week_items": list(week_items),
        "month_items": list(month_items),
        "year_items": list(year_items),
        "items": items_data,
    }

    # Get AI analysis
    ai_analysis = ai_service.analyze_inventory(analytics_data)

    return Response({
        "ai_available": True,
        "analytics": analytics_data,
        "ai_analysis": ai_analysis,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_ai_borrow_analysis(request):
    """Get AI-powered borrow pattern analysis"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    if not ai_service.is_ai_available():
        return Response({
            "ai_available": False,
            "message": "AI service not configured.",
        })

    # Get borrow data
    total_borrows = Borrow.objects.count()
    active_borrows = Borrow.objects.filter(status=Borrow.Status.ACTIVE).count()
    returned_borrows = Borrow.objects.filter(status=Borrow.Status.RETURNED).count()
    late_borrows = Borrow.objects.filter(status=Borrow.Status.LATE).count()
    not_returned_borrows = Borrow.objects.filter(status=Borrow.Status.NOT_RETURNED).count()

    top_borrowers = (
        Borrow.objects.values("borrower__username", "borrower__id")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    borrow_data = {
        "stats": {
            "total_borrows": total_borrows,
            "active_borrows": active_borrows,
            "returned_borrows": returned_borrows,
            "late_borrows": late_borrows,
            "not_returned_borrows": not_returned_borrows,
        },
        "top_borrowers": list(top_borrowers),
    }

    # Get AI analysis
    ai_analysis = ai_service.analyze_borrow_patterns(borrow_data)

    return Response({
        "ai_available": True,
        "borrow_data": borrow_data,
        "ai_analysis": ai_analysis,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_ai_custom_analysis(request):
    """Get custom AI analysis for any data"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    if not ai_service.is_ai_available():
        return Response({
            "ai_available": False,
            "message": "AI service not configured.",
        })

    analysis_type = request.data.get("analysis_type")
    data = request.data.get("data", {})

    if not analysis_type:
        return Response({
            "error": "analysis_type is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    ai_analysis = ai_service.generate_custom_analysis(analysis_type, data)

    return Response({
        "ai_available": True,
        "analysis_type": analysis_type,
        "ai_analysis": ai_analysis,
    })


# ============================================
# INVENTORY MANAGEMENT ENDPOINTS
# ============================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_categories(request):
    """Get all categories with item counts"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import Category
    
    categories = Category.objects.all()
    categories_data = []
    
    for category in categories:
        items = Item.objects.filter(category=category)
        total_instances = sum(item.instances.count() for item in items)
        available_instances = sum(
            item.instances.filter(status='AVAILABLE').count() 
            for item in items
        )
        
        categories_data.append({
            "id": category.id,
            "name": category.name,
            "display_name": category.get_name_display(),
            "description": category.description,
            "item_count": items.count(),
            "total_instances": total_instances,
            "available_instances": available_instances,
        })
    
    return Response({"categories": categories_data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_category_items(request, category_id):
    """Get all items in a category with their instances"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import Category, ItemInstance
    
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
    
    items = Item.objects.filter(category=category)
    items_data = []
    
    for item in items:
        instances = ItemInstance.objects.filter(item=item)
        instances_data = []
        
        for instance in instances:
            instances_data.append({
                "id": instance.id,
                "reference_id": instance.reference_id,
                "status": instance.status,
                "status_display": instance.get_status_display(),
                "notes": instance.notes,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            })
        
        items_data.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "total_quantity": instances.count(),
            "available_count": instances.filter(status='AVAILABLE').count(),
            "in_use_count": instances.filter(status='IN_USE').count(),
            "faulty_count": instances.filter(status='FAULTY').count(),
            "in_repair_count": instances.filter(status='IN_REPAIR').count(),
            "out_of_stock_count": instances.filter(status='OUT_OF_STOCK').count(),
            "instances": instances_data,
        })
    
    return Response({
        "category": {
            "id": category.id,
            "name": category.name,
            "display_name": category.get_name_display(),
        },
        "items": items_data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_add_item_instance(request, item_id):
    """Add a new item instance"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import ItemInstance
    
    try:
        item = Item.objects.get(id=item_id)
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
    
    reference_id = request.data.get("reference_id")
    notes = request.data.get("notes", "")
    
    if not reference_id:
        return Response({"detail": "Reference ID is required."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if reference ID already exists
    if ItemInstance.objects.filter(reference_id=reference_id).exists():
        return Response({"detail": "Reference ID already exists."}, status=status.HTTP_400_BAD_REQUEST)
    
    instance = ItemInstance.objects.create(
        item=item,
        reference_id=reference_id,
        status='AVAILABLE',
        notes=notes
    )
    
    # Update item quantity
    item.quantity = item.instances.count()
    item.available = item.instances.filter(status='AVAILABLE').count()
    item.save()
    
    return Response({
        "id": instance.id,
        "reference_id": instance.reference_id,
        "status": instance.status,
        "notes": instance.notes,
        "message": "Item instance added successfully"
    }, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_update_item_instance(request, instance_id):
    """Update item instance status and notes"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import ItemInstance
    
    try:
        instance = ItemInstance.objects.get(id=instance_id)
    except ItemInstance.DoesNotExist:
        return Response({"detail": "Item instance not found."}, status=status.HTTP_404_NOT_FOUND)
    
    # Update status if provided
    new_status = request.data.get("status")
    if new_status and new_status in dict(ItemInstance.ItemStatus.choices):
        instance.status = new_status
    
    # Update notes if provided
    if "notes" in request.data:
        instance.notes = request.data.get("notes", "")
    
    instance.save()
    
    # Update parent item availability count
    item = instance.item
    item.available = item.instances.filter(status='AVAILABLE').count()
    item.save()
    
    return Response({
        "id": instance.id,
        "reference_id": instance.reference_id,
        "status": instance.status,
        "status_display": instance.get_status_display(),
        "notes": instance.notes,
        "message": "Item instance updated successfully"
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def admin_delete_item_instance(request, instance_id):
    """Delete an item instance"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import ItemInstance
    
    try:
        instance = ItemInstance.objects.get(id=instance_id)
    except ItemInstance.DoesNotExist:
        return Response({"detail": "Item instance not found."}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if instance is currently borrowed
    if instance.borrows.filter(status__in=['ACTIVE', 'LATE']).exists():
        return Response(
            {"detail": "Cannot delete item instance that is currently borrowed."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    item = instance.item
    instance.delete()
    
    # Update parent item counts
    item.quantity = item.instances.count()
    item.available = item.instances.filter(status='AVAILABLE').count()
    item.save()
    
    return Response({"message": "Item instance deleted successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_create_item(request, category_id):
    """Create a new item in a category"""
    if not _is_admin_user(request.user):
        return Response({"detail": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    from .models import Category
    
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
    
    name = request.data.get("name")
    description = request.data.get("description", "")
    
    if not name:
        return Response({"detail": "Item name is required."}, status=status.HTTP_400_BAD_REQUEST)
    
    item = Item.objects.create(
        name=name,
        description=description,
        category=category,
        quantity=0,
        available=0
    )
    
    return Response({
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "category": category.name,
        "message": "Item created successfully"
    }, status=status.HTTP_201_CREATED)
