# Secure Command Center

This project consists of a Django backend and React frontend for an executive dashboard application with security features.

## Features

- User authentication (Azure AD, Username/Password)
- Multi-company support with granular access control
- Role-based dashboard views (CEO, CFO, COO, CIO, Leaders)
- Company and time period filtering
- Secure API endpoints
- Responsive design

## Application Structure

### Multi-Company Support
The application is designed to handle multiple companies (5+) with the following features:
- Users can be granted access to all companies or specific ones
- Data can be viewed aggregated across all accessible companies or filtered by company
- Company selection persists across sessions

### Role-Based Views
The dashboard consists of 5 main views (tabs):
- **CEO View**: Company-wide performance metrics and KPIs
- **CFO View**: Financial metrics and analysis
- **COO View**: Operational performance and efficiency
- **CIO View**: Technology infrastructure and projects
- **Leaders View**: Warehouse-specific metrics and management

### Warehouse Management (Leaders View)
The Leaders view provides warehouse-specific functionality:
- Companies can have multiple warehouses (varying by company)
- Access control at warehouse level:
  - Full access: View all warehouses across companies
  - Limited access: View specific warehouse(s)
- Warehouse-specific metrics and KPIs
- Consolidated view for users with multi-warehouse access

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

## Project Structure

```
├── backend/                # Django backend
│   ├── core/              # Main application
│   └── project/           # Django settings
├── frontend/              # React frontend
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # React components
│       │   ├── charts/    # Data visualization
│       │   ├── common/    # Reusable UI components
│       │   ├── layout/    # Layout components
│       │   └── tables/    # Data table components
│       ├── services/      # API services
│       │   ├── core/      # Core services (auth, company, period)
│       │   ├── metrics/   # Metrics by domain (financial, operations, etc)
│       │   └── permission/# Access control services
│       ├── data/          # Types and mock data
│       ├── utils/         # Utility functions
│       └── views/         # Role-specific dashboard views
└── docker-compose.yml     # Docker configuration

```

## Development Status

### Current Implementation
- Frontend views and components structure completed
- Mock data implementation for testing
- Basic authentication system
- Company and period selection functionality

### Pending Implementation
- Backend role-based access control system
- Company-specific data segregation
- Warehouse-level access control
- API endpoints for each metric type
- Integration with real data sources

### Access Control Implementation Plan
The system will support the following permission levels:
1. **Company Access**
   - All companies
   - Specific company/companies
2. **Role Access**
   - All dashboard views
   - Specific view(s)
3. **Warehouse Access** (Leaders View)
   - All warehouses
   - Specific warehouse(s)
   - No warehouse access

## Docker Setup

You can run the entire application stack using Docker Compose:

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

### Important Notes
- All redirect URIs must be registered exactly as they appear in your application configuration
- For development, both HTTP and HTTPS versions are included for local testing
- The redirect URIs must match the exact URL that your application is using
- If your application changes ports or domains, you must update these configurations