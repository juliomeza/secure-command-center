# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView # For serving React index.html if needed
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings # Import settings

# Simple API logout handler
def api_logout(request):
    auth_logout(request)
    return HttpResponse(status=200)

# Custom completion handler for OAuth login
def complete_auth_redirect(request):
    # Redirige a la URL del frontend usando la variable de entorno
    from django.shortcuts import redirect
    from django.conf import settings
    
    frontend_url = settings.FRONTEND_BASE_URL
    # Imprimir para debugging
    print(f"Redirecting to: {frontend_url}/dashboard")
    return redirect(f"{frontend_url}/dashboard")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs
    path('auth/complete/', complete_auth_redirect, name='auth_complete'), # Override default completion
    path('api/', include('core.urls')), # Your app's API endpoints
    
    # API logout endpoint that just performs logout without redirect
    path('api/logout/', csrf_exempt(api_logout), name='api_logout'),

    # Keep original logout for backward compatibility
    path('logout/', LogoutView.as_view(next_page=f"{settings.FRONTEND_BASE_URL}/login"), name='logout'),

    # Catch-all for React routing, if serving React build files from Django (less common with Vite dev server)
    # re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]