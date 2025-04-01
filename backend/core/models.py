# backend/core/models.py
from django.db import models
from django.contrib.auth.models import User

class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # Add other company details if needed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    # Store additional details from OAuth if needed
    azure_oid = models.CharField(max_length=100, blank=True, null=True, unique=True) # Store Azure Object ID
    job_title = models.CharField(max_length=100, blank=True, null=True)
    # Add other fields as necessary

    def __str__(self):
        return self.user.username