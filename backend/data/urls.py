# backend/data/urls.py
from django.urls import path
from .views import TestDataListView

urlpatterns = [
    path('test-data/', TestDataListView.as_view(), name='test-data-list'),
]
