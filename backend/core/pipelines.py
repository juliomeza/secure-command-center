# backend/core/pipelines.py
from .models import Company, UserProfile
from django.contrib.auth.models import User
from social_core.exceptions import AuthAlreadyAssociated
from social_django.models import UserSocialAuth
from django.contrib.auth import logout, login

def clean_session(strategy, *args, **kwargs):
    """
    Pipeline function to ensure clean session state before authentication.
    """
    try:
        request = strategy.request
        if request:
            # IMPORTANT: Do not flush the session as it destroys authentication state
            # Only cycle the key to improve security while maintaining the session
            if not request.session.exists(request.session.session_key):
                request.session.create()
            else:
                # We only cycle the key when starting a new login process
                # without an existing user
                if not request.user.is_authenticated:
                    request.session.cycle_key()
    except Exception as e:
        print(f"Error in clean_session pipeline: {str(e)}")
    return {}

def handle_already_associated_auth(backend, details, uid, user=None, *args, **kwargs):
    """
    Mejorar el manejo de cuentas ya asociadas.
    En lugar de generar error, maneja el conflicto adecuadamente.
    """
    social = UserSocialAuth.objects.filter(provider=backend.name, uid=uid).first()
    if social:
        if user and social.user != user:
            request = kwargs.get('request')
            if request:
                # Don't flush the session as it destroys authentication state
                # Use backend's login function which properly sets up session
                login(request, social.user, backend=f'social_core.backends.{backend.name}.{backend.__class__.__name__}')
                
            return {'user': social.user, 'is_new': False}
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
    
    # You could update User model fields here if needed
    # user.first_name = response.get('given_name') or response.get('first_name', '')
    # user.last_name = response.get('family_name') or response.get('last_name', '')
    # user.email = email
    # user.save()