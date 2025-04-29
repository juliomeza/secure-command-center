from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse, re_path, path, include # Added path, include
from django.http import HttpResponse
from django.conf import settings
from django.contrib import admin # Added admin import
from .models import UserProfile, Company, Warehouse
import factory # Add factory import
# <<< Import UserFactory from authentication tests
from authentication.tests import UserFactory

User = get_user_model()

# Dummy view for testing middleware against a non-exempt path
def dummy_protected_view(request):
    return HttpResponse("OK - Accessed Protected View")

# Define URL patterns for the test context
# Include the dummy view AND the admin URLs so reverse() works
urlpatterns = [
    re_path(r'^_test/protected-path/$', dummy_protected_view, name='test_protected_path'),
    path('admin/', admin.site.urls), # Add admin URLs here
]

# --- Factories ---
# <<< ADDED UserProfileFactory (moved from authentication/tests.py)
class UserProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserProfile # Use the UserProfile model from this app

    user = factory.SubFactory(UserFactory)
    is_authorized = factory.Faker('boolean')
    # Add other fields from access.UserProfile if needed by tests
    # allowed_tabs_list = factory.LazyFunction(lambda: ",".join(random.sample(UserProfile.VALID_TABS, k=random.randint(0, len(UserProfile.VALID_TABS)))))

class UserProfileModelTest(TestCase):
    """Tests for the UserProfile model."""
    def setUp(self):
        self.user = User.objects.create_user(username='testuser_profile', password='password')
        # Assuming profile is NOT automatically created by signal (adjust if it is)
        self.profile = UserProfile.objects.create(user=self.user)

    # <<< ADDED test_profile_creation_str (moved and corrected from authentication/tests.py)
    def test_profile_creation_str(self):
        """Prueba la representación de cadena de UserProfile."""
        # Use the factory to create a profile for this specific test
        profile = UserProfileFactory()
        # <<< CORRECTED Assertion based on actual __str__ output
        # Assuming the __str__ method is: return f"{self.user.username}'s Access Profile"
        self.assertEqual(str(profile), f"{profile.user.username}'s Access Profile")

    def test_profile_creation_defaults(self):
        """Test that a new profile has the correct default values."""
        self.assertEqual(self.profile.user, self.user)
        self.assertFalse(self.profile.is_authorized)
        self.assertEqual(self.profile.allowed_companies.count(), 0)
        self.assertEqual(self.profile.allowed_warehouses.count(), 0)
        self.assertEqual(self.profile.allowed_tabs_list, "")
        self.assertEqual(self.profile.get_allowed_tabs(), [])

    def test_get_set_allowed_tabs(self):
        """Test the get_allowed_tabs and set_allowed_tabs methods."""
        self.assertEqual(self.profile.get_allowed_tabs(), [])

        tabs_to_set = ['CEO', 'Leaders', 'InvalidTab']
        valid_tabs_expected = ['CEO', 'Leaders'] # 'InvalidTab' should be ignored
        valid_tabs_string_expected = 'CEO,Leaders'

        self.profile.set_allowed_tabs(tabs_to_set)
        self.profile.save()

        # Reload from DB to ensure changes were saved and methods work correctly
        reloaded_profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(reloaded_profile.allowed_tabs_list, valid_tabs_string_expected)
        self.assertEqual(reloaded_profile.get_allowed_tabs(), valid_tabs_expected)

        # Test setting empty list
        reloaded_profile.set_allowed_tabs([])
        reloaded_profile.save()
        final_profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(final_profile.allowed_tabs_list, "")
        self.assertEqual(final_profile.get_allowed_tabs(), [])


