# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs provided by social-auth-app-django

    # Include all authentication-related endpoints from the dedicated app
    path('api/auth/', include('authentication.urls')), 

    # Include access control endpoints
    path('api/access/', include('access.urls')), # Added this line
]