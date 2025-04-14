from social_django.strategy import DjangoStrategy
from django.conf import settings
import logging
from django.contrib.sessions.backends.db import SessionStore
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger('core')

class PersistentSessionStrategy(DjangoStrategy):
    """Strategy that ensures session persistence across OAuth flow"""
    
    def __init__(self, storage, request=None, tpl=None):
        self._session = None
        super().__init__(storage, request, tpl)
        
        if request and request.session:
            # Ensure we have a session key
            if not request.session.session_key:
                request.session.create()
                request.session.save()
            logger.info(f"Strategy initialized with session key: {request.session.session_key}")
            logger.info(f"Initial session data: {dict(request.session)}")

    def ensure_session(self):
        """Ensure we have a valid session"""
        if not self.session or not getattr(self.session, 'session_key', None):
            if self.request and hasattr(self.request, 'session'):
                if not self.request.session.session_key:
                    self.request.session.create()
                self.request.session.save()
                self.session = self.request.session
                logger.info(f"Created new session with key: {self.session.session_key}")
            else:
                self.session = SessionStore()
                self.session.create()
                logger.info("Created new SessionStore instance")

    def session_get(self, name, default=None):
        """Get value from session with persistence checks"""
        self.ensure_session()
        logger.info(f"Getting session value for {name}")
        logger.info(f"Current session key: {getattr(self.session, 'session_key', None)}")
        logger.info(f"Current session keys: {list(self.session.keys())}")
        
        # First try getting from session
        value = self.session.get(name, default)
        
        # If not found in session but exists in GET/POST, store and return it
        if value is None and self.request:
            data = self.request.GET.copy()
            data.update(self.request.POST)
            if name in data:
                value = data[name]
                self.session_set(name, value)
                logger.info(f"Restored {name} from request data: {value}")
        
        logger.info(f"Session get result for {name}: {value}")
        return value

    def session_set(self, name, value):
        """Set value in session with immediate persistence"""
        self.ensure_session()
        logger.info(f"Setting session value {name} = {value}")
        logger.info(f"Session before set: {dict(self.session)}")
        
        self.session[name] = value
        if hasattr(self.session, 'modified'):
            self.session.modified = True
        if hasattr(self.session, 'save'):
            self.session.save()
        
        logger.info(f"Session after set: {dict(self.session)}")
        return value

    def session_pop(self, name, default=None):
        """Remove value from session safely"""
        self.ensure_session()
        logger.info(f"Popping session value {name}")
        logger.info(f"Session before pop: {dict(self.session)}")
        
        value = self.session.pop(name, default)
        if hasattr(self.session, 'modified'):
            self.session.modified = True
        if hasattr(self.session, 'save'):
            self.session.save()
        
        logger.info(f"Session after pop: {dict(self.session)}")
        return value

    def request_data(self, merge=True):
        """Get request data with improved logging"""
        if not self.request:
            return {}
        
        if merge:
            data = self.request.GET.copy()
            data.update(self.request.POST)
        else:
            data = self.request.POST if self.request.method == 'POST' else self.request.GET
        
        logger.info(f"Request method: {self.request.method}")
        logger.info(f"Request data: {dict(data)}")
        logger.info(f"Request headers: {dict(self.request.headers)}")
        return data

    def build_absolute_uri(self, path=None):
        """Build URI with logging"""
        uri = super().build_absolute_uri(path)
        if settings.IS_RENDER:
            uri = uri.replace('http:', 'https:')
        logger.info(f"Built URI: {uri}")
        return uri

class JWTStrategy(DjangoStrategy):
    """Strategy that handles OAuth authentication and returns JWT tokens"""
    
    def complete_login(self, request, user, *args, **kwargs):
        """Override complete_login to return JWT tokens instead of session"""
        # Call parent's complete_login first
        result = super().complete_login(request, user, *args, **kwargs)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Add user info to token payload
        refresh['email'] = user.email
        refresh['full_name'] = f"{user.first_name} {user.last_name}"
        if hasattr(user, 'profile') and user.profile.company:
            refresh['company'] = user.profile.company.name
        
        # Log token generation
        logger.info(f"Generated JWT tokens for user: {user.email}")
        
        # Store tokens in session temporarily for the redirect
        self.session['access_token'] = str(refresh.access_token)
        self.session['refresh_token'] = str(refresh)
        
        return result