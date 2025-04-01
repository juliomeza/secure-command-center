// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Show a loading indicator while checking auth status
        return <div>Loading authentication status...</div>;
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login,
        // which is a nicer user experience than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child routes/components
    return <Outlet />;
};

export default ProtectedRoute;