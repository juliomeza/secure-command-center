from django.shortcuts import render
from rest_framework import generics, permissions
from .models import TestData
from .serializers import TestDataSerializer
from access.models import UserProfile, Tab # <--- Añadir esta línea


# Create your views here.

class HasTestingTabAccess(permissions.BasePermission):
    """
    Custom permission to only allow users with access to the 'Testing' tab.
    """
    message = 'You do not have permission to access this data.'
    # Define el ID o nombre único de tu Tab "Testing" aquí
    REQUIRED_TAB_ID_NAME = 'testing' # AJUSTA ESTO si el id_name de tu tab es diferente

    def has_permission(self, request, view):
        # Asegurarse que el usuario está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Intentar obtener el perfil del usuario
        try:
            profile = request.user.access_profile # Asume que la relación se llama 'access_profile'
            # Verificar si el tab requerido está en los tabs permitidos del perfil
            return profile.allowed_tabs.filter(id_name=self.REQUIRED_TAB_ID_NAME).exists()
        except UserProfile.DoesNotExist:
            return False # No tiene perfil, no tiene acceso
        except AttributeError:
            # Si el usuario no tiene 'access_profile' o Tab no tiene 'id_name', denegar acceso
             return False


class TestDataListView(generics.ListAPIView):
    """
    API view to list TestData items.
    Requires authentication and access to the 'Testing' tab.
    """
    queryset = TestData.objects.all().order_by('-fetched_at') # Ordenar por más reciente
    serializer_class = TestDataSerializer
    permission_classes = [permissions.IsAuthenticated, HasTestingTabAccess] # Aplicar permisos

    # Opcional: Podrías añadir paginación si esperas muchos datos
    # pagination_class = YourPaginationClass
