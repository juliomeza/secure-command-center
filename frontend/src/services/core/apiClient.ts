import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extender la configuración de Axios para incluir _retry
interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Determine if we're in production
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Set the base URL for API requests based on environment
const API_BASE_URL = isProduction 
  ? 'https://dashboard-control-back.onrender.com/api'
  : '/api';

// Create base axios instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get stored access token
const getStoredAccessToken = (): string | null => {
    return sessionStorage.getItem('accessToken');
};

// Get stored refresh token
const getStoredRefreshToken = (): string | null => {
    return sessionStorage.getItem('refreshToken');
};

// Add request interceptor to include JWT token
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

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomInternalAxiosRequestConfig;
        
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Handle rate limit
        if (error.response?.status === 429) {
            console.warn("Rate limit exceeded");
            return Promise.reject(error);
        }

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = getStoredRefreshToken();
                
                if (!refreshToken) {
                    return Promise.reject(error);
                }
                
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken
                });
                
                if (response.data.access) {
                    sessionStorage.setItem('accessToken', response.data.access);
                    if (response.data.refresh) {
                        sessionStorage.setItem('refreshToken', response.data.refresh);
                    }
                    
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);