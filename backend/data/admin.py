from django.contrib import admin
from .models import TestData

@admin.register(TestData)
class TestDataAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'order_class_id', 'order_status_id', 'lookup_code', 'fetched_at')
    list_filter = ('order_class_id', 'order_status_id')
    search_fields = ('order_id', 'lookup_code')
    ordering = ('-fetched_at',)  # Ordenar por fecha de actualización, más reciente primero
