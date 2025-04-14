from social_django.strategy import DjangoStrategy
from django.conf import settings
import logging

logger = logging.getLogger('core')

class CustomDjangoStrategy(DjangoStrategy):
    def session_get(self, name, default=None):
        """Custom session getter that handles state more reliably
        
        Args:
            name: The name of the session key
            default: The default value to return if key not found
        """
        logger.info(f"Session get called: name={name}, default={default}")
        logger.info(f"Session keys before get: {list(self.session.keys())}")
        
        value = self.session.get(name, default)
        logger.info(f"Session get result: {value}")
        return value

    def session_set(self, name, value):
        """Custom session setter with immediate save"""
        logger.info(f"Session set called: name={name}, value={value}")
        logger.info(f"Session keys before set: {list(self.session.keys())}")
        
        self.session[name] = value
        self.session.modified = True
        self.session.save()
        
        logger.info(f"Session keys after set: {list(self.session.keys())}")
        return value

    def session_pop(self, name, default=None):
        """Custom session pop that handles missing keys gracefully"""
        logger.info(f"Session pop called: name={name}, default={default}")
        logger.info(f"Session keys before pop: {list(self.session.keys())}")
        
        value = self.session.pop(name, default)
        self.session.modified = True
        self.session.save()
        
        logger.info(f"Session pop result: {value}")
        logger.info(f"Session keys after pop: {list(self.session.keys())}")
        return value

    def build_absolute_uri(self, path=None):
        """Ensure https is used in production"""
        uri = super().build_absolute_uri(path)
        if settings.IS_RENDER:
            uri = uri.replace('http:', 'https:')
        logger.info(f"Built URI: {uri}")
        return uri

    def get_session(self):
        """Get the current session object"""
        return self.session