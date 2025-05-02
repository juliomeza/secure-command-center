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

- **Agente ETL Local (`etl_agent`)**: Script Python independiente responsable de extraer datos de las fuentes (MSSQL, etc.) y cargarlos en PostgreSQL. Se ejecuta localmente o en un servidor dentro de la red local.
- **Almacén de Datos**: Esquemas en PostgreSQL (hosteado en Render) para datos procesados y agregados.
- **App de Datos Django (`data`)**: Módulo Django en la aplicación principal (hosteada en Render) responsable de leer datos desde PostgreSQL y exponerlos vía API.
- **APIs de Datos**: Endpoints en la app Django para consumo del frontend.
- **Tareas Programadas (Local)**: El Agente ETL se ejecutará mediante tareas programadas en el sistema operativo donde resida (ej. Windows Task Scheduler).

## 2. Fuentes de Datos

### 2.1. Sistemas Primarios

- **MSSQL (WMS)**: Sistema de gestión de almacenes con datos operacionales. (Accedido por el Agente ETL Local)
- **QuickBooks**: Sistema financiero y contable. (Accedido por el Agente ETL Local)
- **ADP**: Sistema de recursos humanos y nómina. (Accedido por el Agente ETL Local)

### 2.2. Sistemas Secundarios (Futuros)

- **CRM**: Datos de clientes y ventas.
- **Sistemas IoT**: Datos de sensores y equipamiento.
- **Sistemas de Calidad**: Métricas de calidad de productos.

## 3. Modelo de Datos (PostgreSQL - Render)

### 3.1. Enfoque Multinivel

El almacenamiento de datos en PostgreSQL seguirá un modelo de tres niveles, poblado por el Agente ETL Local y leído por la App Django `data`.

#### Nivel 1: Datos Transaccionales (Granulares)

```python
# Ejemplo conceptual - Modelo Django en app `data`
# Esta tabla será poblada por el Agente ETL Local
class OrderDetail(models.Model):
    order_id = models.CharField(max_length=50, unique=True) # Clave de la fuente
    order_type = models.CharField(max_length=50)
    timestamp = models.DateTimeField()
    customer_id = models.CharField(max_length=50, null=True)
    items_count = models.IntegerField()
    # Timestamps gestionados por el Agente ETL
    source_modified_timestamp = models.DateTimeField(null=True, blank=True)
    etl_loaded_at = models.DateTimeField(auto_now=True) # O gestionado por el agente
```

#### Nivel 2: Agregaciones Diarias

```python
# Ejemplo conceptual - Modelo Django en app `data`
# Esta tabla será poblada por el Agente ETL Local
class DailyMetrics(models.Model):
    date = models.DateField()
    metric_name = models.CharField(max_length=100)
    value = models.DecimalField(max_digits=15, decimal_places=2)
    company = models.ForeignKey('access.Company', on_delete=models.CASCADE, null=True) # Para filtrado
    warehouse = models.ForeignKey('access.Warehouse', on_delete=models.CASCADE, null=True) # Para filtrado
    last_updated = models.DateTimeField() # Gestionado por el Agente ETL

    class Meta:
        unique_together = ('date', 'metric_name', 'company', 'warehouse') # Ejemplo
```

#### Nivel 3: Datos de Referencia

```python
# Ejemplo conceptual - Modelo Django en app `data` o `access`
# Estos datos pueden ser gestionados manualmente o por el Agente ETL
class MetricDefinition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    applicable_roles = models.ManyToManyField('access.Tab')
```

### 3.2. Integración con Control de Acceso

- Los modelos en PostgreSQL incluirán referencias a `Company` y `Warehouse` si es necesario para el filtrado.
- La app `data` de Django aplicará filtros automáticos basados en los permisos del usuario al consultar estos datos para las APIs.

## 4. Proceso ETL (Agente Local `etl_agent`)

El Agente ETL Local (`etl_agent/run_etl.py`) es responsable del ciclo completo de ETL.

### 4.1. Extracción

- El script Python se conecta directamente a las fuentes de datos (MSSQL, QuickBooks, ADP) usando las credenciales definidas en `etl_agent/.env`.
- Utiliza librerías como `pyodbc` (para MSSQL) y otras específicas para cada fuente.
- Realiza consultas SQL o llamadas API para obtener los datos necesarios (nuevos o modificados desde la última ejecución).

### 4.2. Transformación

- El script Python limpia, normaliza, y transforma los datos extraídos según sea necesario.
- Puede realizar cálculos, agregaciones (ej. para `DailyMetrics`), o unir datos de diferentes fuentes si es preciso.
- La lógica de transformación reside completamente dentro del script Python del agente.

### 4.3. Carga

- El script Python se conecta a la base de datos PostgreSQL de Render usando las credenciales de `etl_agent/.env`.
- Utiliza `psycopg2` para insertar o actualizar los datos transformados en las tablas correspondientes (ej. `data_orderdetail`, `data_dailymetrics`).
- Implementa lógica de `UPSERT` (INSERT ... ON CONFLICT ...) para manejar registros existentes.

## 5. APIs de Datos (App Django `data` en Render)

La app `data` en Django **no** se conecta a las fuentes originales. Su única responsabilidad es leer de PostgreSQL y servir los datos al frontend.

### 5.1. Endpoints Principales

- Define Vistas (APIViews) y Serializers para exponer los datos de los modelos PostgreSQL (ej. `OrderDetail`, `DailyMetrics`).
- Ejemplo: `/api/data/daily_metrics/?metric=orders&date_range=last_7_days`

### 5.2. Filtrado por Acceso

