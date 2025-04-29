from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

# Placeholder model for Companies
class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # Add other relevant fields later if needed for access control itself

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Companies"

# Placeholder model for Warehouses
class Warehouse(models.Model):
    name = models.CharField(max_length=100, unique=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE, # Or models.PROTECT, models.SET_NULL depending on desired behavior
        related_name='warehouses',
        null=True, # Allow null temporarily for migration
        blank=True # Allow blank temporarily for migration
    )
    # Add other relevant fields later if needed for access control itself

    def __str__(self):
        # Optionally include company name in string representation
        if self.company:
            return f"{self.name} ({self.company.name})"
        return self.name

# User Profile to store access permissions
class UserProfile(models.Model):
    TAB_CHOICES = [
        ('CEO', 'CEO View'),
        ('CIO', 'CIO View'),
        ('COO', 'COO View'),
        ('CFO', 'CFO View'),
        ('CTO', 'CTO View'),
        ('Leaders', 'Leaders View'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='access_profile'
    )
    is_authorized = models.BooleanField(
        default=False,
        help_text="Designates whether the user is authorized to access the application."
    )
    allowed_companies = models.ManyToManyField(
        Company,
        blank=True,
        help_text="Companies this user is allowed to view data for."
    )
    allowed_warehouses = models.ManyToManyField(
        Warehouse,
        blank=True,
        help_text="Warehouses (Leaders tab) this user is allowed to view data for."
    )
    # Storing allowed tabs as a comma-separated string for simplicity initially
    # Consider a dedicated Tab model and ManyToManyField for more complex scenarios
    allowed_tabs_list = models.CharField(
        max_length=200,
        blank=True,
        help_text="Comma-separated list of tabs the user can access (e.g., CEO,CIO,Leaders)."
    )

    def get_allowed_tabs(self):
        """Returns a list of allowed tab identifiers."""
        if not self.allowed_tabs_list:
            return []
        return [tab.strip() for tab in self.allowed_tabs_list.split(',') if tab.strip()]

    def set_allowed_tabs(self, tabs_list):
        """Sets the allowed tabs from a list of identifiers."""
        # Ensure only valid choices are stored
        valid_tabs = [choice[0] for choice in self.TAB_CHOICES]
        cleaned_tabs = [tab for tab in tabs_list if tab in valid_tabs]
        self.allowed_tabs_list = ','.join(cleaned_tabs)

    def __str__(self):
        return f"{self.user.username}'s Access Profile"

# Optional: Signal to create/update UserProfile when User is created/saved
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# @receiver(post_save, sender=settings.AUTH_USER_MODEL)
# def create_or_update_user_profile(sender, instance, created, **kwargs):
#     if created:
#         UserProfile.objects.create(user=instance)
#     instance.access_profile.save()
