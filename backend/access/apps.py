from django.apps import AppConfig


class AccessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'access'

    def ready(self):
        # Import signals here to ensure they are connected when the app is ready.
        pass
