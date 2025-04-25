import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthProvider';
// Import the singleton instance to mock its methods
import { authService } from '../services/authService';
import { User } from '../services/authService'; // Import User type

// Mock the authService singleton
jest.mock('../services/authService', () => ({
    // Use a factory function to allow resetting mocks
    __esModule: true, // This is important for ES6 modules
    authService: {
        handleOAuthCallback: jest.fn(),
        checkAuthentication: jest.fn(),
        logout: jest.fn(),
        // Add other methods if needed by AuthProvider directly (likely not)
    },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

// Test Component remains the same
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
            {/* Update to use checkAuthStatus if needed for testing, but usually triggered on mount */}
            {/* <button onClick={auth.checkAuthStatus} data-testid="check-auth-button">Check Auth</button> */}
            <button onClick={auth.logout} data-testid="logout-button">
                Logout
            </button>
        </div>
    );
};

describe('AuthProvider', () => {
    const mockNavigate = jest.fn();
    // Get typed mock functions from the mocked authService
    const mockHandleOAuthCallback = authService.handleOAuthCallback as jest.Mock;
    const mockCheckAuthentication = authService.checkAuthentication as jest.Mock;
    const mockLogout = authService.logout as jest.Mock;

    // Mock user data
    const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        profile: {
            company: { id: 1, name: 'Test Company' }
        }
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        // Reset mock implementations if needed
        mockHandleOAuthCallback.mockReset();
        mockCheckAuthentication.mockReset();
        mockLogout.mockReset();
    });

    test('inicia con estado de carga y no autenticado', async () => {
        // Mock initial check returns null (not authenticated)
        mockHandleOAuthCallback.mockReturnValue(false); // No tokens from URL
        mockCheckAuthentication.mockResolvedValue(null);

        // Wrap render in act for initial state setting
        await act(async () => {
            render(
                <MemoryRouter>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
        });


        // Initial state should be loading, then transition
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');
        // Wait for loading to finish after the initial check
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        // Initial check runs once
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(1);
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(1);
    });

    test('maneja autenticación exitosa en el montaje inicial', async () => {
        // Mock service methods for successful auth
        mockHandleOAuthCallback.mockReturnValue(false); // No tokens from URL initially
        mockCheckAuthentication.mockResolvedValue(mockUser);

        // Render is wrapped in act implicitly by RTL's async utils when needed,
        // but wrapping explicitly for clarity with async operations inside.
        await act(async () => {
            render(
                <MemoryRouter>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
            // Allow initial checkAuthStatus to potentially resolve within act
            // However, waitFor is better for awaiting the final state.
        });


        // Wait for loading to finish and state to update
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        });


        // Verify authenticated state and user info
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
        // checkAuthStatus runs on mount, then again because isAuthenticated changes, triggering useEffect
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(2);
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(2);
    });

    test('maneja autenticación exitosa después de callback OAuth', async () => {
        // Mock service methods for successful auth after callback
        mockHandleOAuthCallback.mockReturnValue(true); // Tokens FOUND in URL
        mockCheckAuthentication.mockResolvedValue(mockUser);

        await act(async () => {
            render(
                <MemoryRouter initialEntries={['/?jwt_access=token&jwt_refresh=refresh']}>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
        });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        });

        // Verify authenticated state and user info
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);
        // checkAuthStatus runs on mount, then again because isAuthenticated changes, triggering useEffect
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(2);
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(2);
    });


    test('maneja fallo de autenticación en el montaje inicial', async () => {
        // Mock service methods for failed auth
        mockHandleOAuthCallback.mockReturnValue(false);
        mockCheckAuthentication.mockResolvedValue(null); // checkAuthentication returns null

        await act(async () => {
            render(
                <MemoryRouter>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
        });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });

        // Verify not authenticated state
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.queryByTestId('user-info')).toBeNull();
        // Initial check runs once, effect doesn't re-run as isAuthenticated remains false
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(1);
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(1);
    });

    test('maneja error inesperado durante checkAuthStatus', async () => {
        // Mock service methods to throw an error
        const errorMessage = 'Network Error';
        mockHandleOAuthCallback.mockReturnValue(false);
        mockCheckAuthentication.mockRejectedValue(new Error(errorMessage));

        // Suppress console.error for this specific test
        const originalError = console.error;
        console.error = jest.fn();

        await act(async () => {
            render(
                <MemoryRouter>
                    <AuthProvider>
                        <TestComponent />
                    </AuthProvider>
                </MemoryRouter>
            );
        });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });

        // Verify not authenticated state and error message
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.queryByTestId('user-info')).toBeNull();
        // Check for the generic error message set by AuthProvider's catch block
        expect(screen.getByTestId('error-message')).toHaveTextContent('An unexpected error occurred during authentication check.');
        // Initial check runs once, effect doesn't re-run as isAuthenticated remains false
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(1);
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(1);

        // Restore console.error
        console.error = originalError;
    });


    test('maneja logout correctamente', async () => {
        // Setup initial authenticated state
        // Mock checkAuthentication:
        // 1st call (mount): returns mockUser
        // 2nd call (effect re-run after auth state change): returns mockUser
        // 3rd call (effect re-run after logout state change): returns null
        mockCheckAuthentication
            .mockResolvedValueOnce(mockUser) // First call on mount
            .mockResolvedValueOnce(mockUser) // Second call due to effect re-run
            .mockResolvedValue(null);       // Subsequent calls (after logout) return null
        mockHandleOAuthCallback.mockReturnValue(false); // Assume no OAuth callback needed here
        mockLogout.mockResolvedValue(undefined); // Mock logout service call

        // Initial render
        render(
            <MemoryRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </MemoryRouter>
        );

        // Wait for initial auth to complete and state to reflect 'Authenticated'
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        });
        await waitFor(() => {
             expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
        });
        expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.email);


        // Verify initial auth calls (mount + effect re-run because isAuthenticated changed)
        // Expecting 2 calls by now because the state stabilized to Authenticated
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(2);
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(2);


        // Click logout button - wrap interaction and subsequent state update in act
        const logoutButton = screen.getByTestId('logout-button');
        await act(async () => {
            logoutButton.click();
            // Allow promises inside logout (service call, state updates) to resolve
        });


        // Wait specifically for the state to change *after* logout click
        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        });

        // Verify state after logout
        expect(screen.queryByTestId('user-info')).toBeNull();
        // Verify service logout was called
        expect(mockLogout).toHaveBeenCalledTimes(1);
        // Verify navigation occurred
        expect(mockNavigate).toHaveBeenCalledWith('/login');

        // Check final mock calls
        // Initial: 2 checkAuth, 2 handleOAuth
        // After logout click: 1 logout service call. State changes (isAuthenticated false).
        // Effect re-run (due to isAuthenticated change): 1 checkAuth, 1 handleOAuth
        // Total expected: checkAuth=3, handleOAuth=3, logout=1
        expect(mockCheckAuthentication).toHaveBeenCalledTimes(3); // 2 initial + 1 after logout state change
        expect(mockHandleOAuthCallback).toHaveBeenCalledTimes(3); // 2 initial + 1 after logout state change


    });

    // Note: Testing the token refresh logic is now an integration detail of AuthService.
    // Unit tests for AuthProvider should focus on its reaction to AuthService results.
    // If you need to test the refresh mechanism itself, create separate tests for `AuthService`
    // where you mock `axios` directly and trigger the interceptor.
});