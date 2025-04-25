import axios from 'axios';
import { AuthService, JWTTokens, User } from './authService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock sessionStorage
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
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.interceptors.request.use = jest.fn().mockImplementation(fn => fn);
    mockedAxios.interceptors.response.use = jest.fn().mockImplementation(fn => fn);
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    sessionStorageMock.clear();

    authService = new AuthService();
  });

  it('should create axios client with correct config', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
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
      mockedAxios.get.mockResolvedValue({ data: { csrfToken: 'csrf' } });
      const token = await authService.fetchCSRFToken();
      expect(token).toBe('csrf');
      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/csrf/');
    });

    it('returns null on failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      const token = await authService.fetchCSRFToken();
      expect(token).toBeNull();
    });
  });

  describe('fetchUserProfile', () => {
    it('returns user on success', async () => {
      const user: User = { id:1, username:'u', email:'e', first_name:'f', last_name:'l', profile:{ company:null } };
      mockedAxios.get.mockResolvedValue({ data: user });
      const result = await authService.fetchUserProfile();
      expect(result).toEqual(user);
      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile/');
    });

    it('throws on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(authService.fetchUserProfile()).rejects.toThrow('fail');
    });
  });

  describe('handleOAuthCallback', () => {
    afterEach(() => { window.history.replaceState({}, '', '/'); });

    it('stores and cleans URL when tokens present', () => {
      const params = '?jwt_access=a&jwt_refresh=r';
      Object.defineProperty(window, 'location', { value: { search: params, pathname: '/p', hash: '#h' }, writable: true });
      const replaced = jest.spyOn(window.history, 'replaceState');
      const result = authService.handleOAuthCallback();
      expect(result).toBe(true);
      expect(sessionStorageMock.getItem('accessToken')).toBe('a');
      expect(sessionStorageMock.getItem('refreshToken')).toBe('r');
      expect(replaced).toHaveBeenCalledWith({}, document.title, '/p#h');
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
      mockedAxios.get.mockResolvedValue({ data: user });
      const result = await authService.checkAuthentication();
      expect(result).toEqual(user);
    });

    it('returns null and clears tokens on 401', async () => {
      sessionStorageMock.setItem('accessToken', 't');
      const err: any = new Error('401'); err.response = { status:401 };
      mockedAxios.get.mockRejectedValue(err);
      const result = await authService.checkAuthentication();
      expect(result).toBeNull();
      expect(sessionStorageMock.getItem('accessToken')).toBeNull();
    });
  });

  describe('logout', () => {
    it('calls backend and clears tokens', async () => {
      sessionStorageMock.setItem('refreshToken', 'r');
      mockedAxios.post.mockResolvedValue({});
      const clearCookiesSpy = jest.spyOn(authService, 'clearRelevantCookies');
      await authService.logout();
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout/', { refresh: 'r' });
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(clearCookiesSpy).toHaveBeenCalled();
    });

    it('clears tokens even if backend fails', async () => {
      sessionStorageMock.setItem('refreshToken', 'r');
      mockedAxios.post.mockRejectedValue(new Error('fail'));
      const clearCookiesSpy = jest.spyOn(authService, 'clearRelevantCookies');
      await authService.logout();
      expect(sessionStorageMock.getItem('refreshToken')).toBeNull();
      expect(clearCookiesSpy).toHaveBeenCalled();
    });
  });
});
