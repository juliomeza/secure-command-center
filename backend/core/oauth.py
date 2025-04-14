from social_django.strategy import DjangoStrategy
from django.conf import settings
import logging

logger = logging.getLogger('core')

class CustomDjangoStrategy(DjangoStrategy):
    def session_get(self, name):
        """Custom session getter that handles state more reliably"""
        value = super().session_get(name)
        logger.info(f"Session get: {name} = {value}")
        logger.info(f"All session keys: {list(self.session.keys())}")
        return value

    def session_set(self, name, value):
        """Custom session setter with immediate save"""
        logger.info(f"Session set: {name} = {value}")
        super().session_set(name, value)
        self.session.modified = True
        self.session.save()

    def build_absolute_uri(self, path=None):
        """Ensure https is used in production"""
        uri = super().build_absolute_uri(path)
        if settings.IS_RENDER:
            uri = uri.replace('http:', 'https:')
        logger.info(f"Built URI: {uri}")
        return uri