// frontend/src/auth/hooks/useAuth.test.tsx
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { authService, User } from '../services/authService';
import React from 'react';

// Mock the authService singleton
jest.mock('../services/authService', () => ({
  __esModule: true,
  authService: {
    handleOAuthCallback: jest.fn(),
    checkAuthentication: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Helper Component to test useAuth within components
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
      <button onClick={auth.checkAuthStatus} data-testid="check-auth-button">
        Check Auth
      </button>
      <button onClick={auth.logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('useAuth Hook', () => {
  const mockNavigate = jest.fn();
  const mockHandleOAuthCallback = authService.handleOAuthCallback as jest.Mock;
  const mockCheckAuthentication = authService.checkAuthentication as jest.Mock;
  const mockLogout = authService.logout as jest.Mock;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    is_app_authorized: true, // Added based on User interface
    // profile property removed as it's not in the User interface
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockHandleOAuthCallback.mockReset().mockReturnValue(false);
    mockCheckAuthentication.mockReset().mockResolvedValue(null);
    mockLogout.mockReset().mockResolvedValue(undefined);
  });

  test('throws error when used outside of AuthProvider', () => {
    // Suppress console error to avoid cluttering test output
    const consoleError = jest.spyOn(console, 'error');
    consoleError.mockImplementation(() => {});

    // Expect the hook to throw when used outside provider
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleError.mockRestore();
  });

  test('returns auth context with correct structure when used within AuthProvider', () => {
    // Wrap in MemoryRouter since AuthProvider uses useNavigate
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );
    
    // Render the hook with the wrapper
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Check that the hook returns the expected structure
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('checkAuthStatus');
    expect(result.current).toHaveProperty('logout');
    
    // Verify hook methods are functions
    expect(typeof result.current.checkAuthStatus).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  test('useAuth is accessible within a React component', () => {
    // Setup mock for auth check to succeed
    mockCheckAuthentication.mockResolvedValue(mockUser);
    
    // Render test component which uses useAuth
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Verify component can access hook methods
    expect(screen.getByTestId('check-auth-button')).toBeInTheDocument();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });
});