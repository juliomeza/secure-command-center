# filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\backend\access\urls.py
from django.urls import path
from .views import UserPermissionsView

app_name = 'access' # Optional: Define an app namespace

urlpatterns = [
    path('permissions/', UserPermissionsView.as_view(), name='user_permissions'),
]
