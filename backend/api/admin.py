from django.contrib import admin

from .models import UserProfile, Item, Borrow, Category, ItemInstance, BorrowLog


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "requested_role", "is_approved", "approved_by", "created_at")
    list_filter = ("role", "requested_role", "is_approved")
    search_fields = ("user__username", "user__email")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    list_filter = ("name",)
    search_fields = ("name", "description")


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "quantity", "available", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("name", "description")


@admin.register(ItemInstance)
class ItemInstanceAdmin(admin.ModelAdmin):
    list_display = ("reference_id", "item", "status", "created_at")
    list_filter = ("status", "item__category", "created_at")
    search_fields = ("reference_id", "item__name", "notes")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Borrow)
class BorrowAdmin(admin.ModelAdmin):
    list_display = ("item", "item_instance", "borrower", "status", "borrow_date", "due_date", "return_date")
    list_filter = ("status", "borrow_date", "due_date")
    search_fields = ("item__name", "item_instance__reference_id", "borrower__username")
    readonly_fields = ("borrow_date", "created_at", "updated_at")


@admin.register(BorrowLog)
class BorrowLogAdmin(admin.ModelAdmin):
    list_display = ("borrow", "action", "performed_by", "created_at")
    list_filter = ("action", "created_at")
    search_fields = ("borrow__item__name", "performed_by__username", "description")
    readonly_fields = ("created_at",)

