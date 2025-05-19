import logging
import pyodbc

def extract_recent_orders(mssql_conn, limit=5):
    """Extracts the top N recent orders from MSSQL."""
    cursor = mssql_conn.cursor()
    try:
        query = f"""
            SELECT TOP ({limit}) id, orderClassId, orderStatusId, lookupCode
            FROM datex_footprint.Orders
            WHERE createdSysDateTime >= '2025-05-01'
            ORDER BY id
        """
        logging.info(f"Executing MSSQL query: {query}")
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logging.info(f"Extracted {len(orders)} orders from MSSQL.")
        return orders
    except pyodbc.Error as ex:
        logging.error(f"Error executing MSSQL query: {ex}")
        return []
    finally:
        cursor.close()
