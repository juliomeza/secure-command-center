// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isLoading, checkAuth, user } = useAuth();
    const location = useLocation();

    // Force authentication check when route is accessed directly
    useEffect(() => {
        // If we're not authenticated and not currently loading, check again
        // This helps when the route is accessed directly via URL
        if (!isAuthenticated && !isLoading) {
            checkAuth();
        }
        
        // Log the auth state for debugging
        console.log('ProtectedRoute state:', { isAuthenticated, isLoading, user });
    }, [isAuthenticated, isLoading, checkAuth, location.pathname]);

    if (isLoading) {
        // Show a better loading indicator
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login,
        // which is a nicer user experience than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child routes/components
    return <Outlet />;
};

export default ProtectedRoute;