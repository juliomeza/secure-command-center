# backend/project/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR.parent, '.env')) # Load .env from root

print(f"POSTGRES_USER: {os.environ.get('POSTGRES_USER')}")
print(f"POSTGRES_PASSWORD: {os.environ.get('POSTGRES_PASSWORD')}")

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-fallback-key-for-dev') # CHANGE IN PRODUCTION!

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# --- IMPORTANT SECURITY SETTINGS ---
# For production behind a reverse proxy (like Nginx in Docker setup)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('DJANGO_SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('DJANGO_CSRF_COOKIE_SECURE', 'False') == 'True'
# Set to True in production if behind HTTPS

# HttpOnly flags are True by default for Session and CSRF cookies which is good.
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True # Keep False if frontend needs to read it, True otherwise. Usually True.

# SameSite Cookie attribute
SESSION_COOKIE_SAMESITE = 'Lax' # Recommended default. Can be 'Strict' if needed.
CSRF_COOKIE_SAMESITE = 'Lax'

# --- Allowed Hosts ---
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',
    'social_django', # OAuth2 authentication
    'sslserver',     # For Development HTTPS only

    # Your apps
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For serving static files efficiently
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # CORS Middleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware', # Handle OAuth errors
]

ROOT_URLCONF = 'project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends', # OAuth context
                'social_django.context_processors.login_redirect', # OAuth context
            ],
        },
    },
]

WSGI_APPLICATION = 'project.wsgi.application'

# --- Database Configuration ---
# https://docs.djangoproject.com/en/stable/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('POSTGRES_HOST'),
        'PORT': os.environ.get('POSTGRES_PORT', '5433'),
    }
}

# --- Password validation ---
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    # ... default validators ...
]

# --- Internationalization ---
# https://docs.djangoproject.com/en/stable/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static files (CSS, JavaScript, Images) ---
# https://docs.djangoproject.com/en/stable/howto/static-files/
STATIC_URL = '/static/'
# For production deployment with WhiteNoise or Nginx
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# Simplified static file handling for development with WhiteNoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# Default primary key field type
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Authentication Configuration ---
AUTHENTICATION_BACKENDS = (
    'social_core.backends.azuread.AzureADOAuth2', # Microsoft Azure AD OAuth2
    'social_core.backends.google.GoogleOAuth2', # Google OAuth2
    'django.contrib.auth.backends.ModelBackend', # Default Django auth (for admin, etc.)
)

# --- Social Auth (OAuth2/OpenID Connect) Settings ---
LOGIN_URL = '/auth/login/' # Where to redirect if @login_required fails
LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL', 'http://localhost:5173/') # Redirect after successful social login (frontend URL)
LOGOUT_REDIRECT_URL = os.environ.get('LOGOUT_REDIRECT_URL', 'http://localhost:5173/login') # Redirect after logout (frontend URL)

# Forzar el uso de URLs absolutas para las redirecciones
USE_X_FORWARDED_HOST = True
SOCIAL_AUTH_STRATEGY = 'social_django.strategy.DjangoStrategy'
SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS = ['localhost:5173', '127.0.0.1:5173', 'localhost:8000', '127.0.0.1:8000']
SOCIAL_AUTH_LOGIN_REDIRECT_URL = 'http://localhost:5173/dashboard'  # URL específica para redirección post-login

# Microsoft Azure AD Configuration (Get these from Azure Portal)
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
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    # Add a custom pipeline step to associate company or save extra data
    'core.pipelines.save_profile_details', # Custom step (implement below)
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)

# Specify the User model if you customize it later
# AUTH_USER_MODEL = 'core.CustomUser'

# --- Django REST Framework Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Use Session Authentication as primary for browser-based clients
        'rest_framework.authentication.SessionAuthentication',
        # Potentially add TokenAuthentication if you need API keys later
        # 'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        # Default to requiring authentication for all API endpoints
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        # Add BrowsableAPIRenderer only if DEBUG is True
        'rest_framework.renderers.BrowsableAPIRenderer' if DEBUG else None,
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
    )
}
# Remove None from renderers list if present
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    r for r in REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] if r is not None
]

# --- CORS Settings (Cross-Origin Resource Sharing) ---
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
CORS_ALLOW_CREDENTIALS = True # IMPORTANT: Allows cookies to be sent cross-origin

# CSRF Trusted Origins (Necessary when frontend is on a different port/domain)
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')

# --- Logging Configuration (Optional but Recommended) ---
# Add basic logging configuration here if needed