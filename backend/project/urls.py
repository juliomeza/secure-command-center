# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect
from core.views import UserProfileView
import logging

logger = logging.getLogger('django.request')

def api_logout(request):
    """Simple API logout handler"""
    auth_logout(request)
    return HttpResponse('Logged out', status=200)

def complete_auth_redirect(request):
    """Custom completion handler for OAuth"""
    logger.info("=== OAuth Completion Handler ===")
    logger.info(f"Session ID: {request.session.session_key}")
    logger.info(f"Session Keys: {list(request.session.keys())}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"GET Params: {dict(request.GET)}")
    logger.info(f"POST Params: {dict(request.POST)}")
    
    # Ensure the state is properly handled
    state = request.GET.get('state') or request.POST.get('state')
    if state:
        request.session['state'] = state
        request.session.modified = True
        logger.info(f"Stored state in session: {state}")
    
    # Save session before redirect
    request.session.save()
    
    return redirect(f"{settings.FRONTEND_BASE_URL}/dashboard")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/complete/', complete_auth_redirect, name='auth_complete'),
    path('api/', include('core.urls')),
    path('profile/', UserProfileView.as_view(), name='user-profile-root'),
    path('api/logout/', csrf_exempt(api_logout), name='api_logout'),
    path('logout/', LogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),
]