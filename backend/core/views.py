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
    """API endpoint to get the authenticated user's profile information."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user profile with detailed logging."""
        logger.info("=== UserProfileView Accessed ===")
        logger.info(f"User: {request.user}")
        logger.info(f"Authenticated: {request.user.is_authenticated}")
        logger.info(f"Session ID: {request.session.session_key}")
        logger.info(f"Session Keys: {list(request.session.keys())}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Cookies: {request.COOKIES}")

        if not request.user.is_authenticated:
            logger.warning("User not authenticated in UserProfileView")
            return Response(
                {"detail": "Authentication credentials were not provided."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            serializer = UserSerializer(request.user)
            logger.info("User data serialized successfully")
            logger.debug(f"Serialized data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in UserProfileView: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Error retrieving user profile", "error": str(e)}, 
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

def get_csrf_token(request):
    """Endpoint to provide the CSRF token to the frontend."""
    token = get_token(request)
    logger.info(f"CSRF token generated for user: {request.user}")
    logger.debug(f"Session ID: {request.session.session_key}")
    return JsonResponse({'csrfToken': token})

# Note: If you rely purely on social login and GET requests for data,
# you might not need the explicit CSRF endpoint immediately, but it's
# good practice for future POST/PUT/DELETE operations from the SPA.