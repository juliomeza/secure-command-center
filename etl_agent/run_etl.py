# etl_agent/run_etl.py
import os
import argparse
import pyodbc
import psycopg2
import logging
from dotenv import load_dotenv
from datetime import datetime, timedelta

# --- Configuration ---
# --- Database Connection Functions ---
def get_mssql_connection():
    """Establishes a connection to the MSSQL database."""
    driver = os.getenv('MSSQL_DRIVER')
    server = os.getenv('MSSQL_SERVER')
    database = os.getenv('MSSQL_DATABASE')
    user = os.getenv('MSSQL_USER')
    password = os.getenv('MSSQL_PASSWORD')
    extra_params = os.getenv('MSSQL_EXTRA_PARAMS', '')

    if not all([driver, server, database]):
        logging.error("MSSQL connection details missing in .env file (DRIVER, SERVER, DATABASE).")
        return None

    conn_str_parts = [
        f"DRIVER={driver}",
        f"SERVER={server}",
        f"DATABASE={database}",
    ]
    # Handle Authentication
    if user:
        conn_str_parts.append(f"UID={user}")
        conn_str_parts.append(f"PWD={password}")
    else: # Assume Windows Authentication if no user is provided
        conn_str_parts.append("Trusted_Connection=yes")

    if extra_params:
        conn_str_parts.append(extra_params)

    conn_str = ";".join(conn_str_parts)
    # logging.debug(f"MSSQL Connection String: {conn_str}") # Uncomment to debug connection string

    try:
        conn = pyodbc.connect(conn_str)
        logging.info("Successfully connected to MSSQL.")
        return conn
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        logging.error(f"Error connecting to MSSQL. SQLSTATE: {sqlstate}. Error: {ex}")
        # Log the full connection string without password for debugging if needed, BE CAREFUL
        # safe_conn_str = conn_str.replace(f"PWD={password}", "PWD=***") if password else conn_str
        # logging.error(f"Connection String Used (Password Hidden): {safe_conn_str}")
        return None

def get_postgres_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv('PG_HOST'),
            port=os.getenv('PG_PORT'),
            database=os.getenv('PG_DATABASE'),
            user=os.getenv('PG_USER'),
            password=os.getenv('PG_PASSWORD'),
            sslmode=os.getenv('PG_SSLMODE', 'disable')  # Use sslmode from env or default to disable
        )
        logging.info("Successfully connected to PostgreSQL.")
        return conn
    except psycopg2.Error as e:
        logging.error(f"Error connecting to PostgreSQL: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error connecting to PostgreSQL: {e}")
        return None

def get_db_connection(db_type):
    """Establece conexión a la base de datos especificada."""
    if db_type == 'postgresql':
        return get_postgres_connection()
    elif db_type == 'mssql':
        return get_mssql_connection()
    else:
        logging.error(f"Tipo de base de datos no soportado: {db_type}")
        return None

# --- ETL Logic ---
def extract_recent_orders(mssql_conn, limit=5):
    """Extracts the top N recent orders from MSSQL."""
    cursor = mssql_conn.cursor()
    try:
        # IMPORTANT: Adjust this query to your actual table and column names
        # Assuming a table named 'Orders' and a datetime column 'OrderDate'
        query = f"""
            SELECT TOP ({limit}) id, orderClassId, orderStatusId, lookupCode
            FROM datex_footprint.Orders
            WHERE createdSysDateTime >= '2025-05-01'
            ORDER BY id
        """
        logging.info(f"Executing MSSQL query: {query}")
        cursor.execute(query)
        # Fetch column names for dictionary creation
        columns = [column[0] for column in cursor.description]
        orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logging.info(f"Extracted {len(orders)} orders from MSSQL.")
        return orders
    except pyodbc.Error as ex:
        logging.error(f"Error executing MSSQL query: {ex}")
        return []
    finally:
        cursor.close()

