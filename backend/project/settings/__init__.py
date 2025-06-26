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
    from .base import *  # noqa: F403

    # Then import environment-specific settings
    if IS_RENDER:
        # Production settings for render.com
        from .production import *  # noqa: F403
    else:
        # Development settings
        from .development import *  # noqa: F403

except ImportError as e:
    print(f"Error importing settings: {e}")
    sys.exit(1)
