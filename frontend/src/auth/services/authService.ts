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

                // Enhanced logging for the raw error
                console.debug("[AuthService Interceptor] Raw error object:", error);
                if (error.response) {
                    console.debug("[AuthService Interceptor] Error response status:", error.response.status);
                    console.debug("[AuthService Interceptor] Error response data:", error.response.data);
                }

                // If the failed request was ALREADY the token refresh endpoint, then it's a final failure.
                if (originalRequest.url === '/auth/token/refresh/') {
                    console.error('[AuthService Interceptor] Token refresh request itself failed with status', error.response?.status, '. Clearing tokens and redirecting.');
                    this.isRefreshing = false; // Reset the main flag
                    this.onRefreshed('');      // Notify subscribers that refresh failed (empty token)
                    this.refreshSubscribers = []; // Clear subscribers
                    this.clearTokens();
                    
                    if (window.location.pathname !== '/login') { // Avoid redirect loop if already on login page
                        console.log("[AuthService Interceptor] Redirecting to /login due to refresh token failure.");
                        window.location.href = '/login';
                    }
                    return Promise.reject(error); // Reject the promise for the refresh call itself
                }

                // If it's a 401 on a regular request, and we haven't retried this specific originalRequest yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    if (!this.isRefreshing) {
                        this.isRefreshing = true;
                        const refreshToken = this.getStoredRefreshToken();
                        console.debug("[AuthService Interceptor] Current refresh token before attempting refresh:", refreshToken ? refreshToken.substring(0, 10) + "..." : "null");

                        if (!refreshToken) {
                            console.error("[AuthService Interceptor] No refresh token available. Clearing tokens and redirecting.");
                            this.clearTokens();
                            this.isRefreshing = false; // Reset flag
                            if (window.location.pathname !== '/login') {
                                console.log("[AuthService Interceptor] Redirecting to /login due to no refresh token.");
                                window.location.href = '/login';
                            }
                            return Promise.reject(error);
                        }

                        try {
                            console.debug("[AuthService Interceptor] Attempting token refresh.");
                            const { access: newAccessToken, refresh: newRefreshToken } = await this.performTokenRefresh(refreshToken);
                            
                            console.debug("[AuthService Interceptor] Token refresh successful. New access token:", newAccessToken ? newAccessToken.substring(0,10) + "..." : "null");
                            this.storeTokens({ access: newAccessToken, refresh: newRefreshToken || refreshToken });
                            this.isRefreshing = false;

                            this.onRefreshed(newAccessToken); 
                            this.refreshSubscribers = []; 
                            
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            }
                            console.debug("[AuthService Interceptor] Retrying original request with new token:", originalRequest.url);
                            return this.apiClient(originalRequest); // Retry original request

                        } catch (refreshCallError: any) {
                            // This catch is for errors during performTokenRefresh that are NOT 401s from /auth/token/refresh/ itself
                            // (since those are handled by the new 'if' block above for originalRequest.url === '/auth/token/refresh/').
                            // Example: a network error when trying to POST to /auth/token/refresh/.
                            console.error('[AuthService Interceptor] Error during token refresh process (e.g., network issue, or non-401 error from refresh endpoint):', refreshCallError);
                            this.isRefreshing = false;
                            this.onRefreshed(''); // Signal failure to any subscribers
                            this.refreshSubscribers = []; // Clear subscribers
                            this.clearTokens();
                            if (window.location.pathname !== '/login') {
                                console.log("[AuthService Interceptor] Redirecting to /login due to an error in refresh process.");
                                window.location.href = '/login';
                            }
                            return Promise.reject(refreshCallError); 
                        }
                    } else {
                        // Already refreshing, queue the original request
                        console.debug("[AuthService Interceptor] Another request came while token was refreshing. Queuing request:", originalRequest.url);
                        return new Promise((resolve, reject) => {
                            this.subscribeTokenRefresh((newToken: string) => {
                                if (newToken) { // If refresh was successful
                                    console.debug("[AuthService Interceptor] Refresh successful, replaying queued request:", originalRequest.url);
                                    if (originalRequest.headers) {
                                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                    }
                                    resolve(this.apiClient(originalRequest));
                                } else { // If refresh failed (signaled by onRefreshed(''))
                                    console.warn("[AuthService Interceptor] Refresh failed, rejecting queued request:", originalRequest.url);
                                    reject(error); // Reject the original request that was queued
                                }
                            });
                        });
                    }
                }
                // For errors other than 401, or for 401s that have already been retried
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
        console.debug("[AuthService] clearTokens called");
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        console.debug("[AuthService] clearTokens finished");
    }

    public getStoredAccessToken(): string | null {
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    }

    public getStoredRefreshToken(): string | null {
        return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }

    private async performTokenRefresh(refreshToken: string): Promise<JWTTokens> {
        try {
            console.debug("[AuthService performTokenRefresh] Attempting POST /auth/token/refresh/");
            const response = await this.apiClient.post<JWTTokens>('/auth/token/refresh/', {
                refresh: refreshToken,
            });
            console.debug("[AuthService performTokenRefresh] Refresh POST successful.");
            return response.data;
        } catch (error) {
            console.error("[AuthService performTokenRefresh] Token refresh POST failed:", error);
            throw error; 
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
        console.debug("[AuthService checkAuthentication] Token at start:", token ? token.substring(0,10) + "..." : "null");
        if (!token) {
            console.debug("[AuthService checkAuthentication] No token found, returning null.");
            return null;
        }
        try {
            console.debug("[AuthService checkAuthentication] Attempting GET /auth/profile/");
            const response = await this.apiClient.get<User>('/auth/profile/');
            console.debug("[AuthService checkAuthentication] GET /auth/profile/ successful.");
            return response.data;
        } catch (error) {
            console.error("[AuthService checkAuthentication] Failed to fetch user data (this is after interceptor's attempt to refresh if it was a 401):", error);
            // The interceptor should have already cleared tokens if refresh failed.
            // Returning null signifies to AuthProvider that authentication failed.
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