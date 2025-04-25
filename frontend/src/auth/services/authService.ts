// frontend/src/services/authService.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Interfaces (compatibles con las usadas en AuthProvider)
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile: {
        company: { id: number; name: string } | null;
        azure_oid?: string;
        job_title?: string;
    };
    auth_provider?: string; // Campo adicional en la nueva API
}

export interface JWTTokens {
    access: string;
    refresh: string;
}

export interface TokenResponse {
    access: string;
    refresh: string;
    user: User;
}

// Configuración del entorno
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction 
  ? 'https://dashboard-control-back.onrender.com/api' 
  : '/api';

// Clase para gestionar autenticación
export class AuthService {
    private apiClient: AxiosInstance;
    private useNewAPI: boolean;
    
    constructor(useNewAPI: boolean = false) {
        this.useNewAPI = useNewAPI;
        
        // Crear cliente axios con la configuración adecuada
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        // Configurar interceptor para incluir el token JWT en solicitudes
        this.apiClient.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.getStoredAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Configurar interceptor para renovar tokens expirados
        this.apiClient.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                // Manejar errores de límite de tasa
                if (error.response?.status === 429) {
                    console.warn("[AuthService] Rate limit exceeded");
                    return Promise.reject(error);
                }

                const originalRequest = error.config;
                
                // Si el error es debido a un token expirado (401) y no hemos intentado renovarlo aún
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        console.log("[AuthService] Access token expired. Attempting to refresh...");
                        
                        const refreshToken = this.getStoredRefreshToken();
                        
                        if (!refreshToken) {
                            console.log("[AuthService] No refresh token available");
                            return Promise.reject(error);
                        }
                        
                        // Usar un cliente axios separado para renovar el token y evitar bucles
                        const response = await this.refreshToken(refreshToken);
                        
                        if (response.access) {
                            console.log("[AuthService] Token refresh successful");
                            
                            // Almacenar los nuevos tokens
                            this.storeTokens({
                                access: response.access,
                                refresh: response.refresh || refreshToken // Usar el token de refresco existente si no se proporciona uno nuevo
                            });
                            
                            // Reintentar la solicitud original con el nuevo token
                            originalRequest.headers.Authorization = `Bearer ${response.access}`;
                            return this.apiClient(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("[AuthService] Token refresh failed:", refreshError);
                        this.clearTokens();
                    }
                }
                
                return Promise.reject(error);
            }
        );
    }
    
    // Obtiene la ruta base para endpoints de autenticación
    private get authBasePath(): string {
        return this.useNewAPI ? '/auth' : '';
    }
    
    // Métodos para gestionar tokens en sessionStorage
    public storeTokens(tokens: JWTTokens): void {
        sessionStorage.setItem('accessToken', tokens.access);
        sessionStorage.setItem('refreshToken', tokens.refresh);
    }
    
    public getStoredAccessToken(): string | null {
        return sessionStorage.getItem('accessToken');
    }
    
    public getStoredRefreshToken(): string | null {
        return sessionStorage.getItem('refreshToken');
    }
    
    public clearTokens(): void {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
    }
    
    // Métodos para interactuar con la API
    
    // Obtener token CSRF
    public async fetchCSRFToken(): Promise<string> {
        try {
            const response = await this.apiClient.get(`${this.authBasePath}/csrf/`);
            return response.data.csrfToken;
        } catch (error) {
            console.error('[AuthService] Error fetching CSRF token:', error);
            throw error;
        }
    }
    
    // Obtener perfil de usuario
    public async fetchUserProfile(): Promise<User> {
        try {
            const response = await this.apiClient.get<User>(`${this.authBasePath}/profile/`);
            return response.data;
        } catch (error) {
            console.error('[AuthService] Error fetching user profile:', error);
            throw error;
        }
    }
    
    // Obtener tokens JWT
    public async fetchJWTTokens(): Promise<TokenResponse> {
        try {
            console.log("[AuthService] Fetching JWT tokens...");
            const response = await this.apiClient.get<TokenResponse>(`${this.authBasePath}/token/`);
            console.log("[AuthService] JWT tokens received successfully");
            return response.data;
        } catch (error) {
            console.error('[AuthService] Error fetching JWT tokens:', error);
            throw error;
        }
    }
    
    // Refrescar token JWT
    public async refreshToken(token: string): Promise<JWTTokens> {
        try {
            // Usar un cliente axios separado para renovación de token para evitar bucles
            const tokenRefreshClient = axios.create({
                baseURL: API_BASE_URL,
                withCredentials: true
            });
            
            const response = await tokenRefreshClient.post<JWTTokens>(
                `${this.authBasePath}/token/refresh/`, 
                { refresh: token }
            );
            return response.data;
        } catch (error) {
            console.error('[AuthService] Error refreshing token:', error);
            throw error;
        }
    }
    
    // Cerrar sesión
    public async logout(): Promise<void> {
        try {
            await this.apiClient.get(`${this.authBasePath}/logout/`);
            this.clearTokens();
        } catch (error) {
            console.error('[AuthService] Error during logout:', error);
            throw error;
        }
    }
    
    // Método para limpiar cookies (útil en el proceso de logout)
    public clearAllAuthCookies(): void {
        const domains = [
            window.location.hostname,
            `.${window.location.hostname}`
        ];
        
        const paths = ['/', '/api'];
        
        // Mantener solo las cookies relacionadas con JWT y CSRF
        const cookiesToDelete = [
            'csrftoken',
            'refresh_token',
            'access_token'
        ];

        domains.forEach(domain => {
            paths.forEach(path => {
                cookiesToDelete.forEach(cookieName => {
                    document.cookie = `${cookieName}=;domain=${domain};path=${path};expires=Thu, 01 Jan 1970 00:00:00 GMT;secure;samesite=none`;
                });
            });
        });
    }
}