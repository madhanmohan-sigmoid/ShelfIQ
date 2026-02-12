import { renderHook } from '@testing-library/react';
import { useHeaderData } from '../hooks/useHeaderData';

jest.mock('react-redux', () => ({
  __esModule: true,
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/reducers/regionRetailerSlice', () => ({
  __esModule: true,
  selectSelectedRegion: jest.fn((state) => state.regionRetailer.selectedRegion),
  selectSelectedRetailer: jest.fn((state) => state.regionRetailer.selectedRetailer),
  selectSelectedCategory: jest.fn((state) => state.regionRetailer.selectedCategory),
}));

const { useSelector } = jest.requireMock('react-redux');

describe('useHeaderData', () => {
  const createMockState = (overrides = {}) => ({
    auth: {
      user: { name: 'Test User', email: 'test@example.com' },
      ...(overrides.auth || {}),
    },
    regionRetailer: {
      selectedRegion: 'North America',
      selectedRetailer: { id: 1, name: 'Walmart' },
      selectedCategory: { id: 2, name: 'Hair Care' },
      ...(overrides.regionRetailer || {}),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all data when all values are available', () => {
    const mockState = createMockState();
    useSelector.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockState);
      }
      // For selector functions from regionRetailerSlice
      return selector(mockState);
    });

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.user).toEqual({
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(result.current.selectedRegion).toBe('North America');
    expect(result.current.selectedRetailer).toBe('Walmart');
    expect(result.current.selectedCategory).toBe('Hair Care');
  });

  it('returns empty string when selectedRetailer is null', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: null,
        selectedCategory: { id: 2, name: 'Hair Care' },
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedRetailer).toBe('');
    expect(result.current.selectedRegion).toBe('North America');
    expect(result.current.selectedCategory).toBe('Hair Care');
  });

  it('returns empty string when selectedRetailer is undefined', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: undefined,
        selectedCategory: { id: 2, name: 'Hair Care' },
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedRetailer).toBe('');
  });

  it('returns empty string when selectedRetailer exists but name is missing', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1 }, // name is missing
        selectedCategory: { id: 2, name: 'Hair Care' },
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedRetailer).toBe('');
  });

  it('returns empty string when selectedCategory is null', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1, name: 'Walmart' },
        selectedCategory: null,
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedCategory).toBe('');
    expect(result.current.selectedRetailer).toBe('Walmart');
    expect(result.current.selectedRegion).toBe('North America');
  });

  it('returns empty string when selectedCategory is undefined', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1, name: 'Walmart' },
        selectedCategory: undefined,
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedCategory).toBe('');
  });

  it('returns empty string when selectedCategory exists but name is missing', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1, name: 'Walmart' },
        selectedCategory: { id: 2 }, // name is missing
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedCategory).toBe('');
  });

  it('handles null user', () => {
    const mockState = createMockState({
      auth: {
        user: null,
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.user).toBeNull();
    expect(result.current.selectedRegion).toBe('North America');
    expect(result.current.selectedRetailer).toBe('Walmart');
    expect(result.current.selectedCategory).toBe('Hair Care');
  });

  it('handles undefined user', () => {
    const mockState = createMockState({
      auth: {
        user: undefined,
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.user).toBeUndefined();
  });

  it('handles null selectedRegion', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: null,
        selectedRetailer: { id: 1, name: 'Walmart' },
        selectedCategory: { id: 2, name: 'Hair Care' },
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedRegion).toBeNull();
    expect(result.current.selectedRetailer).toBe('Walmart');
    expect(result.current.selectedCategory).toBe('Hair Care');
  });

  it('handles all edge cases together', () => {
    const mockState = createMockState({
      auth: {
        user: null,
      },
      regionRetailer: {
        selectedRegion: null,
        selectedRetailer: null,
        selectedCategory: null,
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.user).toBeNull();
    expect(result.current.selectedRegion).toBeNull();
    expect(result.current.selectedRetailer).toBe('');
    expect(result.current.selectedCategory).toBe('');
  });

  it('handles selectedRetailer with empty string name', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1, name: '' }, // empty string name
        selectedCategory: { id: 2, name: 'Hair Care' },
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedRetailer).toBe(''); // empty string is falsy, so fallback is used
  });

  it('handles selectedCategory with empty string name', () => {
    const mockState = createMockState({
      regionRetailer: {
        selectedRegion: 'North America',
        selectedRetailer: { id: 1, name: 'Walmart' },
        selectedCategory: { id: 2, name: '' }, // empty string name
      },
    });
    useSelector.mockImplementation((selector) => selector(mockState));

    const { result } = renderHook(() => useHeaderData());

    expect(result.current.selectedCategory).toBe(''); // empty string is falsy, so fallback is used
  });

  it('calls useSelector multiple times', () => {
    const mockState = createMockState();
    useSelector.mockImplementation((selector) => selector(mockState));

    renderHook(() => useHeaderData());

    // useSelector should be called 4 times: once for user, and once for each selector
    expect(useSelector).toHaveBeenCalledTimes(4);
  });
});
