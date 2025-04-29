import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthContextType } from './AuthProvider'; // Import only AuthContextType
import { User } from '../services/authService'; // Import User type

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('./AuthProvider', () => ({
    ...jest.requireActual('./AuthProvider'),
    useAuth: () => mockUseAuth(),
}));

const LoginPage = () => <div data-testid="login-page">Login Page</div>;
const UnauthorizedPage = () => <div data-testid="unauthorized-page">Unauthorized Page</div>;

describe('ProtectedRoute', () => {
    let mockAuthContext: Partial<AuthContextType>;

    beforeEach(() => {
        // Reset mocks before each test
        mockUseAuth.mockReset();
        mockAuthContext = {
            isAuthenticated: false,
            isAuthorized: false,
            isLoading: false,
            user: null,
            error: null,
            checkAuthStatus: jest.fn(),
            logout: jest.fn(),
        };
        mockUseAuth.mockImplementation(() => mockAuthContext);
    });

    test('muestra el contenido cuando el usuario está autenticado y autorizado', async () => {
        // Arrange: Set user as authenticated and authorized
        mockAuthContext.isAuthenticated = true;
        mockAuthContext.isAuthorized = true;
        mockAuthContext.user = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            is_app_authorized: true,
            auth_provider: undefined // Add optional property
        } as User;

        // Act
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Assert: Check if protected content is rendered
        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    test('redirige a login cuando el usuario no está autenticado', async () => {
        // Arrange: Default state is unauthenticated

        // Act
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Assert: Check if redirected to login page
        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
        });
    });

    test('muestra el spinner mientras está cargando', () => {
        // Arrange: Set loading state
        mockAuthContext.isLoading = true;

        // Act
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Assert: Check if loading spinner is present
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('redirige a unauthorized cuando el usuario está autenticado pero no autorizado', async () => {
        // Arrange: Set user as authenticated but NOT authorized
        mockAuthContext.isAuthenticated = true;
        mockAuthContext.isAuthorized = false;
        mockAuthContext.user = {
            id: 2,
            username: 'unauthorizedUser',
            email: 'unauth@example.com',
            first_name: 'Unauth',
            last_name: 'User',
            is_app_authorized: false,
            auth_provider: undefined // Add optional property
        } as User;

        // Act
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Assert: Check if redirected to unauthorized page
        await waitFor(() => {
            expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
        });
    });
});