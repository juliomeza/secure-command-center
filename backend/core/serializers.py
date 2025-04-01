# backend/core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Company, UserProfile

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['company', 'azure_oid', 'job_title'] # Add other fields

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']