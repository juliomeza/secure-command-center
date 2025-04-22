# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView # For serving React index.html if needed
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect

# Define SecureLogoutView
class SecureLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        # Clear session completely
        request.session.flush()
        # Delete the session cookie
        response.delete_cookie('sessionid')
        return response

# Simple API logout handler
def api_logout(request):
    auth_logout(request)
    # Add the same session cleanup
    request.session.flush()
    response = HttpResponse(status=200)
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
    
    # API logout endpoint with secure session cleanup
    path('api/logout/', csrf_exempt(api_logout), name='api_logout'),

    # Updated secure logout view
    path('logout/', SecureLogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),

    # Catch-all for React routing, if serving React build files from Django (less common with Vite dev server)
    # re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]