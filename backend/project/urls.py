# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView as DjangoLogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import TokenObtainView, LogoutView, UserProfileView
import logging

logger = logging.getLogger('django.request')

@csrf_exempt
@require_http_methods(["GET", "POST"])
def complete_auth_redirect(request):
    """Custom completion handler for OAuth that supports both GET and POST"""
    logger.info("=== OAuth Completion Handler ===")
    logger.info(f"Request Method: {request.method}")
    logger.info(f"Session ID: {request.session.session_key}")
    logger.info(f"Session Keys: {list(request.session.keys())}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"GET Params: {dict(request.GET)}")
    logger.info(f"POST Params: {dict(request.POST)}")
    logger.info(f"Cookies: {request.COOKIES}")

    # Get state from either POST or GET
    state = request.POST.get('state') or request.GET.get('state')
    code = request.POST.get('code') or request.GET.get('code')

    logger.info(f"State received: {state}")
    logger.info(f"Code received: {code}")

    if state:
        request.session['state'] = state
        request.session.modified = True
        logger.info(f"Stored state in session: {state}")

    # Save session before redirect
    request.session.save()

    # Handle the OAuth completion
    from social_django.utils import load_strategy, load_backend
    from social_core.actions import do_complete

    strategy = load_strategy(request)
    backend = load_backend(strategy, 'azuread-oauth2', None)

    try:
        return do_complete(
            backend,
            login=lambda backend, user, social_user: user,
            user=None,
            redirect_name='next',
            request=request
        )
    except Exception as e:
        logger.error(f"Error in OAuth completion: {str(e)}", exc_info=True)
        return redirect(f"{settings.FRONTEND_BASE_URL}/login?error=auth_failed")

def api_logout(request):
    """Simple API logout handler"""
    auth_logout(request)
    return HttpResponse('Logged out', status=200)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')),
    path('auth/complete/azuread-oauth2/', complete_auth_redirect, name='azure_complete'),
    path('api/token/', TokenObtainView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', csrf_exempt(LogoutView.as_view()), name='auth_logout'),
    path('api/profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/', UserProfileView.as_view(), name='user-profile-root'),
    path('logout/', DjangoLogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),
]