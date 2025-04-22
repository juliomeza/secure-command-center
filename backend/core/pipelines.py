# backend/core/pipelines.py
from .models import Company, UserProfile
from django.contrib.auth.models import User
from social_core.exceptions import AuthAlreadyAssociated
from social_django.models import UserSocialAuth
from django.contrib.auth import logout, login
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

def clean_session(strategy, *args, **kwargs):
    """
    Pipeline function to ensure clean session state before authentication.
    """
    try:
        request = strategy.request
        if request:
            # Limpiar completamente la sesión anterior si existe
            if request.session.session_key:
                request.session.flush()
            
            # Crear una nueva sesión limpia
            request.session.create()
            request.session.modified = True
            
            print(f"Session state after clean_session: {request.session.session_key}")
    except Exception as e:
        print(f"Error in clean_session pipeline: {str(e)}")
    return {}

def handle_already_associated_auth(backend, details, uid, user=None, *args, **kwargs):
    """
    Maneja cuentas ya asociadas y asegura una sesión persistente.
    """
    try:
        social = UserSocialAuth.objects.filter(provider=backend.name, uid=uid).first()
        if social:
            request = kwargs.get('request')
            if request:
                # Realizar login explícito
                login(request, social.user, backend=f'social_core.backends.{backend.name}.{backend.__class__.__name__}')
                
                # Forzar la sincronización de la sesión
                request.session.save()
                request.session.modified = True
                
                # Asegurarnos de que la sesión está correctamente configurada
                if not request.session.session_key:
                    request.session.create()
                
                # Guardar información importante en la sesión
                request.session['user_id'] = social.user.id
                request.session['backend'] = backend.name
                request.session['social_auth_last_login_backend'] = backend.name
                
                # Forzar commit de la sesión
                request.session.save()
                
                # Verificar que el usuario está realmente autenticado
                if not request.user.is_authenticated:
                    # Si no está autenticado, intentar recargar la sesión
                    request.session.cycle_key()
                    login(request, social.user, backend=f'social_core.backends.{backend.name}.{backend.__class__.__name__}')
                    request.session.save()
                
                print(f"User {social.user.username} logged in with session: {request.session.session_key}")
                print(f"Authentication status: {request.user.is_authenticated}")
                
                return {'user': social.user, 'is_new': False}
    except Exception as e:
        print(f"Error in handle_already_associated_auth: {str(e)}")
    return {}

def save_profile_details(backend, user: User, response, *args, **kwargs):
    """
    Pipeline step to create/update UserProfile and associate Company.
    Handles both Azure AD and Google OAuth responses.
    """
    # Common variables that will be set regardless of backend
    company_name = None
    email = None
    unique_id = None
    job_title = None
    
    # Extract backend-specific data
    if backend.name == 'azuread-oauth2':
        # --- Handle Azure AD OAuth2 ---
        email = response.get('mail') or response.get('email') or response.get('upn')
        unique_id = response.get('oid')  # Azure AD Object ID
        job_title = response.get('jobTitle')
        
    elif backend.name == 'google-oauth2':
        # --- Handle Google OAuth2 ---
        email = response.get('email')
        unique_id = response.get('sub')  # Google's unique user identifier
        # Google doesn't typically provide job title, but might have occupation in some cases
        job_title = response.get('occupation', None)
    
    # --- Common company determination from email (for both backends) ---
    if email and '@' in email:
        domain = email.split('@')[1]
        # Simple company name derivation from email domain
        company_name = domain.split('.')[0].capitalize()
    
    # --- Find or Create Company ---
    company = None
    if company_name:
        company, created = Company.objects.get_or_create(name=company_name)
        if created:
            print(f"Created new company: {company_name}")
    
    # --- Create or Update UserProfile ---
    # Build defaults dict based on available data
    defaults = {
        'company': company,
        'job_title': job_title,
    }
    
    # Only set azure_oid if it's from Azure AD
    if backend.name == 'azuread-oauth2' and unique_id:
        defaults['azure_oid'] = unique_id
    
    profile, created = UserProfile.objects.update_or_create(
        user=user,
        defaults=defaults
    )
    
    if created:
        print(f"Created profile for user: {user.username}")
    else:
        print(f"Updated profile for user: {user.username}")
