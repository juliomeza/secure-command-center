// frontend/src/services/authService.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Interfaces (compatibles con las usadas en AuthProvider)
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_app_authorized: boolean; // <<< ADDED THIS FIELD
    auth_provider?: string;
}

export interface JWTTokens {
    access: string;
    refresh: string;
}

export interface TokenResponse extends JWTTokens {
    user: User; // Assuming the token endpoint might return user info
}

// Configuración del entorno
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction
  ? 'https://dashboard-control-back.onrender.com/api'
  : '/api'; // Using relative path for local dev proxy

// Storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Clase para gestionar autenticación
export class AuthService {
    // <<< Make apiClient public so it can be accessed from the instance
    public apiClient: AxiosInstance;
    private isRefreshing = false; // Flag to prevent multiple refresh attempts
    private refreshSubscribers: ((token: string) => void)[] = []; // Queue requests during refresh

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true, // Important for CSRF if still used alongside JWT
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor: Add JWT access token to Authorization header
        this.apiClient.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.getStoredAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor: Handle token refresh on 401 errors
        this.apiClient.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true; // Mark as retried

                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        const refreshToken = this.getStoredRefreshToken();

                        if (!refreshToken) {
                            console.error("[AuthService] No refresh token available for refresh.");
                            this.clearTokens(); // Clear tokens if refresh fails
                            // Optionally redirect to login or notify the app
                            window.location.href = '/login'; // Simple redirect
                            return Promise.reject(error);
                        }

                        try {
                            const { access: newAccessToken, refresh: newRefreshToken } = await this.performTokenRefresh(refreshToken);
                            this.storeTokens({ access: newAccessToken, refresh: newRefreshToken || refreshToken });
                            this.isRefreshing = false;

                            // Notify queued requests
                            this.onRefreshed(newAccessToken);
                            this.refreshSubscribers = []; // Clear queue

                            // Retry the original request with the new token
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            }
                            return this.apiClient(originalRequest);

                        } catch (refreshError) {
                            this.isRefreshing = false;
                            this.clearTokens(); // Clear tokens on refresh failure
                            this.refreshSubscribers = []; // Clear queue
                            // Optionally redirect or notify
                            window.location.href = '/login'; // Simple redirect
                            return Promise.reject(refreshError);
                        }
                    } else {
                        // Queue the original request until the token is refreshed
                        return new Promise((resolve) => {
                            this.subscribeTokenRefresh((newToken: string) => {
                                if (originalRequest.headers) {
                                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                }
                                resolve(this.apiClient(originalRequest));
                            });
                        });
                    }
                }

                // Handle other errors (like 429 Rate Limit)
                if (error.response?.status === 429) {
                    console.warn("[AuthService] Rate limit exceeded.");
                    // Potentially implement retry logic or notify user
                }

                return Promise.reject(error);
            }
        );
    }

    public handleOAuthCallback(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        const jwtAccess = urlParams.get('jwt_access');
        const jwtRefresh = urlParams.get('jwt_refresh');

        if (jwtAccess && jwtRefresh) {
            this.storeTokens({ access: jwtAccess, refresh: jwtRefresh });
            // Clean the URL
            const cleanUrl = window.location.pathname + window.location.hash; // Keep hash if present
            window.history.replaceState({}, document.title, cleanUrl);
            return true;
        }
        return false;
    }

    public storeTokens(tokens: JWTTokens): void {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
        sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }

    public clearTokens(): void {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    public getStoredAccessToken(): string | null {
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }

    public getStoredRefreshToken(): string | null {
        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }

    private async performTokenRefresh(refreshToken: string): Promise<JWTTokens> {
        try {
            const response = await this.apiClient.post<JWTTokens>('/auth/token/refresh/', {
                refresh: refreshToken,
            });
            return response.data;
        } catch (error) {
            console.error("[AuthService] Token refresh failed:", error);
            throw error; // Rethrow to be caught by the interceptor
        }
    }

    private subscribeTokenRefresh(cb: (token: string) => void): void {
        this.refreshSubscribers.push(cb);
    }

    private onRefreshed(token: string): void {
        this.refreshSubscribers.forEach((cb) => cb(token));
    }

    // Método para verificar si el usuario está autenticado (ejemplo)
    public async checkAuthentication(): Promise<User | null> {
        const token = this.getStoredAccessToken();
        if (!token) {
            return null;
        }
        // Intenta obtener datos del usuario para validar el token
        try {
            // <<< Use the correct endpoint from authentication/urls.py
            // Changed '/auth/user/' to '/auth/profile/'
            const response = await this.apiClient.get<User>('/auth/profile/');
            return response.data;
        } catch (error) {
            console.error("[AuthService] Failed to fetch user data:", error);
            // Si falla (ej. token expirado y refresh falló), considera limpiar tokens
            // this.clearTokens(); // Opcional: limpiar si la verificación falla
            return null;
        }
    }

    // Método para cerrar sesión (ejemplo)
    public async logout(): Promise<void> {
        const refreshToken = this.getStoredRefreshToken();
        if (refreshToken) {
            try {
                // <<< Use the correct endpoint from authentication/urls.py
                // Changed from POST to GET to match potential server configuration or previous behavior
                await this.apiClient.get('/auth/logout/', {
                    // Pass refresh token as a query parameter if needed by GET endpoint
                    // params: { refresh_token: refreshToken } // Uncomment if backend GET expects it
                });
                // Note: The backend LogoutAPIView's GET method doesn't explicitly use the refresh token
                // from query params in the provided snippet, but focuses on cookies and blacklisting.
                // Sending it might be unnecessary unless the backend logic was changed.
            } catch (error) {
                console.error("[AuthService] Logout API call failed:", error);
                // Continúa limpiando localmente incluso si la API falla
            }
        }
        this.clearTokens();
        // No redirigir aquí, dejar que AuthProvider lo haga
    }
}

// <<< Crear y exportar una instancia singleton
export const authService = new AuthService();