class AuthorizationMiddlewareTest(TestCase):
    """Tests for the AuthorizationMiddleware."""

    _original_root_urlconf = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Temporarily override ROOT_URLCONF to include our dummy protected URL
        cls._original_root_urlconf = settings.ROOT_URLCONF
        settings.ROOT_URLCONF = __name__ # Point URL resolution to this test module

    @classmethod
    def tearDownClass(cls):
        # Restore original ROOT_URLCONF
        settings.ROOT_URLCONF = cls._original_root_urlconf
        super().tearDownClass()

    def setUp(self):
        self.client = Client()
        self.authorized_user = User.objects.create_user(username='auth_user_mw', password='password')
        self.unauthorized_user = User.objects.create_user(username='unauth_user_mw', password='password')
        self.no_profile_user = User.objects.create_user(username='noprofile_user_mw', password='password')

        # Create profiles explicitly
        UserProfile.objects.create(user=self.authorized_user, is_authorized=True)
        UserProfile.objects.create(user=self.unauthorized_user, is_authorized=False)
        # No profile created for no_profile_user

        # URLs
        self.protected_url = reverse('test_protected_path') # Our dummy protected URL
        # Use URLs known to be exempt based on middleware.py
        self.admin_url = reverse('admin:index')
        self.auth_api_url = '/api/auth/some-endpoint/' # Matches '/api/auth/' pattern
        self.permissions_url = '/api/access/permissions/' # Explicitly exempt

    def test_unauthenticated_access_passes_middleware(self):
        """Unauthenticated users should pass through this middleware."""
        response_protected = self.client.get(self.protected_url)
        response_admin = self.client.get(self.admin_url)
        # Middleware should let these requests pass through.
        # The final status code depends on subsequent middleware/views (e.g., auth redirects).
        # We just check it wasn't the specific 403 from *this* middleware.
        self.assertNotEqual(response_protected.status_code, 403, "Middleware should not block unauthenticated user on protected URL")
        self.assertNotEqual(response_admin.status_code, 403, "Middleware should not block unauthenticated user on exempt URL")


    def test_unauthorized_user_access_to_protected_url(self):
        """Authenticated but unauthorized users should get 403 on protected URLs."""
        self.client.login(username='unauth_user_mw', password='password')
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, 403)
        self.assertIn('not authorized', response.json().get('detail', '').lower())
        self.client.logout()

    def test_authorized_user_access_to_protected_url(self):
        """Authorized users should access protected URLs successfully (reach the view)."""
        self.client.login(username='auth_user_mw', password='password')
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), "OK - Accessed Protected View")
        self.client.logout()

    def test_authorized_user_access_to_exempt_urls(self):
        """Authorized users should access exempt URLs."""
        self.client.login(username='auth_user_mw', password='password')
        response_admin = self.client.get(self.admin_url)
        response_auth = self.client.get(self.auth_api_url) # Needs a view to return 200/404 etc.
        response_perms = self.client.get(self.permissions_url) # Needs a view

        # Check they weren't blocked by *this* middleware's 403 logic
        self.assertNotEqual(response_admin.status_code, 403)
        self.assertNotEqual(response_auth.status_code, 403)
        self.assertNotEqual(response_perms.status_code, 403)
        self.client.logout()

    def test_unauthorized_user_access_to_exempt_urls(self):
        """Unauthorized users should also access exempt URLs (middleware ignores them)."""
        self.client.login(username='unauth_user_mw', password='password')
        response_admin = self.client.get(self.admin_url)
        response_auth = self.client.get(self.auth_api_url)
        response_perms = self.client.get(self.permissions_url)

        self.assertNotEqual(response_admin.status_code, 403)
        self.assertNotEqual(response_auth.status_code, 403)
        self.assertNotEqual(response_perms.status_code, 403)
        self.client.logout()

    def test_no_profile_user_access_to_protected_url(self):
        """Authenticated users without a profile should get 403 on protected URLs."""
        self.client.login(username='noprofile_user_mw', password='password')
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, 403)
        self.assertIn('profile not found', response.json().get('detail', '').lower())
        self.client.logout()

    def test_no_profile_user_access_to_exempt_urls(self):
        """Users without profiles should still access exempt URLs."""
        self.client.login(username='noprofile_user_mw', password='password')
        response_admin = self.client.get(self.admin_url)
        response_auth = self.client.get(self.auth_api_url)
        response_perms = self.client.get(self.permissions_url)

        self.assertNotEqual(response_admin.status_code, 403)
        self.assertNotEqual(response_auth.status_code, 403)
        self.assertNotEqual(response_perms.status_code, 403)
        self.client.logout()


# Placeholder for View tests (when views are added to access/views.py)
class AccessViewTests(TestCase):
    """Tests for the views in the access app."""
    def setUp(self):
        self.client = Client()
        # Add setup for users, profiles etc. as needed for view tests
        # self.user = User.objects.create_user(...)
        # UserProfile.objects.create(user=self.user, is_authorized=True, ...)

    def test_placeholder_for_future_views(self):
        """Add tests here when views are implemented in access/views.py."""
        # Example:
        # self.client.login(username='some_user', password='password')
        # response = self.client.get(reverse('access:some_view_name'))
        # self.assertEqual(response.status_code, 200)
        # self.assertContains(response, "Expected content for authorized user")
        self.assertTrue(True) # Placeholder assertion

# Note: The middleware tests rely on overriding settings.ROOT_URLCONF.
# Ensure your main project's urls.py (or the one specified in settings)
# doesn't conflict with the dummy URL used here.
# Also, ensure the User model and AUTH_USER_MODEL setting are standard Django.
