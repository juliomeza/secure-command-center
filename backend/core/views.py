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

class UserProfileView(APIView):
    """
    API endpoint to get the authenticated user's profile information.
    """
    permission_classes = [IsAuthenticated] # Ensure user is logged in

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# --- JWT Token Generation ---
class TokenObtainView(APIView):
    """
    Endpoint to obtain JWT tokens after OAuth2 authentication.
    This allows the frontend to get tokens for future API calls.
    """
    throttle_classes = [LoginRateThrottle]
    permission_classes = [IsAuthenticated]  # User must be already authenticated via OAuth2

    def get(self, request):
        # Generate tokens for the authenticated user
        refresh = RefreshToken.for_user(request.user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(request.user).data  # Include user data for convenience
        })

# Nueva vista para generar tokens JWT y redirigir después del login OAuth2
def oauth_success_redirect(request):
    """
    Vista que genera tokens JWT después de un login OAuth2 exitoso y redirige al frontend.
    """
    if request.user.is_authenticated:
        # Primero asegurar que el token CSRF está establecido
        csrf_token = get_token(request)

        # URL a la que redirigiremos después de generar los tokens
        redirect_url = f"{settings.FRONTEND_BASE_URL}/dashboard"
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(request.user)
        
        # Añadir los tokens como parámetros de consulta en la URL de redirección
        redirect_url_with_params = f"{redirect_url}?jwt_access={str(refresh.access_token)}&jwt_refresh={str(refresh)}"
        
        # Redirigir al frontend con los tokens
        response = HttpResponseRedirect(redirect_url_with_params)
        
        # Asegurar que las cookies tengan los atributos correctos
        response['X-CSRFToken'] = csrf_token
        return response
    
    # Si el usuario no está autenticado, redirigirlo a la página de login
    return HttpResponseRedirect(f"{settings.FRONTEND_BASE_URL}/login")

# --- Company Access Restriction Logic ---
# This needs to be implemented based on your specific requirements.
# Options:
# 1. Filter QuerySets: In views that return lists (e.g., ListAPIView), filter
#    the queryset based on `request.user.profile.company`.
#    Example: `queryset = MyModel.objects.filter(company=request.user.profile.company)`
# 2. Custom Permissions: Create a DRF permission class that checks if the requested
#    object belongs to the user's company or if the user has rights based on company.
# 3. Middleware: For more global checks, middleware can inspect the request path
#    or parameters and verify against the user's company.

# --- CSRF Token Endpoint ---
# Needed if your frontend makes POST/PUT/DELETE requests and needs the token.
# GET requests usually don't need CSRF protection. Session auth handles CSRF.
# If using HttpOnly session cookies, CSRF protection is vital.
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Endpoint to get a new CSRF token and ensure the cookie is set
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

# Note: If you rely purely on social login and GET requests for data,
# you might not need the explicit CSRF endpoint immediately, but it's
# good practice for future POST/PUT/DELETE operations from the SPA.