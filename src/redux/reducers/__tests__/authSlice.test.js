import reducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from '../authSlice';

describe('authSlice', () => {
  const getBaseState = () => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('should return the initial state', () => {
    const state = reducer(undefined, { type: 'unknown' });
    expect(state).toEqual(getBaseState());
  });

  describe('loginStart', () => {
    it('should set loading to true and clear error', () => {
      let state = reducer(getBaseState(), loginFailure('Previous error'));
      const action = loginStart();
      state = reducer(state, action);
      
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe('loginSuccess', () => {
    it('should set user, token and mark as authenticated', () => {
      const payload = {
        user: { id: 1, name: 'Test User' },
        token: 'test-token-123',
      };
      const action = loginSuccess(payload);
      const state = reducer(getBaseState(), action);
      
      expect(state.user).toEqual({
        ...payload.user,
        access_groups: null,
      });
      expect(state.token).toBe(payload.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', payload.token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(state.user));
    });

    it('should handle missing user gracefully', () => {
      const payload = {
        token: 'test-token-123'
      };
      const action = loginSuccess(payload);
      const state = reducer(getBaseState(), action);
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({ access_groups: null });
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', payload.token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ access_groups: null }));
    });
  });

  describe('loginFailure', () => {
    it('should set error and set isAuthenticated to false', () => {
      let state = reducer(getBaseState(), loginStart());
      const error = 'Invalid credentials';
      const action = loginFailure(error);
      state = reducer(state, action);
      
      expect(state.error).toBe(error);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should reset all auth state to initial values', () => {
      let state = reducer(getBaseState(), loginSuccess({
        user: { id: 1, name: 'Test User' },
        token: 'test-token',
      }));
      
      const action = logout();
      state = reducer(state, action);
      
      expect(state).toEqual(getBaseState());
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });
});

