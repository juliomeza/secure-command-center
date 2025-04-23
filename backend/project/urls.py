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
        try:
            # Realizar el logout de manera segura
            if request.user.is_authenticated:
                auth_logout(request)

            # Limpiar la sesión de manera segura
            try:
                if hasattr(request, 'session'):
                    request.session.flush()
                    request.session.cycle_key()
            except Exception as session_error:
                print(f"Session cleanup error: {str(session_error)}")
                # Continuar con el proceso incluso si hay error en la sesión

            # Preparar la respuesta
            response = HttpResponse(status=200)
            
            # Obtener configuraciones
            domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
            secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
            samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')

            # Lista de cookies a eliminar
            cookies_to_delete = [
                'sessionid',
                'csrftoken',
                'social_auth_last_login_backend',
                'oauth_state',
                'g_state',
                'social_auth_google-oauth2_state',
            ]

            # Eliminar cookies de manera segura
            for cookie in cookies_to_delete:
                try:
                    response.delete_cookie(
                        cookie,
                        domain=domain,
                        path='/',
                        samesite=samesite,
                        secure=secure
                    )
                except Exception as cookie_error:
                    print(f"Error deleting cookie {cookie}: {str(cookie_error)}")
                    continue

            # Headers de seguridad
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'

            return response

        except Exception as e:
            print(f"Logout error: {str(e)}")
            # Devolver una respuesta exitosa incluso si hay errores
            # para evitar que el frontend se quede en un estado inconsistente
            return HttpResponse(status=200)

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
    
    # Mantener rutas originales para compatibilidad
    path('api/', include('core.urls')), # Rutas originales de core
    
    # Nueva ruta para la app de autenticación refactorizada
    path('api/auth/', include('authentication.urls')), # Nueva app de autenticación
    
    # API logout endpoint using SecureLogoutView
    path('api/logout/', csrf_exempt(SecureLogoutView.as_view()), name='api_logout'),

    # Web logout using the same SecureLogoutView
    path('logout/', SecureLogoutView.as_view(next_page=f'{settings.FRONTEND_BASE_URL}/login'), name='logout'),
]