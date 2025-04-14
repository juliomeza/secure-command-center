# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect
from core.views import UserProfileView

# Simple API logout handler
def api_logout(request):
    auth_logout(request)
    return HttpResponse('Logged out', status=200)

# Custom completion handler for OAuth login
def complete_auth_redirect(request):
    # Add debug logging
    print("OAuth completion handler called")
    print(f"Request GET params: {request.GET}")
    print(f"Session keys: {request.session.keys()}")
    
    return redirect(f"{settings.FRONTEND_BASE_URL}/dashboard")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/complete/', complete_auth_redirect, name='auth_complete'),
    
    # API endpoints
    path('api/', include('core.urls')),
    
    # Add profile endpoint at root level also (in addition to /api/profile/)
    path('profile/', UserProfileView.as_view(), name='user-profile-root'),
    
    # API logout endpoint
    path('api/logout/', csrf_exempt(api_logout), name='api_logout'),
    
    # Regular logout
    path('logout/', LogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),
]