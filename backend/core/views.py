# backend/core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import redirect
from django.conf import settings
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse
import logging

logger = logging.getLogger('core')

class TokenObtainView(APIView):
    """Vista para obtener tokens después de OAuth"""
    permission_classes = [AllowAny]

    def get(self, request):
        # Verificar si tenemos tokens temporales en la sesión
        access_token = request.session.pop('access_token', None)
        refresh_token = request.session.pop('refresh_token', None)

        if not access_token or not refresh_token:
            return Response({
                'error': 'No tokens found in session'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Construir la URL de redirección con los tokens
        redirect_url = f"{settings.FRONTEND_BASE_URL}/auth-callback?access_token={access_token}&refresh_token={refresh_token}"
        
        return redirect(redirect_url)

class UserProfileView(APIView):
    """API endpoint para obtener información del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class LogoutView(APIView):
    """Vista para cerrar sesión y revocar tokens"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

def get_csrf_token(request):
    """Endpoint to provide the CSRF token to the frontend."""
    token = get_token(request)
    logger.info(f"CSRF token generated for user: {request.user}")
    logger.debug(f"Session ID: {request.session.session_key}")
    return JsonResponse({'csrfToken': token})

# Note: If you rely purely on social login and GET requests for data,
# you might not need the explicit CSRF endpoint immediately, but it's
# good practice for future POST/PUT/DELETE operations from the SPA.