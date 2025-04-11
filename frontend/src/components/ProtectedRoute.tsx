// frontend/src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
    // Allows passing specific roles/permissions in the future if needed
    // allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
    const { isAuthenticated, isLoading, checkAuth, user, error } = useAuth();
    const location = useLocation();

    // Force authentication check when route is accessed directly
    useEffect(() => {
        // If we're not authenticated and not currently loading, check again
        // This helps when the route is accessed directly via URL
        if (!isAuthenticated && !isLoading) {
            console.log("[ProtectedRoute] Not authenticated, rechecking...");
            checkAuth();
        }
        
        // Check if the user object is actually HTML (invalid response)
        const isUserObjectHTML = user && typeof user === 'object' && 
                               'id' in user && typeof user.id === 'number' ? false : true;
        
        // Log the auth state for debugging
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
                company: user.profile?.company?.name || 'No company'
            });
        }
    }, [isAuthenticated, isLoading, checkAuth, location.pathname, user, error]);

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

    // Extra validation to detect invalid user objects
    const isInvalidUser = user && (
        typeof user === 'string' || 
        !('id' in user) || 
        typeof user.id !== 'number'
    );
    
    if (isInvalidUser) {
        console.error("[ProtectedRoute] Invalid user object detected:", user);
        // Force logout/redirect when invalid user is detected
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated, redirecting to login');
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login,
        // which is a nicer user experience than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child routes/components
    return <Outlet />;
};

export default ProtectedRoute;