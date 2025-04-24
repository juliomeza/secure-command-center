import time
from django.db import transaction
from django.utils import timezone
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
    Mejorado para trabajar de manera óptima en un sistema híbrido JWT + sesiones.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Verificamos la autenticación y el método utilizado (para mejor logging)
        auth_method = "JWT" if 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer ') else "Session"
        print(f"User {request.user.username} accessing profile via {auth_method} authentication")

        # Serializamos el usuario con más información de autenticación
        serializer = AuthUserSerializer(request.user)
        response_data = serializer.data
        
        # Para debugging, añadimos información sobre el método de autenticación usado
        if settings.DEBUG:
            response_data['_auth_method'] = auth_method

        return Response(response_data)


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
    Versión mejorada para operar en un sistema híbrido JWT + sesiones Django.
    """
    try:
        # Verificar autenticación - primero chequear usuario en sesión (sistema híbrido)
        if not request.user.is_authenticated:
            print("User not authenticated after OAuth, redirecting to login")
            return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login?error=auth_failed")

        # El usuario está autenticado, procedemos a generar tokens JWT
        print(f"OAuth success for user {request.user.username}")
        
        # Generar CSRF token y tokens JWT
        csrf_token = get_token(request)
        refresh = RefreshToken.for_user(request.user)

        # Obtener información del proveedor OAuth si está disponible
        provider = None
        if hasattr(request.user, 'social_auth') and request.user.social_auth.exists():
            provider = request.user.social_auth.first().provider
            print(f"User authenticated via OAuth provider: {provider}")

        # Preparar URL de redirección con tokens
        redirect_url = f"{settings.FRONTEND_BASE_URL}/dashboard"
        redirect_url_with_params = f"{redirect_url}?jwt_access={str(refresh.access_token)}&jwt_refresh={str(refresh)}"
        
        # Añadir información del proveedor si está disponible
        if provider:
            redirect_url_with_params += f"&provider={provider}"

        # Preparar respuesta
        response = HttpResponseRedirect(redirect_url_with_params)
        response['X-CSRFToken'] = csrf_token

        # Configurar la cookie del refresh token
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
        return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login?error=server_error")


class LogoutAPIView(APIView):
    """
    Endpoint para cerrar sesión y revocar tokens JWT.
    Versión mejorada y robusta para resolver problemas de blacklisting y cookies persistentes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_id = None
            if request.user.is_authenticated:
                user_id = request.user.id
                print(f"Iniciando logout para usuario {request.user.username} (ID: {user_id})")
            else:
                print("Iniciando logout para usuario no autenticado")

            # Imprimir todas las cookies para diagnosticar
            print(f"Cookies disponibles en la solicitud: {request.COOKIES.keys()}")
            print(f"Headers disponibles: {request.headers.keys()}")

            # 1. Intentar obtener el refresh token de múltiples fuentes
            refresh_token = None
            
            # Buscar en cookies específicas (usando nombre exacto y también posibles variaciones)
            cookie_options = ['refresh_token', 'refreshToken', 'jwt_refresh']
            for cookie_name in cookie_options:
                if cookie_name in request.COOKIES:
                    refresh_token = request.COOKIES.get(cookie_name)
                    print(f"Refresh token encontrado en cookie '{cookie_name}'")
                    break
            
            # Si no está en cookies, buscar en el query param (usado en algunas implementaciones)
            if not refresh_token and 'refresh_token' in request.GET:
                refresh_token = request.GET.get('refresh_token')
                print("Refresh token encontrado en query parameter")

            # Intentar obtener el refresh token del usuario basado en su ID
            if not refresh_token and request.user.is_authenticated:
                try:
                    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
                    # Buscar tokens activos para este usuario
                    outstanding_tokens = OutstandingToken.objects.filter(
                        user=request.user,
                        expires_at__gt=timezone.now()
                    ).order_by('-created_at')
                    
                    if outstanding_tokens.exists():
                        # Obtener el token más reciente
                        latest_token = outstanding_tokens.first()
                        print(f"Usando token activo más reciente para usuario: JTI={latest_token.jti}")
                        
                        # Blacklistear este token
                        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
                        try:
                            BlacklistedToken.objects.create(token=latest_token)
                            print(f"✅ Token JTI {latest_token.jti} blacklisteado exitosamente")
                            return self._finish_logout(request, True)
                        except Exception as e:
                            print(f"Error al blacklistear token manualmente: {str(e)}")
                    else:
                        print("No se encontraron tokens activos para el usuario")
                except Exception as e:
                    print(f"Error al buscar tokens por usuario: {str(e)}")
            
            # 2. Manejar el blacklisting con más detalle
            blacklisted = False
            if refresh_token:
                try:
                    # Imprimir información parcial del token para diagnóstico (evitar exponer todo el token)
                    token_prefix = refresh_token[:10] if len(refresh_token) > 10 else "token_corto"
                    print(f"Intentando blacklist para token: {token_prefix}...")
                    
                    # Verificar que sea un refresh token antes de intentar parsearlo
                    import jwt
                    try:
                        # Decode sin verificar para obtener el tipo
                        decoded = jwt.decode(refresh_token, options={"verify_signature": False})
                        token_type = decoded.get('token_type', '')
                        if token_type != 'refresh':
                            print(f"⚠️ El token no es un refresh token (tipo: {token_type}). No se intentará blacklistear.")
                            refresh_token = None
                    except Exception as je:
                        print(f"Error al decodificar token: {str(je)}")
                    
                    if refresh_token:  # Solo continuar si aún tenemos un token válido
                        token = RefreshToken(refresh_token)
                        print(f"Token parseado correctamente, JTI: {token['jti']}")
                        
                        # Forzar que la operación sea explícita y completa
                        token.blacklist()
                        print(f"Blacklist realizado para token con JTI: {token['jti']}")
                        blacklisted = True
                except TokenError as te:
                    print(f"Error TokenError al procesar el refresh token: {str(te)}")
                except Exception as e:
                    print(f"Error inesperado al blacklistear token: {str(e)}")
            else:
                print("No se encontró refresh token para blacklistear")
            
            return self._finish_logout(request, blacklisted)
            
        except Exception as e:
            print(f"Error crítico durante logout: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": "Error during logout process.", "error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def _finish_logout(self, request, blacklisted=False):
        """
        Método auxiliar que completa el proceso de logout después del blacklisting
        """
        # 1. Realizar logout de Django (limpia la sesión)
        if request.user.is_authenticated:
            print(f"Ejecutando Django logout para usuario {request.user.username}")
            auth_logout(request)
        
        # 2. Preparar respuesta y eliminar cookies
        response = Response({
            "detail": "Successfully logged out.",
            "blacklisted": blacklisted
        })
        
        # Lista completa de todas las posibles cookies
        cookies_to_delete = [
            'csrftoken',
            'refresh_token',
            'refreshToken',
            'access_token',
            'accessToken',
            'jwt_refresh',
            'jwt_access',
            'sessionid',
            'social_auth_last_login_backend',
            'oauth_state',
            'g_state',
            'social_auth_google-oauth2_state',
            'social_auth_azuread-oauth2_state',
        ]
        
        # Determinar posibles dominios para cookies - evitar duplicados
        domains = []
        
        # Obtener dominios de configuración
        base_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
        if base_domain and base_domain not in domains:
            domains.append(base_domain)
        
        # Añadir el dominio actual y posibles variantes
        current_domain = request.get_host().split(':')[0]  # Quitar el puerto si existe
        if current_domain not in domains:
            domains.append(current_domain)
        
        # Añadir variante con punto al inicio si no existe ya
        dot_domain = f".{current_domain}" if not current_domain.startswith('.') else current_domain
        if dot_domain not in domains:
            domains.append(dot_domain)
            
        # Añadir también el dominio del frontend si está configurado
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', None)
        if frontend_url:
            try:
                from urllib.parse import urlparse
                frontend_domain = urlparse(frontend_url).netloc.split(':')[0]
                if frontend_domain and frontend_domain not in domains:
                    domains.append(frontend_domain)
                    # También la variante con punto
                    dot_frontend = f".{frontend_domain}" if not frontend_domain.startswith('.') else frontend_domain
                    if dot_frontend not in domains:
                        domains.append(dot_frontend)
            except Exception as e:
                print(f"Error al parsear FRONTEND_BASE_URL: {str(e)}")
        
        print(f"Eliminando cookies en dominios: {domains}")
        
        # Obtener configuración de samesite
        samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
        
        # Eliminar para todos los dominios posibles
        for domain in domains:
            for cookie in cookies_to_delete:
                # Eliminar en path / y /api para cubrir todas las bases
                for path in ['/', '/api']:
                    response.delete_cookie(
                        cookie,
                        domain=domain,
                        path=path,
                        samesite=samesite
                    )
                    print(f"Eliminando cookie {cookie} para dominio={domain}, path={path}")
        
        # Headers de seguridad
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        print(f"Logout completado {'con' if blacklisted else 'sin'} blacklisting de token")
        return response
