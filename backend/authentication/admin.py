from django.contrib import admin
from .models import UserProfile # Import UserProfile from local models

# Register your models here.
admin.site.register(UserProfile) # Register UserProfile
