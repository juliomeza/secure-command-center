import logging
import psycopg2
from datetime import datetime

def load_datacard_data(pg_conn, data, year, week):
    """
    Loads DataCard data into PostgreSQL.
    Args:
        pg_conn: PostgreSQL connection
        data: List of dictionaries with DataCard data
        year: Report year
        week: Report week
    """
    cursor = pg_conn.cursor()
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
            logging.info("No DataCard data to load into PostgreSQL.")
            return
        results = []
        for record in prepared_data:
            cursor.execute(insert_query, record)
            results.append(cursor.fetchone()[0])
        inserted = sum(1 for r in results if r)
        updated = len(results) - inserted
        pg_conn.commit()
        print("\n=== DataCard ETL Summary ===")
        print(f"Year: {year}, Week: {week}")
        print(f"Total records processed: {len(prepared_data)}")
        print(f"New records inserted: {inserted}")
        print(f"Existing records updated: {updated}")
        print("============================\n")
    except psycopg2.Error as e:
        logging.error(f"Error loading DataCard data into PostgreSQL: {e}")
        pg_conn.rollback()
    finally:
        cursor.close()
