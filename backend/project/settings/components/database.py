"""
Database settings for the project.
"""
import os
import dj_database_url

# Determinar si estamos en entorno Render (producción)
IS_RENDER = os.environ.get('IS_RENDER', False)

# --- Database Configuration ---
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
            'PORT': os.environ.get('POSTGRES_PORT', '5432'),  # Mantiene tu puerto local
        }
    }