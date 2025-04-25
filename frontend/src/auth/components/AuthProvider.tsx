// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Import the singleton instance and User type
import { authService, User } from '../services/authService';

// Define the context shape (simplified)
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null; // Keep error state for UI feedback
    checkAuthStatus: () => Promise<void>; // Renamed for clarity
    logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component (Refactored)
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Function to check authentication status using the AuthService
    const checkAuthStatus = useCallback(async () => {
        console.debug("[AuthProvider] Checking authentication status...");
        setIsLoading(true);
        setError(null);

        try {
            // Handle OAuth callback first - this stores tokens if present
            authService.handleOAuthCallback();

            // Now, check authentication using the stored tokens (or lack thereof)
            const currentUser = await authService.checkAuthentication();

            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                console.debug("[AuthProvider] User is authenticated.", currentUser);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                console.debug("[AuthProvider] User is not authenticated.");
            }
        } catch (err) {
            console.error("[AuthProvider] Error during checkAuthStatus:", err);
            setUser(null);
            setIsAuthenticated(false);
            setError('An unexpected error occurred during authentication check.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependency array is empty as navigate is not used directly here

    // Logout function using the AuthService
    const logout = async (): Promise<void> => {
        console.debug("[AuthProvider] Initiating logout...");
        setIsLoading(true);
        try {
            await authService.logout(); // Service handles backend call and token clearing
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
            console.debug("[AuthProvider] Logout successful, navigating to login.");

            // Add marker for multi-tab logout detection (optional but good practice)
            try {
                 sessionStorage.setItem('auth_logout', Date.now().toString());
            } catch (storageError) {
                 console.warn("[AuthProvider] Could not set logout marker in sessionStorage:", storageError);
            }

            navigate('/login');
        } catch (error) {
            console.error("[AuthProvider] Logout failed:", error);
            setError('Logout failed. Please try again.'); // Provide feedback
            setUser(null); // Force clear state even on error
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to check auth status on mount and listen for multi-tab logout
    useEffect(() => {
        checkAuthStatus();

        const handleStorageChange = (e: StorageEvent) => {
            // Check for the logout marker set by the logout function
            if (e.key === 'auth_logout' && e.storageArea === sessionStorage) {
                console.debug("[AuthProvider] Detected logout event from another tab/window.");
                // Check if already logged out to avoid loop/unnecessary updates
                if (isAuthenticated) {
                    setUser(null);
                    setIsAuthenticated(false);
                    navigate('/login', { replace: true });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuthStatus, isAuthenticated, navigate]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            isLoading,
            error,
            checkAuthStatus,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context (no changes needed here)
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};