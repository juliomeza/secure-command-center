"""
Django settings for project.
This file dynamically imports settings based on environment.
"""
import os
import sys

# Determine environment
IS_RENDER = os.environ.get('IS_RENDER', False)

try:
    # First import base settings
    from .base import *

    # Then import environment-specific settings
    if IS_RENDER:
        # Production settings for render.com
        from .production import *
    else:
        # Development settings
        from .development import *

except ImportError as e:
    print(f"Error importing settings: {e}")
    sys.exit(1)