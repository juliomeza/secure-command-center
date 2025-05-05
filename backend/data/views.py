from django.shortcuts import render
from rest_framework import generics, permissions
from .models import TestData, DataCardReport
from .serializers import TestDataSerializer, DataCardReportSerializer
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


class HasDataCardAccess(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo usuarios con acceso a la pestaña 'DataCard'.
    Por ahora utilizamos la misma pestaña 'testing' mientras se desarrolla.
    """
    message = 'No tienes permiso para acceder a estos datos.'
    # Cambiar esto al ID/nombre real de la pestaña DataCard cuando esté creada
    REQUIRED_TAB_ID_NAME = 'testing'  

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.access_profile
            return profile.allowed_tabs.filter(id_name=self.REQUIRED_TAB_ID_NAME).exists()
        except (UserProfile.DoesNotExist, AttributeError):
            return False


class DataCardReportListView(generics.ListAPIView):
    """
    Vista API para listar datos de DataCard.
    Requiere autenticación y acceso a la pestaña correspondiente.
    """
    serializer_class = DataCardReportSerializer
    permission_classes = [permissions.IsAuthenticated, HasDataCardAccess]
    
    def get_queryset(self):
        """
        Filtra los resultados según parámetros de URL y permisos del usuario.
        Soporta filtrado por año, semana y warehouse_id.
        """
        # Obtener año y semana de los parámetros de la URL o usar valores predeterminados
        year = self.request.query_params.get('year')
        week = self.request.query_params.get('week')
        warehouse_id = self.request.query_params.get('warehouse_id')
        
        # Base de la consulta
        queryset = DataCardReport.objects.all()
        
        # Aplicar filtros si se proporcionan
        if year:
            queryset = queryset.filter(year=year)
        if week:
            queryset = queryset.filter(week=week)
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
            
        # Filtrar por warehouses permitidos (si se implementa luego)
        # profile = self.request.user.access_profile
        # allowed_warehouses = profile.allowed_warehouses.values_list('id', flat=True)
        # queryset = queryset.filter(warehouse_id__in=allowed_warehouses)
        
        # Ordenar resultados
        return queryset.order_by('warehouse_id', 'section', 'list_order')
