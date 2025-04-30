from django.contrib import admin
from .models import UserProfile, Company, Warehouse, Tab # Import Tab

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

# Register the new Tab model
@admin.register(Tab)
class TabAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'id_name')
    search_fields = ('display_name', 'id_name')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # Update list_display: add email
    list_display = ('get_identifier', 'email', 'is_authorized', 'display_allowed_companies', 'display_allowed_warehouses', 'display_allowed_tabs')
    list_filter = ('is_authorized', 'allowed_companies', 'allowed_tabs') # Added filters
    search_fields = ('user__username', 'user__email', 'email') # Added email search
    filter_horizontal = ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')
    list_select_related = ('user',)
    # Define base readonly fields (none by default now)
    readonly_fields = ()

    # Define fieldsets to conditionally show user or email
    # fieldsets = (
    #     (None, {
    #         'fields': ('user', 'email', 'is_authorized') # Include email
    #     }),
    #     ('Permissions', {
    #         'fields': ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')
    #     }),
    # )

    # Use get_fieldsets for more dynamic control
    def get_fieldsets(self, request, obj=None):
        if obj and obj.user: # Editing a linked profile
            return (
                (None, {'fields': ('user', 'email', 'is_authorized')}),
                ('Permissions', {'fields': ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')}),
            )
        elif obj and not obj.user: # Editing a pre-configured profile
            return (
                (None, {'fields': ('email', 'is_authorized')}), # Show email, not user
                ('Permissions', {'fields': ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')}),
            )
        else: # Adding a new profile (pre-configured or linked directly)
            return (
                ('Link or Pre-configure', {
                    'fields': ('user', 'email'),
                    'description': "Set either the User (to link immediately) or the Email (to pre-configure)."
                }),
                (None, {'fields': ('is_authorized',)}),
                ('Permissions', {'fields': ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')}),
            )

    # Make fields readonly based on context
    def get_readonly_fields(self, request, obj=None):
        if obj and obj.user: # Editing a linked profile
            # Make user and email readonly once linked
            return self.readonly_fields + ('user', 'email')
        elif obj and not obj.user: # Editing a pre-configured profile
            # Allow editing email if not linked
            return self.readonly_fields
        return self.readonly_fields # No readonly fields when adding

    # Helper methods for display
    @admin.display(description='User / Email', ordering='user__username')
    def get_identifier(self, obj):
        if obj.user:
            return obj.user.username
        return obj.email or "-"

    @admin.display(description='User Email', ordering='user__email')
    def user__email(self, obj):
        return obj.user.email if obj.user else "-"

    @admin.display(description='Allowed Companies')
    def display_allowed_companies(self, obj):
        return ", ".join([company.name for company in obj.allowed_companies.all()])

    @admin.display(description='Allowed Warehouses')
    def display_allowed_warehouses(self, obj):
        return ", ".join([warehouse.name for warehouse in obj.allowed_warehouses.all()])

    @admin.display(description='Allowed Tabs')
    def display_allowed_tabs(self, obj):
        return ", ".join([tab.display_name for tab in obj.allowed_tabs.all()])

    # Override save_model to potentially clear email if user is set
    # def save_model(self, request, obj, form, change):
    #     # Optional: Clear the pre-configured email once the user is linked?
    #     # if obj.user and obj.email:
    #     #     obj.email = None # Or keep it for history?
    #     super().save_model(request, obj, form, change)

    # Override get_queryset to improve performance
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('allowed_companies', 'allowed_warehouses', 'allowed_tabs').select_related('user')
