# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile # Assuming models are now in authentication

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['azure_oid', 'job_title'] # Add other fields

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer for the response containing JWT tokens and user info.
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()

    def create(self, validated_data):
        # This serializer is read-only for responses, no create needed
        raise NotImplementedError()

    def update(self, instance, validated_data):
        # This serializer is read-only for responses, no update needed
        raise NotImplementedError()
