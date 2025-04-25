import axios, { AxiosRequestConfig } from 'axios';
import { AuthService, JWTTokens, User, TokenResponse } from './authService';

// Mockear axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mockear sessionStorage
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mockear console para evitar logs durante los tests
let consoleLogSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;


describe('AuthService', () => {
  let authService: AuthService;
  const mockBaseUrl = '/api'; // Asumiendo entorno de desarrollo

  beforeEach(() => {
    // Limpiar mocks antes de cada test
    mockedAxios.create.mockReturnValue(mockedAxios); // Simular la creación de instancia
    // Mock the interceptor use methods to capture the functions
    mockedAxios.interceptors.request.use = jest.fn().mockImplementation(fulfilled => fulfilled);
    mockedAxios.interceptors.response.use = jest.fn().mockImplementation(fulfilled => fulfilled);

    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    sessionStorageMock.clear();


    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


    // Crear instancia de AuthService para cada test
    authService = new AuthService(false); // Usando la API vieja por defecto en tests
  });

  afterEach(() => {
      // Restore console spies
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
  });

  it('should be created', () => {
    expect(authService).toBeDefined();
    // Verificar que se crea una instancia de axios
    expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockBaseUrl,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });
  });

  // --- Tests para gestión de tokens en sessionStorage ---

  it('should store tokens in sessionStorage', () => {
    const tokens: JWTTokens = { access: 'fakeAccessToken', refresh: 'fakeRefreshToken' };
    authService.storeTokens(tokens);
    expect(sessionStorageMock.getItem('accessToken')).toBe(tokens.access);
    expect(sessionStorageMock.getItem('refreshToken')).toBe(tokens.refresh);
  });

  it('should retrieve stored access token', () => {
    const token = 'fakeAccessToken';
    sessionStorageMock.setItem('accessToken', token);
    expect(authService.getStoredAccessToken()).toBe(token);
  });

  it('should retrieve stored refresh token', () => {
    const token = 'fakeRefreshToken';
    sessionStorageMock.setItem('refreshToken', token);
    expect(authService.getStoredRefreshToken()).toBe(token);
  });

  it('should clear tokens from sessionStorage', () => {
    sessionStorageMock.setItem('accessToken', 'access');
    sessionStorageMock.setItem('refreshToken', 'refresh');
    authService.clearTokens();
    expect(sessionStorageMock.getItem('accessToken')).toBeNull();
    expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
  });

  // --- Tests para métodos de API ---

  it('should fetch CSRF token', async () => {
    const csrfToken = 'test-csrf-token';
    mockedAxios.get.mockResolvedValue({ data: { csrfToken } });

    const token = await authService.fetchCSRFToken();

    expect(token).toBe(csrfToken);
    expect(mockedAxios.get).toHaveBeenCalledWith('/csrf/');
  });

  it('should handle error when fetching CSRF token', async () => {
    const error = new Error('Network Error');
    mockedAxios.get.mockRejectedValue(error);

    await expect(authService.fetchCSRFToken()).rejects.toThrow('Network Error');
    expect(mockedAxios.get).toHaveBeenCalledWith('/csrf/');
    expect(console.error).toHaveBeenCalledWith('[AuthService] Error fetching CSRF token:', error);
  });

  it('should fetch user profile', async () => {
    const mockUser: User = {
        id: 1, username: 'testuser', email: 'test@example.com', first_name: 'Test', last_name: 'User',
        profile: { company: null }
    };
    mockedAxios.get.mockResolvedValue({ data: mockUser });

    const user = await authService.fetchUserProfile();

    expect(user).toEqual(mockUser);
    expect(mockedAxios.get).toHaveBeenCalledWith('/profile/');
  });

   it('should handle error when fetching user profile', async () => {
    const error = new Error('Unauthorized');
    mockedAxios.get.mockRejectedValue(error);

    await expect(authService.fetchUserProfile()).rejects.toThrow('Unauthorized');
    expect(mockedAxios.get).toHaveBeenCalledWith('/profile/');
    expect(console.error).toHaveBeenCalledWith('[AuthService] Error fetching user profile:', error);
  });

  it('should fetch JWT tokens', async () => {
    const mockTokenResponse: TokenResponse = {
        access: 'newAccessToken', refresh: 'newRefreshToken',
        user: { id: 1, username: 'testuser', email: 'test@example.com', first_name: 'Test', last_name: 'User', profile: { company: null } }
    };
    mockedAxios.get.mockResolvedValue({ data: mockTokenResponse });

    const response = await authService.fetchJWTTokens();

    expect(response).toEqual(mockTokenResponse);
    expect(mockedAxios.get).toHaveBeenCalledWith('/token/');
    expect(console.log).toHaveBeenCalledWith("[AuthService] Fetching JWT tokens...");
    expect(console.log).toHaveBeenCalledWith("[AuthService] JWT tokens received successfully");
  });

  it('should handle error when fetching JWT tokens', async () => {
    const error = new Error('Server Error');
    mockedAxios.get.mockRejectedValue(error);

    await expect(authService.fetchJWTTokens()).rejects.toThrow('Server Error');
    expect(mockedAxios.get).toHaveBeenCalledWith('/token/');
    expect(console.error).toHaveBeenCalledWith('[AuthService] Error fetching JWT tokens:', error);
  });

  it('should refresh JWT token', async () => {
    const oldRefreshToken = 'oldRefreshToken';
    const newTokens: JWTTokens = { access: 'newAccessToken', refresh: 'newRefreshToken' };
    // Mock para la llamada específica de refresh token (usando el cliente separado)
    mockedAxios.post.mockResolvedValue({ data: newTokens });

    const response = await authService.refreshToken(oldRefreshToken);

    expect(response).toEqual(newTokens);
    expect(mockedAxios.post).toHaveBeenCalledWith(
        '/token/refresh/',
        { refresh: oldRefreshToken }
    );
  });

   it('should handle error when refreshing JWT token', async () => {
    const oldRefreshToken = 'oldRefreshToken';
    const error = new Error('Invalid Refresh Token');
     // Mock para la llamada específica de refresh token
    mockedAxios.post.mockRejectedValue(error);

    await expect(authService.refreshToken(oldRefreshToken)).rejects.toThrow('Invalid Refresh Token');
    expect(mockedAxios.post).toHaveBeenCalledWith(
        '/token/refresh/',
        { refresh: oldRefreshToken }
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('[AuthService] Error refreshing token:', error);
  });

  it('should logout', async () => {
    mockedAxios.get.mockResolvedValue({}); // Simula respuesta exitosa de logout
    sessionStorageMock.setItem('accessToken', 'access');
    sessionStorageMock.setItem('refreshToken', 'refresh');

    await authService.logout();

    expect(mockedAxios.get).toHaveBeenCalledWith('/logout/');
    expect(sessionStorageMock.getItem('accessToken')).toBeNull();
    expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
  });

  it('should handle error during logout', async () => {
    const error = new Error('Logout Failed');
    mockedAxios.get.mockRejectedValue(error);

    await expect(authService.logout()).rejects.toThrow('Logout Failed');
    expect(mockedAxios.get).toHaveBeenCalledWith('/logout/');
    // Los tokens no deberían borrarse si el logout falla en la API
    // expect(sessionStorageMock.getItem('accessToken')).not.toBeNull();
    expect(console.error).toHaveBeenCalledWith('[AuthService] Error during logout:', error);
  });

  // --- Tests para Interceptors ---

  it('request interceptor should add Authorization header if token exists', () => {
    const token = 'myAccessToken';
    authService.storeTokens({ access: token, refresh: 'refresh' });

    // Get the interceptor function passed to 'use'
    // We need to re-instantiate AuthService here AFTER setting the token
    // because the interceptors are set up in the constructor.
    authService = new AuthService(false);
    const requestInterceptor = (mockedAxios.interceptors.request.use as jest.Mock).mock.calls[0][0];

    // Use AxiosRequestConfig instead of InternalAxiosRequestConfig
    const config: AxiosRequestConfig = { headers: {} };
    const updatedConfig = requestInterceptor(config);

    expect(updatedConfig.headers?.Authorization).toBe(`Bearer ${token}`);
  });

  it('request interceptor should not add Authorization header if no token exists', () => {
     // Ensure tokens are clear before creating the instance for this test
     authService.clearTokens();
     authService = new AuthService(false);
     const requestInterceptor = (mockedAxios.interceptors.request.use as jest.Mock).mock.calls[0][0];

    // Use AxiosRequestConfig instead of InternalAxiosRequestConfig
    const config: AxiosRequestConfig = { headers: {} };
    const updatedConfig = requestInterceptor(config);

    expect(updatedConfig.headers?.Authorization).toBeUndefined();
  });

  // TODO: Tests más complejos para el interceptor de respuesta (renovación de token en 401)
  // Estos tests requerirán simular una secuencia de llamadas axios

});

