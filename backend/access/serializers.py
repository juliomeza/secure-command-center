# filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\backend\access\serializers.py
from rest_framework import serializers
from .models import Company, Warehouse, Tab

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name'] # Return ID and name

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name'] # Return ID and name

class TabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tab
        fields = ['id', 'id_name', 'display_name'] # Return ID, internal name, and display name
