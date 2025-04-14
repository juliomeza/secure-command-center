# backend/core/urls.py
from django.urls import path
from .views import UserProfileView, get_csrf_token, TokenObtainView, oauth_success_redirect
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('csrf/', get_csrf_token, name='get-csrf-token'), # Add CSRF endpoint
    path('token/', TokenObtainView.as_view(), name='token-obtain'), # JWT token endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'), # JWT token refresh endpoint
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'), # JWT token verify endpoint
    path('oauth-success/', oauth_success_redirect, name='oauth-success-redirect'), # New OAuth success redirect with JWT tokens
]