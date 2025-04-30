import axios from 'axios';
import { AuthService, JWTTokens, User } from './authService';

// Fake Axios client con interceptors y métodos get/post
const fakeInterceptors = {
  request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
  response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
};
const mGet = jest.fn();
const mPost = jest.fn();
const fakeClient = { interceptors: fakeInterceptors, get: mGet, post: mPost } as any;
// Sobrescribir axios.create, get, post antes de instanciar AuthService
(axios as any).create = jest.fn(() => fakeClient);
(axios as any).get = mGet;
(axios as any).post = mPost;
// Atajos para mocks
const mockCreate = (axios as any).create as jest.Mock;
const mockGet = (axios as any).get as jest.Mock;
const mockPost = (axios as any).post as jest.Mock;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Limpiar storage y mocks antes de cada prueba
    sessionStorageMock.clear();
    mockGet.mockClear();
    mockPost.mockClear();
    // Resetear spies en interceptors
    fakeInterceptors.request.use.mockClear();
    fakeInterceptors.response.use.mockClear();
    // Instanciar servicio
    authService = new AuthService();
  });

  it('should create axios client with correct config', () => {
    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    // Interceptor de request debe haberse registrado
    expect(fakeInterceptors.request.use).toHaveBeenCalled();
    expect(fakeInterceptors.response.use).toHaveBeenCalled();
  });

  describe('Token storage methods', () => {
    it('storeTokens and retrieve tokens', () => {
      const tokens: JWTTokens = { access: 'a', refresh: 'r' };
      authService.storeTokens(tokens);
      expect(sessionStorageMock.getItem('accessToken')).toBe('a');
      expect(sessionStorageMock.getItem('refreshToken')).toBe('r');
    });

    it('getStoredAccessToken returns null if none', () => {
      expect(authService.getStoredAccessToken()).toBeNull();
    });

    it('clearTokens removes tokens', () => {
      sessionStorageMock.setItem('accessToken', 'a');
      sessionStorageMock.setItem('refreshToken', 'r');
      authService.clearTokens();
      expect(sessionStorageMock.getItem('accessToken')).toBeNull();
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
    });
  });

  describe('handleOAuthCallback', () => {
    afterEach(() => { window.history.replaceState({}, '', '/'); });

    it('stores and cleans URL when tokens present', () => {
      const params = '?jwt_access=a&jwt_refresh=r';
      Object.defineProperty(window, 'location', { value: { search: params, pathname: '/p', hash: '#h' }, writable: true });
      const replaceSpy = jest.spyOn(window.history, 'replaceState');
      const result = authService.handleOAuthCallback();
      expect(result).toBe(true);
      expect(sessionStorageMock.getItem('accessToken')).toBe('a');
      expect(sessionStorageMock.getItem('refreshToken')).toBe('r');
      expect(replaceSpy).toHaveBeenCalledWith({}, document.title, '/p#h');
    });

    it('returns false when no tokens', () => {
      Object.defineProperty(window, 'location', { value: { search: '', pathname:'/', hash:'' }, writable: true });
      expect(authService.handleOAuthCallback()).toBe(false);
    });
  });

  describe('checkAuthentication', () => {
    it('returns null if no access token', async () => {
      sessionStorageMock.clear();
      const user = await authService.checkAuthentication();
      expect(user).toBeNull();
    });

    it('returns user if profile fetch succeeds', async () => {
      sessionStorageMock.setItem('accessToken', 't');
      const user: User = { id:1, username:'u', email:'e', first_name:'f', last_name:'l', is_app_authorized: true };
      mockGet.mockResolvedValue({ data: user });
      const result = await authService.checkAuthentication();
      expect(result).toEqual(user);
    });

    it('returns null on profile fetch failure', async () => {
      sessionStorageMock.setItem('accessToken', 't');
      const err: any = new Error('fail');
      // Simular un AxiosError para activar clearTokens en checkAuthentication
      err.response = { status: 500 };
      mockGet.mockRejectedValue(err); // Mock the direct call failure

      // Spy on clearTokens to ensure it's NOT called directly by checkAuthentication
      const clearTokensSpy = jest.spyOn(authService, 'clearTokens');

      const result = await authService.checkAuthentication();
      expect(result).toBeNull();
      // Verify tokens were NOT cleared by this method directly
      expect(sessionStorageMock.getItem('accessToken')).toBe('t');
      expect(clearTokensSpy).not.toHaveBeenCalled();

      clearTokensSpy.mockRestore(); // Clean up spy
    });
  });

  describe('logout', () => {
    it('calls backend (GET) and clears tokens', async () => {
      sessionStorageMock.setItem('accessToken', 'a');
      sessionStorageMock.setItem('refreshToken', 'r');
      // Mock the GET request used in the current logout implementation
      mockGet.mockResolvedValue({});
      // Spy on clearTokens to ensure it's called
      const clearTokensSpy = jest.spyOn(authService, 'clearTokens');

      await authService.logout();

      // Check if the GET request was made to the correct endpoint with the config object
      expect(mockGet).toHaveBeenCalledWith('/auth/logout/', {}); // <<< CORRECTED: Added empty object
      // Check if tokens were cleared
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(sessionStorageMock.getItem('accessToken')).toBeNull();
      expect(clearTokensSpy).toHaveBeenCalled();

      clearTokensSpy.mockRestore();
    });

    it('clears tokens even if backend fails', async () => {
      sessionStorageMock.setItem('accessToken', 'a');
      sessionStorageMock.setItem('refreshToken', 'r');
      // Mock the GET request to fail
      mockGet.mockRejectedValue(new Error('fail'));
      // Spy on clearTokens
      const clearTokensSpy = jest.spyOn(authService, 'clearTokens');

      // Use try/catch as logout might re-throw or handle the error
      try {
        await authService.logout();
      } catch (e) {
        // Ignore error for this test, focus on token clearing
      }

      // Check if tokens were cleared despite the error
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(sessionStorageMock.getItem('accessToken')).toBeNull();
      expect(clearTokensSpy).toHaveBeenCalled();

      clearTokensSpy.mockRestore();
    });
  });
});
