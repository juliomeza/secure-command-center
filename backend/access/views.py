from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import UserProfile
from .serializers import CompanySerializer, WarehouseSerializer, TabSerializer

# Create your views here.

class UserPermissionsView(APIView):
    """
    API view to retrieve the access permissions for the authenticated user.

    Requires authentication.
    Returns the user's allowed companies, warehouses, and tabs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            profile = request.user.access_profile
            # Check if the user is authorized (redundant if middleware is active, but good practice)
            if not profile.is_authorized:
                return Response(
                    {'detail': 'User is not authorized to access this application.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Serialize the allowed objects
            company_serializer = CompanySerializer(profile.allowed_companies.all(), many=True)
            warehouse_serializer = WarehouseSerializer(profile.allowed_warehouses.all(), many=True)
            tab_serializer = TabSerializer(profile.allowed_tabs.all(), many=True)

            permissions_data = {
                'allowed_companies': company_serializer.data,
                'allowed_warehouses': warehouse_serializer.data,
                'allowed_tabs': tab_serializer.data,
            }
            return Response(permissions_data, status=status.HTTP_200_OK)

        except UserProfile.DoesNotExist:
            # This case should ideally be handled by middleware or user creation signal
            return Response(
                {'detail': 'User profile not found. Authorization pending.'},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            # Log the exception e
            return Response(
                {'detail': 'An error occurred while retrieving permissions.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