- Las Vistas de la app `data` utilizan el perfil de acceso del usuario (`request.user.access_profile`) para filtrar los resultados de PostgreSQL.
- Se asegura que los usuarios solo vean datos de las `allowed_companies` y `allowed_warehouses` a las que tienen permiso.

### 5.3. Granularidad Dinámica

- Las APIs pueden permitir parámetros para solicitar diferentes niveles de agregación si los datos base lo permiten (aunque las agregaciones principales se pre-calculan por el Agente ETL).

## 6. Estructura del Proyecto

```
secure-command-center/
├── backend/
│   ├── data/             # App Django: Lee de PG, expone APIs
│   │   ├── models.py     # Modelos que mapean tablas PG
│   │   ├── serializers.py
│   │   ├── views.py      # API Views
│   │   └── urls.py
│   ├── access/           # App de control de acceso
│   ├── authentication/   # App de autenticación
│   └── project/          # Configuración Django
├── frontend/             # Aplicación React
├── etl_agent/            # NUEVO: Agente ETL Local
│   ├── requirements.txt  # Dependencias del agente (pyodbc, psycopg2, ...)
│   ├── .env              # Credenciales MSSQL y PG para el agente
│   └── run_etl.py        # Script principal del ETL
├── .env                  # Variables de entorno para Django (backend)
├── .gitignore
└── render.yaml           # Configuración de despliegue (solo backend/frontend)
```

## 7. Plan de Implementación Revisado

### 7.0. Fase 0: Preparación y Conexión (1 Semana)

- Crear nuevo tab "Testing" en frontend y backend (`access` app).
- **Crear estructura básica del `etl_agent` (carpeta, `requirements.txt`, `.env`, script `run_etl.py`).**
- **Configurar y probar conexión del `etl_agent` a MSSQL (solo lectura inicial).**
- **Configurar y probar conexión del `etl_agent` a PostgreSQL (Render).**
- Crear modelo Django simple (`TestData`) en app `data`.
- Crear migraciones y aplicar en PostgreSQL (Render).
- **Modificar `etl_agent` para extraer datos simples de MSSQL y cargarlos en la tabla `data_testdata` de PostgreSQL.**
- Crear API simple en app `data` para leer de `data_testdata`.
- Implementar visualización básica (ej. Card) en el tab "Testing" del frontend que consuma la API.
- Validar sistema de permisos (que solo usuarios con acceso al tab "Testing" lo vean).

### 7.1. Fase 1: Cimientos ETL y Modelos (2 Semanas)

- **Refinar script `etl_agent`:** Implementar manejo de errores, logging robusto.
- Diseñar e implementar modelos de datos finales en app `data` (Nivel 1 y 2: ej. `OrderDetail`, `DailyMetrics`).
- Crear migraciones y aplicar en PostgreSQL.
- **Adaptar `etl_agent` para poblar los nuevos modelos de datos (Nivel 1 y 2) desde MSSQL (WMS).**
- Implementar conector base para QuickBooks en `etl_agent` (solo conexión inicial).
- **Configurar tarea programada local (ej. Windows Task Scheduler) para ejecutar `run_etl.py` periódicamente.**

### 7.2. Fase 2: Flujo de Datos WMS y API Leaders (3 Semanas)

- **Completar proceso ETL en `etl_agent` para todos los datos relevantes del WMS (MSSQL).**
- Implementar API en app `data` para el dashboard de Warehouse Leaders (leyendo de los modelos poblados por el agente).
- Actualizar frontend (vista Leaders) para consumir datos reales de la API.
- Monitorear ejecuciones de la tarea programada local.

### 7.3. Fase 3: Expansión de Fuentes (4 Semanas)

- **Desarrollar extracción y transformación en `etl_agent` para QuickBooks y ADP.**
- Extender modelos en app `data` si es necesario.
- **Adaptar `etl_agent` para cargar datos financieros y de RRHH en PostgreSQL.**
- Extender API en app `data` para dashboards CEO y CFO.
- Implementar proceso de reconciliación de datos (puede ser en el agente o en Django).

### 7.4. Fase 4: Consolidación (3 Semanas)

- Completar endpoints API en app `data` para todos los dashboards.
- Optimizar consultas en las Vistas de Django.
- Implementar caché en las respuestas de API si es necesario.
- **Mejorar monitoreo y alertas para el `etl_agent` y la tarea programada.**
- Realizar pruebas de carga y rendimiento en la aplicación Render.

## 8. Consideraciones Adicionales

### 8.1. Rendimiento

- Índices adecuados en tablas PostgreSQL.
- Agregaciones pre-calculadas (realizadas por el `etl_agent`).
- Estrategia de caché para respuestas de API (en Django/Render).
- Particionamiento de tablas históricas grandes (en PostgreSQL).

### 8.2. Seguridad

- Cifrado de credenciales en `etl_agent/.env` y variables de entorno de Render.
- **Conexión segura (SSL) del `etl_agent` a PostgreSQL (Render).**
- **El Agente ETL se ejecuta en un entorno local o de confianza.**
- Registros de auditoría para cambios de datos (pueden ser generados por el agente).
- Restricciones a nivel de campo (aplicadas en las APIs de Django).

### 8.3. Mantenibilidad

- Documentación del script `etl_agent/run_etl.py`.
- Logging detallado en el `etl_agent`.
- **Alertas automáticas ante fallos del `etl_agent` o la tarea programada.**
- Panel de monitoreo (podría ser un log centralizado o una tabla simple en PG actualizada por el agente).
- Plan de contingencia para fallos de conectividad del agente.
