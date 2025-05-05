from django.db import models

class TestData(models.Model):
    order_id = models.IntegerField(primary_key=True)  # matches 'id' from SQL Server
    order_class_id = models.IntegerField()  # matches 'orderClassId'
    order_status_id = models.IntegerField()  # matches 'orderStatusId'
    lookup_code = models.CharField(max_length=255)  # matches 'lookupCode'
    fetched_at = models.DateTimeField(auto_now=True)  # automatically set when record is updated

    class Meta:
        db_table = 'data_testdata'
        verbose_name = 'Test Data'
        verbose_name_plural = 'Test Data'

    def __str__(self):
        return f"Order {self.order_id} - {self.lookup_code}"


class DataCardReport(models.Model):
    """
    Modelo para almacenar los datos de DataCard extraídos de MSSQL.
    Los datos se extraen de la función KPower_BI.RHL_DataCard_Reports.
    """
    # Identificadores
    warehouse_id = models.IntegerField()
    warehouse_order = models.FloatField(null=True, blank=True)  # Agregado campo warehouse_order
    warehouse = models.CharField(max_length=255)
    section = models.IntegerField()
    list_order = models.IntegerField()
    description = models.TextField()
    
    # Valores para cada día (conservamos string para mayor flexibilidad)
    day1_value = models.CharField(max_length=255, null=True, blank=True)
    day2_value = models.CharField(max_length=255, null=True, blank=True)
    day3_value = models.CharField(max_length=255, null=True, blank=True)
    day4_value = models.CharField(max_length=255, null=True, blank=True)
    day5_value = models.CharField(max_length=255, null=True, blank=True)
    day6_value = models.CharField(max_length=255, null=True, blank=True)
    day7_value = models.CharField(max_length=255, null=True, blank=True)
    
    # Valor total (suma de los días)
    total = models.CharField(max_length=255, null=True, blank=True)  # Agregado campo total
    
    # Indicadores de tipo
    is_integer = models.BooleanField(default=False)  # Basado en tInt
    is_percentage = models.BooleanField(default=False)  # Basado en totalPorc
    is_text = models.BooleanField(default=False)  # Basado en vText
    
    # Flags adicionales
    is_title = models.BooleanField(default=False)  # Agregado campo is_title
    has_heat_colors = models.BooleanField(default=False)  # Agregado campo has_heat_colors
    
    # Metadatos y organización
    year = models.IntegerField()
    week = models.IntegerField()
    fetched_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_datacardreport'
        unique_together = ('warehouse_id', 'section', 'list_order', 'year', 'week')
        indexes = [
            models.Index(fields=['warehouse_id']),
            models.Index(fields=['year', 'week']),
        ]
        verbose_name = 'DataCard Report'
        verbose_name_plural = 'DataCard Reports'

    def __str__(self):
        return f"DataCard - {self.warehouse} - {self.description}"
