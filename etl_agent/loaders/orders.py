import logging

def load_orders(pg_conn, data):
    """
    Loads extracted order data into the Orders table in PostgreSQL.
    """
    cursor = pg_conn.cursor()
    insert_query = """
        INSERT INTO data_orders (
            customer, warehouse, warehouse_city_state, order_number, shipment_number,
            order_type, date, order_class, fetched_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (order_number, shipment_number) DO UPDATE SET
            customer = EXCLUDED.customer,
            warehouse = EXCLUDED.warehouse,
            warehouse_city_state = EXCLUDED.warehouse_city_state,
            order_type = EXCLUDED.order_type,
            date = EXCLUDED.date,
            order_class = EXCLUDED.order_class,
            fetched_at = EXCLUDED.fetched_at
        RETURNING (xmax = 0) as inserted;
    """
    try:
        inserted = 0
        updated = 0
        for row in data:
            cursor.execute(insert_query, (
                row['customer'], row['warehouse'], row['warehouse_city_state'],
                row['order_number'], row['shipment_number'], row['order_type'],
                row['date'], row['order_class']
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
