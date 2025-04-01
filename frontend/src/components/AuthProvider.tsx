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
    logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axios instance configured to send cookies
const apiClient = axios.create({
    baseURL: '/api', // Use relative path, Vite proxy will handle it in dev
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
        console.log("Checking authentication status...");
        setIsLoading(true);
        setError(null);
        try {
            // Attempt to fetch user profile. Success means authenticated.
            const response = await apiClient.get<User>('/profile/');
             console.log("Authentication check successful:", response.data);
            setUser(response.data);
            setIsAuthenticated(true);
        } catch (err) {
            console.log("Authentication check failed:", err);
            setUser(null);
            setIsAuthenticated(false);
            if (axios.isAxiosError(err) && err.response?.status !== 401 && err.response?.status !== 403) {
                // Only set error for unexpected issues, not for unauthenticated status
                setError('Failed to check authentication status.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = () => {
        // Redirect to Django's logout URL. Django clears the session cookie.
        // The backend LOGOUT_REDIRECT_URL should point back to the frontend.
        window.location.href = '/logout/'; // Use Vite proxy or direct backend URL
        // Clear local state immediately for responsiveness (optional)
        // setUser(null);
        // setIsAuthenticated(false);
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