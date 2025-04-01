# backend/project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView # For serving React index.html if needed
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls', namespace='social')), # OAuth URLs
    path('api/', include('core.urls')), # Your app's API endpoints

    # Optional: Route for Django admin logout if not using React for everything
    path('logout/', LogoutView.as_view(), name='logout'),

    # Catch-all for React routing, if serving React build files from Django (less common with Vite dev server)
    # re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]