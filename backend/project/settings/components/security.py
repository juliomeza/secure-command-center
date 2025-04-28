"""
Security settings for the project.
"""
import os

# Determinar si estamos en entorno Render (producción)
IS_RENDER = os.environ.get('IS_RENDER', False)

# --- IMPORTANT SECURITY SETTINGS ---
# For production behind a reverse proxy (like Nginx in Docker setup)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'False') == 'True'

# HSTS settings (HTTP Strict Transport Security)
if IS_RENDER:  # Apply only in production
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# --- Session and Cookie Settings ---
# Configuración centralizada para todas las cookies
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600  # 1 hora
SESSION_SAVE_EVERY_REQUEST = True

# Configuración de cookies de sesión
# Restaurar nombre original
SESSION_COOKIE_NAME = 'sessionid' 
SESSION_COOKIE_SECURE = True if IS_RENDER else False
SESSION_COOKIE_HTTPONLY = True
# SameSite debe ser 'None' en producción para permitir cross-origin con HTTPS
SESSION_COOKIE_SAMESITE = 'None' if IS_RENDER else 'Lax'

# Configuración de cookies CSRF
# Restaurar nombre original
CSRF_COOKIE_NAME = 'csrftoken' 
CSRF_COOKIE_SECURE = True if IS_RENDER else False
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'None' if IS_RENDER else 'Lax'

# Configuración de dominios y paths para cookies
# Dejar el path por defecto '/' ya que los nombres ahora son diferentes
if IS_RENDER:
    # En producción, configurar correctamente los dominios
    FRONTEND_DOMAIN = 'dashboard-control-front.onrender.com'
    BACKEND_DOMAIN = 'dashboard-control-back.onrender.com'
    
    SESSION_COOKIE_DOMAIN = BACKEND_DOMAIN
    CSRF_COOKIE_DOMAIN = BACKEND_DOMAIN
    
    # Ya no necesitamos paths diferentes porque los nombres son diferentes
    SESSION_COOKIE_PATH = '/'
    CSRF_COOKIE_PATH = '/'

    # Variables antiguas (ya no usadas directamente para settings globales)
    ADMIN_COOKIE_PATH = '/admin' 
    API_COOKIE_PATH = '/' # API usa el path raíz ahora

    # Para la API y el admin, usar cookies con dominios/paths diferentes
    # Esta configuración se usa en el middleware o en las vistas según sea necesario
else:
    # En desarrollo, no configurar dominio específico
    SESSION_COOKIE_DOMAIN = None
    CSRF_COOKIE_DOMAIN = None
    # Ya no necesitamos paths diferentes
    SESSION_COOKIE_PATH = '/'
    CSRF_COOKIE_PATH = '/'
    ADMIN_COOKIE_PATH = '/admin'
    API_COOKIE_PATH = '/' # API usa el path raíz ahora

# CSRF Trusted Origins (Necessary when frontend is on a different port/domain)
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS')
if not CSRF_TRUSTED_ORIGINS:
    raise ValueError("CSRF_TRUSTED_ORIGINS is not set in the environment variables.")
CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS.split(',')