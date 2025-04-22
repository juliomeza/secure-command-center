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
        if request.user.is_authenticated:
            # Primero hacer logout del usuario
            auth_logout(request)
            
        # Asegurarnos de limpiar completamente la sesión
        if hasattr(request, 'session'):
            # Flush elimina toda la data de la sesión
            request.session.flush()
            # Ciclar la clave de sesión por seguridad
            request.session.cycle_key()
        
        # Prepare response
        if request.path.startswith('/api/'):
            response = HttpResponse(status=200)
        else:
            response = super().dispatch(request, *args, **kwargs)
            
        # Get domain settings
        domain = settings.SESSION_COOKIE_DOMAIN or None
        secure = settings.SESSION_COOKIE_SECURE
        samesite = settings.SESSION_COOKIE_SAMESITE
        
        # Lista de todas las cookies que necesitamos eliminar
        cookies_to_delete = [
            'sessionid',
            'csrftoken',
            'social_auth_last_login_backend',
            'oauth_state',
            'g_state',
            'social_auth_google-oauth2_state',
        ]

        # Eliminar todas las cookies relacionadas con la autenticación
        for cookie in cookies_to_delete:
            response.delete_cookie(
                cookie,
                domain=domain,
                path='/',
                samesite=samesite,
                secure=secure
            )

        # Añadir headers de seguridad
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        response['SameSite'] = samesite
        
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