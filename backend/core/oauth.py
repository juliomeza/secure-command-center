from social_django.strategy import DjangoStrategy
from django.conf import settings
import logging
from social_core.utils import get_strategy

logger = logging.getLogger('core')

class PersistentSessionStrategy(DjangoStrategy):
    def __init__(self, storage, request=None, tpl=None):
        self.session = None
        super().__init__(storage, request, tpl)
        if request:
            # Force session save on initialization
            request.session.save()
            logger.info(f"Strategy initialized with session key: {request.session.session_key}")

    def session_get(self, name, default=None):
        """Get value from session with strong persistence"""
        if not self.session:
            self.session = self.request.session
        
        # Ensure session is loaded
        if not self.session.session_key:
            self.session.create()
            logger.info(f"Created new session with key: {self.session.session_key}")
        
        value = self.session.get(name, default)
        logger.info(f"Session get: {name} = {value} (default={default})")
        logger.info(f"Current session keys: {list(self.session.keys())}")
        return value

    def session_set(self, name, value):
        """Set value in session with immediate persistence"""
        if not self.session:
            self.session = self.request.session
            
        logger.info(f"Session set: {name} = {value}")
        logger.info(f"Session keys before set: {list(self.session.keys())}")
        
        self.session[name] = value
        self.session.modified = True
        
        # Force save after each set
        try:
            self.session.save()
            logger.info(f"Session saved successfully. Key: {self.session.session_key}")
        except Exception as e:
            logger.error(f"Error saving session: {str(e)}")
            
        logger.info(f"Session keys after set: {list(self.session.keys())}")
        return value

    def session_pop(self, name, default=None):
        """Remove value from session with proper persistence"""
        if not self.session:
            self.session = self.request.session
            
        logger.info(f"Session pop: {name} (default={default})")
        logger.info(f"Session keys before pop: {list(self.session.keys())}")
        
        value = self.session.pop(name, default)
        self.session.modified = True
        self.session.save()
        
        logger.info(f"Session pop result: {value}")
        logger.info(f"Session keys after pop: {list(self.session.keys())}")
        return value

    def request_data(self, merge=True):
        """Get request data handling both GET and POST"""
        if not self.request:
            return {}
        
        if merge:
            data = self.request.GET.copy()
            data.update(self.request.POST)
        else:
            data = self.request.POST if self.request.method == 'POST' else self.request.GET
        
        logger.info(f"Request data method: {self.request.method}")
        logger.info(f"Request data: {dict(data)}")
        return data

    def build_absolute_uri(self, path=None):
        """Ensure https is used in production"""
        uri = super().build_absolute_uri(path)
        if settings.IS_RENDER:
            uri = uri.replace('http:', 'https:')
        logger.info(f"Built URI: {uri}")
        return uri