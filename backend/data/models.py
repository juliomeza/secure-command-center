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
