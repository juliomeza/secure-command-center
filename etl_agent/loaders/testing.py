import logging
import psycopg2
from datetime import datetime

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
