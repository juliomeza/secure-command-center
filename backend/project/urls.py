# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView # For serving React index.html if needed
from django.contrib.auth.views import LogoutView
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

# Simple API logout handler
def api_logout(request):
    auth_logout(request)
    return HttpResponse(status=200)

# Custom completion handler for OAuth login
def complete_auth_redirect(request):
    # Simply redirect to the frontend dashboard
    from django.shortcuts import redirect
    return redirect('http://localhost:5173/dashboard')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs
    path('auth/complete/', complete_auth_redirect, name='auth_complete'), # Override default completion
    path('api/', include('core.urls')), # Your app's API endpoints
    
    # API logout endpoint that just performs logout without redirect
    path('api/logout/', csrf_exempt(api_logout), name='api_logout'),

    # Keep original logout for backward compatibility
    path('logout/', LogoutView.as_view(next_page='http://localhost:5173/login'), name='logout'),

    # Catch-all for React routing, if serving React build files from Django (less common with Vite dev server)
    # re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]