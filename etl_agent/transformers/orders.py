import datetime

# Mapping from warehouse ID to source state
WAREHOUSE_TO_STATE_MAPPING = {
    10: "Florida",
    18: "Florida",
    15: "Texas",
    20: "Ohio",
    23: "New Jersey",
}

def _get_source_state_from_warehouse(warehouse_value):
    """
    Determines the source state from the warehouse value.
    Converts warehouse_value to int for lookup.
    Returns the state name or None if not found or input is invalid.
    """
    if warehouse_value is None:
        return None
    try:
        warehouse_id = int(warehouse_value)
        return WAREHOUSE_TO_STATE_MAPPING.get(warehouse_id)
    except (ValueError, TypeError):
        # If warehouse_value cannot be converted to int, or is not a suitable type
        return None

def extract_date_fields(order):
    """
    Given an order dict with a 'date' key (YYYY-MM-DD or datetime/date), extract year, month, quarter, week, day, and month_name.
    """
    date_val = order.get('date')
    if not date_val:
        order['year'] = None
        order['month'] = None
        order['month_name'] = None
        order['quarter'] = None
        order['week'] = None
        order['day'] = None
        return order
    try:
        if isinstance(date_val, str):
            date_obj = datetime.datetime.strptime(date_val, '%Y-%m-%d').date()
        elif isinstance(date_val, datetime.datetime):
            date_obj = date_val.date()
        elif isinstance(date_val, datetime.date):
            date_obj = date_val
        else:
            order['year'] = None
            order['month'] = None
            order['month_name'] = None
            order['quarter'] = None
            order['week'] = None
            order['day'] = None
            return order
        order['year'] = date_obj.year
        order['month'] = date_obj.month
        order['month_name'] = date_obj.strftime('%B')
        order['day'] = date_obj.day
        order['week'] = date_obj.isocalendar()[1]
        order['quarter'] = (date_obj.month - 1) // 3 + 1
    except Exception:
        order['year'] = None
        order['month'] = None
        order['month_name'] = None
        order['quarter'] = None
        order['week'] = None
        order['day'] = None
    return order

def add_source_state(order):
    """
    Adds the 'source_state' to the order dictionary based on the 'warehouse' field.
    Modifies the order dictionary in place and returns it.
    """
    warehouse_identifier = order.get('warehouse')
    order['source_state'] = _get_source_state_from_warehouse(warehouse_identifier)
    return order

def transform_orders(data):
    """
    Transform a list of order dicts, adding year, month, month_name, quarter, week, day, and source_state fields.
    """
    transformed_data = []
    for order_item in data:
        order_item = extract_date_fields(order_item)  # Existing date transformation
        order_item = add_source_state(order_item)      # Add source state
        transformed_data.append(order_item)
    return transformed_data
