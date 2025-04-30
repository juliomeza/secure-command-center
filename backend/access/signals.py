# filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\backend\access\signals.py
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging

from .models import UserProfile

logger = logging.getLogger(__name__)
User = get_user_model()

@receiver(post_save, sender=User)
def link_preconfigured_profile(sender, instance, created, **kwargs):
    """
    Signal handler to link a pre-configured UserProfile to a newly created User.

    Checks if a UserProfile exists with the new user's email (case-insensitive)
    and no user linked yet. If found, links the profile to the new user.
    """
    if created and instance.email:
        user_email_normalized = instance.email.lower().strip()
        try:
            # Look for a profile with matching email and no user linked
            preconfigured_profile = UserProfile.objects.filter(
                email__iexact=user_email_normalized,
                user__isnull=True
            ).first() # Use first() to get one or None

            if preconfigured_profile:
                # Link the profile to the new user
                preconfigured_profile.user = instance
                # Optional: Clear the email field now that it's linked?
                # preconfigured_profile.email = None # Decide if you want this behavior
                preconfigured_profile.save()
                logger.info(f"Linked pre-configured profile (ID: {preconfigured_profile.pk}) to new user {instance.username} ({instance.email})")

            # Optional: What if no pre-configured profile exists?
            # Should we create a default one? The original commented-out signal
            # in models.py did this. Let's decide if that's needed.
            # For now, we only link if one exists.
            # else:
            #     # Create a default profile if none was pre-configured
            #     UserProfile.objects.create(user=instance)
            #     logger.info(f"Created default profile for new user {instance.username} ({instance.email})")


        except UserProfile.DoesNotExist:
            # This case is handled by .first() returning None, but kept for clarity
            pass
        except Exception as e:
            # Log any unexpected error during profile linking
            logger.error(f"Error linking pre-configured profile for user {instance.email}: {e}", exc_info=True)

