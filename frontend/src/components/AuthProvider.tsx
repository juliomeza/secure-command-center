// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

// Store token in sessionStorage (instead of localStorage)
const storeTokens = (tokens: JWTTokens) => {
    sessionStorage.setItem('accessToken', tokens.access);
    sessionStorage.setItem('refreshToken', tokens.refresh);
};

// Get access token from sessionStorage
const getStoredAccessToken = (): string | null => {
    return sessionStorage.getItem('accessToken');
};

// Get refresh token from sessionStorage
const getStoredRefreshToken = (): string | null => {
    return sessionStorage.getItem('refreshToken');
};

// Clear tokens from sessionStorage
const clearTokens = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
};

// Determine if we're in production (Render) or development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Set the base URL for API requests based on environment
const API_BASE_URL = isProduction 
  ? 'https://dashboard-control-back.onrender.com/api' // Production - Absolute URL to backend
  : '/api'; // Development proxy

// Track redirect attempts to prevent infinite loops
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 2;

console.log(`[AuthProvider] Using API base URL: ${API_BASE_URL}`);

// Axios instance configured to send cookies
const apiClient = axios.create({
    baseURL: API_BASE_URL,
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
        // Handle rate limit exceeded errors
        if (error.response?.status === 429) {
            console.warn("[AuthProvider] Rate limit exceeded");
            alert("Too many requests. Please try again later.");
            return Promise.reject(error);
        }

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
                    baseURL: API_BASE_URL, // Use the correct API_BASE_URL based on environment
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
                // If refresh fails, clear tokens - but DON'T redirect automatically
                clearTokens();
                
                // Let the error propagate to be handled by the regular error handlers
                // which will use navigate() instead of window.location for better SPA handling
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
    const navigate = useNavigate();

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
            // First, obtain the CSRF token
            await apiClient.get('/csrf/');
            
            // Attempt to fetch the user's profile
            const response = await apiClient.get<User>('/profile/');
            setUser(response.data);
            setIsAuthenticated(true);
            
            // Attempt to fetch JWT tokens
            const tokens = await fetchTokens();
            if (tokens) {
                storeTokens(tokens);
                console.log("[AuthProvider] JWT tokens stored successfully");
            }
            
            redirectAttempts = 0;
        } catch (err) {
            console.error("[AuthProvider] Authentication check failed:", err);
            
            // Only clean the authentication state, not the tokens
            setUser(null);
            setIsAuthenticated(false);
            
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    if (isProduction && redirectAttempts < MAX_REDIRECT_ATTEMPTS) {
                        redirectAttempts++;
                        navigate('/login');
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const logout = async (): Promise<boolean> => {
        try {
            console.log("[AuthProvider] Attempting to logout");
            
            // Llamar al endpoint de logout
            await apiClient.get('/logout/', {
                withCredentials: true // Importante para enviar/recibir cookies
            });
            
            // Limpiar tokens de sessionStorage
            clearTokens();
            
            // Limpiar cookies del dominio principal y posibles subdominios
            const domains = [
                window.location.hostname,
                `.${window.location.hostname}` // Para cookies de subdominios
            ];
            
            const paths = ['/', '/api'];
            
            // Lista de cookies a limpiar
            const cookiesToDelete = [
                'sessionid',
                'csrftoken',
                'refresh_token',
                'access_token',
                'social_auth_last_login_backend',
                'oauth_state',
                'g_state',
                'social_auth_google-oauth2_state'
            ];

            // Limpiar cookies en todos los dominios y paths
            domains.forEach(domain => {
                paths.forEach(path => {
                    cookiesToDelete.forEach(cookieName => {
                        document.cookie = `${cookieName}=;domain=${domain};path=${path};expires=Thu, 01 Jan 1970 00:00:00 GMT;secure;samesite=none`;
                    });
                });
            });

            // Limpiar estado local
            setUser(null);
            setIsAuthenticated(false);
            
            // Limpiar cualquier dato en sessionStorage
            sessionStorage.clear();
            
            // Agregar un marcador para logout en múltiples tabs
            sessionStorage.setItem('auth_logout', 'true');
            
            console.log("[AuthProvider] Logout successful");
            
            // Redirigir al login
            navigate('/login');
            return true;
        } catch (error) {
            console.error("[AuthProvider] Logout failed:", error);
            return false;
        }
    };

    // Function to get the current access token
    const getAccessToken = (): string | null => {
        return getStoredAccessToken();
    };

    // Check authentication status when the provider mounts
    useEffect(() => {
        // First, check if there are JWT tokens in the URL (after OAuth redirection)
        const urlParams = new URLSearchParams(window.location.search);
        const jwtAccess = urlParams.get('jwt_access');
        const jwtRefresh = urlParams.get('jwt_refresh');
        
        if (jwtAccess && jwtRefresh) {
            console.log("[AuthProvider] JWT tokens found in URL after OAuth login");
            // Store the tokens
            storeTokens({
                access: jwtAccess,
                refresh: jwtRefresh
            });
            
            // Clean the URL to avoid keeping the tokens visible
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Verify authentication with the new tokens
            checkAuth();
        } else {
            // If there are no tokens in the URL, verify authentication normally
            checkAuth();
        }
        
        // Add event listener for storage changes (for multi-tab logout)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_logout' && e.newValue === 'true') {
                console.log("[AuthProvider] Detected logout in another tab");
                setUser(null);
                setIsAuthenticated(false);
                clearTokens(); // Clear JWT tokens in this tab too
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