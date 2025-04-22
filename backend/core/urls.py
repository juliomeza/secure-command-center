# backend/core/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('token/', views.TokenObtainView.as_view(), name='token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('csrf/', views.get_csrf_token, name='csrf-token'),
    path('oauth-success/', views.oauth_success_redirect, name='oauth-success'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]