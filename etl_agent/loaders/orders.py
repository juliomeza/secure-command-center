import logging

def load_orders(pg_conn, data):
    """
    Loads extracted order data into the Orders table in PostgreSQL.
    """
    cursor = pg_conn.cursor()
    insert_query = """
        INSERT INTO data_orders (
            customer, warehouse, warehouse_city_state, order_number, shipment_number,
            order_type, date, order_class, source_state, destination_state, year, month, quarter, week, day, fetched_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (order_number, shipment_number) DO UPDATE SET
            customer = EXCLUDED.customer,
            warehouse = EXCLUDED.warehouse,
            warehouse_city_state = EXCLUDED.warehouse_city_state,
            order_type = EXCLUDED.order_type,
            date = EXCLUDED.date,
            order_class = EXCLUDED.order_class,
            source_state = EXCLUDED.source_state,
            destination_state = EXCLUDED.destination_state,
            year = EXCLUDED.year,
            month = EXCLUDED.month,
            quarter = EXCLUDED.quarter,
            week = EXCLUDED.week,
            day = EXCLUDED.day,
            fetched_at = EXCLUDED.fetched_at
        RETURNING (xmax = 0) as inserted;
    """
    try:
        inserted = 0
        updated = 0
        for row in data:
            cursor.execute(insert_query, (
                row.get('customer'), row.get('warehouse'), row.get('warehouse_city_state'),
                row.get('order_number'), row.get('shipment_number'), row.get('order_type'),
                row.get('date'), row.get('order_class'),
                row.get('source_state'), row.get('destination_state'),
                row.get('year'), row.get('month'), row.get('quarter'), row.get('week'), row.get('day')
            ))
            result = cursor.fetchone()
            if result and result[0]:
                inserted += 1
            else:
                updated += 1
        pg_conn.commit()
        print("\n=== Orders ETL Summary ===")
        print(f"Total records processed: {len(data)}")
        print(f"New records inserted: {inserted}")
        print(f"Existing records updated: {updated}")
        print("==========================\n")
    except Exception as e:
        pg_conn.rollback()
        print(f"Error loading Orders data: {e}")
    finally:
        cursor.close()
