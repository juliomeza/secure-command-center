// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../services/authService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuthStatus: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const checkAuthStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            authService.handleOAuthCallback();
            const currentUser = await authService.checkAuthentication();

            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error("[AuthProvider] Authentication error:", err);
            setUser(null);
            setIsAuthenticated(false);
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
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};