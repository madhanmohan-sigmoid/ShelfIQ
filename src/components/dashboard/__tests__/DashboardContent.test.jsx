/* eslint-disable react/prop-types */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DashboardContent from '../DashboardContent';
import { useHeaderData } from '../../header';

jest.mock('../../header', () => ({
  useHeaderData: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockSearchBarState = { latest: undefined };
jest.mock('../SearchBar', () => {
  const MockSearchBar = (props) => {
    mockSearchBarState.latest = props;
    return (
      <div data-testid="search-bar-mock">
        <button
          data-testid="trigger-reset"
          onClick={() => props.onResetFilters?.()}
        >
          Reset
        </button>
        <button
          data-testid="trigger-compare"
          onClick={() => props.onCompare?.()}
        >
          Compare
        </button>
      </div>
    );
  };

  return MockSearchBar;
});

const mockResetAllFilters = jest.fn();
const mockPlanogramTableState = { latest: undefined };

jest.mock('../PlanogramTable', () => {
  const React = require('react');

  const MockPlanogramTable = React.forwardRef((props, ref) => {
    mockPlanogramTableState.latest = props;

    React.useImperativeHandle(ref, () => ({
      resetAllFilters: mockResetAllFilters,
    }));

    return (
      <div data-testid="planogram-table-mock">
        <button
          data-testid="trigger-filter-true"
          onClick={() => props.onFilterChange?.(true)}
        >
          FilterTrue
        </button>
        <button
          data-testid="trigger-selection"
          onClick={() => props.onSelectionChange?.(['left-id', 'right-id', 'extra-id'])}
        >
          Select
        </button>
      </div>
    );
  });

  MockPlanogramTable.displayName = 'MockPlanogramTable';

  return MockPlanogramTable;
});

const getLatestSearchBarProps = () => mockSearchBarState?.latest;
const getLatestPlanogramTableProps = () => mockPlanogramTableState?.latest;

describe('DashboardContent', () => {
  const defaultHeaderState = {
    selectedRegion: 'Region A',
    selectedRetailer: 'Retailer B',
    category: 'Category C',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResetAllFilters.mockClear();
    if (mockSearchBarState) {
      mockSearchBarState.latest = undefined;
    }
    if (mockPlanogramTableState) {
      mockPlanogramTableState.latest = undefined;
    }
    useHeaderData.mockReturnValue(defaultHeaderState);
  });

  it('passes header data and props to child components', () => {
    const onSearchChange = jest.fn();

    render(
      <DashboardContent searchTerm="look-up" onSearchChange={onSearchChange} />
    );

    const searchBarProps = getLatestSearchBarProps();
    expect(searchBarProps.selectedRegion).toBe('Region A');
    expect(searchBarProps.selectedRetailer).toBe('Retailer B');
    expect(searchBarProps.category).toBe('Category C');
    expect(searchBarProps.onSearchChange).toBe(onSearchChange);

    const tableProps = getLatestPlanogramTableProps();
    expect(tableProps.searchTerm).toBe('look-up');
  });

  it('resets filters using the PlanogramTable ref when triggered by SearchBar', () => {
    render(<DashboardContent searchTerm="" onSearchChange={jest.fn()} />);

    fireEvent.click(screen.getByTestId('trigger-reset'));

    expect(mockResetAllFilters).toHaveBeenCalledTimes(1);
  });

  it('tracks filter/selection state and navigates when comparing two planograms', async () => {
    render(<DashboardContent searchTerm="" onSearchChange={jest.fn()} />);

    const initialProps = getLatestSearchBarProps();
    await act(async () => {
      initialProps.onCompare();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('trigger-filter-true'));

    await waitFor(() => {
      expect(getLatestSearchBarProps().hasActiveFilters).toBe(true);
    });

    fireEvent.click(screen.getByTestId('trigger-selection'));

    await waitFor(() => {
      expect(getLatestSearchBarProps().canCompare).toBe(true);
    });

    await act(async () => {
      getLatestSearchBarProps().onCompare();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/compare?left=left-id&right=right-id'
    );
  });
});

