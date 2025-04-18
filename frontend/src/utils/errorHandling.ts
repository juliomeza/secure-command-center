import { AxiosError } from 'axios';

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

export const handleApiError = (error: unknown): ApiError => {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const apiError = error.response?.data?.error;

        // Handle specific error codes
        switch (status) {
            case 400:
                return {
                    message: apiError?.message || 'Invalid request data',
                    code: 'BAD_REQUEST',
                    status
                };
            case 401:
                return {
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED',
                    status
                };
            case 403:
                return {
                    message: 'Access denied',
                    code: 'FORBIDDEN',
                    status
                };
            case 404:
                return {
                    message: apiError?.message || 'Resource not found',
                    code: 'NOT_FOUND',
                    status
                };
            case 429:
                return {
                    message: 'Too many requests. Please try again later',
                    code: 'RATE_LIMIT_EXCEEDED',
                    status
                };
            case 500:
                return {
                    message: 'Internal server error',
                    code: 'SERVER_ERROR',
                    status
                };
            default:
                return {
                    message: apiError?.message || 'An unexpected error occurred',
                    code: 'UNKNOWN_ERROR',
                    status
                };
        }
    }

    // Handle non-Axios errors
    if (error instanceof Error) {
        return {
            message: error.message,
            code: 'CLIENT_ERROR'
        };
    }

    return {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
    };
};