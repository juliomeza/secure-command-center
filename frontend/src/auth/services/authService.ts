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
    private apiClient: AxiosInstance;
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

    // --- Authentication Flow Methods ---

    /**
     * Checks if the user is currently authenticated by verifying the access token
     * (implicitly via fetchUserProfile) and potentially refreshing it.
     * @returns {Promise<User | null>} The user profile if authenticated, null otherwise.
     */
    public async checkAuthentication(): Promise<User | null> {
        const accessToken = this.getStoredAccessToken();
        if (!accessToken) {
            console.log("[AuthService] No access token found. User is not authenticated.");
            return null; // Not authenticated if no token
        }

        try {
            // Attempting to fetch the user profile will trigger the interceptor
            // to refresh the token if necessary.
            console.log("[AuthService] Verifying authentication by fetching user profile...");
            const user = await this.fetchUserProfile();
            console.log("[AuthService] Authentication verified successfully.");
            return user;
        } catch (error) {
             // Errors (like 401 after refresh failure) are handled by the interceptor,
             // which might clear tokens or redirect.
             // If fetchUserProfile fails for other reasons, we consider the user not authenticated.
            console.error("[AuthService] Authentication check failed after potential refresh attempt:", error);
            // Ensure tokens are cleared if the error persists after potential refresh
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                 this.clearTokens(); // Ensure cleanup if interceptor didn't catch it
            }
            return null;
        }
    }


    // Renamed from fetchJWTTokens - This seems redundant if tokens are obtained via OAuth callback
    // or refresh. Keeping it commented out for now. If needed for a specific flow, uncomment and adapt.
    /*
    public async fetchInitialJWTTokens(): Promise<TokenResponse> {
        try {
            console.log("[AuthService] Fetching initial JWT tokens..."); // Adjust endpoint if needed
            const response = await this.apiClient.get<TokenResponse>('/auth/token/');
            this.storeTokens({ access: response.data.access, refresh: response.data.refresh });
            console.log("[AuthService] Initial JWT tokens received and stored.");
            return response.data;
        } catch (error) {
            console.error('[AuthService] Error fetching initial JWT tokens:', error);
            this.handleApiError(error); // Use centralized error handler
            throw error; // Re-throw for the caller to handle if necessary
        }
    }
    */

    // Fetch user profile
    public async fetchUserProfile(): Promise<User> {
        try {
            const response = await this.apiClient.get<User>('/auth/profile/');
            return response.data;
        } catch (error) {
            console.error('[AuthService] Error fetching user profile:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    // Perform token refresh using a dedicated client instance
    private async performTokenRefresh(refreshToken: string): Promise<JWTTokens> {
         // Use a separate client instance to avoid interceptor loops
        const refreshClient = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true,
        });
        try {
            const response = await refreshClient.post<JWTTokens>(
                '/auth/token/refresh/',
                { refresh: refreshToken }
            );
            return response.data;
        } catch (error) {
             console.error('[AuthService] Error during performTokenRefresh:', error);
             // Specific handling for refresh failure might be needed here
             // The main interceptor will catch this and clear tokens/redirect.
            throw error; // Re-throw for the main interceptor
        }
    }


    // Logout
    public async logout(): Promise<void> {
        const refreshToken = this.getStoredRefreshToken();
        try {
             // Optional: Inform the backend about logout, especially to invalidate the refresh token
             if (refreshToken) {
                 // Cambiado de POST a GET para coincidir con el backend
                 await this.apiClient.get('/auth/logout/', { 
                     params: { refresh: refreshToken } 
                 });
             }
        } catch (error) {
             // Log error but proceed with client-side cleanup
             console.error('[AuthService] Error notifying backend on logout:', error);
        } finally {
             // Always clear local tokens regardless of backend call success
             this.clearTokens(); // Clears sessionStorage
             // Attempt to clear relevant client-accessible cookies
             this.clearRelevantCookies();
             // Optional: Clear other session/local storage data if necessary
             // sessionStorage.clear(); // Use cautiously
             console.log("[AuthService] User logged out, tokens cleared from storage, attempted cookie clearing.");
        }
    }

    // --- Helper Methods ---

    // Helper to queue requests while refreshing token
    private subscribeTokenRefresh(cb: (token: string) => void) {
        this.refreshSubscribers.push(cb);
    }

    // Helper to notify queued requests after token refresh
    private onRefreshed(token: string) {
        this.refreshSubscribers.forEach((cb) => cb(token));
    }

    // Centralized API error handling (basic example)
    private handleApiError(error: unknown): void {
        if (axios.isAxiosError(error)) {
            console.error(`[AuthService] API Error: ${error.response?.status} ${error.message}`, error.response?.data);
            // Add more specific error handling based on status codes if needed
            // e.g., if (error.response?.status === 403) { /* handle forbidden */ }
        } else {
            console.error("[AuthService] Non-API Error:", error);
        }
        // Do not clear tokens here generally, interceptors handle auth errors
    }

     // Fetch CSRF token (if still needed alongside JWT - depends on backend setup)
     public async fetchCSRFToken(): Promise<string | null> {
        // If your backend doesn't require CSRF for JWT-authenticated requests,
        // you might be able to remove this. Check backend requirements.
        try {
            // Ensure this endpoint exists and is necessary with your JWT setup
            const response = await this.apiClient.get('/auth/csrf/');
            const csrfToken = response.data.csrfToken;
             // Axios might handle the 'csrftoken' cookie automatically if HttpOnly is false.
             // If HttpOnly is true (recommended), the backend needs to read it from the cookie,
             // and you might need to include X-CSRFToken header if using Django.
             // Check if axios needs explicit header setting:
             // this.apiClient.defaults.headers.common['X-CSRFToken'] = csrfToken;
            console.debug("[AuthService] CSRF token fetched (if applicable).");
            return csrfToken;
        } catch (error) {
            console.warn('[AuthService] Warning: Could not fetch CSRF token:', error);
            // Decide if this is critical. If not needed for JWT, can return null.
            // this.handleApiError(error); // Log it
            return null; // Or throw error if CSRF is strictly required
        }
    }

    // Method to clear cookies (might be less relevant if only using sessionStorage for JWT)
    // Keep if other cookies (like CSRF) are managed.
    public clearRelevantCookies(): void {
        console.log("[AuthService] Clearing relevant client-accessible cookies (CSRF, potentially non-HttpOnly JWTs)...");
        const domains = [window.location.hostname, `.${window.location.hostname}`];
        const paths = ['/', '/api']; // Adjust paths as needed
        // Add JWT cookie names in case they are NOT HttpOnly
        const cookiesToClear = ['csrftoken', 'access_token', 'refresh_token'];

        domains.forEach(domain => {
            paths.forEach(path => {
                cookiesToClear.forEach(cookieName => {
                    // Construct cookie string for deletion
                    // Note: HttpOnly cookies cannot be deleted from JavaScript.
                    // Use SameSite=Lax by default, adjust if needed (e.g., None for cross-site)
                    // Secure flag should be used if site is HTTPS
                    const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
                    document.cookie = `${cookieName}=; domain=${domain}; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
                });
            });
        });
         console.log("[AuthService] Attempted to clear client-accessible cookies.");
    }
}

// Export a singleton instance
export const authService = new AuthService();