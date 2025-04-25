import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

// Mock del contexto de autenticación
const mockAuthContext = {
  isAuthenticated: false,
  isLoading: false,
  checkAuth: jest.fn()
};

jest.mock('./AuthProvider', () => ({
  useAuth: () => mockAuthContext
}));

// Mock de los botones de login social
jest.mock('react-social-login-buttons', () => ({
  MicrosoftLoginButton: ({ onClick }: { onClick: () => void }) => 
    <button onClick={onClick} data-testid="microsoft-login">Sign in with Microsoft</button>,
  GoogleLoginButton: ({ onClick }: { onClick: () => void }) => 
    <button onClick={onClick} data-testid="google-login">Sign in with Google</button>
}));

describe('LoginPage Component', () => {
  const originalWindow = window;
  let mockAlert: jest.SpyInstance;
  
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: {
        assign: jest.fn(),
        hostname: 'localhost',
        href: 'http://localhost',
        pathname: '/login',
        reload: jest.fn()
      }
    });

    // Mock alert ANTES de cada test
    mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Limpiar sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    // Restaurar window.location y alert
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: originalWindow.location
    });
    mockAlert.mockRestore();
    jest.clearAllMocks();
  });

  test('renderiza la página de login correctamente', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/Please enter your details/i)).toBeInTheDocument();
    expect(screen.getByTestId('microsoft-login')).toBeInTheDocument();
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
  });

  test('muestra el spinner de carga cuando isLoading es true', () => {
    // Cambiar el estado de loading a true
    mockAuthContext.isLoading = true;

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Restaurar el estado original
    mockAuthContext.isLoading = false;
  });

  test('redirige al hacer clic en el botón de Microsoft', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('microsoft-login'));
    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login/azuread-oauth2')
    );
  });

  test('redirige al hacer clic en el botón de Google', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('google-login'));
    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login/google-oauth2')
    );
  });

  test('maneja el límite de intentos de redirección', () => {
    // Espiar sessionStorage.getItem
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue('4');  // Simular 4 intentos previos

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId('microsoft-login'));
    
    // Verificar que se llamó a alert con el mensaje correcto
    expect(mockAlert).toHaveBeenCalledWith(
      'There was a problem with authentication. Please try again later.'
    );

    // Limpiar el spy
    getItemSpy.mockRestore();
  });
});