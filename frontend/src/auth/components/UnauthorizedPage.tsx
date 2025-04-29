// frontend/src/auth/components/UnauthorizedPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

const UnauthorizedPage: React.FC = () => {
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Keep track to prevent multiple calls

    useEffect(() => {
        // Only set the timeout if we haven't started the logout process yet
        if (!isLoggingOut) {
            console.log('[UnauthorizedPage] User is not authorized. Scheduling automatic logout...');

            const timerId = setTimeout(() => {
                setIsLoggingOut(true); // Mark as logging out before calling
                console.log('[UnauthorizedPage] Timeout finished. Logging out now...');
                logout().catch(error => {
                    console.error("[UnauthorizedPage] Automatic logout failed:", error);
                    // Consider how to handle failed logout - maybe allow manual retry?
                    setIsLoggingOut(false); // Reset if failed?
                });
            }, 4000); // Wait for 4 seconds

            // Cleanup function to clear the timeout if the component unmounts
            return () => {
                console.log('[UnauthorizedPage] Cleanup: Clearing logout timer.');
                clearTimeout(timerId);
            };
        }
        // Dependencies: logout ensures it's available, isLoggingOut prevents re-running the effect unnecessarily
    }, [logout, isLoggingOut]);

    // Display the message and spinner during the wait period
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-gray-700 mb-6">
                    You are authenticated, but you do not have permission to access this application.
                    Please contact the administrator if you believe this is an error.
                </p>
                {/* Add role="status" for accessibility and testing */}
                <div
                    role="status"
                    aria-live="polite" // Indicate that updates should be announced politely
                    className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"
                    aria-label="Loading..." // Provide an accessible label
                >
                     <span className="sr-only">Loading...</span> {/* Visually hidden text for screen readers */}
                </div>
                <p className="text-gray-600">Redirecting to login page shortly...</p>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
