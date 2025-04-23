import time
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from .serializers import AuthUserSerializer, TokenResponseSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from .throttling import LoginRateThrottle
from django.contrib.auth import login, logout as auth_logout
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthAlreadyAssociated

# --- Views ---
class UserProfileAPIView(APIView):
    """
    API endpoint para obtener información del perfil del usuario autenticado.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = AuthUserSerializer(request.user)
        return Response(serializer.data)


class TokenObtainAPIView(APIView):
    """
    Endpoint para obtener tokens JWT después de autenticación OAuth2.
    """
    throttle_classes = [LoginRateThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh = RefreshToken.for_user(request.user)
        serializer = TokenResponseSerializer({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': request.user
        })
        return Response(serializer.data)


@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Endpoint para obtener un nuevo token CSRF y asegurar que la cookie está establecida.
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})


def oauth_success_redirect(request):
    """
    Vista que genera tokens JWT después de un login OAuth2 exitoso y redirige al frontend.
    Versión simplificada que elimina la dependencia de sesiones Django.
    """
    try:
        # Si el usuario no está autenticado, redirigir al login
        if not request.user.is_authenticated:
            print("User not authenticated after OAuth, redirecting to login")
            return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

        # El usuario está autenticado, procedemos a generar tokens JWT
        print(f"OAuth success for user {request.user.username}")
        
        # Generar CSRF token y tokens JWT
        csrf_token = get_token(request)
        refresh = RefreshToken.for_user(request.user)

        # Preparar URL de redirección con tokens
        redirect_url = f"{settings.FRONTEND_BASE_URL}/dashboard"
        redirect_url_with_params = f"{redirect_url}?jwt_access={str(refresh.access_token)}&jwt_refresh={str(refresh)}"

        # Preparar respuesta
        response = HttpResponseRedirect(redirect_url_with_params)
        response['X-CSRFToken'] = csrf_token

        # Configurar la cookie del refresh token (único token esencial)
        cookie_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
        cookie_secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
        cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
        cookie_path = getattr(settings, 'SESSION_COOKIE_PATH', '/')
        max_age = getattr(settings, 'SESSION_COOKIE_AGE', 1209600)

        # Configurar la cookie del refresh token
        response.set_cookie(
            'refresh_token',
            str(refresh),
            max_age=max_age,
            domain=cookie_domain,
            path=cookie_path,
            secure=cookie_secure,
            httponly=True,
            samesite=cookie_samesite
        )

        print(f"Redirecting authenticated user {request.user.username} to dashboard")
        return response

    except Exception as e:
        print(f"Error en oauth_success_redirect: {str(e)}")
        return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")


class LogoutAPIView(APIView):
    """
    Endpoint para cerrar sesión y revocar tokens JWT.
    Versión simplificada que se centra en la revocación de tokens.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Obtener el token de refresco del usuario
            refresh_token = request.COOKIES.get('refresh_token')
            
            if refresh_token:
                try:
                    # Blacklist the refresh token
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    pass  # Token ya expirado o inválido
            
            # Realizar logout (solo para compatibilidad con OAuth)
            auth_logout(request)
            
            response = Response({"detail": "Successfully logged out."})
            
            # Eliminar solo las cookies esenciales
            cookies_to_delete = [
                'csrftoken',
                'refresh_token',
                'access_token'
            ]
            
            # Obtener el dominio de las settings
            domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
            samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
            
            for cookie in cookies_to_delete:
                response.delete_cookie(
                    cookie,
                    domain=domain,
                    path='/',
                    samesite=samesite
                )
            
            # Headers de seguridad
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
            
        except Exception as e:
            print(f"Error during logout: {str(e)}")
            return Response(
                {"detail": "Error during logout process."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
