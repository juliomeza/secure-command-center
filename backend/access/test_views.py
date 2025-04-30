import pytest
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework import status
from unittest.mock import patch, MagicMock

from .models import UserProfile, Company, Warehouse, Tab
from .views import UserPermissionsView
from authentication.tests import UserFactory
from .tests import UserProfileFactory

User = get_user_model()

class TestUserPermissionsView:
    """
    Pruebas para UserPermissionsView, que devuelve los permisos de acceso del usuario.
    """
    
    @pytest.fixture
    def api_client(self):
        return APIClient()
    
    @pytest.fixture
    def request_factory(self):
        return APIRequestFactory()
    
    @pytest.fixture
    def company(self):
        """Crea una empresa de prueba."""
        return Company.objects.create(name="Test Company")
    
    @pytest.fixture
    def warehouse(self, company):
        """Crea un almacén de prueba asociado a una empresa."""
        return Warehouse.objects.create(name="Test Warehouse", company=company)
    
    @pytest.fixture
    def tab(self):
        """Crea una pestaña de prueba."""
        return Tab.objects.create(id_name="test_tab", display_name="Test Tab")
    
    @pytest.fixture
    def authorized_user_with_profile(self, company, warehouse, tab):
        """
        Crea un usuario autorizado con un perfil que tiene acceso a una empresa,
        un almacén y una pestaña.
        """
        user = UserFactory()
        profile = UserProfile.objects.create(user=user, is_authorized=True)
        profile.allowed_companies.add(company)
        profile.allowed_warehouses.add(warehouse)
        profile.allowed_tabs.add(tab)
        return user
    
    @pytest.fixture
    def unauthorized_user_with_profile(self):
        """
        Crea un usuario no autorizado con un perfil.
        """
        user = UserFactory()
        UserProfile.objects.create(user=user, is_authorized=False)
        return user
    
    @pytest.fixture
    def user_without_profile(self):
        """
        Crea un usuario sin perfil.
        """
        return UserFactory()
    
    @pytest.mark.django_db
    def test_user_permissions_view_authenticated_authorized(self, api_client, authorized_user_with_profile, company, warehouse, tab):
        """
        Prueba que un usuario autenticado y autorizado pueda acceder a sus permisos.
        """
        # Autenticar al usuario
        user = authorized_user_with_profile
        api_client.force_authenticate(user=user)
        
        # Hacer la solicitud
        response = api_client.get('/api/access/permissions/')
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar que los datos están presentes y son correctos
        assert 'allowed_companies' in response.data
        assert 'allowed_warehouses' in response.data
        assert 'allowed_tabs' in response.data
        
        # Verificar que los datos específicos están presentes
        assert response.data['allowed_companies'][0]['name'] == company.name
        assert response.data['allowed_warehouses'][0]['name'] == warehouse.name
        assert response.data['allowed_tabs'][0]['display_name'] == tab.display_name
    
    @pytest.mark.django_db
    def test_user_permissions_view_authenticated_unauthorized(self, api_client, unauthorized_user_with_profile):
        """
        Prueba que un usuario autenticado pero no autorizado reciba un error 403.
        """
        # Autenticar al usuario
        user = unauthorized_user_with_profile
        api_client.force_authenticate(user=user)
        
        # Hacer la solicitud
        response = api_client.get('/api/access/permissions/')
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "not authorized" in response.data['detail'].lower()
    
    @pytest.mark.django_db
    def test_user_permissions_view_authenticated_no_profile(self, api_client, user_without_profile):
        """
        Prueba que un usuario autenticado sin perfil reciba un error 403.
        """
        # Autenticar al usuario
        user = user_without_profile
        api_client.force_authenticate(user=user)
        
        # Hacer la solicitud
        response = api_client.get('/api/access/permissions/')
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "profile not found" in response.data['detail'].lower()
    
    @pytest.mark.django_db
    def test_user_permissions_view_unauthenticated(self, api_client):
        """
        Prueba que un usuario no autenticado reciba un error 401.
        """
        # Hacer la solicitud sin autenticación
        response = api_client.get('/api/access/permissions/')
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.django_db
    def test_user_permissions_view_with_empty_permissions(self, api_client):
        """
        Prueba que un usuario autorizado sin permisos específicos reciba una lista vacía.
        """
        # Crear usuario con perfil autorizado pero sin permisos específicos
        user = UserFactory()
        UserProfile.objects.create(user=user, is_authorized=True)
        
        # Autenticar al usuario
        api_client.force_authenticate(user=user)
        
        # Hacer la solicitud
        response = api_client.get('/api/access/permissions/')
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_200_OK
        assert response.data['allowed_companies'] == []
        assert response.data['allowed_warehouses'] == []
        assert response.data['allowed_tabs'] == []
    
    @pytest.mark.django_db
    def test_user_permissions_view_error_handling(self, api_client, authorized_user_with_profile):
        """
        Prueba que la vista maneje correctamente los errores internos.
        """
        # Autenticar al usuario
        user = authorized_user_with_profile
        api_client.force_authenticate(user=user)
        
        # Simular un error interno durante la serialización
        with patch('access.views.CompanySerializer') as mock_company_serializer:
            mock_company_serializer.side_effect = Exception("Test exception")
            
            # Hacer la solicitud
            response = api_client.get('/api/access/permissions/')
            
            # Verificar que se devuelve un error 500
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "error occurred" in response.data['detail'].lower()
    
    @pytest.mark.django_db
    def test_user_permissions_direct_view_call(self, request_factory, authorized_user_with_profile):
        """
        Prueba llamar directamente a la vista sin pasar por el enrutador.
        """
        # Crear una solicitud
        request = request_factory.get('/api/access/permissions/')
        request.user = authorized_user_with_profile
        
        # Para DRF necesitamos marcar el usuario como autenticado explícitamente
        # cuando usamos directamente la vista y no pasamos por el enrutador
        # ya que APIRequestFactory no configura esto automáticamente
        force_authenticate(request, user=authorized_user_with_profile)
        
        # Llamar directamente a la vista
        view = UserPermissionsView.as_view()
        response = view(request)
        
        # Verificar la respuesta
        assert response.status_code == status.HTTP_200_OK
        assert 'allowed_companies' in response.data
        assert 'allowed_warehouses' in response.data
        assert 'allowed_tabs' in response.data