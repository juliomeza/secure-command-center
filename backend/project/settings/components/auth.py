"""
Authentication settings for the project.
"""
import os
from datetime import timedelta

# Determinar si estamos en entorno Render (producción)
IS_RENDER = os.environ.get('IS_RENDER', False)

# --- Authentication Configuration ---
AUTHENTICATION_BACKENDS = (
    'social_core.backends.azuread.AzureADOAuth2', # Microsoft Azure AD OAuth2
    'social_core.backends.google.GoogleOAuth2', # Google OAuth2
    'django.contrib.auth.backends.ModelBackend', # Default Django auth (for admin, etc.)
)

# --- Social Auth (OAuth2/OpenID Connect) Settings ---
LOGIN_URL = '/auth/login/'

# Determinar las URLs de frontend según el entorno
FRONTEND_BASE_URL = 'https://dashboard-control-front.onrender.com' if IS_RENDER else 'http://localhost:5173'

# Todas las redirecciones deben pasar por oauth-success en la nueva app
SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/api/auth/oauth-success/'
SOCIAL_AUTH_NEW_ASSOCIATION_REDIRECT_URL = '/api/auth/oauth-success/'
SOCIAL_AUTH_LOGIN_DONE_URL = '/api/auth/oauth-success/'
SOCIAL_AUTH_NEW_USER_REDIRECT_URL = '/api/auth/oauth-success/'

# Configuraciones adicionales para asegurar redirecciones adecuadas
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True if IS_RENDER else False
SOCIAL_AUTH_SANITIZE_REDIRECTS = True

# Microsoft Azure AD Configuration
SOCIAL_AUTH_AZUREAD_OAUTH2_KEY = os.environ.get('AZURE_AD_CLIENT_ID')
SOCIAL_AUTH_AZUREAD_OAUTH2_SECRET = os.environ.get('AZURE_AD_CLIENT_SECRET')
SOCIAL_AUTH_AZUREAD_OAUTH2_TENANT_ID = os.environ.get('AZURE_AD_TENANT_ID')

# Scopes requested from Microsoft
SOCIAL_AUTH_AZUREAD_OAUTH2_SCOPE = ['openid', 'email', 'profile', 'User.Read']

# Additional parameters for Microsoft login
SOCIAL_AUTH_AZUREAD_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
    'prompt': 'select_account'  # Always show account selection screen
}

# Add Google OAuth credentials
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')

# Configure Google OAuth scopes
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['email', 'profile']

# Pipeline to save extra data (like company, if available in claims)
# Ensure this points only to the new authentication app pipelines
SOCIAL_AUTH_PIPELINE = (
    'authentication.pipelines.clean_session',  # From authentication app
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'authentication.pipelines.handle_already_associated_auth',  # From authentication app
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'authentication.pipelines.save_profile_details', # From authentication app
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)

# --- JWT Settings ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('DJANGO_SECRET_KEY'),
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}