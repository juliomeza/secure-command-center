# etl_agent/run_etl.py
from dotenv import load_dotenv
from datetime import datetime, timedelta
import logging
import os
import pyodbc
import psycopg2
import argparse
from database.mssql import get_mssql_connection
from database.postgres import get_postgres_connection
from extracts.testing import extract_recent_orders
from extracts.orders import extract_orders
from extracts.datacard import extract_datacard_reports
from loaders.testing import load_test_data
from loaders.orders import load_orders
from loaders.datacard import load_datacard_data

# --- Configuration ---
# --- Database Connection Functions ---
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

        # 3. Proceso Orders - "orders"
        if query_target == "orders" or query_target == "all":
            print("\n=== Iniciando proceso ETL de Orders (orders) ===")
            logging.info("Ejecutando proceso 'orders'.")
            try:
                orders_data = extract_orders(mssql_conn)
                if orders_data:
                    print(f"Se extrajeron {len(orders_data)} registros de Orders.")
                    load_orders(pg_conn, orders_data)
                else:
                    logging.info("No se encontraron datos de Orders para cargar.")
                    print("⚠️ No se encontraron datos de Orders para cargar.")
            except Exception as e:
                error_message = f"❌ Error procesando Orders: {str(e)}"
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
        choices=['testing', 'datacard', 'orders', 'all'],
        default='all',
        help="Especifica qué parte del ETL ejecutar: 'testing' para órdenes de prueba, 'datacard' para reportes DataCard, 'orders' para datos de Orders, o 'all' para todos (por defecto)."
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
