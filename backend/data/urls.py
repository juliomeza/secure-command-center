# backend/data/urls.py
from django.urls import path
from .views import TestDataListView, DataCardReportListView

urlpatterns = [
    path('test-data/', TestDataListView.as_view(), name='test-data-list'),
    path('datacard-reports/', DataCardReportListView.as_view(), name='datacard-reports-list'),
]
