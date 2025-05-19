import os
import logging
import pyodbc

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
