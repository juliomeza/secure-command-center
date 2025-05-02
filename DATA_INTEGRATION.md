# Arquitectura de Integración de Datos

Este documento describe la arquitectura y plan de implementación para el sistema de integración de datos del Secure Command Center.

## 1. Visión General

El sistema de integración de datos reemplazará los datos simulados (mock data) actuales con datos reales provenientes de múltiples sistemas fuente, proporcionando métricas e indicadores actualizados para todos los dashboards de la aplicación.

### 1.1. Objetivos

- Obtener datos reales de sistemas operacionales (WMS, ERP, etc.)
- Transformar y normalizar los datos para su uso en dashboards
- Mantener consistencia con el modelo de control de acceso existente
- Proporcionar actualizaciones regulares con mínimo impacto operacional
- Soportar diferentes niveles de granularidad para distintos roles de usuario

### 1.2. Componentes Principales

- **App de Datos**: Nuevo módulo Django (`data`) para gestionar ETL
- **Almacén de Datos**: Esquemas en PostgreSQL para datos operacionales
- **APIs de Datos**: Endpoints para consumo del frontend
- **Tareas Programadas**: Procesos de sincronización automática

## 2. Fuentes de Datos

### 2.1. Sistemas Primarios

- **MSSQL (WMS)**: Sistema de gestión de almacenes con datos operacionales
- **QuickBooks**: Sistema financiero y contable
- **ADP**: Sistema de recursos humanos y nómina

### 2.2. Sistemas Secundarios (Futuros)

- **CRM**: Datos de clientes y ventas
- **Sistemas IoT**: Datos de sensores y equipamiento
- **Sistemas de Calidad**: Métricas de calidad de productos

## 3. Modelo de Datos

### 3.1. Enfoque Multinivel

El almacenamiento de datos seguirá un modelo de tres niveles:

#### Nivel 1: Datos Transaccionales (Granulares)

```python
# Ejemplo conceptual, no código real
class OrderDetail(models.Model):
    order_id = models.CharField(max_length=50)
    order_type = models.CharField(max_length=50)  # 'inbound', 'outbound'
    timestamp = models.DateTimeField()
    customer_id = models.CharField(max_length=50, null=True)
    items_count = models.IntegerField()
    warehouse = models.ForeignKey('access.Warehouse', on_delete=models.CASCADE)
    company = models.ForeignKey('access.Company', on_delete=models.CASCADE)
    order_status = models.CharField(max_length=50)
    last_modified = models.DateTimeField(auto_now=True)
    source_system_id = models.CharField(max_length=50)
    source_modified_timestamp = models.DateTimeField()
```

#### Nivel 2: Agregaciones Diarias

```python
# Ejemplo conceptual, no código real
class DailyMetrics(models.Model):
    date = models.DateField()
    metric_name = models.CharField(max_length=100)  # 'inbound_orders', 'outbound_orders', 'revenue', etc.
    metric_value = models.DecimalField(max_digits=15, decimal_places=2)
    warehouse = models.ForeignKey('access.Warehouse', on_delete=models.CASCADE)
    company = models.ForeignKey('access.Company', on_delete=models.CASCADE)
    is_reconciled = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
```

#### Nivel 3: Datos de Referencia

```python
# Ejemplo conceptual, no código real
class MetricDefinition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=50)  # 'financial', 'operational', 'hr', etc.
    calculation_method = models.TextField()  # Descripción del cálculo o fórmula
    applicable_roles = models.ManyToManyField('access.Tab')  # Qué roles/tabs pueden ver esta métrica
```

#### Ejemplos Concretos de Datos por Nivel

##### Nivel 1: Datos Transaccionales (Registros individuales)
- **OrderDetail**:
  ```
  {
    "order_id": "WO-78901",
    "order_type": "inbound",
    "timestamp": "2025-04-30 14:35:22",
    "customer_id": "NIKE123",
    "items_count": 120,
    "warehouse_id": 3,
    "company_id": 2,
    "order_status": "completed",
    "source_system_id": "WMS_MSSQL"
  }
  ```

- **InventoryTransaction**:
  ```
  {
    "transaction_id": "INV-45678",
    "item_sku": "NIKE-AIR-42-BLK",
    "quantity": 25,
    "transaction_type": "receiving",
    "location_id": "RACK-A42-LEVEL3",
    "warehouse_id": 3,
    "employee_id": "EMP123"
  }
  ```

- **EmployeeActivity**:
  ```
  {
    "employee_id": "EMP123",
    "activity_type": "picking",
    "start_time": "2025-04-30 09:00:00",
    "end_time": "2025-04-30 17:00:00",
    "items_processed": 342,
    "orders_completed": 47
  }
  ```

##### Nivel 2: Agregaciones Diarias (Métricas calculadas)
- **DailyMetrics** (Órdenes entrantes):
  ```
  {
    "date": "2025-04-30",
    "metric_name": "inbound_orders_count",
    "metric_value": 127,
    "warehouse_id": 3,
    "company_id": 2,
    "is_reconciled": true
  }
  ```

