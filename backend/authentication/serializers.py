# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Company, UserProfile # Assuming models are still in core

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['company', 'azure_oid', 'job_title'] # Add other fields

# Renamed from UserSerializer to match the import in authentication.views
class AuthUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

# It seems TokenResponseSerializer was also imported in authentication/views.py
# Let's define it here if it's not already present.
class TokenResponseSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField()
    user = AuthUserSerializer(read_only=True) # Use the renamed serializer
