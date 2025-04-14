from social_django.strategy import DjangoStrategy
from django.conf import settings
import logging
from social_core.utils import get_strategy
from django.contrib.sessions.backends.db import SessionStore

logger = logging.getLogger('core')

class PersistentSessionStrategy(DjangoStrategy):
    def __init__(self, storage, request=None, tpl=None):
        super().__init__(storage, request, tpl)
        self._session = None
        if request:
            # Ensure we have a session
            if not request.session.session_key:
                request.session.create()
                request.session.save()
            logger.info(f"Strategy initialized with session key: {request.session.session_key}")
            logger.info(f"Initial session data: {dict(request.session)}")

    @property
    def session(self):
        """Ensure we always have a valid session"""
        if not self._session:
            if self.request:
                self._session = self.request.session
                if not self._session.session_key:
                    self._session.create()
                    self._session.save()
            else:
                self._session = SessionStore()
        return self._session

    def session_get(self, name, default=None):
        """Get value from session with persistence checks"""
        logger.info(f"Getting session value for {name}")
        logger.info(f"Current session key: {self.session.session_key}")
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
        logger.info(f"Setting session value {name} = {value}")
        logger.info(f"Session before set: {dict(self.session)}")
        
        self.session[name] = value
        self.session.modified = True
        self.session.save()
        
        logger.info(f"Session after set: {dict(self.session)}")
        return value

    def session_pop(self, name, default=None):
        """Remove value from session safely"""
        logger.info(f"Popping session value {name}")
        logger.info(f"Session before pop: {dict(self.session)}")
        
        value = self.session.pop(name, default)
        self.session.modified = True
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

    def get_pipeline_session_data(self, backend, key, default=None):
        """Get pipeline data with state restoration"""
        logger.info(f"Getting pipeline data for {key}")
        return self.session_get(key, default)