# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    is_app_authorized = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_app_authorized']

    def get_is_app_authorized(self, obj):
        """Checks if the user has an access profile and is authorized."""
        try:
            profile = getattr(obj, 'access_profile', None)
            if profile:
                return profile.is_authorized
            return False # No profile found
        except AttributeError:
            # Handle cases where access_profile relation might not exist on User model (should not happen)
            return False

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
