"""define URLs for accounts app"""
from django.urls import path, include
from . import views

app_name = "accounts"

urlpatterns = [
    # include the default auth URLs (login, logout, password reset, etc.)
    path("", include("django.contrib.auth.urls")),  # accounts/ → same homepage + other routes
    path("register/", views.register, name="register"), #registration page
]