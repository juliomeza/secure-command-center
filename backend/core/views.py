# backend/core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse
import logging

logger = logging.getLogger('core')

class UserProfileView(APIView):
    """
    API endpoint to get the authenticated user's profile information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.debug(f"UserProfileView accessed by user: {request.user}")
        logger.debug(f"Is user authenticated? {request.user.is_authenticated}")
        logger.debug(f"Session keys: {request.session.keys()}")
        logger.debug(f"Headers: {request.headers}")
        
        if not request.user.is_authenticated:
            logger.warning("User not authenticated in UserProfileView")
            return Response(
                {"detail": "Authentication credentials were not provided."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            serializer = UserSerializer(request.user)
            logger.debug(f"User data serialized: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in UserProfileView: {str(e)}")
            return Response(
                {"detail": "Error retrieving user profile"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
def get_csrf_token(request):
    """
    Endpoint to provide the CSRF token to the frontend.
    """
    token = get_token(request)
    logger.debug(f"CSRF token generated for user: {request.user}")
    return JsonResponse({'csrfToken': token})

# Note: If you rely purely on social login and GET requests for data,
# you might not need the explicit CSRF endpoint immediately, but it's
# good practice for future POST/PUT/DELETE operations from the SPA.