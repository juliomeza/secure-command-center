"""
Production-specific settings (for render.com deployment).
"""
import os

# Import base settings
from .base import *

# Import components
from .components.auth import *
from .components.database import *
from .components.rest import *
from .components.security import *

# Override settings for production environment
DEBUG = False

# Configuraciones específicas de Render
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Logging settings for production - más restringido que en desarrollo
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}