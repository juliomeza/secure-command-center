// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (user && isAuthenticated) {
            console.log('[ProtectedRoute] User authenticated:', {
                username: user.username,
                email: user.email
            });
        }
    }, [isAuthenticated, user]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    const isInvalidUser = user && (
        typeof user === 'string' ||
        !('id' in user) ||
        typeof user.id !== 'number'
    );

    if (isInvalidUser) {
        console.error("[ProtectedRoute] Invalid user object detected");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;