# backend/core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from .throttling import LoginRateThrottle
from django.contrib.auth import login
from django.contrib.auth.signals import user_logged_in
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthAlreadyAssociated

# --- Views ---
class UserProfileView(APIView):
    """
    API endpoint to get the authenticated user's profile information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class TokenObtainView(APIView):
    """
    Endpoint to obtain JWT tokens after OAuth2 authentication.
    """
    throttle_classes = [LoginRateThrottle]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        refresh = RefreshToken.for_user(request.user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(request.user).data
        })

def oauth_success_redirect(request):
    """
    Vista que genera tokens JWT después de un login OAuth2 exitoso y redirige al frontend.
    """
    try:
        if not request.user.is_authenticated:
            return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

        # Regenerar la sesión de forma segura
        if not request.session.exists(request.session.session_key):
            request.session.create()
        
        # Almacenar el ID del usuario en la sesión
        request.session['user_id'] = request.user.id
        request.session.modified = True

        # Generar CSRF token y tokens JWT
        csrf_token = get_token(request)
        refresh = RefreshToken.for_user(request.user)

        # Preparar URL de redirección con tokens
        redirect_url = f"{settings.FRONTEND_BASE_URL}/dashboard"
        redirect_url_with_params = f"{redirect_url}?jwt_access={str(refresh.access_token)}&jwt_refresh={str(refresh)}"

        # Preparar respuesta
        response = HttpResponseRedirect(redirect_url_with_params)
        response['X-CSRFToken'] = csrf_token

        # Asegurar que la cookie de sesión esté configurada correctamente
        if request.session.session_key:
            response.set_cookie(
                'sessionid',
                request.session.session_key,
                secure=settings.SESSION_COOKIE_SECURE,
                httponly=True,
                samesite=settings.SESSION_COOKIE_SAMESITE,
                domain=settings.SESSION_COOKIE_DOMAIN,
                max_age=settings.SESSION_COOKIE_AGE
            )

        return response
    except Exception as e:
        print(f"Error en oauth_success_redirect: {str(e)}")
        return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Endpoint to get a new CSRF token and ensure the cookie is set
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})