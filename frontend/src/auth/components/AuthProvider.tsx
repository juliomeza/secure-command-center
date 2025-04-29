// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../services/authService';

// Define the shape of the context data
export interface AuthContextType { // Add export keyword
    isAuthenticated: boolean;
    isAuthorized: boolean; // Added authorization status
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuthStatus: () => Promise<void>;
    logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false); // <<< ADDED
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            authService.handleOAuthCallback(); // Handle potential tokens from redirect
            const currentUser = await authService.checkAuthentication();

            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                // Set authorization based on the flag from backend
                setIsAuthorized(currentUser.is_app_authorized); // <<< MODIFIED
            } else {
                setUser(null);
                setIsAuthenticated(false);
                setIsAuthorized(false); // <<< ADDED
            }
        } catch (err) {
            console.error("[AuthProvider] Authentication error:", err);
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthorized(false); // <<< ADDED
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
            setIsAuthorized(false); // <<< ADDED
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
            setIsAuthorized(false); // <<< ADDED
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
                setIsAuthorized(false); // <<< ADDED
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [checkAuthStatus, isAuthenticated, navigate]); // isAuthorized not needed in dependency array here

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isAuthorized, // <<< ADDED
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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};