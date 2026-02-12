import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MyPlanogramContent from '../MyPlanogramContent';

const navigateMock = jest.fn();
const setSearchTermMock = jest.fn();
const setSelectedPlanogramIdsMock = jest.fn();

jest.mock('../useMyPlanogramState', () => ({
  __esModule: true,
  useMyPlanogramState: jest.fn(),
}));

jest.mock('../../header', () => ({
  __esModule: true,
  useHeaderData: jest.fn(),
}));

jest.mock('../../dashboard/SearchBar', () => {
  const SearchBarMock = ({
    onSearchChange,
    onResetFilters,
    onDuplicate,
    hasActiveFilters,
    canDuplicate,
    selectedRegion,
    selectedRetailer,
    category,
  }) => (
    <div data-testid="search-bar">
      <div data-testid="search-bar-region">{selectedRegion}</div>
      <div data-testid="search-bar-retailer">{selectedRetailer}</div>
      <div data-testid="search-bar-category">{category}</div>
      <div data-testid="search-bar-active-filters">{hasActiveFilters ? 'true' : 'false'}</div>
      <div data-testid="search-bar-can-duplicate">{canDuplicate ? 'true' : 'false'}</div>
      <input
        data-testid="search-input"
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
      <button data-testid="reset-filters-button" onClick={() => onResetFilters?.()}>
        Reset Filters
      </button>
      <button data-testid="duplicate-button" onClick={() => onDuplicate?.()}>
        Duplicate
      </button>
    </div>
  );
  SearchBarMock.displayName = 'SearchBarMock';

  return {
    __esModule: true,
    default: SearchBarMock,
  };
});

jest.mock('../../dashboard/PlanogramTable', () => {
  const React = require('react');
  const module = {
    __esModule: true,
  };

  module.__latestProps = null;
  module.__resetAllFiltersMock = jest.fn();

  module.__getLatestProps = () => module.__latestProps;
  module.__getResetAllFiltersMock = () => module.__resetAllFiltersMock;

  const MyPlanogramTableMock = React.forwardRef((props, ref) => {
    module.__latestProps = props;
    React.useImperativeHandle(ref, () => ({
      resetAllFilters: module.__resetAllFiltersMock,
    }));
    return <div data-testid="my-planogram-table" />;
  });
  MyPlanogramTableMock.displayName = 'MyPlanogramTableMock';

  module.default = MyPlanogramTableMock;

  return module;
});

jest.mock('../../../api/api', () => ({
  __esModule: true,
  duplicatePlanogram: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: jest.fn(),
}));

jest.mock('react-hot-toast', () => {
  const toast = {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(() => 'toast-id'),
    dismiss: jest.fn(),
  };
  return {
    __esModule: true,
    default: toast,
  };
});

const { useMyPlanogramState } = jest.requireMock('../useMyPlanogramState');
const { useHeaderData } = jest.requireMock('../../header');
const { duplicatePlanogram } = jest.requireMock('../../../api/api');
const { useNavigate } = jest.requireMock('react-router-dom');
const toast = jest.requireMock('react-hot-toast').default;
const PlanogramTableModule = jest.requireMock('../../dashboard/PlanogramTable');

const renderComponent = () => render(<MyPlanogramContent />);

