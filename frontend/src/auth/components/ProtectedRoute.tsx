// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isAuthorized, isLoading, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (user && isAuthenticated) {
            console.log('[ProtectedRoute] User authenticated:', {
                username: user.username,
                email: user.email,
                isAuthorized
            });
        }
    }, [isAuthenticated, isAuthorized, user]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    {/* Add data-testid to the spinning div */}
                    <div 
                        data-testid="loading-spinner" 
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
                    ></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated. Redirecting to /login.');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthorized) {
        console.log('[ProtectedRoute] User authenticated but not authorized. Redirecting to /unauthorized.');
        return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;