# backend/authentication/pipelines.py
from django.contrib.auth.models import User
from social_core.exceptions import AuthAlreadyAssociated
from social_django.models import UserSocialAuth
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile

def clean_session(strategy, *args, **kwargs):
    """
    Pipeline function simplificada que ya no depende de la sesión.
    """
    # Este pipeline ahora es mínimo ya que no dependemos de la sesión
    return None


def handle_already_associated_auth(backend, details, uid, user=None, *args, **kwargs):
    """
    Maneja cuentas ya asociadas con enfoque simplificado usando JWT.
    """
    social = UserSocialAuth.get_social_auth(backend.name, uid)
    
    if social and user and social.user != user:
        print(f"[Auth Pipeline] Found already associated account, but with different user. Social user: {social.user.username}, Current user: {user.username}")
        
        # Simplemente autenticar al usuario correcto especificando el backend
        strategy = backend.strategy
        if strategy.request:
            # Guardar esto en la sesión para que la función oauth_success_redirect pueda recuperarlo
            if hasattr(strategy.request, 'session'):
                strategy.request.session['auth_switched_user_id'] = social.user.id
                strategy.request.session['auth_switched_from_user'] = user.username
                strategy.request.session['auth_switched_to_user'] = social.user.username
                strategy.request.session.save()
            
            # Establecer el usuario correcto y su backend
            strategy.request.user = social.user
            backend_path = f"social_core.backends.{backend.name}.{backend.__class__.__name__}"
            social.user.backend = backend_path
            
            # Forzar login con el usuario asociado
            login(strategy.request, social.user)
            print(f"[Auth Pipeline] Forzando login para el usuario correcto: {social.user.username}")
            
        # Marcar para saltar la asociación
        return {'user': social.user, 'is_new': False, 'social': social}
            
    return None


def save_profile_details(backend, user: User, response, *args, **kwargs):
    """
    Pipeline para guardar o actualizar datos del perfil de usuario desde OAuth.
    Esta función se mantiene igual ya que no depende de sesiones.
    """
    # Asegurar que existe el perfil de usuario
    if not hasattr(user, 'profile'):
        # Ensure UserProfile is imported correctly from .models
        UserProfile.objects.create(user=user)

    # Actualizar datos del perfil según el backend
    if backend.name == 'azuread-oauth2':
        # Procesar información de perfil de Azure AD
        if 'oid' in response:
            user.profile.azure_oid = response['oid']
        
        # Actualizamos nombre y correo si están disponibles
        if 'name' in response:
            names = response['name'].split(' ')
            if len(names) >= 2:
                user.first_name = names[0]
                user.last_name = ' '.join(names[1:])
        
        if 'email' in response and response['email']:
            user.email = response['email']
        elif 'upn' in response:
            user.email = response['upn']
            
        # Actualizar título de trabajo si está disponible
        if 'jobTitle' in response:
            user.profile.job_title = response['jobTitle']

        # Guardar cambios
        user.save()
        user.profile.save()

    elif backend.name == 'google-oauth2':
        # Procesar información de perfil de Google
        if 'email' in response:
            user.email = response['email']
            
        # Actualizamos nombre si está disponible
        if 'given_name' in response:
            user.first_name = response['given_name']
        if 'family_name' in response:
            user.last_name = response['family_name']
            
        # Guardar cambios
        user.save()
        user.profile.save()
            
    # Para debugging
    print(f"Perfil actualizado para usuario {user.username} desde proveedor {backend.name}")
    
    return {'user': user}