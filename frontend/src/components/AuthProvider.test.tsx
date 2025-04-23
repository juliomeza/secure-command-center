import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthProvider';
import axios from 'axios';

// Mock de axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
        }
    })),
    isAxiosError: jest.fn()
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn()
}));

// Componente de prueba que usa el contexto de autenticación
const TestComponent = () => {
    const auth = useAuth();
    return (
        <div>
            <div data-testid="auth-status">
                {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <div data-testid="loading-status">
                {auth.isLoading ? 'Loading' : 'Not Loading'}
            </div>
            {auth.user && (
                <div data-testid="user-info">
                    {auth.user.email}
                </div>
            )}
            {auth.error && (
                <div data-testid="error-message">
                    {auth.error}
                </div>
            )}
            <button onClick={auth.logout} data-testid="logout-button">
                Logout
            </button>
        </div>
    );
};

describe('AuthProvider', () => {
    const mockNavigate = jest.fn();
    let mockAxiosGet: jest.Mock;
    let mockAxiosPost: jest.Mock;
    let axiosInstance: any;

    beforeEach(() => {
        // Limpiar todos los mocks
        jest.clearAllMocks();
        
        // Configurar mock de navigate
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        
        // Configurar mocks de axios
        mockAxiosGet = jest.fn();
        mockAxiosPost = jest.fn();
        axiosInstance = {
            get: mockAxiosGet,
            post: mockAxiosPost,
            interceptors: {
                request: { use: jest.fn(), eject: jest.fn() },
                response: { use: jest.fn(), eject: jest.fn() }
            }
        };
        (axios.create as jest.Mock).mockReturnValue(axiosInstance);

        // Limpiar sessionStorage
        sessionStorage.clear();
    });

    test('inicia con estado de carga', () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });

    /* test('maneja autenticación exitosa', async () => {
        // Mock el usuario y tokens
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            username: 'testuser'
        };

        const mockTokens = {
            access: 'mock-token',
            refresh: 'mock-refresh'
        };

        // Simular token existente
        sessionStorage.setItem('accessToken', mockTokens.access);
        sessionStorage.setItem('refreshToken', mockTokens.refresh);

        // Mock las respuestas en secuencia: CSRF, Profile, Tokens
        mockAxiosGet
            .mockResolvedValueOnce({ data: {} }) // CSRF
            .mockResolvedValueOnce({ data: mockUser }) // Profile
            .mockResolvedValueOnce({ data: mockTokens }); // Tokens

        render(
            <MemoryRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </MemoryRouter>
        );

        // Esperar a que se complete la autenticación inicial
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });

        // Verificar que el usuario está autenticado
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
    }); */

    test('maneja error de autenticación', async () => {
        // Mock error de autenticación
        mockAxiosGet.mockRejectedValueOnce(new Error('Authentication failed'));

        render(
            <MemoryRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });

        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(sessionStorage.getItem('accessToken')).toBeNull();
        expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });

    test('maneja logout correctamente', async () => {
        const mockUser = {
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            profile: {
                company: { id: 1, name: 'Test Company' }
            }
        };

        // Mock autenticación inicial exitosa
        mockAxiosGet
            .mockResolvedValueOnce({ data: {} }) // CSRF
            .mockResolvedValueOnce({ data: mockUser }) // Profile
            .mockResolvedValueOnce({ data: { access: 'token', refresh: 'refresh' } }); // Tokens

        render(
            <MemoryRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </MemoryRouter>
        );

        // Esperar a que se complete la autenticación inicial
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        });

        // Mock respuesta exitosa de logout
        mockAxiosGet.mockResolvedValueOnce({ data: {} });

        // Hacer clic en el botón de logout
        const logoutButton = screen.getByTestId('logout-button');
        await act(async () => {
            logoutButton.click();
        });

        // Verificar estado después del logout
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
            expect(sessionStorage.getItem('accessToken')).toBeNull();
            expect(sessionStorage.getItem('refreshToken')).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    /* test('refresca el token cuando expira', async () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        const mockInitialTokens = {
            access: 'initial-access-token',
            refresh: 'old-refresh-token'  // This matches what the test expects
        };
        const mockNewTokens = {
            access: 'new-access-token',
            refresh: 'new-refresh-token'
        };

        // Set up initial tokens in sessionStorage
        sessionStorage.setItem('accessToken', mockInitialTokens.access);
        sessionStorage.setItem('refreshToken', mockInitialTokens.refresh);

        // Mock respuesta de refresh token
        mockAxiosPost.mockImplementation(async (url) => {
            if (url === '/token/refresh/') {
                return { data: mockNewTokens };
            }
            throw new Error('Unexpected URL');
        });

        // Mock las respuestas en secuencia: CSRF, 401 error, Profile after refresh
        mockAxiosGet
            .mockResolvedValueOnce({ data: {} })  // CSRF call
            .mockRejectedValueOnce({ response: { status: 401 } })  // Profile call fails with 401
            .mockResolvedValueOnce({ data: mockUser });  // Profile call succeeds after token refresh

        await act(async () => {
            render(
                <MemoryRouter>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
        });

        // Esperar a que se procese la respuesta 401 y el refresh token
        await waitFor(() => {
            expect(mockAxiosPost).toHaveBeenCalledWith(
                '/token/refresh/',
                { refresh: 'old-refresh-token' }
            );
        });

        // Esperar a que se actualicen los tokens
        await waitFor(() => {
            expect(sessionStorage.getItem('accessToken')).toBe('new-access-token');
            expect(sessionStorage.getItem('refreshToken')).toBe('new-refresh-token');
        });

        // Verificar que el usuario se autenticó después del refresh
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
            expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
        });
    }); */
});