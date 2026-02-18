from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "requested_role", "is_approved", "approved_by", "created_at")
    list_filter = ("role", "requested_role", "is_approved")
    search_fields = ("user__username", "user__email")
