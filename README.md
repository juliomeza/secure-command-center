# Secure Command Center

This project consists of a Django backend and React frontend for an executive dashboard application with security features.

## Features

- User authentication (Azure AD, Username/Password)
- Role-based dashboard views (CEO, CFO, COO, CIO)
- Company and time period filtering
- Secure API endpoints
- Responsive design

## Tech Stack

### Frontend
- React 19.x
- TypeScript
- React Router DOM
- Recharts for data visualization
- Axios for API requests

### Backend
- Django 5.x
- Django REST Framework
- Social Auth for Azure AD integration
- PostgreSQL database

## Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Start the development server:
   ```
   python manage.py runserver
   ```

   For HTTPS (recommended for Azure AD auth):
   ```
   python manage.py runsslserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

## Docker Setup

You can also run the entire application stack using Docker Compose:

```
docker-compose up -d
```

## OAuth Configuration

### Azure AD Configuration

1. In the Azure Portal, navigate to your App Registration
2. Under "Authentication", configure the following:
   - Web Redirect URIs:
     - `http://localhost:5173/auth/complete/azuread-oauth2/`
     - `https://localhost:8000/auth/complete/azuread-oauth2/`
   - Supported account types: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)"

### Google Cloud Configuration

1. In Google Cloud Console, navigate to your OAuth 2.0 Client ID
2. Configure the following:
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/complete/google-oauth2/`
     - `https://127.0.0.1:8000/auth/complete/google-oauth2/`
     - `https://localhost:8000/auth/complete/google-oauth2/`

## Folder Structure

```
├── backend/                # Django backend
│   ├── core/               # Main application
│   └── project/            # Django settings
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   └── src/                # Source code
│       ├── components/     # React components
│       │   ├── charts/     # Data visualization components
│       │   ├── common/     # Reusable UI components
│       │   ├── layout/     # Layout components
│       │   └── tables/     # Data table components
│       ├── data/           # Mock data and data types
│       ├── utils/          # Utility functions
│       └── views/          # Role-specific dashboard views
└── docker-compose.yml      # Docker configuration
```

## Note on Current Status

The application currently uses mock data defined in `frontend/src/data/mockData.ts`. In a production environment, these would be replaced with API calls to the backend.

The authentication system is functional, with integrations for:
- Traditional username/password login
- Azure AD/Microsoft authentication

The main dashboard displays different views depending on the selected role (CEO, CFO, COO, CIO).

## Important Notes
- All redirect URIs must be registered exactly as they appear in your application configuration
- For development, both HTTP and HTTPS versions are included for local testing
- The redirect URIs must match the exact URL that your application is using
- If your application changes ports or domains, you must update these configurations