import { renderHook, act } from '@testing-library/react';
import { useMyPlanogramState } from '../useMyPlanogramState';

const dispatchMock = jest.fn();

jest.mock('react-redux', () => ({
  __esModule: true,
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../redux/reducers/myPlanogramSlice', () => ({
  __esModule: true,
  setViewMode: jest.fn((mode) => ({ type: 'myPlanogram/setViewMode', payload: mode })),
  setSearchTerm: jest.fn((term) => ({ type: 'myPlanogram/setSearchTerm', payload: term })),
  setSelectedPlanogramIds: jest.fn((ids) => ({
    type: 'myPlanogram/setSelectedPlanogramIds',
    payload: ids,
  })),
}));

const { useDispatch, useSelector } = jest.requireMock('react-redux');
const {
  setViewMode,
  setSearchTerm,
  setSelectedPlanogramIds,
} = jest.requireMock('../../../redux/reducers/myPlanogramSlice');

describe('useMyPlanogramState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatchMock);
    useSelector.mockImplementation((selector) =>
      selector({
        myPlanogram: {
          viewMode: 'grid',
          searchTerm: 'initial term',
          selectedPlanogramIds: ['planogram-1'],
        },
      }),
    );
  });

  it('returns current planogram state values', () => {
    const { result } = renderHook(() => useMyPlanogramState());

    expect(result.current.viewMode).toBe('grid');
    expect(result.current.searchTerm).toBe('initial term');
    expect(result.current.selectedPlanogramIds).toEqual(['planogram-1']);
  });

  it('dispatches setViewMode action with provided mode', () => {
    const { result } = renderHook(() => useMyPlanogramState());

    act(() => {
      result.current.setViewMode('list');
    });

    expect(setViewMode).toHaveBeenCalledWith('list');
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'myPlanogram/setViewMode',
      payload: 'list',
    });
  });

  it('dispatches setSearchTerm action with provided term', () => {
    const { result } = renderHook(() => useMyPlanogramState());

    act(() => {
      result.current.setSearchTerm('new term');
    });

    expect(setSearchTerm).toHaveBeenCalledWith('new term');
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'myPlanogram/setSearchTerm',
      payload: 'new term',
    });
  });

  it('dispatches setSelectedPlanogramIds action with provided ids', () => {
    const { result } = renderHook(() => useMyPlanogramState());

    act(() => {
      result.current.setSelectedPlanogramIds(['planogram-2', 'planogram-3']);
    });

    expect(setSelectedPlanogramIds).toHaveBeenCalledWith(['planogram-2', 'planogram-3']);
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'myPlanogram/setSelectedPlanogramIds',
      payload: ['planogram-2', 'planogram-3'],
    });
  });
});

