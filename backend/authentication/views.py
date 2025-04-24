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
    Solo acepta autenticación JWT para la API.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Verificar que se está usando JWT (no sesión)
        if not ('Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer ')):
            return Response({"detail": "Se requiere autenticación JWT para acceder a la API."}, status=status.HTTP_403_FORBIDDEN)

        # Serializamos el usuario
        serializer = AuthUserSerializer(request.user)
        response_data = serializer.data
        
        # Para debugging
        if settings.DEBUG:
            response_data['_auth_method'] = "JWT"
            
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
    Solo genera JWT y no crea sesiones para la aplicación principal.
    """
    try:
        # Verificación para autenticación después de OAuth
        user = None
        
        # 1. Verificar si el usuario está autenticado en el request
        if request.user.is_authenticated:
            user = request.user
            print(f"Usuario autenticado detectado: {request.user.username}")
        
        # 2. Verificar si hubo un cambio de usuario durante la autenticación OAuth
        elif hasattr(request, 'session') and 'auth_switched_user_id' in request.session:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                # Recuperar el usuario cambiado desde la sesión
                switched_user_id = request.session['auth_switched_user_id']
                user = User.objects.get(id=switched_user_id)
                print(f"Cambio de usuario detectado: {request.session.get('auth_switched_from_user', 'desconocido')} → {user.username}")
                
                # No hacemos login aquí para evitar crear sesiones
                
                # Limpiar las variables de sesión ya utilizadas
                for key in ['auth_switched_user_id', 'auth_switched_from_user', 'auth_switched_to_user']:
                    if key in request.session:
                        del request.session[key]
                request.session.save()
            except User.DoesNotExist:
                print(f"No se encontró usuario con ID {request.session.get('auth_switched_user_id')}")
            except Exception as e:
                print(f"Error procesando cambio de usuario: {str(e)}")
        
        # 3. Verificar user_id en la sesión (caso normal)
        elif hasattr(request, 'session') and 'user_id' in request.session:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user_id = request.session['user_id']
                user = User.objects.get(id=user_id)
                print(f"Usuario recuperado de la sesión: {user.username}")
                
                # No hacemos login aquí para evitar crear sesiones
                
            except User.DoesNotExist:
                print(f"No se encontró usuario con ID {request.session.get('user_id')}")
            except Exception as e:
                print(f"Error recuperando usuario de sesión: {str(e)}")
        
        # 4. Verificar si aún no hay usuario, intentar recuperar de social_auth
        if not user and hasattr(request, 'session') and 'partial_pipeline_token' in request.session:
            # Intentar recuperar usuario del pipeline parcial
            print("Intentando recuperar usuario del pipeline parcial")
            from social_django.utils import load_strategy, load_partial
            strategy = load_strategy(request)
            partial = load_partial(strategy, request.session['partial_pipeline_token'])
            if partial and 'kwargs' in partial and 'user' in partial['kwargs']:
                user = partial['kwargs']['user']
                print(f"Usuario recuperado del pipeline parcial: {user.username}")
        
        # Si después de todo no hay usuario autenticado, redirigir a login
        if not user:
            print("Usuario no autenticado después de todos los intentos, redirigiendo a login")
            return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login?error=auth_failed")

        # El usuario está autenticado, procedemos a generar tokens JWT
        print(f"OAuth success for user {user.username}")
        
        # Generar CSRF token y tokens JWT
        csrf_token = get_token(request)
        refresh = RefreshToken.for_user(user)

        # Obtener información del proveedor OAuth si está disponible
        provider = None
        if hasattr(user, 'social_auth') and user.social_auth.exists():
            provider = user.social_auth.first().provider
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

        # Configurar la cookie del refresh token usando la configuración centralizada
        cookie_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
        cookie_secure = getattr(settings, 'SESSION_COOKIE_SECURE', True)
        cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
        cookie_path = getattr(settings, 'API_COOKIE_PATH', '/')
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

        # También establecer el token de acceso en una cookie
        response.set_cookie(
            'access_token',
            str(refresh.access_token),
            max_age=3600,  # 1 hora (debería coincidir con ACCESS_TOKEN_LIFETIME)
            domain=cookie_domain,
            path=cookie_path,
            secure=cookie_secure,
            httponly=True,
            samesite=cookie_samesite
        )

        # Importante: NO crear una cookie sessionid para la aplicación principal
        
        if settings.DEBUG:
            print(f"Redirecting authenticated user {user.username} to dashboard with JWT only (no session)")
            print(f"JWT cookies set with domain={cookie_domain}, path={cookie_path}, samesite={cookie_samesite}")

        return response

    except Exception as e:
        print(f"Error en oauth_success_redirect: {str(e)}")
        import traceback
        traceback.print_exc()
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
                    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
                    from django.utils import timezone
                    from datetime import timedelta
                    
                    # Definir un periodo de tiempo para considerar como "tokens recientes"
                    # Tokens creados en los últimos 10 minutos se consideran parte de la misma sesión
                    recent_time_threshold = timezone.now() - timedelta(minutes=10)
                    
                    # Buscar tokens activos recientes para este usuario
                    outstanding_tokens = OutstandingToken.objects.filter(
                        user=request.user,
                        expires_at__gt=timezone.now(),  # No expirados
                        created_at__gt=recent_time_threshold  # Creados recientemente
                    ).order_by('-created_at')
                    
                    if outstanding_tokens.exists():
                        # Contador de tokens blacklisteados
                        blacklisted_count = 0
                        jti_list = []
                        
                        # Blacklistear todos los tokens activos recientes
                        for token in outstanding_tokens:
                            try:
                                # Verificar si ya está en la blacklist
                                if not BlacklistedToken.objects.filter(token=token).exists():
                                    BlacklistedToken.objects.create(token=token)
                                    jti_list.append(token.jti)
                                    blacklisted_count += 1
                                    print(f"✅ Token JTI {token.jti} blacklisteado exitosamente (creado: {token.created_at})")
                                else:
                                    print(f"⚠️ Token JTI {token.jti} ya estaba blacklisteado")
                            except Exception as e:
                                print(f"Error al blacklistear token {token.jti}: {str(e)}")
                        
                        if blacklisted_count > 0:
                            print(f"Se blacklistearon {blacklisted_count} tokens recientes (últimos 10 minutos)")
                            return self._finish_logout(request, True)
                        else:
                            print("No se blacklisteó ningún token (ya estaban todos en blacklist)")
                    else:
                        print("No se encontraron tokens activos recientes para el usuario (últimos 10 minutos)")
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
        Método auxiliar que completa el proceso de logout después del blacklisting.
        Esta versión mejorada separa correctamente las cookies para admin y API.
        """
        # Verificar si es una solicitud de la API (con header JWT) o del admin (con sesión)
        is_api_request = 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer ')
        
        if is_api_request:
            print("Procesando logout para API (JWT)")
            # Para API solo nos interesa invalidar el token JWT
            response = Response({
                "detail": "Successfully logged out.",
                "blacklisted": blacklisted
            })
        else:
            print("Procesando logout general (posiblemente desde admin)")
            # Si no es específicamente una petición con JWT, limpiar la sesión
            if request.user.is_authenticated:
                print(f"Ejecutando Django logout para usuario {request.user.username}")
                
                # Limpiar la sesión antes de hacer logout
                if hasattr(request, 'session'):
                    # Guardar el session_key actual para eliminarlo correctamente
                    session_key = request.session.session_key
                    
                    # Eliminar claves de OAuth específicas
                    oauth_keys = [
                        'auth_switched_user_id', 'auth_switched_from_user', 'auth_switched_to_user',
                        'partial_pipeline_token', 'social_auth_last_login_backend',
                        'oauth_state', 'google-oauth2_state', 'azuread-oauth2_state',
                        'next', 'backend', 'user_id'
                    ]
                    
                    for key in oauth_keys:
                        if key in request.session:
                            del request.session[key]
                    
                    # Eliminar datos asociados a pipelines parciales
                    pipeline_keys = [k for k in request.session.keys() if 'partial_pipeline' in str(k)]
                    for key in pipeline_keys:
                        del request.session[key]
                    
                    # Forzar la escritura de los cambios
                    request.session.save()
                
                # Realizar el logout de Django
                auth_logout(request)
            
            response = Response({
                "detail": "Successfully logged out.",
                "blacklisted": blacklisted
            })
        
        # Lista de cookies para eliminar
        cookies_to_delete = [
            'csrftoken',
            'refresh_token',
            'refreshToken',
            'access_token',
            'accessToken',
            'jwt_refresh',
            'jwt_access'
        ]
        
        # Si es una solicitud de API, añadir sessionid a las cookies a eliminar
        # para asegurar que no se mezclan los métodos de autenticación
        if is_api_request:
            cookies_to_delete.append('sessionid')
            cookies_to_delete.extend([
                'social_auth_last_login_backend',
                'oauth_state',
                'g_state',
                'social_auth_google-oauth2_state',
                'social_auth_azuread-oauth2_state',
                'next', 
                'partial_pipeline_token'
            ])
        
        # Obtener configuraciones
        backend_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None)
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', None)
        admin_path = getattr(settings, 'ADMIN_COOKIE_PATH', '/admin')
        api_path = getattr(settings, 'API_COOKIE_PATH', '/')
        samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
        
        # Determinar dominios para eliminar cookies
        domains = []
        
        # 1. Dominio del backend configurado en settings
        if backend_domain and backend_domain not in domains:
            domains.append(backend_domain)
            
        # 2. Dominio actual del request
        current_domain = request.get_host().split(':')[0]  # Quitar el puerto si existe
        if current_domain and current_domain not in domains:
            domains.append(current_domain)
        
        # 3. Variante con punto al inicio para subdominios
        dot_domain = f".{current_domain}" if not current_domain.startswith('.') else current_domain
        if dot_domain and dot_domain not in domains:
            domains.append(dot_domain)
        
        # 4. Dominio del frontend si está configurado
        if frontend_url:
            try:
                from urllib.parse import urlparse
                frontend_domain = urlparse(frontend_url).netloc.split(':')[0]
                if frontend_domain and frontend_domain not in domains:
                    domains.append(frontend_domain)
                    # También la variante con punto para subdominios
                    dot_frontend = f".{frontend_domain}" if not frontend_domain.startswith('.') else frontend_domain
                    if dot_frontend not in domains:
                        domains.append(dot_frontend)
            except Exception as e:
                print(f"Error al parsear FRONTEND_BASE_URL: {str(e)}")
        
        # También añadir dominio nulo y vacío
        domains.extend(['', None])
        domains = [d for d in domains if d is not None]
        domains = list(dict.fromkeys(domains))  # Eliminar duplicados
        
        print(f"Eliminando cookies en dominios: {domains}")
        
        # Paths a limpiar
        paths = [api_path]
        if not is_api_request:
            # Si es logout general, incluir también los paths de admin
            paths.extend([admin_path, '/', '/api', '/admin', '/auth'])
        paths = list(set(paths))  # Eliminar duplicados
        
        # Eliminar cookies
        for domain in domains:
            for cookie in cookies_to_delete:
                for path in paths:
                    response.delete_cookie(
                        cookie,
                        domain=domain,
                        path=path,
                        samesite=samesite
                    )
        
        # Headers de seguridad
        if is_api_request:
            # Solo para API, ayuda a limpiar storage
            response['Clear-Site-Data'] = '"cookies", "storage"'
            
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        if settings.DEBUG:
            print(f"Logout completado para usuario ID: {request.user.id if hasattr(request, 'user') and request.user.is_authenticated else 'anónimo'}")
            print(f"Token blacklisted: {blacklisted}")
            print(f"Tipo de solicitud: {'API (JWT)' if is_api_request else 'Admin/Genérico'}")
            print(f"Cookies eliminadas en dominios: {', '.join(str(d) for d in domains if d)}")
            print(f"Paths limpiados: {', '.join(paths)}")
        
        return response
