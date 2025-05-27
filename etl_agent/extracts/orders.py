import logging

def extract_orders(mssql_conn, start_date='2024-01-01', warehouse_ids=(1,12,20,23,27), excluded_owner_id=701):
    """
    Extracts order and shipment data from MSSQL for the Orders table.
    """
    cursor = mssql_conn.cursor()
    warehouse_ids_str = ','.join(str(w) for w in warehouse_ids)
    query = f'''
        SELECT DISTINCT --TOP 4000
            p.name AS customer,
            w.name AS warehouse,
            w.notes AS warehouse_city_state,
            o.lookupCode AS order_number,
            s.lookupCode AS shipment_number,
            CASE 
                WHEN s.typeId = 1 THEN 'Inbound'
                WHEN s.typeId = 2 THEN 'Outbound'
                ELSE 'Other'
            END AS order_type,
            o.fulfillmentDate AS date,
            oc.name AS order_class
        FROM datex_footprint.Orders o
            JOIN datex_footprint.Projects p ON p.id = o.projectId
            JOIN datex_footprint.Owners ow ON ow.id = p.ownerId
            JOIN datex_footprint.ShipmentOrderLookup sol ON sol.orderId = o.id
            JOIN datex_footprint.Shipments s ON s.id = sol.shipmentId
            JOIN datex_footprint.Warehouses w ON w.id = COALESCE(s.actualWarehouseId, s.expectedWarehouseId)
            JOIN datex_footprint.OrderClasses oc ON oc.id = o.orderClassId
        WHERE s.statusId = 8
            AND o.fulfillmentDate >= ?
            AND w.id IN ({warehouse_ids_str})
            AND ow.id NOT IN (?)
    '''
    try:
        cursor.execute(query, (start_date, excluded_owner_id))
        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return results
    except Exception as ex:
        # Handle/log error as needed
        return []
    finally:
        cursor.close()