def load_test_data(pg_conn, data):
    """Loads the extracted data into the PostgreSQL test table."""
    cursor = pg_conn.cursor()
    insert_query = """
        INSERT INTO data_testdata (order_id, order_class_id, order_status_id, lookup_code, fetched_at)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (order_id) DO UPDATE SET
            order_class_id = EXCLUDED.order_class_id,
            order_status_id = EXCLUDED.order_status_id,
            lookup_code = EXCLUDED.lookup_code,
            fetched_at = EXCLUDED.fetched_at
        RETURNING (xmax = 0) as inserted;
    """
    try:
        now = datetime.now()
        prepared_data = []
        for item in data:
            prepared_data.append((
                item['id'],
                item['orderClassId'],
                item['orderStatusId'],
                item['lookupCode'],
                now
            ))

        if not prepared_data:
            logging.info("No data to load into PostgreSQL.")
            return

        # Ejecutar el insert y contar inserciones vs actualizaciones
        results = []
        for record in prepared_data:
            cursor.execute(insert_query, record)
            results.append(cursor.fetchone()[0])
        
        inserted = sum(1 for r in results if r)
        updated = len(results) - inserted
        
        pg_conn.commit()
        print("\n=== ETL Process Summary ===")
        print(f"Total records processed: {len(prepared_data)}")
        print(f"New records inserted: {inserted}")
        print(f"Existing records updated: {updated}")
        print("===========================\n")
        logging.info("ETL process completed successfully.")

    except psycopg2.Error as e:
        logging.error(f"Error loading data into PostgreSQL: {e}")
        pg_conn.rollback()
    except Exception as e:
        logging.error(f"Unexpected error during data loading: {e}")
        pg_conn.rollback()
    finally:
        cursor.close()

def extract_datacard_reports(mssql_conn, year, week, warehouses=None):
    """
    Extrae los datos de DataCard Reports desde MSSQL usando la función KPower_BI.RHL_DataCard_Reports,
    aplicando transformaciones específicas a los datos según su tipo.
    
    Args:
        mssql_conn: Conexión a MSSQL
        year: Año para el reporte (int)
        week: Semana para el reporte (int)
        warehouses: Lista de IDs de almacenes o string con IDs separados por comas (opcional)
    
    Returns:
        Lista de diccionarios con los datos del DataCard transformados
    """
    cursor = mssql_conn.cursor()
    try:
        # Si warehouses es una lista, convertirla a string separado por comas
        if isinstance(warehouses, list):
            warehouses_param = ','.join(map(str, warehouses))
        else:
            warehouses_param = warehouses if warehouses else ''
        
        # Query completo con transformaciones similares al original
        query = """
        SELECT
            d.warehouseId,
            d.warehouseOrder,
            d.warehouse,
            d.section,
            d.listOrder,
            d.description,
            -- Formateo de valores según tipo
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d1, '0')
                WHEN d.totalPorc = 1 THEN d.d1
                WHEN d.vText = 1 THEN d.d1
                ELSE d.d1
            END AS day1_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d2, '0')
                WHEN d.totalPorc = 1 THEN d.d2
                WHEN d.vText = 1 THEN d.d2
                ELSE d.d2
            END AS day2_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d3, '0')
                WHEN d.totalPorc = 1 THEN d.d3
                WHEN d.vText = 1 THEN d.d3
                ELSE d.d3
            END AS day3_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d4, '0')
                WHEN d.totalPorc = 1 THEN d.d4
                WHEN d.vText = 1 THEN d.d4
                ELSE d.d4
            END AS day4_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d5, '0')
                WHEN d.totalPorc = 1 THEN d.d5
                WHEN d.vText = 1 THEN d.d5
                ELSE d.d5
            END AS day5_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d6, '0')
                WHEN d.totalPorc = 1 THEN d.d6
                WHEN d.vText = 1 THEN d.d6
                ELSE d.d6
            END AS day6_value,
            CASE 
                WHEN d.tInt = 1 THEN ISNULL(d.d7, '0')
                WHEN d.totalPorc = 1 THEN d.d7
                WHEN d.vText = 1 THEN d.d7
                ELSE d.d7
            END AS day7_value,
            -- Calculando el total cuando es posible
            CASE
                WHEN d.tInt = 1 AND ISNULL(d.totalPorc, 0) = 0 
                    AND ISNUMERIC(ISNULL(d.d1, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d2, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d3, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d4, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d5, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d6, 0)) = 1 
                    AND ISNUMERIC(ISNULL(d.d7, 0)) = 1 
                THEN CONVERT(VARCHAR, CONVERT(INT, ISNULL(d.d1, 0)) + CONVERT(INT, ISNULL(d.d2, 0)) 
                    + CONVERT(INT, ISNULL(d.d3, 0)) + CONVERT(INT, ISNULL(d.d4, 0)) 
                    + CONVERT(INT, ISNULL(d.d5, 0)) + CONVERT(INT, ISNULL(d.d6, 0)) 
                    + CONVERT(INT, ISNULL(d.d7, 0)))
                ELSE NULL
            END AS total,
            -- Indicadores de tipo
            ISNULL(d.tInt, 0) AS is_integer,
            ISNULL(d.totalPorc, 0) AS is_percentage,
            ISNULL(d.vText, 0) AS is_text,
            -- Metadatos adicionales útiles
            ISNULL(d.title, 0) AS is_title,
            ISNULL(d.heatColors, 0) AS has_heat_colors
        FROM KPower_BI.RHL_DataCard_Reports(?, ?, ?) d
        WHERE ISNULL(d.projectDetails, 0) = 0
        """
        
        logging.info(f"Ejecutando consulta mejorada de DataCard: year={year}, week={week}, warehouses={warehouses_param}")
        cursor.execute(query, (year, week, warehouses_param))
        
        # Convertir resultados a lista de diccionarios
        columns = [column[0] for column in cursor.description]
        datacard_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        logging.info(f"Extraídos {len(datacard_data)} registros de DataCard desde MSSQL.")
        return datacard_data
        
    except pyodbc.Error as ex:
        logging.error(f"Error al ejecutar consulta de DataCard: {ex}")
        return []
    finally:
        cursor.close()

