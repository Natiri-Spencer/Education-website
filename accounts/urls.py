"""define URLs for accounts app"""
from django.urls import path, include
from . import views
from learning.account_views import SafeLoginView, SafePasswordChangeView, recovery
from django.contrib.auth.views import PasswordResetConfirmView
from django.urls import reverse_lazy

app_name = "accounts"

urlpatterns = [
    path('login/', SafeLoginView.as_view(), name='login'),
    path('password_reset/', recovery, name='password_reset'),
    path('password_change/', SafePasswordChangeView.as_view(), name='password_change'),
    path('reset/<uidb64>/<token>/', PasswordResetConfirmView.as_view(success_url=reverse_lazy('accounts:password_reset_complete')), name='password_reset_confirm'),
    # include the default auth URLs (login, logout, password reset, etc.)
    path("", include("django.contrib.auth.urls")),  # accounts/ → same homepage + other routes
    path("register/", views.register, name="register"), #registration page
]
