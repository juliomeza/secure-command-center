from django.db import models
from django.contrib.auth.models import User

# Estos modelos son compatibles con los definidos en core/models.py
# pero están específicamente relacionados con la autenticación
# NO eliminamos los modelos originales para mantener compatibilidad

# Usamos proxy para no duplicar datos, pero poder extender funcionalidad
class AuthUser(User):
    """
    Modelo proxy para User que permite añadir métodos relacionados
    con autenticación sin modificar el modelo original User.
    """
    class Meta:
        proxy = True
        app_label = 'authentication'
        
    # Métodos de ayuda para JWT y OAuth
    def get_jwt_tokens(self):
        """
        Genera tokens JWT para el usuario.
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    @property
    def is_oauth_user(self):
        """
        Determina si es un usuario autenticado vía OAuth.
        """
        return hasattr(self, 'social_auth') and self.social_auth.exists()
    
    @property
    def oauth_provider(self):
        """
        Devuelve el proveedor OAuth si está disponible.
        """
        if self.is_oauth_user:
            return self.social_auth.first().provider
        return None

# Moved UserProfile from core.models
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    # Store additional details from OAuth if needed
    azure_oid = models.CharField(max_length=100, blank=True, null=True, unique=True) # Store Azure Object ID
    job_title = models.CharField(max_length=100, blank=True, null=True)
    # Add other fields as necessary

    def __str__(self):
        return self.user.username
