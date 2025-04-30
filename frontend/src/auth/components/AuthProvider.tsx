// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../services/authService';
import { fetchUserPermissions, Tab } from '../services/permissionsService'; // <<< CORRECTED IMPORT PATH

// Define the shape of the context data
export interface AuthContextType { // Add export keyword
    isAuthenticated: boolean;
    isAuthorized: boolean; // Added authorization status
    user: User | null;
    isLoading: boolean;
    error: string | null;
    allowedTabs: Tab[] | null; // <<< ADDED: Store allowed tabs
    checkAuthStatus: () => Promise<void>;
    logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [allowedTabs, setAllowedTabs] = useState<Tab[] | null>(null); // <<< ADDED state for tabs
    const navigate = useNavigate();

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAllowedTabs(null); // Reset tabs on check

        try {
            authService.handleOAuthCallback(); // Handle potential tokens from redirect
            const currentUser = await authService.checkAuthentication();

            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                const isUserAppAuthorized = currentUser.is_app_authorized;
                setIsAuthorized(isUserAppAuthorized);

                // If authorized, fetch specific permissions (tabs)
                if (isUserAppAuthorized) {
                    try {
                        const permissions = await fetchUserPermissions();
                        setAllowedTabs(permissions.allowed_tabs);
                    } catch (permError) {
                        console.error("[AuthProvider] Error fetching permissions:", permError);
                        setError('Failed to load user permissions.');
                        // Decide if this should de-authorize or just show an error
                        // For now, keep authorized but without specific tabs
                        setAllowedTabs(null);
                    }
                } else {
                    setAllowedTabs(null); // Not authorized, no tabs
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
                setIsAuthorized(false);
                setAllowedTabs(null);
            }
        } catch (err) {
            console.error("[AuthProvider] Authentication error:", err);
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthorized(false);
            setAllowedTabs(null);
            setError('An unexpected error occurred during authentication check.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthorized(false);
            setAllowedTabs(null); // <<< CLEAR TABS ON LOGOUT
            setError(null);

            try {
                sessionStorage.setItem('auth_logout', Date.now().toString());
            } catch (storageError) {
                console.warn("[AuthProvider] Storage error during logout:", storageError);
            }

            navigate('/login');
        } catch (error) {
            console.error("[AuthProvider] Logout error:", error);
            setError('Logout failed. Please try again.');
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthorized(false);
            setAllowedTabs(null); // <<< CLEAR TABS ON LOGOUT ERROR
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_logout' && e.storageArea === sessionStorage && isAuthenticated) {
                setUser(null);
                setIsAuthenticated(false);
                setIsAuthorized(false);
                setAllowedTabs(null); // <<< CLEAR TABS ON STORAGE EVENT
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [checkAuthStatus, isAuthenticated, navigate]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isAuthorized,
            user,
            isLoading,
            error,
            allowedTabs, // <<< PROVIDE TABS
            checkAuthStatus,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};