- **DailyMetrics** (Ingresos diarios):
  ```
  {
    "date": "2025-04-30",
    "metric_name": "daily_revenue",
    "metric_value": 125750.25,
    "warehouse_id": 3,
    "company_id": 2
  }
  ```

- **DailyMetrics** (Productividad):
  ```
  {
    "date": "2025-04-30",
    "metric_name": "picks_per_hour_avg",
    "metric_value": 87.5,
    "warehouse_id": 3,
    "company_id": 2
  }
  ```

##### Nivel 3: Datos de Referencia (Metadatos y configuración)
- **MetricDefinition**:
  ```
  {
    "name": "picks_per_hour_avg",
    "display_name": "Promedio de Picks por Hora",
    "description": "Número promedio de picks completados por hora de trabajo",
    "category": "operational",
    "applicable_roles": ["warehouse_manager", "operations_director"]
  }
  ```

- **KPITarget**:
  ```
  {
    "metric_name": "picks_per_hour_avg",
    "target_value": 95.0,
    "min_acceptable": 80.0,
    "applicable_warehouse_id": 3
  }
  ```

### 3.2. Integración con Control de Acceso

Todos los modelos de datos incluirán:

- Referencias a `Company` y `Warehouse` del sistema de acceso existente
- Filtros automáticos basados en los permisos del usuario
- Compatibilidad con el sistema de tabs/vistas existente

## 4. Proceso ETL

### 4.1. Extracción

- Conexiones programadas a sistemas fuente
- Extracción incremental basada en marcas de tiempo
- Registro de última sincronización exitosa
- Manejo de fallos y reintentos

```python
# Ejemplo conceptual, no código real
def extract_wms_orders(source_config, last_sync_timestamp):
    connection = create_connection(source_config)
    query = f"""
        SELECT * FROM Orders 
        WHERE ModifiedDate > '{last_sync_timestamp}'
        ORDER BY ModifiedDate
    """
    return execute_query(connection, query)
```

### 4.2. Transformación

- Normalización de formatos entre fuentes
- Cálculo de métricas derivadas
- Validación y limpieza de datos
- Transformación a estructura destino

```python
# Ejemplo conceptual, no código real
def transform_order_data(raw_orders, warehouse_mapping, company_mapping):
    transformed_orders = []
    for order in raw_orders:
        transformed = {
            'order_id': order['OrderNumber'],
            'timestamp': parse_date(order['CreatedDate']),
            'warehouse_id': warehouse_mapping.get(order['WarehouseCode']),
            'company_id': company_mapping.get(order['CompanyCode']),
            'status': normalize_status(order['Status']),
            # más transformaciones...
        }
        transformed_orders.append(transformed)
    return transformed_orders
```

### 4.3. Carga

- Carga transaccional para asegurar consistencia
- Preservación de datos históricos
- Actualización de métricas agregadas
- Registro de cambios para auditoría

```python
# Ejemplo conceptual, no código real
def load_order_data(transformed_orders):
    with transaction.atomic():
        for order_data in transformed_orders:
            order, created = OrderDetail.objects.update_or_create(
                order_id=order_data['order_id'],
                source_system_id=order_data['source_system_id'],
                defaults=order_data
            )
```

### 4.4. Reconciliación de Datos

Para manejar modificaciones tardías:

1. Detectar cambios en órdenes ya procesadas
2. Actualizar registros detallados
3. Recalcular agregaciones afectadas
4. Registrar cambios para auditoría

```python
# Ejemplo conceptual, no código real
def reconcile_modified_data(modified_records):
    affected_dates = set()
    
    for record in modified_records:
        # Actualizar registro detallado
        update_detail_record(record)
        
        # Registrar el cambio
        log_data_change(record)
        
        # Identificar fechas afectadas
        affected_dates.add(record['date'])
    
    # Recalcular agregaciones para las fechas afectadas
    for date in affected_dates:
        recalculate_daily_aggregations(date)
```

## 5. Diseño de API

### 5.1. Endpoints por Rol

Cada dashboard tendrá endpoints específicos con los datos relevantes:

```python
# Ejemplo conceptual, no código real
class CEODashboardViewSet(viewsets.ViewSet):
    def list(self, request):
        # Obtener parámetros
        company_ids = get_allowed_companies(request.user)
        date_range = get_date_range_from_params(request)
        
        # Obtener métricas relevantes para CEO
        revenue = get_company_revenue(company_ids, date_range)
        profit = get_company_profit(company_ids, date_range)
        
        return Response({
            'revenue': revenue,
            'profit': profit,
            # otras métricas...
        })
```

### 5.2. Filtrado por Acceso

Todas las consultas incluirán filtrado automático:

```python
# Ejemplo conceptual, no código real
def get_warehouse_metrics(user, metric_names, date_range):
    # Obtener almacenes permitidos para el usuario
    warehouses = user.userprofile.allowed_warehouses.all()
    
    # Filtrar métricas por almacenes permitidos
    metrics = DailyMetrics.objects.filter(
        warehouse__in=warehouses,
        metric_name__in=metric_names,
        date__range=date_range
    )
    
    return metrics
```

### 5.3. Granularidad Dinámica

