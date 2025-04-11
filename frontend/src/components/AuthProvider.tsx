// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Define the structure of the user data
interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile: {
        company: { id: number; name: string } | null;
        azure_oid?: string;
        job_title?: string;
        // Add other profile fields here
    };
    // Add other user fields here
}

// Define the context shape
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    logout: () => Promise<boolean>; // Changed return type to Promise<boolean>
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Determine if we're in production based on window.location
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

// Axios instance configured to send cookies
const apiClient = axios.create({
    baseURL: isProduction ? '' : '/api', // Use relative path or empty for production
    withCredentials: true, // Crucial for sending/receiving session cookies
    headers: {
        'Content-Type': 'application/json',
        // CSRF token will be added dynamically if needed for POST/PUT/DELETE
    },
});

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading on mount
    const [error, setError] = useState<string | null>(null);

    const checkAuth = useCallback(async () => {
        console.log("[AuthProvider] Checking authentication status...");
        setIsLoading(true);
        setError(null);
        try {
            // Attempt to fetch user profile. Success means authenticated.
            const response = await apiClient.get<User>('/profile/');
            
            // Log the raw response for debugging
            console.log("[AuthProvider] Raw API response:", response);
            
            // Check if the response contains HTML instead of a user object
            const responseData = response.data;
            const isHtmlResponse = typeof responseData === 'string' && 
                                  (responseData as string).trim().startsWith('<!doctype html>');
            
            if (isHtmlResponse) {
                console.error("[AuthProvider] Received HTML response instead of user data. API endpoint might be redirecting.");
                setUser(null);
                setIsAuthenticated(false);
                setError('Invalid API response format. Please try again.');
                return;
            }
            
            // Log the user data with specific fields for debugging
            console.log("[AuthProvider] Authentication successful, user data:", {
                id: response.data.id,
                username: response.data.username,
                email: response.data.email,
                firstName: response.data.first_name,
                lastName: response.data.last_name,
                company: response.data.profile?.company?.name || 'No company'
            });
            
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.error("[AuthProvider] Authentication check failed:", err);
            setUser(null);
            setIsAuthenticated(false);
            
            if (axios.isAxiosError(err)) {
                console.log("[AuthProvider] Error details:", {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data
                });
                
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                    // Only set error for unexpected issues, not for unauthenticated status
                    setError(`Authentication check failed: ${err.message}`);
                }
            } else {
                setError('Unknown error checking authentication status.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Updated logout function
    const logout = async (): Promise<boolean> => {
        console.log("[AuthProvider] Attempting to logout");
        try {
            // First call the logout endpoint
            const logoutUrl = isProduction 
                ? `${window.location.origin}/api/logout/` 
                : '/api/logout/';
            
            console.log("[AuthProvider] Calling logout endpoint:", logoutUrl);
            const response = await fetch(logoutUrl, { 
                method: 'GET', 
                credentials: 'include' 
            });
            
            console.log("[AuthProvider] Logout response:", response);
            
            // Then update local state
            setUser(null);
            setIsAuthenticated(false);
            
            // Add a marker in localStorage to handle multi-tab logout
            localStorage.setItem('auth_logout', 'true');
            
            // Return true to indicate successful logout
            console.log("[AuthProvider] Logout successful");
            return true;
        } catch (error) {
            console.error("[AuthProvider] Logout failed:", error);
            return false;
        }
    };

    // Check authentication status when the provider mounts
    useEffect(() => {
        checkAuth();
        
        // Add event listener for storage changes (for multi-tab logout)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_logout' && e.newValue === 'true') {
                console.log("[AuthProvider] Detected logout in another tab");
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('auth_logout');
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, error, checkAuth, logout }}>
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