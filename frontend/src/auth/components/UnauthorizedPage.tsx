// frontend/src/auth/components/UnauthorizedPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

const UnauthorizedPage: React.FC = () => {
    const { logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        if (!isLoggingOut) {
            console.log('[UnauthorizedPage] User is not authorized. Scheduling automatic logout...');

            const timerId = setTimeout(() => {
                setIsLoggingOut(true);
                console.log('[UnauthorizedPage] Timeout finished. Logging out now...');
                logout().catch(error => {
                    console.error("[UnauthorizedPage] Automatic logout failed:", error);
                    setIsLoggingOut(false);
                });
            }, 4000);

            return () => {
                console.log('[UnauthorizedPage] Cleanup: Clearing logout timer.');
                clearTimeout(timerId);
            };
        }
    }, [logout, isLoggingOut]);

    return (
        <div className="login-container unauthorized-page">
            <h1 className="text-3xl font-semibold mb-4 text-gray-800">Access Denied</h1>
            
            <p className="text-gray-700 mb-4">
                You do not have permission to access this application.
            </p>
            
            <p className="text-gray-700 mb-8">
                Please contact the administrator if you believe this is an error.
            </p>
            
            <div className="mt-6">
                <p className="text-gray-600">
                    Loading
                    <span className="dot-animation">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </p>
            </div>
        </div>
    );
};

export default UnauthorizedPage;
