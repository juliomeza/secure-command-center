import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { User } from '../services/authService'; // Import User type if needed for mock

// Mock del contexto de autenticación - Align with actual AuthContextType
const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    user: null as User | null, // Use actual User type
    error: null as string | null,
    checkAuthStatus: jest.fn(), // Renamed from checkAuth
    logout: jest.fn() // Added logout
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
        // Clear all mocks including the functions
        mockAuthContext.checkAuthStatus.mockClear();
        mockAuthContext.logout.mockClear();
        // jest.clearAllMocks(); // This might be redundant if clearing specific mocks
    });

    test('muestra el contenido cuando el usuario está autenticado', async () => {
        mockAuthContext.isAuthenticated = true;
        mockAuthContext.user = { // Use a valid User structure
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            profile: { company: { id: 1, name: 'Test Company' } } // Ensure profile matches User type
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
        // Simulate an invalid user structure (e.g., missing id or wrong type)
        // Note: Casting to 'any' bypasses type checking here for the test scenario.
        mockAuthContext.user = { username: 'invalid' } as any;

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