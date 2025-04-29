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

# Model for Tabs/Views
class Tab(models.Model):
    id_name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique identifier for the tab (e.g., CEO, Leaders). Used internally."
    )
    display_name = models.CharField(
        max_length=100,
        help_text="User-friendly name for the tab (e.g., CEO View, Leaders View)."
    )
    # Add other fields if needed, like description, icon, order, etc.

    def __str__(self):
        return self.display_name

    class Meta:
        ordering = ['display_name'] # Optional: order tabs alphabetically by default

# User Profile to store access permissions
class UserProfile(models.Model):
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
    allowed_tabs = models.ManyToManyField(
        Tab,
        blank=True,
        help_text="Tabs/Views this user is allowed to access."
    )

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