def load_datacard_data(pg_conn, data, year, week):
    """
    Carga los datos del DataCard en PostgreSQL.
    
    Args:
        pg_conn: Conexión a PostgreSQL
        data: Lista de diccionarios con datos del DataCard
        year: Año del reporte
        week: Semana del reporte
    """
    cursor = pg_conn.cursor()
    
    # Consulta con UPSERT para insertar o actualizar datos
    insert_query = """
        INSERT INTO data_datacardreport (
            warehouse_id, warehouse_order, warehouse, section, list_order, description,
            day1_value, day2_value, day3_value, day4_value, day5_value, day6_value, day7_value,
            total, is_integer, is_percentage, is_text, is_title, has_heat_colors,
            year, week, fetched_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (warehouse_id, section, list_order, year, week) DO UPDATE SET
            warehouse_order = EXCLUDED.warehouse_order,
            warehouse = EXCLUDED.warehouse,
            description = EXCLUDED.description,
            day1_value = EXCLUDED.day1_value,
            day2_value = EXCLUDED.day2_value,
            day3_value = EXCLUDED.day3_value,
            day4_value = EXCLUDED.day4_value,
            day5_value = EXCLUDED.day5_value,
            day6_value = EXCLUDED.day6_value,
            day7_value = EXCLUDED.day7_value,
            total = EXCLUDED.total,
            is_integer = EXCLUDED.is_integer,
            is_percentage = EXCLUDED.is_percentage,
            is_text = EXCLUDED.is_text,
            is_title = EXCLUDED.is_title,
            has_heat_colors = EXCLUDED.has_heat_colors,
            fetched_at = EXCLUDED.fetched_at
        RETURNING (xmax = 0) as inserted;
    """
    
    try:
        now = datetime.now()
        prepared_data = []
        
        for item in data:
            prepared_data.append((
                item['warehouseId'],
                item.get('warehouseOrder'),
                item['warehouse'],
                item['section'],
                item['listOrder'],
                item['description'],
                item['day1_value'],
                item['day2_value'],
                item['day3_value'],
                item['day4_value'],
                item['day5_value'],
                item['day6_value'],
                item['day7_value'],
                item.get('total'),
                bool(item['is_integer']),
                bool(item['is_percentage']),
                bool(item['is_text']),
                bool(item.get('is_title', 0)),
                bool(item.get('has_heat_colors', 0)),
                year,
                week,
                now
            ))
        
        if not prepared_data:
            logging.info("No hay datos de DataCard para cargar.")
            return
            
        # Ejecutar INSERT/UPDATE
        results = []
        for record in prepared_data:
            cursor.execute(insert_query, record)
            results.append(cursor.fetchone()[0])
        
        inserted = sum(1 for r in results if r)
        updated = len(results) - inserted
        
        pg_conn.commit()
        
        print("\n=== Resumen proceso ETL DataCard ===")
        print(f"Año: {year}, Semana: {week}")
        print(f"Total registros procesados: {len(prepared_data)}")
        print(f"Nuevos registros insertados: {inserted}")
        print(f"Registros existentes actualizados: {updated}")
        print("====================================\n")
        
    except psycopg2.Error as e:
        logging.error(f"Error al cargar datos en PostgreSQL: {e}")
        pg_conn.rollback()
    finally:
        cursor.close()

def get_current_year_week():
    """
    Obtiene el año y número de semana actual según ISO.
    """
    # Obtenemos la fecha actual
    today = datetime.now()
    
    # Obtenemos el año y la semana actual
    year = today.year
    # isocalendar() retorna una tupla (año, semana, día de la semana)
    week = today.isocalendar()[1]
    
    logging.info(f"Usando año={year}, semana={week} (semana actual)")
    return year, week

