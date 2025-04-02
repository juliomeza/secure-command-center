# Secure App OAuth Configuration

## Azure AD Configuration

### Required Settings
1. In the Azure Portal, navigate to your App Registration
2. Under "Authentication", configure the following:
   - Web Redirect URIs:
     - `http://localhost:5173/auth/complete/azuread-oauth2/`
     - `https://localhost:8000/auth/complete/azuread-oauth2/`
   - Supported account types: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)"

## Google Cloud Configuration

### Required Settings
1. In Google Cloud Console, navigate to your OAuth 2.0 Client ID
2. Configure the following:
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/complete/google-oauth2/`
     - `https://127.0.0.1:8000/auth/complete/google-oauth2/`
     - `https://localhost:8000/auth/complete/google-oauth2/`

## Important Notes
- All redirect URIs must be registered exactly as they appear in your application configuration
- For development, both HTTP and HTTPS versions are included for local testing
- The redirect URIs must match the exact URL that your application is using
- If your application changes ports or domains, you must update these configurations