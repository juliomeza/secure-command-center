# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect

# Define SecureLogoutView
class SecureLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        # Perform logout with parent method
        response = super().dispatch(request, *args, **kwargs)
        
        # Clear session completely
        request.session.flush()
        
        # Check if this is an API request or browser request
        if request.path.startswith('/api/'):
            # For API requests, return a simple 200 response instead of redirect
            response = HttpResponse(status=200)
        
        # Delete the session cookie for both response types
        response.delete_cookie('sessionid')
        return response

# Custom completion handler for OAuth login
def complete_auth_redirect(request):
    # Si ya estás autenticado, redirigir al dashboard
    if request.user.is_authenticated:
        return redirect(f'{settings.FRONTEND_BASE_URL}/dashboard')
    # Si no estás autenticado, redirigir al login
    return redirect(f'{settings.FRONTEND_BASE_URL}/login')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs
    path('auth/complete/', complete_auth_redirect, name='auth_complete'), # Override default completion
    path('api/', include('core.urls')), # Your app's API endpoints
    
    # API logout endpoint using SecureLogoutView
    path('api/logout/', csrf_exempt(SecureLogoutView.as_view()), name='api_logout'),

    # Web logout using the same SecureLogoutView
    path('logout/', SecureLogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),
]