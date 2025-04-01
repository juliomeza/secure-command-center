# backend/core/pipelines.py
from .models import Company, UserProfile
from django.contrib.auth.models import User

def save_profile_details(backend, user: User, response, *args, **kwargs):
    """
    Pipeline step to create/update UserProfile and associate Company.
    This needs customization based on how company info is provided by Azure AD.
    Example: Using email domain or a specific claim.
    """
    if backend.name == 'azuread-oauth2':
        # --- Attempt to determine company ---
        # Option 1: Extract from email domain (simple example)
        company_name = None
        email = response.get('mail') or response.get('email') or response.get('upn')
        if email and '@' in email:
            domain = email.split('@')[1]
            # You might have a mapping of domains to company names
            # For simplicity, we use the domain directly (or a cleaned version)
            # In a real scenario, you might look up the domain in a predefined list.
            company_name = domain.split('.')[0].capitalize() # Basic example

        # Option 2: Look for a specific claim (e.g., 'company_name')
        # company_name = response.get('company_name') # If Azure AD sends this claim

        # --- Find or Create Company ---
        company = None
        if company_name:
            company, created = Company.objects.get_or_create(name=company_name)
            if created:
                print(f"Created new company: {company_name}")

        # --- Create or Update UserProfile ---
        profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'company': company,
                'azure_oid': response.get('oid'), # Azure AD Object ID
                'job_title': response.get('jobTitle'),
                # Add other fields from 'response' or 'details' as needed
            }
        )
        if created:
            print(f"Created profile for user: {user.username}")
        else:
            print(f"Updated profile for user: {user.username}")

        # --- Update User model fields (optional) ---
        # You might want to update User fields directly if not done automatically
        # user.first_name = response.get('given_name', '')
        # user.last_name = response.get('family_name', '')
        # user.email = email # Ensure email is saved if not handled by create_user step
        # user.save()