# --- Main Execution ---
def main(args): # Cambiamos para aceptar el objeto args completo
    environment = args.environment
    query_target = args.query_target
    logging.info(f"Starting ETL process for environment: {environment}, target: {query_target}")
    # Construir la ruta al archivo .env basado en el argumento
    env_file = f".env.{environment}"
    # __file__ da la ruta del script actual (run_etl.py)
    # os.path.dirname(__file__) da el directorio del script (etl_agent)
    # os.path.join une las partes para formar la ruta completa al .env file
    env_path = os.path.join(os.path.dirname(__file__), env_file)

    if not os.path.exists(env_path):
        logging.error(f"El archivo de entorno '{env_file}' no se encontró en {os.path.dirname(__file__)}")
        logging.error(f"Ruta buscada: {env_path}")
        return

    # Cargar las variables de entorno desde el archivo especificado
    load_dotenv(dotenv_path=env_path)
    logging.info(f"Cargando configuración desde: {env_path}")

    mssql_conn = get_mssql_connection()
    pg_conn = get_postgres_connection()

    if not mssql_conn or not pg_conn:
        logging.error("Failed to establish database connections. Exiting.")
        return

    try:
        # 1. Proceso de prueba (órdenes recientes)
        if query_target == "testing" or query_target == "all":
            print("\n=== Iniciando proceso ETL de Test Orders (testing) ===")
            logging.info("Ejecutando proceso 'testing' (órdenes recientes).")
            recent_orders = extract_recent_orders(mssql_conn, limit=5)
            if recent_orders:
                load_test_data(pg_conn, recent_orders)
            else:
                logging.info("No recent orders found to load for 'testing' process.")
                print("No se encontraron órdenes recientes para cargar (proceso 'testing').")
                
        # 2. Proceso DataCard - "datacard"
        if query_target == "datacard" or query_target == "all":
            print("\n=== Iniciando proceso ETL de DataCard (datacard) ===")
            logging.info("Ejecutando proceso 'datacard'.")

            # Determinar año y semana para DataCard
            current_dt = datetime.now()
            if args.week is not None:
                week = args.week
                year = args.year if args.year is not None else current_dt.year
                logging.info(f"DataCard: Usando año={year}, semana={week} (especificados por argumentos CLI o año actual por defecto para semana especificada).")
            else:
                # Si la semana no se especifica, el argumento de año se ignora y usamos el año/semana actuales.
                if args.year is not None:
                    logging.warning("DataCard: El argumento --year se ignora cuando --week no está especificado. Usando año y semana actuales.")
                year, week = get_current_year_week() # Esta función ya registra "Usando año=Y, semana=W (semana actual)"

            # Lista específica de warehouses IDs que funcionan
            warehouses = '1,12,20,23,27'  # Lista de warehouses específicos que funcionan
            
            print(f"Extrayendo DataCard para año={year}, semana={week}, warehouses='{warehouses}'")
            logging.info(f"Iniciando extracción de DataCard para año={year}, semana={week}")
            try:
                datacard_data = extract_datacard_reports(mssql_conn, year, week, warehouses)
                
                if datacard_data:
                    print(f"Se extrajeron {len(datacard_data)} registros de DataCard.")
                    load_datacard_data(pg_conn, datacard_data, year, week)
                else:
                    message = f"No se encontraron datos de DataCard para cargar (año: {year}, semana: {week}, warehouses: '{warehouses}')."
                    logging.info(message)
                    print(f"⚠️ {message}")
            except Exception as e:
                error_message = f"❌ Error procesando DataCard: {str(e)}"
                logging.error(error_message)
                print(error_message)

    finally:
        # Ensure connections are closed
        if mssql_conn:
            mssql_conn.close()
            logging.info("MSSQL connection closed.")
        if pg_conn:
            pg_conn.close()
            logging.info("PostgreSQL connection closed.")

    logging.info("ETL process finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ejecuta el proceso ETL para un entorno específico.")
    parser.add_argument(
        "environment",
        choices=['dev', 'prod'],
        help="El entorno de ejecución ('dev' para desarrollo local, 'prod' para producción)."
    )
    parser.add_argument(
        "--query_target",
        choices=['testing', 'datacard', 'all'],
        default='all',
        help="Especifica qué parte del ETL ejecutar: 'testing' para órdenes de prueba, 'datacard' para reportes DataCard, o 'all' para ambos (por defecto)."
    )
    parser.add_argument(
        "--year",
        type=int,
        default=None,
        help="Especifica el año para el reporte DataCard (opcional). Si se provee --week y no --year, se usa el año actual. Si no se provee --week, este argumento se ignora."
    )
    parser.add_argument(
        "--week",
        type=int,
        default=None,
        help="Especifica la semana para el reporte DataCard (opcional, por defecto la semana actual)."
    )

    args = parser.parse_args()

    main(args)
