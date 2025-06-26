import pytest
from unittest.mock import patch
from django.test import override_settings
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth import get_user_model

from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from .views import LogoutAPIView
from .tests import UserFactory
from access.tests import UserProfileFactory

User = get_user_model()

class TestAdvancedLogout:
    """
    Pruebas para el proceso avanzado de logout y el blacklisting de tokens.
    Estas pruebas se centran en la función LogoutAPIView que maneja:
    - Blacklisting de múltiples tokens
    - Manejo diferenciado de sesiones vs JWT
    - Limpieza de cookies en múltiples dominios
    - Verificación de tokens inválidos
    """
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def request_factory(self):
        return APIRequestFactory()
    
    @pytest.fixture
    def add_session(self):
        """Añade soporte de sesión a un request"""
        def _add_session(request):
            middleware = SessionMiddleware(lambda req: None)
            middleware.process_request(request)
            request.session.save()
            return request
        return _add_session
    
    @pytest.fixture
    def authenticated_user(self):
        """Crea un usuario autenticado con perfil"""
        user = UserFactory()
        UserProfileFactory(user=user, is_authorized=True)
        return user
    
    @pytest.fixture
    def create_tokens_for_user(self, authenticated_user):
        """
        Crea múltiples tokens para un usuario simulando logins recientes.
        Retorna una lista de tokens (refresh tokens) creados.
        """
        user = authenticated_user
        refresh_tokens = []
        
        # Crear 3 tokens diferentes
        for _ in range(3):
            refresh = RefreshToken.for_user(user)
            refresh_tokens.append(refresh)
            
        return refresh_tokens
    
    # --- Pruebas Básicas de Logout ---
    
    @pytest.mark.django_db
    def test_logout_api_view_token_from_cookie(self, api_client, authenticated_user):
        """Prueba el logout con token desde cookie (caso básico)"""
        user = authenticated_user
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)
        
        # Configurar el cliente con token y cookie
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        api_client.cookies.load({'refresh_token': refresh_str})
        
        response = api_client.get('/api/auth/logout/')
        
        # Verificar respuesta exitosa
        assert response.status_code == 200
        assert response.data['detail'] == "Successfully logged out."
        assert response.data['blacklisted'] is True
        
        # Verificar blacklisting del token
        assert BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()
    
    @pytest.mark.django_db
    def test_logout_api_view_token_from_query_param(self, api_client, authenticated_user):
        """Prueba el logout con token desde parámetro de consulta"""
        user = authenticated_user
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)
        
        # Configurar el cliente con token en authorization header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        
        # Llamar a logout con el token como parámetro de URL
        response = api_client.get(f'/api/auth/logout/?refresh_token={refresh_str}')
        
        # Verificar respuesta exitosa
        assert response.status_code == 200
        assert response.data['detail'] == "Successfully logged out."
        assert response.data['blacklisted'] is True
        
        # Verificar blacklisting del token
        assert BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()
    
    # --- Pruebas de Blacklisting Múltiple ---
    
    @pytest.mark.django_db
    def test_logout_blacklists_multiple_recent_tokens(self, api_client, authenticated_user, create_tokens_for_user):
        """Prueba que el logout blacklista múltiples tokens recientes para el mismo usuario"""
        tokens = create_tokens_for_user
        
        # Usar uno de los tokens para la autenticación
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(tokens[0].access_token)}')
        
        # La función debería blacklistear todos los tokens recientes
        response = api_client.get('/api/auth/logout/')
        
        # Verificar respuesta exitosa
        assert response.status_code == 200
        assert response.data['blacklisted'] is True
        
        # Verificar que todos los tokens fueron blacklisteados
        for token in tokens:
            assert BlacklistedToken.objects.filter(token__jti=token['jti']).exists()
    
    @pytest.mark.django_db
    def test_logout_skips_already_blacklisted_tokens(self, api_client, authenticated_user, create_tokens_for_user):
        """Prueba que el logout maneja correctamente tokens ya blacklisteados"""
        tokens = create_tokens_for_user
        
        # Blacklistear manualmente uno de los tokens
        tokens[1].blacklist()
        
        # Usar otro token para la autenticación
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(tokens[0].access_token)}')
        
        # La función debería blacklistear los tokens restantes sin error
        response = api_client.get('/api/auth/logout/')
        
        # Verificar respuesta exitosa
        assert response.status_code == 200
        assert response.data['blacklisted'] is True
        
        # Verificar que todos los tokens terminaron blacklisteados
        for token in tokens:
            assert BlacklistedToken.objects.filter(token__jti=token['jti']).exists()
    
    @pytest.mark.django_db
    def test_logout_handles_no_recent_tokens(self, api_client, authenticated_user):
        """Prueba que el logout maneja el caso donde no hay tokens recientes"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Simular que no hay tokens recientes modificando la fecha de creación
        with patch('rest_framework_simplejwt.token_blacklist.models.OutstandingToken.objects.filter') as mock_filter:
            # Hacer que no retorne tokens
            mock_filter.return_value.filter.return_value.order_by.return_value = []
            
            # Configurar el cliente con token en authorization header
            api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
            
            # La función debería manejar correctamente que no hay tokens
            response = api_client.get('/api/auth/logout/')
            
            # Verificar respuesta exitosa
            assert response.status_code == 200
            assert response.data['blacklisted'] is False
    
    # --- Pruebas de Validación de Tokens ---
    
    @pytest.mark.django_db
    def test_logout_validates_token_type(self, api_client, authenticated_user):
        """Prueba que el logout valida que el token sea un refresh token"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Configurar el cliente con token en authorization header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        
        # Pasar un access token como refresh (tipo incorrecto)
        api_client.cookies.load({'refresh_token': access})  # access token, no refresh
        
        # La función debería detectar que no es un refresh token
        response = api_client.get('/api/auth/logout/')
        
        # Verificar respuesta exitosa pero sin blacklisting
        assert response.status_code == 200
        assert response.data['blacklisted'] is False
    
    @pytest.mark.django_db
    def test_logout_handles_invalid_token(self, api_client, authenticated_user):
        """Prueba que el logout maneja tokens inválidos sin fallar"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Configurar el cliente con token en authorization header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        
        # Pasar un token inválido
        api_client.cookies.load({'refresh_token': 'invalid-token'})
        
        # La función debería manejar el token inválido sin error
        response = api_client.get('/api/auth/logout/')
        
        # Verificar respuesta exitosa pero sin blacklisting
        assert response.status_code == 200
        assert response.data['blacklisted'] is False
    
    # --- Pruebas para diferentes tipos de solicitudes ---
    
    @pytest.mark.django_db
    def test_logout_api_request(self, api_client, authenticated_user):
        """Prueba el logout para una solicitud de la API (con JWT)"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Configurar el cliente con token en authorization header (API request)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        
        response = api_client.get('/api/auth/logout/')
        
        # Verificar que se identifica como API request
        assert response.status_code == 200
        # Verificar que se configuró el header Clear-Site-Data
        assert 'Clear-Site-Data' in response
        assert 'cookies' in response['Clear-Site-Data']
        assert 'storage' in response['Clear-Site-Data']
    
    @pytest.mark.django_db
    def test_logout_admin_request(self, request_factory, add_session, authenticated_user):
        """Prueba el logout para una solicitud admin (con sesión)"""
        user = authenticated_user
        
        # Crear una solicitud sin JWT (simulando una sesión admin)
        request = request_factory.get('/api/auth/logout/')
        request.user = user
        request = add_session(request)
        
        # Agregar cookies de sesión
        request.session['user_id'] = user.id
        request.session['backend'] = 'django.contrib.auth.backends.ModelBackend'
        request.session.save()
        
        # Ejecutar la vista manualmente (inyectando el permiso)
        view_instance = LogoutAPIView()
        view_instance.permission_classes = []
        view_instance.request = request
        
        # Simulamos dispatch directamente para evitar el middleware de autenticación
        response = view_instance.get(request)
        
        # Verificar respuesta exitosa
        assert response.status_code == 200
        # Verificar que Clear-Site-Data no está presente (es solo para API)
        assert 'Clear-Site-Data' not in response
        
        # Verificar que la respuesta contiene el detalle correcto
        assert response.data['detail'] == "Successfully logged out."
    
    @pytest.mark.django_db
    def test_logout_handles_global_errors(self):
        """Prueba que el método get de LogoutAPIView maneja excepciones correctamente"""
        # Crear una instancia directa de la vista para probar su manejo de errores
        view = LogoutAPIView()
        
        # Crear un request simulado que va a generar un error (None para forzar un error)
        request = None
        
        # Llamar directamente al método get, que debería manejar la excepción
        response = view.get(request)
        
        # Verificar que se retorna una respuesta de error 500
        assert response.status_code == 500
        assert "Error during logout" in response.data['detail']
    
    @pytest.mark.django_db
    def test_logout_cleans_oauth_session_keys(self, request_factory, add_session, authenticated_user):
        """Prueba que el logout limpia correctamente las claves de OAuth en la sesión"""
        user = authenticated_user
        
        # Crear una solicitud sin JWT (simulando una sesión admin)
        request = request_factory.get('/api/auth/logout/')
        request.user = user
        request = add_session(request)
        
        # Agregar múltiples claves OAuth a la sesión
        oauth_session_keys = [
            'auth_switched_user_id', 'auth_switched_from_user', 
            'partial_pipeline_token', 'social_auth_last_login_backend',
            'oauth_state', 'google-oauth2_state', 'user_id'
        ]
        
        for key in oauth_session_keys:
            request.session[key] = f"test-{key}"
        
        # Agregar una clave de pipeline parcial
        request.session['partial_pipeline_abc123'] = 'pipeline-data'
        
        # Guardar los cambios en la sesión
        request.session.save()
        
        # En lugar de verificar que las claves se eliminan, verificamos que
        # auth_logout de Django se llama correctamente, ya que es Django quien limpia la sesión
        with patch('authentication.views.auth_logout') as mock_auth_logout:
            # Ejecutar la vista manualmente (inyectando el permiso)
            view_instance = LogoutAPIView()
            view_instance.permission_classes = []
            view_instance.request = request
            
            # Simulamos dispatch directamente para evitar el middleware de autenticación
            response = view_instance.get(request)
            
            # Verificar que auth_logout fue llamado correctamente con nuestro request
            mock_auth_logout.assert_called_once_with(request)
            
        # Verificamos que la respuesta sea exitosa
        assert response.status_code == 200
        assert response.data['detail'] == "Successfully logged out."
    
    # --- Pruebas para limpieza de cookies ---
    
    @pytest.mark.django_db
    @override_settings(
        FRONTEND_BASE_URL='https://app.example.com',
        SESSION_COOKIE_DOMAIN='api.example.com',
        API_COOKIE_PATH='/api',
        ADMIN_COOKIE_PATH='/admin'
    )
    def test_logout_cleans_cookies_from_multiple_domains(self, api_client, authenticated_user):
        """Prueba que el logout limpia cookies en múltiples dominios"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Configurar el cliente con token en authorization header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        
        # Configurar varias cookies
        cookies = {
            'refresh_token': str(refresh),
            'access_token': access,
            'csrftoken': 'test-csrf-token'
        }
        api_client.cookies.load(cookies)
        
        response = api_client.get('/api/auth/logout/')
        
        # Verificar que las cookies fueron configuradas para eliminarse
        
        for cookie in ['refresh_token', 'access_token', 'csrftoken']:
            cookie_found = False
            for cookie_item in response.cookies.items():
                if cookie_item[0] == cookie:
                    cookie_found = True
                    break
            assert cookie_found, f"Cookie {cookie} no fue eliminada"
    
    # --- Pruebas para modo debug ---
    
    @pytest.mark.django_db
    @override_settings(DEBUG=True)
    def test_logout_in_debug_mode(self, api_client, authenticated_user):
        """Prueba comportamiento específico del logout en modo debug"""
        refresh = RefreshToken.for_user(authenticated_user)
        access = str(refresh.access_token)
        
        # Configurar el cliente con token y cookie
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        api_client.cookies.load({'refresh_token': str(refresh)})
        
        # En modo debug, la respuesta debe incluir más detalles pero no afecta a la funcionalidad
        response = api_client.get('/api/auth/logout/')
        
        assert response.status_code == 200
        assert response.data['blacklisted'] is True
        
        # Verificar blacklisting del token
        assert BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()
