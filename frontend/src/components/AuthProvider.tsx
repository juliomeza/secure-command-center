// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/core/authService';
import { handleApiError } from '../utils/errorHandling';
import { User } from '../data/types';

// Define the context shape
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    logout: () => Promise<boolean>;
    getAccessToken: () => string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store token in sessionStorage
const storeTokens = (tokens: { access: string; refresh: string }) => {
    sessionStorage.setItem('accessToken', tokens.access);
    sessionStorage.setItem('refreshToken', tokens.refresh);
};

// Clear tokens from sessionStorage
const clearTokens = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
};

// Track redirect attempts to prevent infinite loops
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 2;

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    
    const getAccessToken = useCallback((): string | null => {
        return sessionStorage.getItem('accessToken');
    }, []);

    const checkAuth = useCallback(async () => {
        console.log("[AuthProvider] Checking authentication status...");
        setIsLoading(true);
        setError(null);
        
        try {
            // Get user profile
            const userData = await authService.checkAuth();
            setUser(userData);
            setIsAuthenticated(true);
            
            // Get new tokens
            const tokens = await authService.getTokens();
            storeTokens(tokens);
            
            redirectAttempts = 0;
        } catch (err) {
            console.error("[AuthProvider] Authentication check failed:", err);
            
            setUser(null);
            setIsAuthenticated(false);
            
            const apiError = handleApiError(err);
            setError(apiError.message);

            // Only redirect on auth errors in production
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname.indexOf('127.0.0.1') === -1;
            if (isProduction && (apiError.status === 401 || apiError.status === 403) && redirectAttempts < MAX_REDIRECT_ATTEMPTS) {
                redirectAttempts++;
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const logout = async (): Promise<boolean> => {
        console.log("[AuthProvider] Attempting to logout");
        try {
            await authService.logout();
            
            // Clear tokens and state
            clearTokens();
            setUser(null);
            setIsAuthenticated(false);
            
            // Handle multi-tab logout
            sessionStorage.setItem('auth_logout', 'true');
            
            return true;
        } catch (err) {
            console.error("[AuthProvider] Logout failed:", err);
            const apiError = handleApiError(err);
            setError(apiError.message);
            return false;
        }
    };

    useEffect(() => {
        // Check for tokens in URL (for social auth)
        const urlParams = new URLSearchParams(window.location.search);
        const jwtAccess = urlParams.get('access');
        const jwtRefresh = urlParams.get('refresh');
        
        if (jwtAccess && jwtRefresh) {
            // Store the tokens
            storeTokens({
                access: jwtAccess,
                refresh: jwtRefresh
            });
            
            // Clean the URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            checkAuth();
        } else {
            checkAuth();
        }
        
        // Add listener for multi-tab logout
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_logout' && e.newValue === 'true') {
                console.log("[AuthProvider] Detected logout in another tab");
                setUser(null);
                setIsAuthenticated(false);
                clearTokens();
                sessionStorage.removeItem('auth_logout');
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            isLoading, 
            error, 
            checkAuth, 
            logout,
            getAccessToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};