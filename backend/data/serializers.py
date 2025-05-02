# backend/data/serializers.py
from rest_framework import serializers
from .models import TestData

class TestDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestData
        fields = ['order_id', 'order_class_id', 'order_status_id', 'lookup_code', 'fetched_at']
