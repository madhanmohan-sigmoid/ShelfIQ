import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDashboardState } from '../useDashboardState';
import dashboardReducer from '../../../redux/reducers/dashboardSlice';

describe('useDashboardState', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        dashboard: dashboardReducer,
      },
      preloadedState: {
        dashboard: {
          viewMode: 'list',
          searchTerm: '',
          ...initialState,
        },
      },
    });
  };

  const wrapper = (store) => {
    const ProviderWrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    ProviderWrapper.displayName = 'DashboardTestProvider';
    return ProviderWrapper;
  };

  it('should return initial state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useDashboardState(), {
      wrapper: wrapper(store),
    });

    expect(result.current.viewMode).toBe('list');
    expect(result.current.searchTerm).toBe('');
  });

  it('should return custom initial state', () => {
    const store = createTestStore({ viewMode: 'grid', searchTerm: 'test' });
    const { result } = renderHook(() => useDashboardState(), {
      wrapper: wrapper(store),
    });

    expect(result.current.viewMode).toBe('grid');
    expect(result.current.searchTerm).toBe('test');
  });

  describe('setViewMode', () => {
    it('should update viewMode when setViewMode is called', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(result.current.viewMode).toBe('grid');
    });

    it('should update viewMode to list', () => {
      const store = createTestStore({ viewMode: 'grid' });
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      expect(result.current.viewMode).toBe('grid');

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');
    });
  });

  describe('setSearchTerm', () => {
    it('should update searchTerm when setSearchTerm is called', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      act(() => {
        result.current.setSearchTerm('test search');
      });

      expect(result.current.searchTerm).toBe('test search');
    });

    it('should update searchTerm to empty string', () => {
      const store = createTestStore({ searchTerm: 'test' });
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      expect(result.current.searchTerm).toBe('test');

      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.searchTerm).toBe('');
    });
  });

  describe('Multiple updates', () => {
    it('should handle multiple setViewMode calls', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      act(() => {
        result.current.setViewMode('grid');
      });
      expect(result.current.viewMode).toBe('grid');

      act(() => {
        result.current.setViewMode('list');
      });
      expect(result.current.viewMode).toBe('list');

      act(() => {
        result.current.setViewMode('card');
      });
      expect(result.current.viewMode).toBe('card');
    });

    it('should handle multiple setSearchTerm calls', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      act(() => {
        result.current.setSearchTerm('first');
      });
      expect(result.current.searchTerm).toBe('first');

      act(() => {
        result.current.setSearchTerm('second');
      });
      expect(result.current.searchTerm).toBe('second');
    });

    it('should handle both setViewMode and setSearchTerm together', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      act(() => {
        result.current.setViewMode('grid');
        result.current.setSearchTerm('test');
      });

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.searchTerm).toBe('test');
    });
  });

  describe('Hook return values', () => {
    it('should return setViewMode and setSearchTerm functions', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardState(), {
        wrapper: wrapper(store),
      });

      expect(typeof result.current.setViewMode).toBe('function');
      expect(typeof result.current.setSearchTerm).toBe('function');
      expect(result.current.viewMode).toBeDefined();
      expect(result.current.searchTerm).toBeDefined();
    });
  });
});

