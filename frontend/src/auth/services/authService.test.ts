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

  describe('fetchCSRFToken', () => {
    it('returns csrf token on success', async () => {
      mockGet.mockResolvedValue({ data: { csrfToken: 'csrf' } });
      const token = await authService.fetchCSRFToken();
      expect(token).toBe('csrf');
      expect(mockGet).toHaveBeenCalledWith('/auth/csrf/');
    });

    it('returns null on failure', async () => {
      mockGet.mockRejectedValue(new Error('fail'));
      const token = await authService.fetchCSRFToken();
      expect(token).toBeNull();
    });
  });

  describe('fetchUserProfile', () => {
    it('returns user on success', async () => {
      const user: User = { id:1, username:'u', email:'e', first_name:'f', last_name:'l', profile:{ company:null } };
      mockGet.mockResolvedValue({ data: user });
      const result = await authService.fetchUserProfile();
      expect(result).toEqual(user);
      expect(mockGet).toHaveBeenCalledWith('/auth/profile/');
    });

    it('throws on error', async () => {
      mockGet.mockRejectedValue(new Error('fail'));
      await expect(authService.fetchUserProfile()).rejects.toThrow('fail');
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
      const user: User = { id:1, username:'u', email:'e', first_name:'f', last_name:'l', profile:{ company:null } };
      mockGet.mockResolvedValue({ data: user });
      const result = await authService.checkAuthentication();
      expect(result).toEqual(user);
    });

    it('returns null and clears tokens on 401', async () => {
      sessionStorageMock.setItem('accessToken', 't');
      const err: any = new Error('fail'); err.response = { status:401 };
      // Simular un AxiosError para activar clearTokens en checkAuthentication
      (axios as any).isAxiosError = jest.fn(() => true);
      mockGet.mockRejectedValue(err);
      const result = await authService.checkAuthentication();
      expect(result).toBeNull();
      expect(sessionStorageMock.getItem('accessToken')).toBeNull();
    });
  });

  describe('logout', () => {
    it('calls backend and clears tokens', async () => {
      sessionStorageMock.setItem('refreshToken', 'r');
      mockPost.mockResolvedValue({});
      const clearCookiesSpy = jest.spyOn(authService, 'clearRelevantCookies');
      await authService.logout();
      expect(mockPost).toHaveBeenCalledWith('/auth/logout/', { refresh: 'r' });
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(clearCookiesSpy).toHaveBeenCalled();
    });

    it('clears tokens even if backend fails', async () => {
      sessionStorageMock.setItem('refreshToken', 'r');
      mockPost.mockRejectedValue(new Error('fail'));
      const clearCookiesSpy = jest.spyOn(authService, 'clearRelevantCookies');
      await authService.logout();
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(clearCookiesSpy).toHaveBeenCalled();
    });
  });
});
