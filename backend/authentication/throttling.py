# backend/authentication/throttling.py
from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """
    Limitador de tasa para intentos de login.
    Usa la configuración 'login' de DEFAULT_THROTTLE_RATES.
    """
    scope = 'login'