import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock del contexto de autenticación
const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    user: null as any, // Usando any para permitir asignar diferentes tipos de user
    error: null,
    checkAuth: jest.fn()
};

jest.mock('./AuthProvider', () => ({
    useAuth: () => mockAuthContext
}));

// Componente de prueba para simular una ruta protegida
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
    beforeEach(() => {
        // Reiniciar el estado del mock antes de cada test
        mockAuthContext.isAuthenticated = false;
        mockAuthContext.isLoading = false;
        mockAuthContext.user = null;
        mockAuthContext.error = null;
        jest.clearAllMocks();
    });

    test('muestra el contenido cuando el usuario está autenticado', async () => {
        mockAuthContext.isAuthenticated = true;
        mockAuthContext.user = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            profile: { company: { name: 'Test Company' } }
        };

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<TestComponent />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    test('redirige a login cuando el usuario no está autenticado', async () => {
        mockAuthContext.isAuthenticated = false;

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<TestComponent />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(mockAuthContext.checkAuth).toHaveBeenCalled();
    });

    test('muestra el spinner mientras está cargando', () => {
        mockAuthContext.isLoading = true;

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<TestComponent />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('redirige a login cuando el usuario es inválido', () => {
        mockAuthContext.isAuthenticated = true;
        mockAuthContext.user = 'invalid user' as any; // Simular un usuario inválido

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<TestComponent />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
});