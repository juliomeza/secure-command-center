# backend/core/urls.py
from django.urls import path
from .views import UserProfileView, get_csrf_token

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('csrf/', get_csrf_token, name='get-csrf-token'), # Add CSRF endpoint
]