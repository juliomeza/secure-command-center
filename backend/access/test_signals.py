# filepath: c:\Users\jmeza.WOODFIELD\git\Projects\secure-command-center\backend\access\test_signals.py
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .models import UserProfile, Company, Tab # Import necessary models

User = get_user_model()

@pytest.mark.django_db
def test_link_preconfigured_profile_success():
    """Test that a pre-configured profile is linked when a user with matching email is created."""
    email_to_test = "test@example.com"
    # Create a pre-configured profile
    pre_profile = UserProfile.objects.create(email=email_to_test, is_authorized=True)
    # Add some permissions to check they are carried over
    company = Company.objects.create(name="Test Co")
    tab = Tab.objects.create(id_name="test_tab", display_name="Test Tab")
    pre_profile.allowed_companies.add(company)
    pre_profile.allowed_tabs.add(tab)

    # Create a new user with the matching email
    new_user = User.objects.create_user(username="testuser", email=email_to_test, password="password")

    # Refresh the profile from the DB to see if the signal linked the user
    linked_profile = UserProfile.objects.get(pk=pre_profile.pk)

    assert linked_profile.user == new_user
    assert new_user.access_profile == linked_profile # Check the reverse relationship
    assert linked_profile.is_authorized is True
    assert company in linked_profile.allowed_companies.all()
    assert tab in linked_profile.allowed_tabs.all()
    # Optional: Check if email field was cleared or kept (depends on signal logic)
    # assert linked_profile.email is None # If email is cleared after linking
    assert linked_profile.email == email_to_test.lower() # If email is kept

@pytest.mark.django_db
def test_no_link_if_email_mismatch():
    """Test that a profile is NOT linked if the user's email doesn't match."""
    pre_profile = UserProfile.objects.create(email="preconf@example.com", is_authorized=True)
    new_user = User.objects.create_user(username="otheruser", email="other@example.com", password="password")

    # Check if the user got a profile automatically (it shouldn't be the pre-configured one)
    with pytest.raises(UserProfile.DoesNotExist):
        # Accessing the related manager should raise DoesNotExist if no profile is linked
        _ = new_user.access_profile

    # Verify the pre-configured profile remains unlinked
    pre_profile.refresh_from_db()
    assert pre_profile.user is None

@pytest.mark.django_db
def test_no_link_if_user_has_no_email():
    """Test that no linking occurs if the new user doesn't have an email."""
    pre_profile = UserProfile.objects.create(email="noemailuser@example.com", is_authorized=True)
    # Create user without email (ensure your User model allows this or adjust test)
    new_user = User.objects.create_user(username="noemailuser", email=None, password="password")

    with pytest.raises(UserProfile.DoesNotExist):
        _ = new_user.access_profile

    pre_profile.refresh_from_db()
    assert pre_profile.user is None

@pytest.mark.django_db
def test_no_link_if_no_preconfigured_profile():
    """Test that no profile is linked if none exists for the user's email."""
    new_user = User.objects.create_user(username="nopreconf", email="nopreconf@example.com", password="password")

    with pytest.raises(UserProfile.DoesNotExist):
        _ = new_user.access_profile

@pytest.mark.django_db
def test_preconfigured_profile_email_uniqueness():
    """Test that creating two pre-configured profiles with the same email raises ValidationError."""
    email_to_test = "unique@example.com"
    UserProfile.objects.create(email=email_to_test)

    with pytest.raises(ValidationError) as excinfo:
        # Attempt to create another profile with the same email (case-insensitive) and no user
        UserProfile(email=email_to_test.upper()).full_clean() # Use full_clean to trigger validation

    assert 'email' in excinfo.value.message_dict # Check that the error is related to the email field
    # Check for the Spanish error message defined in models.py clean() method
    assert "Ya existe un perfil pre-configurado con este email." in excinfo.value.message_dict['email'][0]

@pytest.mark.django_db
def test_signal_on_user_update():
    """Test that the signal doesn't cause issues when an existing user is saved."""
    email_to_test = "update@example.com"
    # Create user and profile (linked)
    user = User.objects.create_user(username="updateuser", email=email_to_test, password="password")
    profile = UserProfile.objects.create(user=user, email=email_to_test, is_authorized=True)

    # Create another pre-configured profile (should not interfere)
    other_email = "otherupdate@example.com"
    UserProfile.objects.create(email=other_email)

    # Update the user
    user.first_name = "Updated"
    user.save()

    # Refresh profile and check it's still linked correctly
    profile.refresh_from_db()
    assert profile.user == user
    assert profile.email == email_to_test # Assuming email isn't cleared

    # Check the other pre-configured profile remains unlinked
    other_profile = UserProfile.objects.get(email=other_email)
    assert other_profile.user is None

@pytest.mark.django_db
def test_link_case_insensitive_email():
    """Test that linking works correctly regardless of email case."""
    email_lower = "case@example.com"
    email_upper = "CASE@EXAMPLE.COM"

    pre_profile = UserProfile.objects.create(email=email_lower, is_authorized=True)
    new_user = User.objects.create_user(username="caseuser", email=email_upper, password="password")

    linked_profile = UserProfile.objects.get(pk=pre_profile.pk)
    assert linked_profile.user == new_user
    assert new_user.access_profile == linked_profile
