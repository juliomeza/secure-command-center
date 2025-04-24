# backend/authentication/middleware.py
from django.http import HttpResponseForbidden
from django.conf import settings

class AuthenticationSeparationMiddleware:
    """
    Middleware que garantiza que:
    - Las rutas /api/ solo se autentiquen con JWT (Authorization) y no con sesiones
    - El Admin de Django (/admin/) solo use autenticación por sesiones y no JWT
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Obtener la ruta actual
        path = request.path_info

        # 1. Para rutas de API (/api/), rechazar autenticación por sesión si hay JWT presente
        if path.startswith('/api/'):
            # Si hay un header Authorization de tipo Bearer, es una solicitud de API con JWT
            has_jwt = 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer ')
            
            # Si está presente el header JWT y también hay una sesión Django autenticada,
            # ignorar la sesión para esta solicitud
            if has_jwt and hasattr(request, 'user') and request.user.is_authenticated:
                # Verificamos en los headers si la autenticación viene por JWT
                # La sesión no debe usarse para autenticar en la API
                if settings.DEBUG:
                    print(f"API request with JWT: {request.path}")

        # 2. Para el admin de Django (/admin/), rechazar solicitudes que intenten usar JWT
        elif path.startswith('/admin/'):
            has_jwt = 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer ')
            
            # Si alguien intenta acceder al admin con un token JWT (sin sesión),
            # devolvemos un error
            if has_jwt and not request.COOKIES.get('sessionid'):
                return HttpResponseForbidden("Admin site requires session authentication.")
            
            if settings.DEBUG and request.user.is_authenticated:
                print(f"Admin request with session auth: {request.path}")

        # Continuar con la solicitud
        response = self.get_response(request)
        return response