import pytest
from unittest.mock import patch, MagicMock
from django.test import RequestFactory, override_settings
from django.contrib.sessions.middleware import SessionMiddleware
from social_django.models import UserSocialAuth
from .views import oauth_success_redirect
from access.models import UserProfile
from .tests import UserFactory

class TestOAuthFlows:
    """
    Pruebas para los flujos de autenticación OAuth.
    Estas pruebas se centran en la función oauth_success_redirect que maneja
    la generación de tokens JWT y redirección después de un login OAuth exitoso.
    """
    
    @pytest.fixture
    def request_factory(self):
        return RequestFactory()
    
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
    def oauth_user(self):
        """Crea un usuario con autenticación social"""
        user = UserFactory()
        # Simular que el usuario tiene una autenticación social
        UserSocialAuth.objects.create(
            user=user,
            provider='google-oauth2',
            uid=f'test-{user.id}@gmail.com'
        )
        return user
    
    @pytest.fixture
    def authorized_user(self):
        """Crea un usuario autorizado con perfil"""
        user = UserFactory()
        UserProfile.objects.create(user=user, is_authorized=True)
        return user
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_authenticated_user(self, request_factory, add_session):
        """Prueba el caso donde el usuario ya está autenticado"""
        user = UserFactory()
        
        # Crear una solicitud con usuario autenticado
        request = request_factory.get('/auth/complete/google-oauth2/')
        request.user = user
        request = add_session(request)
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar redirección al dashboard
        assert response.status_code == 302
        assert response['Location'].startswith('https://app.example.com/dashboard')
        
        # Verificar que los tokens JWT están en la URL
        assert 'jwt_access=' in response['Location']
        assert 'jwt_refresh=' in response['Location']
        
        # Verificar que las cookies se establecen
        assert 'refresh_token' in response.cookies
        assert 'access_token' in response.cookies
        assert response.cookies['refresh_token']['httponly']
        assert response.cookies['access_token']['httponly']
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_switched_user(self, request_factory, add_session):
        """Prueba el caso donde hubo un cambio de usuario durante la autenticación OAuth"""
        original_user = UserFactory()
        switched_user = UserFactory()
        
        # Crear una solicitud con un cambio de usuario en la sesión
        request = request_factory.get('/auth/complete/google-oauth2/')
        request = add_session(request)
        request.session['auth_switched_user_id'] = switched_user.id
        request.session['auth_switched_from_user'] = original_user.username
        request.session['auth_switched_to_user'] = switched_user.username
        request.session.save()
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar redirección al dashboard
        assert response.status_code == 302
        assert response['Location'].startswith('https://app.example.com/dashboard')
        
        # Verificar que los tokens JWT están en la URL
        assert 'jwt_access=' in response['Location']
        assert 'jwt_refresh=' in response['Location']
        
        # Verificar que las cookies se establecen correctamente
        assert 'refresh_token' in response.cookies
        assert 'access_token' in response.cookies
        
        # Verificar que las variables de sesión fueron limpiadas
        assert 'auth_switched_user_id' not in request.session
        assert 'auth_switched_from_user' not in request.session
        assert 'auth_switched_to_user' not in request.session
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_user_in_session(self, request_factory, add_session):
        """Prueba el caso donde el usuario está en la sesión (caso normal de social_auth)"""
        user = UserFactory()
        
        # Crear una solicitud con el usuario en la sesión
        request = request_factory.get('/auth/complete/google-oauth2/')
        request = add_session(request)
        request.session['user_id'] = user.id
        request.session.save()
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar redirección al dashboard
        assert response.status_code == 302
        assert response['Location'].startswith('https://app.example.com/dashboard')
        
        # Verificar que los tokens JWT están en la URL
        assert 'jwt_access=' in response['Location']
        assert 'jwt_refresh=' in response['Location']
        
        # Verificar que las cookies se establecen
        assert 'refresh_token' in response.cookies
        assert 'access_token' in response.cookies
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    @patch('social_django.utils.load_strategy')
    @patch('social_core.pipeline.partial.partial_prepare')  
    def test_oauth_success_redirect_partial_pipeline(self, mock_partial_prepare, mock_load_strategy, request_factory, add_session):
        """Prueba el caso donde el usuario está en un pipeline parcial"""
        user = UserFactory()
        
        # Crear una solicitud con un pipeline parcial
        request = request_factory.get('/auth/complete/google-oauth2/')
        request = add_session(request)
        request.session['partial_pipeline_token'] = 'test_token'
        
        # Configurar los mocks para simular un pipeline parcial
        strategy_mock = MagicMock()
        mock_load_strategy.return_value = strategy_mock
        
        # También configuramos cualquier módulo que importe load_partial
        # Para garantizar que esto funcione sin importar de dónde se importe load_partial
        import sys
        
        # Configurar patch dinámicamente
        with patch.dict(sys.modules):
            # Si se realiza la importación durante la prueba, esto intercepta cualquier importación
            # de load_partial 
            sys.modules['social_django.utils'].load_partial = lambda *args, **kwargs: {'kwargs': {'user': user}}
            
            # También podemos patchear directamente social_core.pipeline.partial si es de donde viene
            if 'social_core.pipeline.partial' in sys.modules:
                sys.modules['social_core.pipeline.partial'].load_partial = lambda *args, **kwargs: {'kwargs': {'user': user}}
            
            # Ejecutar el view
            response = oauth_success_redirect(request)
        
        # Verificaciones
        assert response.status_code == 302
        assert response['Location'].startswith('https://app.example.com/dashboard')
        assert 'jwt_access=' in response['Location']
        assert 'jwt_refresh=' in response['Location']
        assert 'refresh_token' in response.cookies
        assert 'access_token' in response.cookies
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_no_user_found(self, request_factory, add_session):
        """Prueba el caso donde no se encuentra ningún usuario autenticado"""
        # Crear una solicitud sin usuario ni información en la sesión
        request = request_factory.get('/auth/complete/google-oauth2/')
        request = add_session(request)
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar redirección a login con error
        assert response.status_code == 302
        assert response['Location'] == 'https://app.example.com/login?error=auth_failed'
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_provider_in_response(self, request_factory, add_session, oauth_user):
        """Prueba que el proveedor OAuth se incluye en la redirección"""
        # Crear una solicitud con usuario autenticado que tiene un proveedor OAuth
        request = request_factory.get('/auth/complete/google-oauth2/')
        request.user = oauth_user
        request = add_session(request)
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar que el proveedor está en la URL de redirección
        assert 'provider=google-oauth2' in response['Location']
    
    @pytest.mark.django_db
    @override_settings(FRONTEND_BASE_URL='https://app.example.com')
    @patch('authentication.views.RefreshToken')
    def test_oauth_success_redirect_exception_handling(self, mock_refresh_token, request_factory, add_session):
        """Prueba el manejo de excepciones durante la generación de tokens"""
        user = UserFactory()
        
        # Configurar el mock para lanzar una excepción
        mock_refresh_token.for_user.side_effect = Exception("Token generation failed")
        
        # Crear solicitud con usuario autenticado
        request = request_factory.get('/auth/complete/google-oauth2/')
        request.user = user
        request = add_session(request)
        
        # Ejecutar el view
        response = oauth_success_redirect(request)
        
        # Verificar redirección a login con error
        assert response.status_code == 302
        assert response['Location'] == 'https://app.example.com/login?error=server_error'
    
    @pytest.mark.django_db
    @override_settings(DEBUG=True, FRONTEND_BASE_URL='https://app.example.com')
    def test_oauth_success_redirect_debug_mode(self, request_factory, add_session):
        """Prueba comportamiento en modo debug"""
        user = UserFactory()
        
        # Crear una solicitud con usuario autenticado en modo DEBUG
        request = request_factory.get('/auth/complete/google-oauth2/')
        request.user = user
        request = add_session(request)
        
        # Ejecutar el view (las aserciones no cambian pero aumenta la cobertura
        # para el código específico del modo DEBUG)
        response = oauth_success_redirect(request)
        
        # Verificar redirección al dashboard
        assert response.status_code == 302
        assert response['Location'].startswith('https://app.example.com/dashboard')