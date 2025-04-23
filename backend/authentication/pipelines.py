# backend/authentication/pipelines.py
from core.models import Company, UserProfile
from django.contrib.auth.models import User
from social_core.exceptions import AuthAlreadyAssociated
from social_django.models import UserSocialAuth
from django.contrib.auth import logout, login

def clean_session(strategy, *args, **kwargs):
    """
    Pipeline function to ensure clean session state before authentication.
    """
    # Limpiar estado de sesión anterior que podría causar problemas
    if strategy.request and hasattr(strategy.request, 'session'):
        session = strategy.request.session
        
        # Preservar el state para evitar ataques CSRF
        oauth_state = session.get('oauth_state')
        
        # Guardar ciertos datos importantes antes de limpiar
        preserve_data = {}
        keys_to_preserve = ['oauth_state']
        for key in keys_to_preserve:
            if key in session:
                preserve_data[key] = session.get(key)
                
        # Restaurar solo los datos necesarios
        for key, value in preserve_data.items():
            session[key] = value
            
        # Para debugging
        print(f"Session cleaned in OAuth pipeline. Preserved keys: {list(preserve_data.keys())}")
    
    return None


def handle_already_associated_auth(backend, details, uid, user=None, *args, **kwargs):
    """
    Maneja cuentas ya asociadas y asegura una sesión persistente.
    """
    social = UserSocialAuth.get_social_auth(backend.name, uid)
    strategy = backend.strategy
    
    if social and user and social.user != user:
        print(f"[Auth Pipeline] Found already associated account, but with different user. Social user: {social.user.username}, Current user: {user.username}")
        if strategy.request and hasattr(strategy.request, 'session'):
            strategy.request.session['next'] = strategy.request.path
            
            # Guardar información para restaurar la sesión después
            strategy.request.session['backend'] = backend.name
            strategy.request.session['user_id'] = social.user.id
            
            # Logout silencioso
            logout(strategy.request)
            
            # Login con la cuenta asociada
            strategy.request.user = social.user
            login(strategy.request, social.user, backend=f'social_core.backends.{backend.name}.{backend.name.title()}OAuth2')
            
            # Marcar para saltar la asociación
            return {'user': social.user, 'is_new': False}
            
    return None


def save_profile_details(backend, user: User, response, *args, **kwargs):
    """
    Pipeline para guardar o actualizar datos del perfil de usuario desde OAuth.
    """
    # Asegurar que existe el perfil de usuario
    if not hasattr(user, 'profile'):
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