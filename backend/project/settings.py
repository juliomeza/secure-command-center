# backend/project/settings.py
import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
from datetime import timedelta

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR.parent, '.env'))

# print(f"POSTGRES_USER: {os.environ.get('POSTGRES_USER')}")
# print(f"POSTGRES_PASSWORD: {os.environ.get('POSTGRES_PASSWORD')}")

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-fallback-key-for-dev') # CHANGE IN PRODUCTION!

# SECURITY WARNING: don't run with debug turned on in production!
# Cambiar a 'True' temporalmente para diagnosticar problemas de OAuth
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# --- IMPORTANT SECURITY SETTINGS ---
IS_RENDER = os.environ.get('IS_RENDER', False)

# Secure settings for production
if IS_RENDER:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Cookie settings
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Necesario para que el frontend pueda leer el token
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# --- Allowed Hosts ---
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '.onrender.com']  # .onrender.com permitirá todos los subdominios en Render

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
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For serving static files efficiently
    'django.contrib.sessions.middleware.SessionMiddleware',
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
IS_RENDER = os.environ.get('IS_RENDER', False)

# Luego, en la sección de DATABASES, reemplaza con esto:
if IS_RENDER:
    # Configuración de base de datos para Render (producción)
    DATABASES = {
        'default': dj_database_url.config(
            default=f"postgresql://{os.environ.get('POSTGRES_USER')}:{os.environ.get('POSTGRES_PASSWORD')}@{os.environ.get('POSTGRES_HOST')}:{os.environ.get('POSTGRES_PORT')}/{os.environ.get('POSTGRES_DB')}",
            conn_max_age=600
        )
    }
else:
    # Mantener tu configuración de base de datos actual para desarrollo
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB'),
            'USER': os.environ.get('POSTGRES_USER'),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
            'HOST': os.environ.get('POSTGRES_HOST'),
            'PORT': os.environ.get('POSTGRES_PORT', '5433'),  # Mantiene tu puerto local
        }
    }

# Añade esta configuración para Render
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

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

# Determinar las URLs de frontend según el entorno
FRONTEND_BASE_URL = 'https://dashboard-control-front.onrender.com' if IS_RENDER else 'http://localhost:5173'

LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL', f'{FRONTEND_BASE_URL}/') # Redirect after successful social login
LOGOUT_REDIRECT_URL = os.environ.get('LOGOUT_REDIRECT_URL', f'{FRONTEND_BASE_URL}/login') # Redirect after logout

# Forzar el uso de URLs absolutas para las redirecciones
USE_X_FORWARDED_HOST = True

# --- OAuth and Session Configuration ---
SOCIAL_AUTH_STRATEGY = 'core.oauth.JWTStrategy'  # Use our new JWT strategy
SOCIAL_AUTH_STORAGE = 'social_django.models.DjangoStorage'
SOCIAL_AUTH_DISCONNECT_PIPELINE = (
    'social_core.pipeline.disconnect.allowed_to_disconnect',
    'social_core.pipeline.disconnect.get_entries',
    'social_core.pipeline.disconnect.revoke_tokens',
    'social_core.pipeline.disconnect.disconnect'
)
SOCIAL_AUTH_JSONFIELD_ENABLED = True

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None'  # Required for OAuth redirects
SESSION_COOKIE_DOMAIN = '.onrender.com' if os.environ.get('IS_RENDER', False) else None
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Redis cache for better session handling
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Azure AD specific settings
SOCIAL_AUTH_AZUREAD_OAUTH2_KEY = os.environ.get('AZURE_AD_CLIENT_ID')
SOCIAL_AUTH_AZUREAD_OAUTH2_SECRET = os.environ.get('AZURE_AD_CLIENT_SECRET')
SOCIAL_AUTH_AZUREAD_OAUTH2_TENANT_ID = os.environ.get('AZURE_AD_TENANT_ID')
SOCIAL_AUTH_AZUREAD_OAUTH2_RESOURCE = 'https://graph.microsoft.com/'
SOCIAL_AUTH_AZUREAD_OAUTH2_SCOPE = ['openid', 'email', 'profile', 'User.Read']
SOCIAL_AUTH_AZUREAD_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
    'response_mode': 'form_post',
    'prompt': 'select_account'
}

# OAuth settings
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)

SOCIAL_AUTH_LOGIN_ERROR_URL = f'{FRONTEND_BASE_URL}/login'
SOCIAL_AUTH_RAISE_EXCEPTIONS = True
SOCIAL_AUTH_SANITIZE_REDIRECTS = True
SOCIAL_AUTH_REDIRECT_IS_HTTPS = True if IS_RENDER else False
SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS = [
    'localhost:5173',
    '127.0.0.1:5173',
    'dashboard-control-front.onrender.com',
]

SOCIAL_AUTH_LOGIN_REDIRECT_URL = os.environ.get('SOCIAL_AUTH_LOGIN_REDIRECT_URL', f'{FRONTEND_BASE_URL}/dashboard')
# Configuraciones adicionales para asegurar redirecciones adecuadas
SOCIAL_AUTH_SANITIZE_REDIRECTS = True
SOCIAL_AUTH_AUTHENTICATION_BACKENDS_TIMEOUT = 300
SOCIAL_AUTH_SESSION_EXPIRATION = False  # Don't expire sessions

# Add Google OAuth credentials
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')

# Configure Google OAuth scopes
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ['email', 'profile']

# Specify the User model if you customize it later
# AUTH_USER_MODEL = 'core.CustomUser'

# --- Django REST Framework Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
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
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'https://dashboard-control-front.onrender.com',
    'https://accounts.google.com',
    'https://login.microsoftonline.com',
]
CORS_EXPOSE_HEADERS = ['Set-Cookie']
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cookie',
]

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'https://dashboard-control-front.onrender.com',
    'https://accounts.google.com',
    'https://login.microsoftonline.com',
]
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_USE_SESSIONS = True  # Store CSRF token in the session
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_DOMAIN = '.onrender.com' if os.environ.get('IS_RENDER', False) else None

# --- Session and Cookie Settings ---
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_DOMAIN = '.onrender.com' if os.environ.get('IS_RENDER', False) else None
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None'  # Required for OAuth redirects
SESSION_SAVE_EVERY_REQUEST = True  # Important for OAuth state
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Security and Cookie settings based on environment
IS_RENDER = os.environ.get('IS_RENDER', False)

if IS_RENDER:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Specific domain settings for production
    CSRF_COOKIE_DOMAIN = '.onrender.com'
    SESSION_COOKIE_DOMAIN = '.onrender.com'
    
    ALLOWED_HOSTS = [
        'localhost',
        '127.0.0.1',
        '.onrender.com',
        'dashboard-control-back.onrender.com',
        'dashboard-control-front.onrender.com',
    ]
else:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# --- Logging Configuration ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'social_core': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}