Soporte para solicitar diferentes niveles de agregación:

```python
# Ejemplo conceptual, no código real
def aggregate_metrics(metrics, granularity):
    """
    Agregar métricas según granularidad solicitada:
    - 'day': Sin agregación adicional
    - 'week': Agrupar por semana
    - 'month': Agrupar por mes
    - 'quarter': Agrupar por trimestre
    - 'year': Agrupar por año
    """
    if granularity == 'day':
        return metrics
    
    # Agrupar por período solicitado
    return metrics.annotate(
        period=Trunc('date', granularity),
    ).values(
        'period', 'metric_name', 'company'
    ).annotate(
        value=Sum('metric_value')
    ).order_by('period')
```

## 6. Estructura del Proyecto

### 6.1. Nueva App Django

```
backend/
  └── data/
      ├── __init__.py
      ├── admin.py
      ├── apps.py
      ├── models.py
      ├── views.py
      ├── urls.py
      ├── tests.py
      ├── services/
      │   ├── __init__.py
      │   ├── etl_service.py
      │   ├── connectors/
      │   │   ├── __init__.py
      │   │   ├── mssql_connector.py
      │   │   ├── quickbooks_connector.py
      │   │   └── adp_connector.py
      │   ├── transformers/
      │   └── loaders/
      └── tasks/
          ├── __init__.py
          └── scheduled_tasks.py
```

### 6.2. Configuración Celery para Tareas

```python
# Ejemplo conceptual, no código real
# project/celery.py
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('secure_command_center')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# data/tasks/scheduled_tasks.py
from celery import shared_task
from ..services.etl_service import ETLService

@shared_task
def sync_wms_data():
    etl = ETLService()
    etl.sync_data('wms')

@shared_task
def sync_financial_data():
    etl = ETLService()
    etl.sync_data('quickbooks')
```

## 7. Plan de Implementación

### 7.0. Fase 0: Ambiente de Pruebas (1 Semana)

- Crear nuevo tab "Testing"
- Implementar dashboard básico en el frontend para este tab
- Configurar endpoints de prueba en el backend
- Establecer conexión inicial con PostgreSQL
- Implementar visualización básica de datos de prueba
- Validar sistema de permisos y control de acceso

### 7.1. Fase 1: Cimientos (2 Semanas)

- Crear app `data`
- Diseñar e implementar modelos de datos
- Configurar entorno de integración
- Implementar conector base para MSSQL

### 7.2. Fase 2: Flujo de Datos Inicial (3 Semanas)

- Desarrollar proceso ETL para datos del WMS
- Implementar API para dashboard de Warehouse Leaders
- Crear tareas programadas para sincronización
- Actualizar frontend para consumir datos reales

### 7.3. Fase 3: Expansión de Fuentes (4 Semanas)

- Agregar conectores para QuickBooks y ADP
- Desarrollar transformaciones para datos financieros y de RRHH
- Extender API para dashboards CEO y CFO
- Implementar proceso de reconciliación de datos

### 7.4. Fase 4: Consolidación (3 Semanas)

- Completar endpoints para todos los dashboards
- Optimizar consultas y agregar caché
- Implementar monitoreo de procesos ETL
- Realizar pruebas de carga y rendimiento

## 8. Consideraciones Adicionales

### 8.1. Rendimiento

- Índices adecuados en tablas principales
- Agregaciones pre-calculadas para consultas frecuentes
- Estrategia de caché para respuestas de API
- Particionamiento de tablas históricas grandes

### 8.2. Seguridad

- Cifrado de credenciales para sistemas externos
- Acceso por VPN o IP fija a fuentes de datos
- Registros de auditoría para cambios de datos
- Restricciones a nivel de campo según rol de usuario

### 8.3. Mantenibilidad

- Documentación de procesos ETL
- Alertas automáticas ante fallos
- Panel de monitoreo de sincronización
- Plan de contingencia para fallos de conectividad

## 9. Integración con Control de Acceso Existente

El sistema de integración de datos se integrará con el sistema de control de acceso existente:

1. Todos los datos estarán asociados a `Company` y/o `Warehouse`
2. Las API aplicarán filtros automáticamente según:
   - `allowed_companies` del usuario
   - `allowed_warehouses` del usuario
3. Los dashboards mostrados respetarán `allowed_tabs`
4. Las métricas específicas pueden tener restricciones adicionales basadas en roles

## 10. Resolución de Problemas Comunes

### 10.1. Cambios Tardíos en Datos Fuente

- Problema: Modificación de datos históricos en sistemas fuente
- Solución: Proceso de reconciliación diario que detecta cambios por timestamp
- Implementación: Tablas de control con última fecha de modificación

### 10.2. Sincronización Fallida

- Problema: Interrupción de proceso ETL
- Solución: Sistema de reintentos con backoff exponencial
- Implementación: Registro de estado de sincronización y punto de reinicio

### 10.3. Inconsistencia de Datos

- Problema: Discrepancias entre sistemas fuente
- Solución: Reglas de resolución de conflictos definidas por negocio
- Implementación: Sistema de alertas para revisión manual cuando sea necesario
