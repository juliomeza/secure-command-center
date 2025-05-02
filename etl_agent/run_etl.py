# etl_agent/run_etl.py
import os
import pyodbc
import psycopg2
import logging
from dotenv import load_dotenv
from datetime import datetime

# --- Configuration ---
load_dotenv() # Load variables from .env file
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
            sslmode='require' # Important for Render connections
        )
        logging.info("Successfully connected to PostgreSQL.")
        return conn
    except psycopg2.Error as e:
        logging.error(f"Error connecting to PostgreSQL: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error connecting to PostgreSQL: {e}")
        return None

# --- ETL Logic ---
def extract_recent_orders(mssql_conn, limit=5):
    """Extracts the top N recent orders from MSSQL."""
    cursor = mssql_conn.cursor()
    try:
        # IMPORTANT: Adjust this query to your actual table and column names
        # Assuming a table named 'Orders' and a datetime column 'OrderDate'
        query = f"""
            SELECT TOP ({limit}) OrderID, CustomerID, OrderDate, SomeValue
            FROM YourOrderTable
            WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE) -- Orders from today
            ORDER BY OrderDate DESC
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
    # IMPORTANT: Adjust table and column names to match your Django model
    # Assuming a table named 'data_testdata' created by Django
    # And columns 'source_id', 'description', 'fetched_at'
    insert_query = """
        INSERT INTO data_testdata (source_id, description, fetched_at)
        VALUES (%s, %s, %s)
        ON CONFLICT (source_id) DO UPDATE SET
        description = EXCLUDED.description,
        fetched_at = EXCLUDED.fetched_at;
    """
    try:
        now = datetime.now()
        prepared_data = []
        for item in data:
            # Adapt this mapping based on your MSSQL query and PG table
            source_id = str(item.get('OrderID', 'N/A')) # Example mapping
            description = f"Customer: {item.get('CustomerID', '?')} - Value: {item.get('SomeValue', 0)}" # Example mapping
            prepared_data.append((source_id, description, now))

        if not prepared_data:
            logging.info("No data to load into PostgreSQL.")
            return

        logging.info(f"Loading {len(prepared_data)} records into PostgreSQL...")
        cursor.executemany(insert_query, prepared_data)
        pg_conn.commit()
        logging.info("Successfully loaded data into PostgreSQL.")

    except psycopg2.Error as e:
        logging.error(f"Error loading data into PostgreSQL: {e}")
        pg_conn.rollback() # Roll back in case of error
    except Exception as e:
        logging.error(f"Unexpected error during data loading: {e}")
        pg_conn.rollback()
    finally:
        cursor.close()

# --- Main Execution ---
def main():
    logging.info("Starting ETL process...")

    mssql_conn = get_mssql_connection()
    pg_conn = get_postgres_connection()

    if not mssql_conn or not pg_conn:
        logging.error("Failed to establish database connections. Exiting.")
        return

    try:
        # 1. Extract
        recent_orders = extract_recent_orders(mssql_conn, limit=5)

        # 2. Transform (Minimal transformation in this example)
        # Transformation is done within load_test_data for simplicity here

        # 3. Load
        if recent_orders:
            load_test_data(pg_conn, recent_orders)
        else:
            logging.info("No recent orders found to load.")

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
    main()
