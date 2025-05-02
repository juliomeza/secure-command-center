# backend/data/serializers.py
from rest_framework import serializers
from .models import TestData, DataCardReport

class TestDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestData
        fields = ['order_id', 'order_class_id', 'order_status_id', 'lookup_code', 'fetched_at']

class DataCardReportSerializer(serializers.ModelSerializer):
    """Serializer para el modelo DataCardReport."""
    class Meta:
        model = DataCardReport
        fields = [
            'id', 'warehouse_id', 'warehouse_order', 'warehouse', 
            'section', 'list_order', 'description',
            'day1_value', 'day2_value', 'day3_value', 'day4_value', 
            'day5_value', 'day6_value', 'day7_value', 'total',
            'is_integer', 'is_percentage', 'is_text',
            'is_title', 'has_heat_colors',
            'year', 'week', 'fetched_at'
        ]
