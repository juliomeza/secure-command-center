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

// Define the base URL for the API
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Axios instance configured to send cookies
const apiClient = axios.create({
    baseURL: API_BASE_URL || '/api',  // Aseguramos que siempre tenga /api como base
    withCredentials: true, // Crucial for sending/receiving session cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Log the base URL for debugging
console.log('API Base URL:', API_BASE_URL || '/api');

// Add request and response interceptors for debugging
apiClient.interceptors.request.use(request => {
    console.log('API Request:', request);
    return request;
});

apiClient.interceptors.response.use(
    response => {
        console.log('API Response:', response);
        return response;
    },
    error => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading on mount
    const [error, setError] = useState<string | null>(null);

    const checkAuth = useCallback(async () => {
        console.log("Checking authentication status...");
        setIsLoading(true);
        setError(null);
        try {
            // Log the full URL we're trying to access
            const profileUrl = `${API_BASE_URL}/api/profile/`;
            console.log("Attempting to fetch profile from:", profileUrl);
            
            // Attempt to fetch user profile. Success means authenticated.
            const response = await apiClient.get<User>('/api/profile/');
            console.log("Authentication check successful:", response.data);
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.log("Authentication check failed:", err);
            setUser(null);
            setIsAuthenticated(false);
            if (axios.isAxiosError(err)) {
                console.log("Error status:", err.response?.status);
                console.log("Error data:", err.response?.data);
                
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                    // Only set error for unexpected issues, not for unauthenticated status
                    setError(`Failed to check authentication status: ${err.message}`);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Updated logout function
    const logout = async (): Promise<boolean> => {
        try {
            // First call the logout endpoint
            await fetch('/api/logout/', { method: 'GET', credentials: 'include' });
            
            // Then update local state
            setUser(null);
            setIsAuthenticated(false);
            
            // Return true to indicate successful logout
            return true;
        } catch (error) {
            console.error("Logout failed:", error);
            return false;
        }
    };

    // Check authentication status when the provider mounts
    useEffect(() => {
        checkAuth();
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