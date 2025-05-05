from django.contrib import admin
from .models import TestData, DataCardReport

@admin.register(TestData)
class TestDataAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'order_class_id', 'order_status_id', 'lookup_code', 'fetched_at')
    list_filter = ('order_class_id', 'order_status_id')
    search_fields = ('order_id', 'lookup_code')
    ordering = ('-fetched_at',)  # Ordenar por fecha de actualización, más reciente primero

@admin.register(DataCardReport)
class DataCardReportAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'warehouse', 'section', 'list_order', 'description', 
        'display_day1', 'display_day2', 'display_day3', 'display_day4',
        'display_day5', 'display_day6', 'display_day7', 'display_total',
        'display_type_indicators', 'year', 'week'
    )
    list_filter = (
        'warehouse_id', 'section', 'year', 'week', 
        'is_integer', 'is_percentage', 'is_text', 
        'is_title', 'has_heat_colors'
    )
    search_fields = ('warehouse', 'description')
    ordering = ('-year', '-week', 'warehouse_id', 'section', 'list_order')
    list_per_page = 50  # Muestra 50 registros por página en lugar del valor predeterminado (100)
    
    fieldsets = [
        ('Identificadores', {
            'fields': ['warehouse_id', 'warehouse_order', 'warehouse', 'section', 'list_order', 'description']
        }),
        ('Valores por día', {
            'fields': [
                ('day1_value', 'day2_value', 'day3_value', 'day4_value'),
                ('day5_value', 'day6_value', 'day7_value', 'total')
            ]
        }),
        ('Tipo de datos', {
            'fields': ['is_integer', 'is_percentage', 'is_text', 'is_title', 'has_heat_colors']
        }),
        ('Metadatos', {
            'fields': ['year', 'week', 'fetched_at']
        }),
    ]
    readonly_fields = ('fetched_at',)
    
    # Métodos personalizados para mostrar datos formateados
    def display_day1(self, obj):
        """Muestra el valor del día 1 con formato según su tipo"""
        if obj.day1_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day1_value}%"
        return obj.day1_value
    display_day1.short_description = 'Día 1'
    
    def display_day2(self, obj):
        """Muestra el valor del día 2 con formato según su tipo"""
        if obj.day2_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day2_value}%"
        return obj.day2_value
    display_day2.short_description = 'Día 2'
    
    def display_day3(self, obj):
        """Muestra el valor del día 3 con formato según su tipo"""
        if obj.day3_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day3_value}%"
        return obj.day3_value
    display_day3.short_description = 'Día 3'
    
    def display_day4(self, obj):
        """Muestra el valor del día 4 con formato según su tipo"""
        if obj.day4_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day4_value}%"
        return obj.day4_value
    display_day4.short_description = 'Día 4'
    
    def display_day5(self, obj):
        """Muestra el valor del día 5 con formato según su tipo"""
        if obj.day5_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day5_value}%"
        return obj.day5_value
    display_day5.short_description = 'Día 5'
    
    def display_day6(self, obj):
        """Muestra el valor del día 6 con formato según su tipo"""
        if obj.day6_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day6_value}%"
        return obj.day6_value
    display_day6.short_description = 'Día 6'
    
    def display_day7(self, obj):
        """Muestra el valor del día 7 con formato según su tipo"""
        if obj.day7_value is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.day7_value}%"
        return obj.day7_value
    display_day7.short_description = 'Día 7'
    
    def display_total(self, obj):
        """Muestra el valor total con formato"""
        if obj.total is None:
            return "-"
        if obj.is_percentage:
            return f"{obj.total}%"
        return obj.total
    display_total.short_description = 'Total'
    
    def display_type_indicators(self, obj):
        """Muestra indicadores del tipo de dato"""
        indicators = []
        if obj.is_integer:
            indicators.append("INT")
        if obj.is_percentage:
            indicators.append("%")
        if obj.is_text:
            indicators.append("TXT")
        if obj.is_title:
            indicators.append("TITLE")
        if not indicators:
            return "-"
        return ", ".join(indicators)
    display_type_indicators.short_description = 'Tipo'
