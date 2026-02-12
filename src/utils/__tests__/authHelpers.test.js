// Mock authConfig
jest.mock('../../config/authConfig', () => ({
  loginRequest: {
    scopes: ['User.Read', 'openid', 'profile', 'email'],
    prompt: 'select_account',
  },
}));

import {
  handleLogin,
  getAccessToken,
  getUserAccount,
  isAuthenticated,
  clearAuthData,
  refreshToken,
  handleTokenExpiration,
  logout,
} from '../authHelpers';

describe('authHelpers', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  // Mock window.location
  const mockLocation = {
    href: '',
    origin: 'http://localhost:3000',
  };

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    // Use global instead of window for Node environment
    global.localStorage = localStorageMock;
    global.window = {
      localStorage: localStorageMock,
      location: mockLocation,
    };
    mockLocation.href = '';
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return token from localStorage', () => {
      localStorageMock.setItem('accessToken', 'test-token-123');
      const result = getAccessToken();
      expect(result).toBe('test-token-123');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should return null when token is not in localStorage', () => {
      const result = getAccessToken();
      expect(result).toBeNull();
    });
  });

  describe('getUserAccount', () => {
    it('should return parsed user account from localStorage', () => {
      const account = { name: 'Test User', email: 'test@example.com' };
      localStorageMock.setItem('userAccount', JSON.stringify(account));
      const result = getUserAccount();
      expect(result).toEqual(account);
    });

    it('should return null when userAccount is not in localStorage', () => {
      const result = getUserAccount();
      expect(result).toBeNull();
    });

    it('should throw error when userAccount is invalid JSON', () => {
      localStorageMock.setItem('userAccount', 'invalid-json');
      expect(() => getUserAccount()).toThrow();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.setItem('accessToken', 'test-token');
      const result = isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', () => {
      const result = isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false when token is empty string', () => {
      localStorageMock.setItem('accessToken', '');
      const result = isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('clearAuthData', () => {
    it('should remove accessToken and userAccount from localStorage', () => {
      localStorageMock.setItem('accessToken', 'test-token');
      localStorageMock.setItem('userAccount', 'test-account');
      clearAuthData();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAccount');
    });
  });

  describe('handleLogin', () => {
    it('should login and save token and account to localStorage', async () => {
      const mockMsalInstance = {
        loginPopup: jest.fn().mockResolvedValue({
          account: { name: 'Test User', username: 'test@example.com' },
        }),
        acquireTokenSilent: jest.fn().mockResolvedValue({
          accessToken: 'new-access-token',
        }),
      };

      const result = await handleLogin(mockMsalInstance);

      expect(mockMsalInstance.loginPopup).toHaveBeenCalled();
      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userAccount',
        JSON.stringify({ name: 'Test User', username: 'test@example.com' })
      );
      expect(result).toBe('new-access-token');
    });

    it('should throw error when loginPopup fails', async () => {
      const mockMsalInstance = {
        loginPopup: jest.fn().mockRejectedValue(new Error('Login failed')),
        acquireTokenSilent: jest.fn(),
      };

      await expect(handleLogin(mockMsalInstance)).rejects.toThrow('Login failed');
      expect(mockMsalInstance.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('should throw error when acquireTokenSilent fails', async () => {
      const mockMsalInstance = {
        loginPopup: jest.fn().mockResolvedValue({
          account: { name: 'Test User' },
        }),
        acquireTokenSilent: jest.fn().mockRejectedValue(new Error('Token acquisition failed')),
      };

      await expect(handleLogin(mockMsalInstance)).rejects.toThrow('Token acquisition failed');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and save to localStorage', async () => {
      const account = { name: 'Test User', username: 'test@example.com' };
      localStorageMock.setItem('userAccount', JSON.stringify(account));

      const mockMsalInstance = {
        acquireTokenSilent: jest.fn().mockResolvedValue({
          accessToken: 'refreshed-token',
        }),
      };

      const result = await refreshToken(mockMsalInstance);

      expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'refreshed-token');
      expect(result).toBe('refreshed-token');
    });

    it('should throw error when no user account found', async () => {
      const mockMsalInstance = {
        acquireTokenSilent: jest.fn(),
      };

      await expect(refreshToken(mockMsalInstance)).rejects.toThrow('No user account found');
      expect(mockMsalInstance.acquireTokenSilent).not.toHaveBeenCalled();
    });

    it('should clear auth data and throw error when token refresh fails', async () => {
      const account = { name: 'Test User' };
      localStorageMock.setItem('userAccount', JSON.stringify(account));
      localStorageMock.setItem('accessToken', 'old-token');

      const mockMsalInstance = {
        acquireTokenSilent: jest.fn().mockRejectedValue(new Error('Refresh failed')),
      };

      await expect(refreshToken(mockMsalInstance)).rejects.toThrow('Refresh failed');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAccount');
    });
  });

  describe('handleTokenExpiration', () => {
    it('should refresh token successfully', async () => {
      const account = { name: 'Test User' };
      localStorageMock.setItem('userAccount', JSON.stringify(account));

      const mockMsalInstance = {
        acquireTokenSilent: jest.fn().mockResolvedValue({
          accessToken: 'new-token',
        }),
      };

      const result = await handleTokenExpiration(mockMsalInstance);
      expect(result).toBe('new-token');
    });

    it('should redirect to login when refresh fails', async () => {
      const account = { name: 'Test User' };
      localStorageMock.setItem('userAccount', JSON.stringify(account));

      const mockMsalInstance = {
        acquireTokenSilent: jest.fn().mockRejectedValue(new Error('Refresh failed')),
      };

      const result = await handleTokenExpiration(mockMsalInstance);
      expect(result).toBeNull();
      expect(mockLocation.href).toBe('/');
    });
  });

  describe('logout', () => {
    it('should clear auth data and logout from MSAL', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      localStorageMock.setItem('userAccount', 'test-account');

      const mockMsalInstance = {
        logoutRedirect: jest.fn().mockResolvedValue(undefined),
      };

      await logout(mockMsalInstance);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAccount');
      expect(mockMsalInstance.logoutRedirect).toHaveBeenCalledWith({
        postLogoutRedirectUri: 'http://localhost:3000/',
      });
    });

    it('should redirect to home when MSAL instance is not provided', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      await logout(null);
      expect(mockLocation.href).toBe('/');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    });

    it('should clear auth data and redirect even when MSAL logout fails', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      const mockMsalInstance = {
        logoutRedirect: jest.fn().mockRejectedValue(new Error('Logout failed')),
      };

      await logout(mockMsalInstance);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAccount');
      expect(mockLocation.href).toBe('/');
    });
  });
});

