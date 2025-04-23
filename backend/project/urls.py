# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

# Vista simplificada que trabaja exclusivamente con JWT
class JWTLogoutView(APIView):
    def get(self, request):
        try:
            # Obtener el token de refresco del usuario
            refresh_token = request.COOKIES.get('refresh_token')
            
            if refresh_token:
                try:
                    # Revocar el token JWT
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    pass  # Token ya expirado o inválido
            
            response = Response({"detail": "Successfully logged out."})
            
            # Eliminar solo las cookies esenciales
            cookies_to_delete = [
                'csrftoken',
                'refresh_token',
                'access_token'
            ]
            
            domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
            samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
            secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
            
            for cookie in cookies_to_delete:
                response.delete_cookie(
                    cookie,
                    domain=domain,
                    path='/',
                    samesite=samesite,
                    secure=secure
                )
            
            # Headers de seguridad
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
            
        except Exception as e:
            print(f"JWT Logout error: {str(e)}")
            # Devolver una respuesta exitosa incluso si hay errores
            return HttpResponse(status=200)

# Custom completion handler for OAuth login that uses JWT
def complete_auth_redirect(request):
    # Redirigir al login en todos los casos, el frontend manejará la autenticación con JWT
    return redirect(f'{settings.FRONTEND_BASE_URL}/login')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs
    path('auth/complete/', complete_auth_redirect, name='auth_complete'), # Override default completion
    
    # Mantener rutas originales para compatibilidad
    path('api/', include('core.urls')), # Rutas originales de core
    
    # Nueva ruta para la app de autenticación refactorizada
    path('api/auth/', include('authentication.urls')), # Nueva app de autenticación
    
    # API logout endpoint usando JWTLogoutView simplificada
    path('api/logout/', csrf_exempt(JWTLogoutView.as_view()), name='api_logout'),

    # Web logout usando la misma vista simplificada
    path('logout/', JWTLogoutView.as_view(), name='logout'),
]