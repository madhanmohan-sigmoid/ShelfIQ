import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/authHelpers', () => ({
  getAccessToken: jest.fn()
}));

describe('axiosInstance', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up globalThis._env_ before requiring module
    globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Mock globalThis.location.href
    delete globalThis.location;
    globalThis.location = { href: '' };

    // Setup axios instance mock
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn(() => 0)
        },
        response: {
          use: jest.fn(() => 0)
        }
      }
    };

    axios.create = jest.fn(() => mockAxiosInstance);
  });

  describe('Axios instance configuration', () => {
    it('should create axios instance with correct baseURL from globalThis._env_', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      require('../axiosInstance');
      
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.example.com'
        })
      );
    });

    it('should create axios instance with default baseURL when globalThis._env_ is not set', () => {
      globalThis._env_ = {};
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      require('../axiosInstance');
      
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: '/api/v1/'
        })
      );
    });

    it('should create axios instance with 30 second timeout', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      require('../axiosInstance');
      
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000
        })
      );
    });

    it('should create axios instance with withCredentials set to true', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      require('../axiosInstance');
      
      expect(axiosMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          withCredentials: true
        })
      );
    });

    it('should export baseURL correctly', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://test-api.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      const { baseURL: exportedBaseURL } = require('../axiosInstance');
      expect(exportedBaseURL).toBe('https://test-api.com');
    });
  });

  describe('Request interceptor', () => {
    let reqInterceptorFn;
    let freshMockInstance;
    
    beforeEach(() => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      
      // Re-import getAccessToken after resetModules
      const { getAccessToken: getAccessTokenMock } = require('../../utils/authHelpers');
      getAccessTokenMock.mockClear();
      
      // Create fresh mock instance with interceptor capture
      reqInterceptorFn = null;
      freshMockInstance = {
        interceptors: {
          request: {
            use: jest.fn((onFulfilled) => {
              reqInterceptorFn = onFulfilled;
              return 0;
            })
          },
          response: {
            use: jest.fn(() => 0)
          }
        }
      };
      
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => freshMockInstance);
      require('../axiosInstance');
    });

    it('should add Authorization header when token exists', () => {
      const { getAccessToken: getAccessTokenMock } = require('../../utils/authHelpers');
      getAccessTokenMock.mockReturnValue('test-token');
      
      const config = { headers: {} };
      const result = reqInterceptorFn(config);
      
      expect(result.headers.Authorization).toBe('Bearer test-token');
      expect(getAccessTokenMock).toHaveBeenCalled();
    });

    it('should not add Authorization header when token does not exist', () => {
      const { getAccessToken: getAccessTokenMock } = require('../../utils/authHelpers');
      getAccessTokenMock.mockReturnValue(null);
      
      const config = { headers: {} };
      const result = reqInterceptorFn(config);
      
      expect(result.headers.Authorization).toBeUndefined();
      expect(getAccessTokenMock).toHaveBeenCalled();
    });

    it('should preserve existing headers when adding Authorization', () => {
      const { getAccessToken: getAccessTokenMock } = require('../../utils/authHelpers');
      getAccessTokenMock.mockReturnValue('test-token');
      
      const config = {
        headers: { 'Content-Type': 'application/json' }
      };
      const result = reqInterceptorFn(config);
      
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('Response interceptor', () => {
    let respInterceptorFn;
    let freshMockInstance;
    
    beforeEach(() => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      
      respInterceptorFn = null;
      freshMockInstance = {
        interceptors: {
          request: {
            use: jest.fn(() => 0)
          },
          response: {
            use: jest.fn((onFulfilled, onRejected) => {
              respInterceptorFn = onRejected;
              return 0;
            })
          }
        }
      };
      
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => freshMockInstance);
      require('../axiosInstance');
    });

    it('should handle 401 error and clear localStorage', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: false }
      };

      await expect(respInterceptorFn(error)).rejects.toEqual(error);
      
      expect(error.config._retry).toBe(true);
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('userAccount');
    });

    it('should not retry 401 error if already retried', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: true }
      };

      globalThis.localStorage.removeItem.mockClear();
      
      await expect(respInterceptorFn(error)).rejects.toEqual(error);
      
      expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle non-401 errors without modification', async () => {
      const error = {
        response: { status: 500 },
        config: { _retry: false }
      };

      await expect(respInterceptorFn(error)).rejects.toEqual(error);
      
      expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle errors without response object', async () => {
      const error = {
        message: 'Network Error',
        config: { _retry: false }
      };

      await expect(respInterceptorFn(error)).rejects.toEqual(error);
      
      expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should export default axios instance', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      const axiosInstance = require('../axiosInstance').default;
      
      expect(axiosInstance).toBeDefined();
    });

    it('should set up both request and response interceptors', () => {
      globalThis._env_ = { VITE_REACT_APP_BACKEND: 'https://api.example.com' };
      jest.resetModules();
      const axiosMock = require('axios');
      axiosMock.create = jest.fn(() => mockAxiosInstance);
      require('../axiosInstance');
      
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
