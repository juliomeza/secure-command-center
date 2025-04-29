from django.http import JsonResponse
from django.urls import reverse
from django.shortcuts import redirect
from django.conf import settings
from .models import UserProfile

# Define paths that do NOT require the user to be authorized
# (e.g., login, logout, admin, the permissions endpoint itself)
AUTHORIZATION_EXEMPT_URLS = [
    reverse('admin:index'),
    # Add specific URLs from authentication app if needed (e.g., logout)
    # Example: reverse('authentication:logout'),
    # Add specific URLs from social_django if used for login
    # Example: '/api/social/disconnect/',
    '/api/access/permissions/', # The endpoint we will create
]

# Add patterns if needed (like admin sub-pages)
AUTHORIZATION_EXEMPT_URL_PATTERNS = [
    settings.STATIC_URL, # Allow static files
    '/admin/', # Allow all admin paths
    '/auth/', # Exempt social auth URLs (login/complete) provided by social-app-django
    '/api/auth/', # Exempt all API authentication endpoints (DRF, dj-rest-auth, etc.)
    '/api/schema/', # Allow API schema if you have one
    '/api/docs/', # Allow API docs if you have one
]


class AuthorizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Allow unauthenticated users to pass through (authentication handles them)
        if not request.user or not request.user.is_authenticated:
            return self.get_response(request)

        # Check if the path is exempt from authorization check
        path = request.path_info
        if any(path == url for url in AUTHORIZATION_EXEMPT_URLS) or \
           any(path.startswith(pattern) for pattern in AUTHORIZATION_EXEMPT_URL_PATTERNS):
            return self.get_response(request)

        # Check authorization status for non-exempt paths
        try:
            profile = request.user.access_profile
            if profile.is_authorized:
                # User is authorized, proceed with the request
                return self.get_response(request)
            else:
                # User is authenticated but not authorized
                # Return a specific response for the frontend to handle
                return JsonResponse(
                    {'detail': 'User is authenticated but not authorized to access this application.'},
                    status=403 # Forbidden
                )
        except UserProfile.DoesNotExist:
            # Profile doesn't exist for this user (should ideally be created on user creation)            # Treat as unauthorized for now
             return JsonResponse(
                {'detail': 'User profile not found. Authorization pending.'},
                status=403 # Forbidden
            )

        # Fallback removed: The try/except block should handle all cases
        # for authenticated users on non-exempt paths. If execution reaches here,
        # it implies an unexpected state, safer to implicitly deny or raise error.
        # However, with current logic, this point should not be reachable for auth users on non-exempt paths.
