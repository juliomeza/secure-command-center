import datetime

def extract_date_fields(order):
    """
    Given an order dict with a 'date' key (YYYY-MM-DD or datetime/date), extract year, month, quarter, week, and day.
    """
    date_val = order.get('date')
    if not date_val:
        order['year'] = None
        order['month'] = None
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
            order['quarter'] = None
            order['week'] = None
            order['day'] = None
            return order
        order['year'] = date_obj.year
        order['month'] = date_obj.month
        order['day'] = date_obj.day
        order['week'] = date_obj.isocalendar()[1]
        order['quarter'] = (date_obj.month - 1) // 3 + 1
    except Exception:
        order['year'] = None
        order['month'] = None
        order['quarter'] = None
        order['week'] = None
        order['day'] = None
    return order

def transform_orders(data):
    """
    Transform a list of order dicts, adding year, month, quarter, week, and day fields.
    """
    return [extract_date_fields(order) for order in data]
