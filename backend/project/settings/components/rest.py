"""
REST Framework and CORS settings for the project.
"""
import os

# Determinar si estamos en entorno Render (producción)
IS_RENDER = os.environ.get('IS_RENDER', False)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# --- Django REST Framework Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Forzar solo JWT Authentication para la API
        'rest_framework_simplejwt.authentication.JWTAuthentication',
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
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        # LoginRateThrottle is applied specifically in authentication views, not globally needed here.
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/minute',
        'user': '1000/minute',
        # The 'login' scope is defined and used within the authentication app's throttling.
        'login': '5/minute', 
    },
}
# Remove None from renderers list if present
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    r for r in REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] if r is not None
]

# --- CORS Settings (Cross-Origin Resource Sharing) ---
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS')
if not CORS_ALLOWED_ORIGINS:
    raise ValueError("CORS_ALLOWED_ORIGINS is not set in the environment variables.")
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS.split(',')

CORS_ALLOW_CREDENTIALS = True  # Allows cookies to be sent cross-origin

# Configuraciones adicionales para CORS
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
CORS_ALLOW_HEADERS = ['accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with']
CORS_EXPOSE_HEADERS = ['content-type', 'content-length']