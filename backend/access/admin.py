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
    # Update list_display: remove allowed_tabs_list, add display_allowed_tabs
    list_display = ('user', 'user__email', 'is_authorized', 'display_allowed_companies', 'display_allowed_warehouses', 'display_allowed_tabs')
    list_filter = ('is_authorized',)
    search_fields = ('user__username', 'user__email')
    # Add allowed_tabs to filter_horizontal
    filter_horizontal = ('allowed_companies', 'allowed_warehouses', 'allowed_tabs')
    list_select_related = ('user',)

    # Remove 'user' from base readonly_fields
    # readonly_fields = ('user',)

    # Define fieldsets
    fieldsets = (
        (None, {
            'fields': ('user', 'is_authorized')
        }),
        ('Permissions', {
            'fields': ('allowed_companies', 'allowed_warehouses', 'allowed_tabs') # Updated field
        }),
    )

    # Make 'user' readonly only when editing an existing object, not when adding
    def get_readonly_fields(self, request, obj=None):
        if obj: # Editing an existing object
            return self.readonly_fields + ('user',)
        return self.readonly_fields

    # Make 'user' required only when adding a new object
    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        # You might customize field order or presence here if needed
        return fields

    def display_allowed_companies(self, obj):
        return ", ".join([company.name for company in obj.allowed_companies.all()])
    display_allowed_companies.short_description = 'Allowed Companies'

    def display_allowed_warehouses(self, obj):
        return ", ".join([warehouse.name for warehouse in obj.allowed_warehouses.all()])
    display_allowed_warehouses.short_description = 'Allowed Warehouses'

    # Add method to display allowed tabs
    def display_allowed_tabs(self, obj):
        return ", ".join([tab.display_name for tab in obj.allowed_tabs.all()])
    display_allowed_tabs.short_description = 'Allowed Tabs'

    actions = ['authorize_users', 'unauthorize_users']

    def authorize_users(self, request, queryset):
        queryset.update(is_authorized=True)
    authorize_users.short_description = "Mark selected users as authorized"

    def unauthorize_users(self, request, queryset):
        queryset.update(is_authorized=False)
    unauthorize_users.short_description = "Mark selected users as unauthorized"
