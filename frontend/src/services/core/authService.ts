import { apiClient } from './apiClient';
import { User } from '../../data/types';

interface AuthResponse {
    access: string;
    refresh: string;
}

interface TokenResponse {
    access: string;
    refresh?: string;
}

export const authService = {
    checkAuth: async (): Promise<User> => {
        await apiClient.get('/csrf/');
        const response = await apiClient.get<User>('/profile/');
        return response.data;
    },

    getTokens: async (): Promise<AuthResponse> => {
        const response = await apiClient.get<AuthResponse>('/token/');
        return response.data;
    },

    refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
        const response = await apiClient.post<TokenResponse>('/token/refresh/', {
            refresh: refreshToken
        });
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.get('/logout/');
    }
};