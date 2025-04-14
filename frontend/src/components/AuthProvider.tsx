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

// Define the JWT tokens structure
interface JWTTokens {
    access: string;
    refresh: string;
}

// Define the context shape
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    logout: () => Promise<boolean>;
    getAccessToken: () => string | null; // New method to access JWT token
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store token in localStorage
const storeTokens = (tokens: JWTTokens) => {
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
};

// Get access token from localStorage
const getStoredAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

// Get refresh token from localStorage
const getStoredRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
};

// Clear tokens from localStorage
const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

// Axios instance configured to send cookies
const apiClient = axios.create({
    baseURL: '/api', // Always use /api prefix for backend calls
    withCredentials: true, // Crucial for sending/receiving session cookies
    headers: {
        'Content-Type': 'application/json',
        // CSRF token will be added dynamically if needed for POST/PUT/DELETE
    },
});

// Add request interceptor to include JWT token if available
apiClient.interceptors.request.use(
    (config) => {
        const token = getStoredAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is due to an expired token (401) and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                console.log("[AuthProvider] Access token expired. Attempting to refresh...");
                // Try to refresh the token
                const refreshToken = getStoredRefreshToken();
                
                if (!refreshToken) {
                    console.log("[AuthProvider] No refresh token available");
                    return Promise.reject(error);
                }
                
                // Create a separate axios instance for token refresh to avoid interceptor loop
                const tokenRefreshClient = axios.create({
                    baseURL: '/api',
                    withCredentials: true
                });
                
                const response = await tokenRefreshClient.post('/token/refresh/', {
                    refresh: refreshToken
                });
                
                if (response.data.access) {
                    console.log("[AuthProvider] Token refresh successful");
                    // Store the new tokens
                    storeTokens({
                        access: response.data.access,
                        refresh: response.data.refresh || refreshToken // Use existing refresh token if not provided
                    });
                    
                    // Retry the original request with new token
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error("[AuthProvider] Token refresh failed:", refreshError);
                // If refresh fails, clear tokens and force login
                clearTokens();
                // Don't reject here, let it continue to the original error
            }
        }
        
        return Promise.reject(error);
    }
);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading on mount
    const [error, setError] = useState<string | null>(null);

    // Function to fetch JWT tokens
    const fetchTokens = async (): Promise<JWTTokens | null> => {
        try {
            console.log("[AuthProvider] Fetching JWT tokens...");
            const response = await apiClient.get<JWTTokens>('/token/');
            console.log("[AuthProvider] JWT tokens received successfully");
            return response.data;
        } catch (err) {
            console.error("[AuthProvider] Failed to fetch JWT tokens:", err);
            return null;
        }
    };

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
            
            // Now that the user is authenticated via OAuth2, fetch and store JWT tokens
            const tokens = await fetchTokens();
            if (tokens) {
                storeTokens(tokens);
                console.log("[AuthProvider] JWT tokens stored successfully");
            }
        } catch (err) {
            console.error("[AuthProvider] Authentication check failed:", err);
            setUser(null);
            setIsAuthenticated(false);
            clearTokens(); // Clear any existing tokens
            
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
            // First call the logout endpoint using apiClient for consistency
            console.log("[AuthProvider] Calling logout endpoint: /api/logout/");
            await apiClient.get('/logout/'); // Use apiClient to call /api/logout/
            
            console.log("[AuthProvider] Logout API call successful");
            
            // Clear JWT tokens
            clearTokens();
            console.log("[AuthProvider] JWT tokens cleared");
            
            // Then update local state
            setUser(null);
            setIsAuthenticated(false);
            
            // Add a marker in localStorage to handle multi-tab logout
            localStorage.setItem('auth_logout', 'true');
            
            // Return true to indicate successful logout
            console.log("[AuthProvider] Logout state updated successfully");
            return true;
        } catch (error) {
            console.error("[AuthProvider] Logout failed:", error);
            // Log specific error details if available
            if (axios.isAxiosError(error)) {
                console.error("[AuthProvider] Logout error details:", {
                    status: error.response?.status,
                    data: error.response?.data
                });
            }
            return false;
        }
    };

    // Function to get the current access token
    const getAccessToken = (): string | null => {
        return getStoredAccessToken();
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
                clearTokens(); // Clear JWT tokens in this tab too
                localStorage.removeItem('auth_logout');
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