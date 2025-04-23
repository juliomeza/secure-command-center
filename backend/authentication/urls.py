# backend/authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Endpoints refactorizados desde core
    path('profile/', views.UserProfileAPIView.as_view(), name='auth-user-profile'),
    path('token/', views.TokenObtainAPIView.as_view(), name='auth-token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('csrf/', views.get_csrf_token, name='auth-csrf-token'),
    path('oauth-success/', views.oauth_success_redirect, name='auth-oauth-success'),
    path('logout/', views.LogoutAPIView.as_view(), name='auth-logout'),
]