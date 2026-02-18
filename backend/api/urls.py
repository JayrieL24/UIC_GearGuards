from django.urls import path

from .views import (
    approve_registration,
    health_check,
    login,
    me,
    pending_registrations,
    register,
    reject_registration,
)

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/register/", register, name="register"),
    path("auth/login/", login, name="login"),
    path("auth/me/", me, name="me"),
    path("admin/pending/", pending_registrations, name="pending-registrations"),
    path("admin/approve/<int:user_id>/", approve_registration, name="approve-registration"),
    path("admin/reject/<int:user_id>/", reject_registration, name="reject-registration"),
]