// Test suite para AuthService con la nueva API habilitada
describe('AuthService - New API', () => {
    let authService: AuthService;

    beforeEach(() => {
        mockedAxios.create.mockReturnValue(mockedAxios);
        // Mock interceptors for this suite too
        mockedAxios.interceptors.request.use = jest.fn().mockImplementation(fulfilled => fulfilled);
        mockedAxios.interceptors.response.use = jest.fn().mockImplementation(fulfilled => fulfilled);
        mockedAxios.get.mockClear();
        mockedAxios.post.mockClear();
        sessionStorageMock.clear();


        // Setup console spies
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Crear instancia usando la nueva API
        authService = new AuthService(true);
    });

    afterEach(() => {
        // Restore console spies
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('should use /auth base path for API calls', async () => {
        mockedAxios.get.mockResolvedValue({ data: { csrfToken: 'csrf' } });
        await authService.fetchCSRFToken();
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/csrf/');

        mockedAxios.get.mockResolvedValue({ data: {} }); // Reset mock for next call
        await authService.fetchUserProfile();
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile/');

        mockedAxios.get.mockResolvedValue({ data: {} }); // Reset mock for next call
        await authService.fetchJWTTokens();
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/token/');

        mockedAxios.post.mockResolvedValue({ data: {} }); // Reset mock for next call
        await authService.refreshToken('refresh');
         // La URL base ya está incluida por axios.create, solo verificamos el endpoint relativo
        expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/token/refresh/'), expect.anything());


        mockedAxios.get.mockResolvedValue({}); // Reset mock for next call
        await authService.logout();
        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/logout/');
    });
});
