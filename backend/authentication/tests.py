import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
import factory

from .models import AuthUser
from .serializers import UserSerializer, TokenResponseSerializer

# --- Factories para crear datos de prueba ---

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Faker('user_name')
    email = factory.Faker('email')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'defaultpassword')

# --- Pruebas para Modelos ---

@pytest.mark.django_db
def test_auth_user_proxy():
    """Prueba que AuthUser actúa como proxy de User."""
    user = UserFactory()
    auth_user = AuthUser.objects.get(pk=user.pk)
    assert isinstance(auth_user, AuthUser)
    assert auth_user.pk == user.pk
    assert auth_user.username == user.username

@pytest.mark.django_db
def test_auth_user_get_jwt_tokens():
    """Prueba la generación de tokens JWT desde AuthUser."""
    user = UserFactory()
    auth_user = AuthUser.objects.get(pk=user.pk)
    tokens = auth_user.get_jwt_tokens()
    assert 'access' in tokens
    assert 'refresh' in tokens
    # Verificar que los tokens son válidos (básico)
    try:
        RefreshToken(tokens['refresh'])
    except Exception as e:
        pytest.fail(f"Refresh token inválido: {e}")

# --- Pruebas para Serializadores ---

@pytest.mark.django_db
def test_user_serializer_without_profile():
    """Prueba la serialización de User sin perfil de acceso."""
    user = UserFactory()
    serializer = UserSerializer(user)
    data = serializer.data
    assert data['id'] == user.id
    assert data['username'] == user.username
    assert data['email'] == user.email
    # <<< Updated assertion: check for is_app_authorized, expect False if no profile
    assert 'is_app_authorized' in data
    assert data['is_app_authorized'] is False

@pytest.mark.django_db
def test_user_serializer_with_profile():
    """Prueba la serialización de User con perfil de acceso."""
    from access.tests import UserProfileFactory
    profile = UserProfileFactory(is_authorized=True)
    user = profile.user
    serializer = UserSerializer(user)
    data = serializer.data
    assert data['id'] == user.id
    assert data['username'] == user.username
    assert 'is_app_authorized' in data
    assert data['is_app_authorized'] is True

@pytest.mark.django_db
def test_token_response_serializer():
    """Prueba la serialización de la respuesta de token."""
    from access.tests import UserProfileFactory
    user = UserFactory()
    UserProfileFactory(user=user, is_authorized=True)
    refresh = RefreshToken.for_user(user)
    token_data = {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user
    }
    serializer = TokenResponseSerializer(token_data)
    data = serializer.data

    assert 'access' in data
    assert 'refresh' in data
    assert 'user' in data
    assert data['user']['id'] == user.id
    assert data['user']['username'] == user.username
    # <<< Updated assertion: check for is_app_authorized in nested user data
    assert 'is_app_authorized' in data['user']
    assert data['user']['is_app_authorized'] is True

# --- Pruebas para Vistas (inicial) ---

@pytest.mark.django_db
def test_get_csrf_token_view():
    """Prueba la vista get_csrf_token."""
    client = APIClient()
    # Corrected URL
    response = client.get('/api/auth/csrf/') 
    assert response.status_code == 200
    assert 'csrfToken' in response.json()
    assert 'csrftoken' in response.cookies # Verifica que la cookie se establece

@pytest.mark.django_db
def test_user_profile_api_view_unauthenticated():
    """Prueba UserProfileAPIView sin autenticación."""
    client = APIClient()
    # Corrected URL
    response = client.get('/api/auth/profile/') 
    # Esperamos 401 Unauthorized o 403 Forbidden dependiendo de la config de auth
    assert response.status_code in [401, 403]

@pytest.mark.django_db
def test_user_profile_api_view_authenticated_jwt():
    """Prueba UserProfileAPIView con autenticación JWT."""
    from access.tests import UserProfileFactory
    user = UserFactory()
    UserProfileFactory(user=user, is_authorized=True)
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    response = client.get('/api/auth/profile/')
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == user.id
    assert data['username'] == user.username
    # <<< Updated assertion: check for is_app_authorized
    assert 'is_app_authorized' in data
    assert data['is_app_authorized'] is True

@pytest.mark.django_db
def test_logout_api_view_authenticated_jwt():
    """Prueba LogoutAPIView con autenticación JWT."""
    user = UserFactory()
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # Simular que las cookies están presentes
    client.cookies.load({'access_token': access_token, 'refresh_token': refresh_token})
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    response = client.get('/api/auth/logout/') # Usar GET como en la implementación

    assert response.status_code == 200
    data = response.json()
    assert data['detail'] == "Successfully logged out."
    # Verificar que las cookies se intentan eliminar (max_age=0 o expires en el pasado)
    assert 'access_token' in response.cookies
    assert response.cookies['access_token']['max-age'] == 0
    assert 'refresh_token' in response.cookies
    assert response.cookies['refresh_token']['max-age'] == 0

    # Verificar blacklisting (Uncommented)
    assert BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()

@pytest.mark.django_db
def test_token_obtain_api_view_authenticated():
    """Prueba TokenObtainAPIView con un usuario ya autenticado."""
    from access.tests import UserProfileFactory
    user = UserFactory()
    UserProfileFactory(user=user, is_authorized=False)
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    response = client.get('/api/auth/token/')

    assert response.status_code == 200
    data = response.json()
    assert 'access' in data
    assert 'refresh' in data
    assert 'user' in data
    assert data['user']['id'] == user.id
    # <<< Updated assertion: check for is_app_authorized in nested user data
    assert 'is_app_authorized' in data['user']
    assert data['user']['is_app_authorized'] is False # Check based on profile created

# --- Pruebas para oauth_success_redirect (Más complejo, requiere simulación) ---
# @pytest.mark.django_db
# def test_oauth_success_redirect_flow():
#     # ... (requiere simular estado de sesión post-OAuth)
#     pass