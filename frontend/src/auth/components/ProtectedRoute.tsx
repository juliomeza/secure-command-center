// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isLoading, user, error } = useAuth();
    const location = useLocation();

    // useEffect for logging purposes, removed the checkAuthStatus call
    useEffect(() => {
        // Log current state when relevant dependencies change
        const isUserObjectHTML = user && typeof user === 'object' &&
                               'id' in user && typeof user.id === 'number' ? false : true;

        console.log('[ProtectedRoute] Auth state:', {
            path: location.pathname,
            isAuthenticated,
            isLoading,
            hasUser: user !== null,
            userType: user ? typeof user : 'null',
            isUserObjectHTML,
            error
        });

        // Log actual user details
        if (user && !isUserObjectHTML) {
            console.log('[ProtectedRoute] Authenticated user:', {
                id: user.id,
                username: user.username,
                fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email,
                profile_job_title: user.profile?.job_title || 'No job title', // Added job title for context
                profile_azure_oid: user.profile?.azure_oid || 'No Azure OID' // Added azure_oid for context
            });
        }
    }, [isAuthenticated, isLoading, location.pathname, user, error]);

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
        console.error("[ProtectedRoute] Invalid user object detected:", user);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;