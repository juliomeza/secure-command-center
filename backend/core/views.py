# backend/core/views.py
import time
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from .throttling import LoginRateThrottle
from django.contrib.auth import login, logout as auth_logout
from django.contrib.auth.signals import user_logged_in
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthAlreadyAssociated

# --- Views ---
class UserProfileView(APIView):
    """
    API endpoint to get the authenticated user's profile information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class TokenObtainView(APIView):
    """
    Endpoint to obtain JWT tokens after OAuth2 authentication.
    """
    throttle_classes = [LoginRateThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh = RefreshToken.for_user(request.user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(request.user).data
        })

def oauth_success_redirect(request):
    """
    Vista que genera tokens JWT después de un login OAuth2 exitoso y redirige al frontend.
    """
    MAX_RETRIES = 3
    RETRY_DELAY = 0.5  # 500ms

    def check_auth():
        # Forzar refresh desde la base de datos
        if hasattr(request, 'user'):
            request.user.refresh_from_db()
        return request.user.is_authenticated

    for attempt in range(MAX_RETRIES):
        try:
            print(f"OAuth success check attempt {attempt + 1} - Session key: {request.session.session_key}")
            
            if not check_auth():
                if attempt < MAX_RETRIES - 1:
                    print(f"User not authenticated yet, waiting {RETRY_DELAY}s before retry...")
                    time.sleep(RETRY_DELAY)
                    continue
                print("User not authenticated after all retries")
                return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

            # El usuario está autenticado, procedemos con el proceso normal
            request.session.save()
            request.session.modified = True

            # Generar CSRF token y tokens JWT
            csrf_token = get_token(request)
            refresh = RefreshToken.for_user(request.user)

            print(f"OAuth success for user {request.user.username} with session {request.session.session_key}")

            # Preparar URL de redirección con tokens
            redirect_url = f"{settings.FRONTEND_BASE_URL}/dashboard"
            redirect_url_with_params = f"{redirect_url}?jwt_access={str(refresh.access_token)}&jwt_refresh={str(refresh)}"

            # Preparar respuesta
            response = HttpResponseRedirect(redirect_url_with_params)
            response['X-CSRFToken'] = csrf_token

            # Configurar las cookies con el dominio correcto y flags de seguridad
            cookie_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
            cookie_secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
            cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
            cookie_path = getattr(settings, 'SESSION_COOKIE_PATH', '/')
            cookie_httponly = getattr(settings, 'SESSION_COOKIE_HTTPONLY', True)
            max_age = getattr(settings, 'SESSION_COOKIE_AGE', 1209600)

            # Asegurar que la cookie de sesión se configura correctamente
            if request.session.session_key:
                response.set_cookie(
                    settings.SESSION_COOKIE_NAME,
                    request.session.session_key,
                    max_age=max_age,
                    domain=cookie_domain,
                    path=cookie_path,
                    secure=cookie_secure,
                    httponly=cookie_httponly,
                    samesite=cookie_samesite
                )

                # También configurar la cookie del refresh token
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

                # Asegurar que el backend se guarda en la sesión
                if hasattr(request.user, 'social_auth') and request.user.social_auth.exists():
                    request.session['social_auth_last_login_backend'] = request.user.social_auth.first().provider
                    request.session.save()

            print(f"Redirecting authenticated user {request.user.username} to dashboard with session {request.session.session_key}")
            return response

        except Exception as e:
            print(f"Error en oauth_success_redirect: {str(e)}")
            return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Endpoint to get a new CSRF token and ensure the cookie is set
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

class LogoutView(APIView):
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
            
            # Realizar logout de la sesión de Django
            if hasattr(request, 'session'):
                request.session.flush()
                request.session.cycle_key()
            
            auth_logout(request)
            
            response = Response({"detail": "Successfully logged out."})
            
            # Eliminar todas las cookies relevantes
            cookies_to_delete = [
                'sessionid',
                'csrftoken',
                'refresh_token',
                'access_token',
                'social_auth_last_login_backend',
                'oauth_state',
                'g_state',
                'social_auth_google-oauth2_state',
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