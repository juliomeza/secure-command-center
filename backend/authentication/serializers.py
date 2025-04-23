# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import UserProfile, Company
from core.serializers import CompanySerializer

# Serializadores específicos para la autenticación
# Mantenemos la misma estructura que en core para asegurar compatibilidad

class AuthProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para el perfil de usuario, similar al de core
    pero con configuración específica para autenticación.
    """
    company = CompanySerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['company', 'azure_oid', 'job_title']

class AuthUserSerializer(serializers.ModelSerializer):
    """
    Serializador para el usuario, similar al de core
    pero con campos específicos para autenticación.
    """
    profile = AuthProfileSerializer(read_only=True)
    auth_provider = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'auth_provider']
        
    def get_auth_provider(self, obj):
        """
        Determina el proveedor de autenticación usado (OAuth o credenciales).
        """
        if hasattr(obj, 'social_auth') and obj.social_auth.exists():
            return obj.social_auth.first().provider
        return 'credentials'

class TokenResponseSerializer(serializers.Serializer):
    """
    Serializador para la respuesta de tokens JWT.
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = AuthUserSerializer()