// frontend/src/components/AuthProvider.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthService, User } from '../auth/services/authService';

// Define the context shape
interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    logout: () => Promise<boolean>;
    getAccessToken: () => string | null;
    // Nuevo: Expone el authService para poder cambiarlo en futuras iteraciones
    authService: AuthService; 
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CONFIGURACIÓN: ¿Usar la nueva API de autenticación?
// Cambiar a true cuando queramos probar la nueva implementación
const USE_NEW_AUTH_API = true;

// Track redirect attempts to prevent infinite loops
let redirectAttempts = 0;
const MAX_REDIRECT_ATTEMPTS = 2;

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Crear instancia del servicio de autenticación
    const [authService] = useState<AuthService>(new AuthService(USE_NEW_AUTH_API));
    
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading on mount
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const checkAuth = useCallback(async () => {
        console.log("[AuthProvider] Checking authentication status...");
        setIsLoading(true);
        setError(null);
        
        try {
            // Obtener token CSRF
            await authService.fetchCSRFToken();
            
            // Intentar obtener el perfil del usuario
            const userData = await authService.fetchUserProfile();
            setUser(userData);
            setIsAuthenticated(true);
            
            // Intentar obtener tokens JWT
            try {
                const tokenResponse = await authService.fetchJWTTokens();
                authService.storeTokens({
                    access: tokenResponse.access,
                    refresh: tokenResponse.refresh
                });
                console.log("[AuthProvider] JWT tokens stored successfully");
            } catch (tokenError) {
                console.warn("[AuthProvider] Could not fetch JWT tokens:", tokenError);
                // No interrumpir el proceso si los tokens no se pueden obtener
            }
            
            redirectAttempts = 0;
        } catch (err) {
            console.error("[AuthProvider] Authentication check failed:", err);
            
            // Limpiar estado de autenticación
            setUser(null);
            setIsAuthenticated(false);
            
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                    if (isProduction && redirectAttempts < MAX_REDIRECT_ATTEMPTS) {
                        redirectAttempts++;
                        navigate('/login');
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, authService]);

    const logout = async (): Promise<boolean> => {
        try {
            console.log("[AuthProvider] Attempting to logout");
            
            // Llamar al servicio para hacer logout
            await authService.logout();
            
            // Limpiar cookies
            authService.clearAllAuthCookies();

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

    // Función para obtener el token de acceso actual
    const getAccessToken = (): string | null => {
        return authService.getStoredAccessToken();
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
            authService.storeTokens({
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
                authService.clearTokens();
                sessionStorage.removeItem('auth_logout');
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkAuth, authService]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            isLoading, 
            error, 
            checkAuth, 
            logout,
            getAccessToken,
            authService
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