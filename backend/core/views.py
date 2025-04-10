# backend/core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .serializers import UserSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class UserProfileView(APIView):
    """
    API endpoint to get the authenticated user's profile information.
    """
    permission_classes = [AllowAny]  # Permitir acceso a todos temporalmente para depuración

    def get(self, request):
        # Add debug print statements
        print("Request user:", request.user)
        print("Is authenticated:", request.user.is_authenticated)
        
        # Return data even if not authenticated (for testing)
        if request.user.is_authenticated:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        else:
            # For debugging - return something even if not authenticated
            return Response({"status": "not_authenticated", "message": "Session not recognized"}, 
                           status=status.HTTP_200_OK)

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
    The frontend should fetch this once and include the token
    in the 'X-CSRFToken' header for subsequent state-changing requests.
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})