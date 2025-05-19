import logging
import pyodbc

def extract_datacard_reports(mssql_conn, year, week, warehouses=None):
    """
    Extracts DataCard Reports data from MSSQL using the KPower_BI.RHL_DataCard_Reports function,
    applying specific transformations to the data according to its type.
    Args:
        mssql_conn: MSSQL connection
        year: Year for the report (int)
        week: Week for the report (int)
        warehouses: List of warehouse IDs or comma-separated string (optional)
    Returns:
        List of dictionaries with transformed DataCard data
    """
    cursor = mssql_conn.cursor()
    try:
        if isinstance(warehouses, list):
            warehouses_param = ','.join(map(str, warehouses))
        else:
            warehouses_param = warehouses if warehouses else ''
        query = """
        SELECT
            d.warehouseId,
            d.warehouseOrder,
            d.warehouse,
            d.section,
            d.listOrder,
            d.description,
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
            ISNULL(d.tInt, 0) AS is_integer,
            ISNULL(d.totalPorc, 0) AS is_percentage,
            ISNULL(d.vText, 0) AS is_text,
            ISNULL(d.title, 0) AS is_title,
            ISNULL(d.heatColors, 0) AS has_heat_colors
        FROM KPower_BI.RHL_DataCard_Reports(?, ?, ?) d
        WHERE ISNULL(d.projectDetails, 0) = 0
        """
        logging.info(f"Executing DataCard query: year={year}, week={week}, warehouses={warehouses_param}")
        cursor.execute(query, (year, week, warehouses_param))
        columns = [column[0] for column in cursor.description]
        datacard_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logging.info(f"Extracted {len(datacard_data)} DataCard records from MSSQL.")
        return datacard_data
    except pyodbc.Error as ex:
        logging.error(f"Error executing DataCard query: {ex}")
        return []
    finally:
        cursor.close()