describe('MyPlanogramContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useMyPlanogramState.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: [],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    useHeaderData.mockReturnValue({
      selectedRegion: 'North',
      selectedRetailer: 'Retailer A',
      category: 'Beverages',
    });

    useNavigate.mockReturnValue(navigateMock);
  });

  it('passes header data and selection state to SearchBar', () => {
    renderComponent();

    expect(screen.getByTestId('search-bar-region')).toHaveTextContent('North');
    expect(screen.getByTestId('search-bar-retailer')).toHaveTextContent('Retailer A');
    expect(screen.getByTestId('search-bar-category')).toHaveTextContent('Beverages');
    expect(screen.getByTestId('search-bar-active-filters')).toHaveTextContent('false');
    expect(screen.getByTestId('search-bar-can-duplicate')).toHaveTextContent('false');
  });

  it('updates search term through SearchBar input', () => {
    renderComponent();

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test search' } });

    expect(setSearchTermMock).toHaveBeenCalledWith('test search');
  });

  it('resets table filters when SearchBar requests reset', () => {
    const resetFiltersMock = jest.fn();
    PlanogramTableModule.__getResetAllFiltersMock().mockImplementation(resetFiltersMock);

    renderComponent();

    fireEvent.click(screen.getByTestId('reset-filters-button'));

    expect(resetFiltersMock).toHaveBeenCalledTimes(1);
  });

  it('passes expected props to PlanogramTable', () => {
    useMyPlanogramState.mockReturnValue({
      searchTerm: 'initial search',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: [],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    renderComponent();

    expect(PlanogramTableModule.__getLatestProps()).toMatchObject({
      searchTerm: 'initial search',
      variant: 'myPlanogram',
      onFilterChange: expect.any(Function),
      onSelectionChange: expect.any(Function),
    });
  });

  it('only keeps the first selected planogram id from table selection change', () => {
    renderComponent();

    act(() => {
      PlanogramTableModule.__getLatestProps().onSelectionChange?.([
        'planogram-1',
        'planogram-2',
      ]);
    });

    expect(setSelectedPlanogramIdsMock).toHaveBeenCalledWith(['planogram-1']);
  });

  it('updates SearchBar when table reports active filters', () => {
    renderComponent();

    act(() => {
      PlanogramTableModule.__getLatestProps().onFilterChange?.(true);
    });

    expect(screen.getByTestId('search-bar-active-filters')).toHaveTextContent('true');
  });

  it('toggles hasActiveFilters based on array filter values', () => {
    renderComponent();

    act(() => {
      PlanogramTableModule.__getLatestProps().onFilterChange?.(['brand-a']);
    });

    expect(screen.getByTestId('search-bar-active-filters')).toHaveTextContent('true');

    act(() => {
      PlanogramTableModule.__getLatestProps().onFilterChange?.([]);
    });

    expect(screen.getByTestId('search-bar-active-filters')).toHaveTextContent('false');
  });

  it('shows duplicate error when more than one planogram is selected', async () => {
    useMyPlanogramState.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: ['planogram-1', 'planogram-2'],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('duplicate-button'));
    });

    expect(toast.error).toHaveBeenCalledWith('Please select exactly one planogram to duplicate');
    expect(duplicatePlanogram).not.toHaveBeenCalled();
  });

  it('shows an error toast when duplicate is requested without a selection', async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('duplicate-button'));
    });

    expect(toast.error).toHaveBeenCalledWith('Please select exactly one planogram to duplicate');
    expect(duplicatePlanogram).not.toHaveBeenCalled();
  });

  it('duplicates selected planogram and navigates to new id', async () => {
    useMyPlanogramState.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: ['planogram-123'],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    duplicatePlanogram.mockResolvedValue({
      data: { data: { record: { id: 'new-planogram-id' } } },
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('duplicate-button'));
    });

    expect(duplicatePlanogram).toHaveBeenCalledWith('planogram-123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    expect(toast.success).toHaveBeenCalledWith('Planogram duplicated successfully');
    expect(navigateMock).toHaveBeenCalledWith('/my-planogram/new-planogram-id');
  });

  it('handles duplicate API response without new id', async () => {
    useMyPlanogramState.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: ['planogram-123'],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    duplicatePlanogram.mockResolvedValue({
      data: { data: { record: {} } },
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('duplicate-button'));
    });

    expect(duplicatePlanogram).toHaveBeenCalledWith('planogram-123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    expect(toast.error).toHaveBeenCalledWith('Failed to duplicate planogram: Invalid response');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows error toast when duplicate API call fails', async () => {
    useMyPlanogramState.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      selectedPlanogramIds: ['planogram-123'],
      setSelectedPlanogramIds: setSelectedPlanogramIdsMock,
    });

    duplicatePlanogram.mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId('duplicate-button'));
    });

    expect(duplicatePlanogram).toHaveBeenCalledWith('planogram-123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    expect(toast.error).toHaveBeenCalledWith('Failed to duplicate planogram');
    expect(navigateMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

