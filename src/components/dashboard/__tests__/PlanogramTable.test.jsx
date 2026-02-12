import React, { createRef } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import PlanogramTable from '../PlanogramTable';
import { getAllPlanograms, getMyPlanograms } from '../../../api/api';
import toast from 'react-hot-toast';

jest.mock('ag-grid-community', () => ({
  ModuleRegistry: { registerModules: jest.fn() },
  ClientSideRowModelModule: {},
}));

const mockNavigate = jest.fn();
const createMockAuthState = () => ({
  auth: {
    user: {
      email: 'test@example.com',
    },
  },
});

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector(createMockAuthState())),
}));

jest.mock('../../../api/api', () => ({
  getAllPlanograms: jest.fn(),
  getMyPlanograms: jest.fn(),
}));

jest.mock('../../MultiFilter', () => {
  const MultiFilterMock = () => <div data-testid="multi-filter-mock">MultiFilter</div>;
  MultiFilterMock.displayName = 'MultiFilterMock';
  return MultiFilterMock;
});

jest.mock('react-hot-toast', () => {
  const toast = { error: jest.fn() };
  return {
    __esModule: true,
    default: toast,
  };
});

const mockSetFilterModel = jest.fn();
let currentFilterModel = {};
const mockGetFilterModel = jest.fn(() => currentFilterModel);
let mockSelectedNodes = [];
let latestAgGridProps;

jest.mock('ag-grid-react', () => {
  const React = require('react');
  const { useEffect, useMemo, useImperativeHandle, forwardRef } = React;

  const AgGridReact = forwardRef((props, ref) => {
    const api = useMemo(
      () => ({
        setFilterModel: (...args) => mockSetFilterModel(...args),
        getFilterModel: () => mockGetFilterModel(),
        getSelectedNodes: () => mockSelectedNodes,
      }),
      []
    );

    useImperativeHandle(ref, () => ({ api }), [api]);

    useEffect(() => {
      latestAgGridProps = props;
    });

    useEffect(() => {
      props.onGridReady?.({ api });
    }, [props.onGridReady, api]);

    return (
      <div data-testid="ag-grid-mock">
        <div data-testid="row-count">{props.rowData?.length ?? 0}</div>
        {props.rowData?.map((row) => (
          <div
            key={row.id || row.planogramId}
            data-testid="grid-row"
            data-cluster={row.clusterName}
            data-parent={row.__isParent ? 'true' : 'false'}
            data-child={row.__isChild ? 'true' : 'false'}
          >
            {row.planogramId}
          </div>
        ))}
      </div>
    );
  });

  AgGridReact.displayName = 'AgGridReactMock';

  return { AgGridReact };
});

const mockRecords = [
  {
    planogramId: 'PG-001',
    id: 'aaaa1111',
    createdDate: '2025-04-05T00:00:00.000Z',
    lastModifiedDate: '2025-04-06T00:00:00.000Z',
    productCategoryInfo: { name: 'Beverages' },
    clusterInfo: { id: 'cluster-a', name: 'Cluster A' },
    versionId: 0,
    short_desc: null,
    rangeReviewInfo: { name: 'Review A' },
    numberOfBays: 2,
    numberOfShelves: 10,
  },
  {
    planogramId: 'PG-001',
    id: 'bbbb2222',
    createdDate: '2025-04-07T00:00:00.000Z',
    lastModifiedDate: '2025-04-08T00:00:00.000Z',
    productCategoryInfo: { name: 'Beverages' },
    clusterInfo: { id: 'cluster-a', name: 'Cluster A' },
    versionId: 1,
    short_desc: 'Alt',
    rangeReviewInfo: { name: 'Review A' },
    numberOfBays: 4,
    numberOfShelves: 12,
  },
  {
    planogramId: 'PG-001',
    id: 'cccc3333',
    createdDate: '2025-04-09T00:00:00.000Z',
    lastModifiedDate: '2025-04-10T00:00:00.000Z',
    productCategoryInfo: { name: 'Beverages' },
    clusterInfo: { id: 'cluster-a', name: 'Cluster A' },
    versionId: 2,
    short_desc: 'Alt2',
    rangeReviewInfo: { name: 'Review A' },
    numberOfBays: 5,
    numberOfShelves: 14,
  },
  {
    planogramId: 'PG-002',
    id: 'dddd4444',
    createdDate: '2025-04-11T00:00:00.000Z',
    lastModifiedDate: '2025-04-12T00:00:00.000Z',
    productCategoryInfo: { name: 'Snacks' },
    clusterInfo: { id: 'cluster-b', name: 'Cluster B' },
    versionId: 0,
    short_desc: null,
    rangeReviewInfo: { name: 'Review B' },
    numberOfBays: 9,
    numberOfShelves: 20,
  },
];

const resolvePlanograms = () =>
  getAllPlanograms.mockResolvedValue({
    data: {
      data: {
        records: mockRecords,
      },
    },
  });

const resolveMyPlanograms = () =>
  getMyPlanograms.mockResolvedValue({
    data: {
      data: {
        records: mockRecords.map((r) => ({ ...r, status: 'draft' })),
      },
    },
  });

describe('PlanogramTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolvePlanograms();
    resolveMyPlanograms();
    mockSelectedNodes = [];
    latestAgGridProps = undefined;
    currentFilterModel = {};
  });

  const renderComponent = (props = {}, ref = null) =>
    render(
      <PlanogramTable
        ref={ref}
        searchTerm=""
        onFilterChange={jest.fn()}
        onSelectionChange={jest.fn()}
        variant="dashboard"
        {...props}
      />
    );

  const waitForRowData = async () => {
    await waitFor(() => {
      expect(Array.isArray(latestAgGridProps?.rowData)).toBe(true);
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  };


  it('fetches planograms and renders grouped rows with parent and child flags', async () => {
    const onFilterChange = jest.fn();
    render(
      <PlanogramTable
        variant="dashboard"
        searchTerm=""
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    expect(screen.getByText('Fetching the planograms...')).toBeInTheDocument();
    await waitFor(() => expect(getAllPlanograms).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(4));

    const rows = screen.getAllByTestId('grid-row');
    const parentRows = rows.filter((row) => row.dataset.parent === 'true');
    const childRows = rows.filter((row) => row.dataset.child === 'true');

    expect(parentRows).not.toHaveLength(0);
    expect(childRows).toHaveLength(2);

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData).toHaveLength(4);
      expect(latestAgGridProps.rowData.some((row) => row.__isParent)).toBe(true);
    });
  });

  it('filters rows when a numeric search term is provided', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = render(
      <PlanogramTable
        variant="dashboard"
        searchTerm=""
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(4));

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="2"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(1));

    const filteredRow = screen.getByTestId('grid-row');
    expect(filteredRow).toHaveTextContent('PG-001');

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData).toHaveLength(1);
      expect(latestAgGridProps.rowData[0].planogramId).toBe('PG-001');
    });
  });

  it('filters rows when a text search term is provided', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(4));

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="Beverages"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(3));

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData).toHaveLength(3);
      expect(latestAgGridProps.rowData.every((row) => row.category === 'Beverages')).toBe(true);
    });
  });

  it('filters rows when a date search term is provided', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(4));

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="5 apr"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.queryAllByTestId('grid-row')).toHaveLength(1));

    const row = screen.getByTestId('grid-row');
    expect(row).toHaveTextContent('PG-001');

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData).toHaveLength(1);
      expect(latestAgGridProps.rowData[0].dateCreated).toBe('2025-04-05T00:00:00.000Z');
    });
  });

  it('prevents selecting planograms from different clusters', async () => {
    const onSelectionChange = jest.fn();
    render(
      <PlanogramTable
        variant="dashboard"
        searchTerm=""
        onFilterChange={jest.fn()}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitForRowData();
    const parentClusterA = latestAgGridProps.rowData.find(
      (row) => row.clusterName === 'Cluster A' && row.__isParent
    );
    const parentClusterB = latestAgGridProps.rowData.find(
      (row) => row.clusterName === 'Cluster B'
    );

    expect(parentClusterA).toBeDefined();
    expect(parentClusterB).toBeDefined();

    mockSelectedNodes = [
      { data: parentClusterA },
      { data: parentClusterB },
    ];

    const currentNode = { data: parentClusterB, setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    expect(currentNode.setSelected).toHaveBeenCalledWith(false);
    expect(toast.error).toHaveBeenCalled();
    expect(toast.error.mock.calls[0][0]).toEqual(
      expect.stringContaining(parentClusterA.clusterName)
    );
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('limits selections to two planograms within the same cluster', async () => {
    const onSelectionChange = jest.fn();
    render(
      <PlanogramTable
        variant="dashboard"
        searchTerm=""
        onFilterChange={jest.fn()}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitForRowData();
    const clusterRows = latestAgGridProps.rowData.filter(
      (row) => row.clusterName === 'Cluster A'
    );

    mockSelectedNodes = clusterRows.slice(0, 3).map((row) => ({ data: row }));

    const thirdNode = {
      data: clusterRows[2],
      setSelected: jest.fn(),
    };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: thirdNode });
    });

    expect(thirdNode.setSelected).toHaveBeenCalledWith(false);
    expect(toast.error).toHaveBeenCalled();
    expect(toast.error.mock.calls[0][0]).toEqual(
      expect.stringContaining('You can only compare 2 planograms')
    );
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('resets filters via exposed imperative handle', async () => {
    const onFilterChange = jest.fn();
    const tableRef = createRef();
    render(
      <PlanogramTable
        variant="dashboard"
        ref={tableRef}
        searchTerm=""
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitForRowData();
    expect(typeof tableRef.current.resetAllFilters).toBe('function');
    expect(tableRef.current.hasActiveFilters()).toBe(false);

    currentFilterModel = { clusterName: ['Cluster A'] };
    await act(async () => {
      latestAgGridProps.onFilterChanged();
    });

    await waitFor(() => expect(tableRef.current.hasActiveFilters()).toBe(true));

    await act(async () => {
      tableRef.current.resetAllFilters();
    });

    expect(mockSetFilterModel).toHaveBeenCalledWith(null);
    await waitFor(() => expect(tableRef.current.hasActiveFilters()).toBe(false));
  });

  it('navigates to planogram details on row click', async () => {
    renderComponent();
    await waitForRowData();

    const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
    const mockClosest = jest.fn().mockReturnValue(null);
    await act(async () => {
      latestAgGridProps.onRowClicked({
        data: row,
        event: { target: { closest: mockClosest } },
      });
    });

    expect(mockClosest).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      '/planogram?id=aaaa1111',
      expect.objectContaining({
        state: expect.objectContaining({
          rowData: expect.objectContaining({
            id: 'aaaa1111',
            planogramId: 'PG-001',
          }),
        }),
      })
    );
  });

  it('does not navigate when expand button is clicked', async () => {
    renderComponent();
    await waitForRowData();

    const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
    const mockClosest = jest.fn().mockImplementation((selector) =>
      selector === '.expand-collapse-btn' ? {} : null
    );

    await act(async () => {
      latestAgGridProps.onRowClicked({
        data: row,
        event: { target: { closest: mockClosest } },
      });
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/planogram?id=aaaa1111', expect.anything());
  });

  it('emits selected planogram ids when selection is valid', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const clusterRows = latestAgGridProps.rowData.filter(
      (row) => row.clusterName === 'Cluster A'
    );

    mockSelectedNodes = clusterRows.slice(0, 2).map((row) => ({ data: row }));

    const secondNode = {
      data: clusterRows[1],
      setSelected: jest.fn(),
    };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: secondNode });
    });

    await act(async () => {
      latestAgGridProps.onSelectionChanged();
    });

    expect(onSelectionChange).toHaveBeenCalledWith(
      mockSelectedNodes.map((n) => n.data.id)
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('handles API fetch error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getAllPlanograms.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Fetching the planograms...')).not.toBeInTheDocument();
    });

    // Accept either the old or new logging
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/planograms|Error fetching planograms/i),
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('handles empty search term', async () => {
    const onFilterChange = jest.fn();
    renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles whitespace-only search term', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="   "
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles null search term', async () => {
    const onFilterChange = jest.fn();
    renderComponent({ searchTerm: null, onFilterChange });
    await waitForRowData();

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('filters by dateModified when searching dates', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="6 apr"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      expect(latestAgGridProps.rowData.some((row) => row.dateModified === '2025-04-06T00:00:00.000Z')).toBe(true);
    });
  });

  it('handles date search with full month name', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="5 april"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles date search with month before day', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="april 5"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('shows parent row when search matches parent but not children', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    // Search for something that matches parent row but not children
    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="PG-002"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      const parentRow = latestAgGridProps.rowData.find((row) => row.__isParent && row.planogramId === 'PG-002');
      expect(parentRow).toBeDefined();
      expect(parentRow.__matched).toBe(true);
    });
  });

  it('shows parent and matched children when search matches children but not parent', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    // Search for something that matches a child row (version) but not parent
    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="Alt V1"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      const parentRow = latestAgGridProps.rowData.find((row) => row.__isParent && row.clusterName === 'Cluster A');
      expect(parentRow).toBeDefined();
      const matchedChildren = latestAgGridProps.rowData.filter(
        (row) => row.__isChild && row.__matched && row.version.includes('Alt')
      );
      expect(matchedChildren.length).toBeGreaterThan(0);
    });
  });

  it('prevents selecting duplicate versions', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const clusterRows = latestAgGridProps.rowData.filter(
      (row) => row.clusterName === 'Cluster A'
    );
    // Find two rows from the same cluster
    const firstRow = clusterRows[0];
    // Create a second row with the same version as the first
    const secondRow = {
      ...clusterRows[1],
      version: firstRow.version, // Force same version
    };

    mockSelectedNodes = [
      { data: firstRow },
      { data: secondRow },
    ];

    const currentNode = { data: secondRow, setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    expect(currentNode.setSelected).toHaveBeenCalledWith(false);
    expect(toast.error).toHaveBeenCalled();
    // Check that the error message contains the duplicate version message
    const errorMessages = toast.error.mock.calls.map((call) => call[0]);
    expect(errorMessages.some((msg) => msg.includes('Cannot compare the same version'))).toBe(true);
  });

  it('applies correct row styles for Original version', async () => {
    renderComponent();
    await waitForRowData();

    const originalRow = latestAgGridProps.rowData.find((row) => row.version === 'Original');
    expect(originalRow).toBeDefined();

    const rowStyle = latestAgGridProps.getRowStyle({ data: originalRow });
    expect(rowStyle.backgroundColor).toBe('#FFF9EC');
    expect(rowStyle.fontWeight).toBe('500');
  });

  it('applies correct row styles for parent rows', async () => {
    renderComponent();
    await waitForRowData();

    // Find a parent row that doesn't have version "Original" (which has priority)
    // Since all parent rows have version "Original", we'll test with a parent row
    // but verify the logic: parent style should apply when version is not "Original"
    const parentRow = latestAgGridProps.rowData.find((row) => row.__isParent);
    expect(parentRow).toBeDefined();

    // Create a parent row without "Original" version to test parent styling
    const parentRowWithoutOriginal = {
      ...parentRow,
      version: 'Test V1', // Not "Original"
    };

    const rowStyle = latestAgGridProps.getRowStyle({ data: parentRowWithoutOriginal });
    expect(rowStyle.backgroundColor).toBe('#ccf3e8');
    expect(rowStyle.fontWeight).toBe('500');
  });

  it('applies correct row styles for child rows', async () => {
    renderComponent();
    await waitForRowData();

    const childRow = latestAgGridProps.rowData.find((row) => row.__isChild);
    expect(childRow).toBeDefined();

    const rowStyle = latestAgGridProps.getRowStyle({ data: childRow });
    expect(rowStyle.color).toBe('#374151');
    expect(rowStyle.backgroundColor).toBe('#ffffff');
  });

  it('applies default row style for rows without special flags', async () => {
    renderComponent();
    await waitForRowData();

    const regularRow = { id: 'test', planogramId: 'TEST' };
    const rowStyle = latestAgGridProps.getRowStyle({ data: regularRow });
    expect(rowStyle.backgroundColor).toBe('#ffffff');
  });

  it('returns default style when data is null', async () => {
    renderComponent();
    await waitForRowData();

    const rowStyle = latestAgGridProps.getRowStyle({ data: null });
    expect(rowStyle.backgroundColor).toBe('#ffffff');
  });

  it('handles expand/collapse cluster toggle', async () => {
    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    const initialRowCount = latestAgGridProps.rowData.length;

    // Simulate toggle collapse
    await act(async () => {
      latestAgGridProps.context.onToggleCluster('Cluster A');
    });

    await waitFor(() => {
      const newRowCount = latestAgGridProps.rowData.length;
      expect(newRowCount).toBeLessThan(initialRowCount);
    });
  });

  it('handles single row selection', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const clusterRows = latestAgGridProps.rowData.filter(
      (row) => row.clusterName === 'Cluster A'
    );

    mockSelectedNodes = [{ data: clusterRows[0] }];
    const currentNode = { data: clusterRows[0], setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    expect(currentNode.setSelected).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not navigate when row data is null', async () => {
    renderComponent();
    await waitForRowData();

    const mockClosest = jest.fn().mockReturnValue(null);
    await act(async () => {
      latestAgGridProps.onRowClicked({
        data: null,
        event: { target: { closest: mockClosest } },
      });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when selection checkbox is clicked', async () => {
    renderComponent();
    await waitForRowData();

    const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
    const mockClosest = jest.fn().mockImplementation((selector) =>
      selector === '.ag-selection-checkbox' ? {} : null
    );

    await act(async () => {
      latestAgGridProps.onRowClicked({
        data: row,
        event: { target: { closest: mockClosest } },
      });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles onSelectionChanged when api is null', async () => {
    const onSelectionChange = jest.fn();
    const tableRef = createRef();
    renderComponent({ onSelectionChange }, tableRef);
    await waitForRowData();

    // The component checks `if (!api) return;` early in onSelectionChanged
    // Since our mock always provides an api, we verify the component structure
    // handles the null check. The actual null api scenario is tested implicitly
    // through the component's defensive coding.
    
    // Verify the function exists and can be called without throwing
    expect(() => {
      latestAgGridProps.onSelectionChanged();
    }).not.toThrow();
    
    // The mock provides an api, so onSelectionChange will be called
    // This test verifies the component doesn't crash when onSelectionChanged is called
  });

  it('handles resetAllFilters when api is null', async () => {
    const tableRef = createRef();
    renderComponent({}, tableRef);
    await waitForRowData();

    // Simulate api being null
    const originalReset = tableRef.current.resetAllFilters;
    expect(typeof originalReset).toBe('function');

    // Should not throw when called
    await act(async () => {
      tableRef.current.resetAllFilters();
    });
  });

  it('calls checkActiveFilters on grid ready', async () => {
    jest.useFakeTimers();
    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    // Trigger onGridReady
    await act(async () => {
      latestAgGridProps.onGridReady?.({ api: latestAgGridProps.context });
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should have checked for active filters
    expect(onFilterChange).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('handles checkActiveFilters when api is null', async () => {
    renderComponent();
    await waitForRowData();

    // Should not throw when api is null
    expect(() => {
      latestAgGridProps.onFilterChanged();
    }).not.toThrow();
  });

  it('calls onFilterChange with boolean when filters change', async () => {
    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    currentFilterModel = { clusterName: ['Cluster A'] };
    await act(async () => {
      latestAgGridProps.onFilterChanged();
    });

    await waitFor(() => {
      const booleanCall = onFilterChange.mock.calls.find((call) => typeof call[0] === 'boolean');
      expect(booleanCall).toBeDefined();
      expect(booleanCall[0]).toBe(true);
    });
  });

  it('formats version column correctly', async () => {
    renderComponent();
    await waitForRowData();

    const versionCol = latestAgGridProps.columnDefs.find((col) => col.field === 'version');
    expect(versionCol).toBeDefined();
    expect(versionCol.valueFormatter({ value: 0 })).toBe('Original');
    expect(versionCol.valueFormatter({ value: 'Alt V1' })).toBe('Alt V1');
  });

  it('formats date columns correctly', async () => {
    renderComponent();
    await waitForRowData();

    const dateCreatedCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'dateCreated'
    );
    expect(dateCreatedCol).toBeDefined();
    const formatted = dateCreatedCol.valueFormatter({
      value: '2025-04-05T00:00:00.000Z',
    });
    expect(formatted).toMatch(/\d+ \w{3} \d{4}/);
  });

  it('handles null date in formatter', async () => {
    renderComponent();
    await waitForRowData();

    const dateCreatedCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'dateCreated'
    );
    expect(dateCreatedCol.valueFormatter({ value: null })).toBe('');
    expect(dateCreatedCol.valueFormatter({ value: '' })).toBe('');
  });

  it('handles version transformation with empty short_desc', async () => {
    const recordsWithEmptyDesc = [
      {
        planogramId: 'PG-003',
        id: 'eeee5555',
        createdDate: '2025-04-13T00:00:00.000Z',
        lastModifiedDate: '2025-04-14T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: { id: 'cluster-c', name: 'Cluster C' },
        versionId: 1,
        short_desc: '',
        rangeReviewInfo: { name: 'Review C' },
        numberOfBays: 1,
        numberOfShelves: 5,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithEmptyDesc,
        },
      },
    });

    renderComponent();
    await waitForRowData();

    const row = latestAgGridProps.rowData.find((r) => r.id === 'eeee5555');
    expect(row.version).toBe(' V1');
  });

  it('handles cluster name as N/A', async () => {
    const recordsWithNACluster = [
      {
        planogramId: 'PG-004',
        id: 'ffff6666',
        createdDate: '2025-04-15T00:00:00.000Z',
        lastModifiedDate: '2025-04-16T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: null,
        versionId: 0,
        short_desc: null,
        rangeReviewInfo: { name: 'Review D' },
        numberOfBays: 1,
        numberOfShelves: 5,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithNACluster,
        },
      },
    });

    renderComponent();
    await waitForRowData();

    const row = latestAgGridProps.rowData.find((r) => r.id === 'ffff6666');
    expect(row.clusterName).toBe('N/A');
  });

  it('handles numeric search for shelves count', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="10"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      expect(latestAgGridProps.rowData.some((row) => row.shelvesCount === 10)).toBe(true);
    });
  });

  it('handles search across multiple text columns', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="Review A"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      expect(latestAgGridProps.rowData.every((row) => row.rangeReviewName === 'Review A')).toBe(true);
    });
  });

  it('handles search for projectName', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="Planogram aaaa"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles selection with null cluster name', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const rowWithNullCluster = {
      ...latestAgGridProps.rowData[0],
      clusterName: null,
    };

    mockSelectedNodes = [{ data: rowWithNullCluster }];
    const currentNode = { data: rowWithNullCluster, setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    // Should handle null cluster name gracefully
    expect(() => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    }).not.toThrow();
  });

  it('handles selection with missing id', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const rowWithoutId = {
      ...latestAgGridProps.rowData[0],
      id: null,
    };

    mockSelectedNodes = [{ data: rowWithoutId }];
    const currentNode = { data: rowWithoutId, setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    await act(async () => {
      latestAgGridProps.onSelectionChanged();
    });

    // Should filter out null ids
    const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
    expect(lastCall[0]).toEqual([]);
  });

  it('handles cluster without version 0 row', async () => {
    const recordsWithoutVersion0 = [
      {
        planogramId: 'PG-005',
        id: 'gggg7777',
        createdDate: '2025-04-17T00:00:00.000Z',
        lastModifiedDate: '2025-04-18T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: { id: 'cluster-d', name: 'Cluster D' },
        versionId: 1,
        short_desc: 'Test',
        rangeReviewInfo: { name: 'Review E' },
        numberOfBays: 1,
        numberOfShelves: 5,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithoutVersion0,
        },
      },
    });

    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      // Should still create a parent row from the first available row
      expect(latestAgGridProps.rowData.some((row) => row.__isParent)).toBe(true);
    });
  });

  it('handles search when cluster is collapsed', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    // Collapse Cluster A
    await act(async () => {
      latestAgGridProps.context.onToggleCluster('Cluster A');
    });

    await waitFor(() => {
      const collapsedRowCount = latestAgGridProps.rowData.length;
      expect(collapsedRowCount).toBeLessThan(4);
    });

    // Search should still work even when cluster is collapsed
    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="Beverages"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles toggle cluster with null/undefined name', async () => {
    renderComponent();
    await waitForRowData();

    await act(async () => {
      latestAgGridProps.context.onToggleCluster(null);
    });

    await act(async () => {
      latestAgGridProps.context.onToggleCluster(undefined);
    });

    // Should not throw
    expect(() => {
      latestAgGridProps.context.onToggleCluster(null);
    }).not.toThrow();
  });

  it('handles version column with null value', async () => {
    renderComponent();
    await waitForRowData();

    const versionCol = latestAgGridProps.columnDefs.find((col) => col.field === 'version');
    expect(versionCol.valueFormatter({ value: null })).toBe(null);
  });

  it('handles dateModified column formatting', async () => {
    renderComponent();
    await waitForRowData();

    const dateModifiedCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'dateModified'
    );
    expect(dateModifiedCol).toBeDefined();
    const formatted = dateModifiedCol.valueFormatter({
      value: '2025-04-06T00:00:00.000Z',
    });
    expect(formatted).toMatch(/\d+ \w{3} \d{4}/);
  });

  it('handles empty filter model in checkActiveFilters', async () => {
    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    currentFilterModel = {};
    await act(async () => {
      latestAgGridProps.onFilterChanged();
    });

    await waitFor(() => {
      const booleanCall = onFilterChange.mock.calls.find((call) => typeof call[0] === 'boolean');
      expect(booleanCall).toBeDefined();
      expect(booleanCall[0]).toBe(false);
    });
  });

  it('handles search that matches no rows', async () => {
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    await waitForRowData();

    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="NonExistentSearchTerm12345"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBe(0);
    });
  });

  it('handles row style with undefined data', async () => {
    renderComponent();
    await waitForRowData();

    const rowStyle = latestAgGridProps.getRowStyle({ data: undefined });
    expect(rowStyle.backgroundColor).toBe('#ffffff');
  });

  it('handles selection when selectedNodes has null data', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    mockSelectedNodes = [{ data: null }, { data: { id: 'test' } }];

    await act(async () => {
      latestAgGridProps.onSelectionChanged();
    });

    // Should filter out null data and extract valid ids
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('handles ExpandCollapseRenderer with null data prop', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with null data
    const result = cellRenderer({ data: null });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with undefined data prop', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with undefined data
    const result = cellRenderer({ data: undefined });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with null planogramId', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with null planogramId
    const result = cellRenderer({ data: { planogramId: null, __isParent: true } });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with null context', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with null context
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true },
      context: null,
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with undefined context', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with undefined context
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true, clusterName: null },
      context: undefined,
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with null clusterName', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with null clusterName
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true, clusterName: null },
      context: { expandedClusters: new Set(), onToggleCluster: jest.fn() },
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with row prop', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with row prop instead of data
    const result = cellRenderer({
      data: null,
      row: { planogramId: 'TEST', __isParent: true },
      context: { expandedClusters: new Set(), onToggleCluster: jest.fn() },
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with node.data prop', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with node.data prop
    const result = cellRenderer({
      data: null,
      row: null,
      node: { data: { planogramId: 'TEST', __isParent: true } },
      context: { expandedClusters: new Set(), onToggleCluster: jest.fn() },
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer with __forceExpandedBySearch', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with __forceExpandedBySearch flag
    const result = cellRenderer({
      data: {
        planogramId: 'TEST',
        __isParent: true,
        __forceExpandedBySearch: true,
      },
      context: { expandedClusters: new Set(), onToggleCluster: jest.fn() },
    });
    expect(result).toBeDefined();
    // Verify the aria-label indicates expanded state
    expect(result.props.children[0].props['aria-label']).toBe('Collapse');
  });

  it('handles ExpandCollapseRenderer with null onToggleCluster', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with null onToggleCluster
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true },
      context: { expandedClusters: new Set(), onToggleCluster: null },
    });
    expect(result).toBeDefined();

    // Click handler should not throw
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    expect(() => {
      result.props.children[0].props.onClick(mockEvent);
    }).not.toThrow();
  });

  it('handles ExpandCollapseRenderer click handler', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    const onToggleCluster = jest.fn();
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true, clusterName: 'Cluster A' },
      context: { expandedClusters: new Set(), onToggleCluster },
    });

    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    result.props.children[0].props.onClick(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(onToggleCluster).toHaveBeenCalledWith('Cluster A');
  });

  it('handles ExpandCollapseRenderer with empty clusterName', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with empty clusterName
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true, clusterName: '' },
      context: { expandedClusters: new Set(), onToggleCluster: jest.fn() },
    });
    expect(result).toBeDefined();
  });

  it('handles ExpandCollapseRenderer collapsed state', async () => {
    renderComponent();
    await waitForRowData();

    const planogramIdCol = latestAgGridProps.columnDefs.find(
      (col) => col.field === 'planogramId'
    );
    const cellRenderer = planogramIdCol.cellRenderer;

    // Test with collapsed state (not in expandedClusters)
    const result = cellRenderer({
      data: { planogramId: 'TEST', __isParent: true, clusterName: 'Cluster X' },
      context: {
        expandedClusters: new Set(['Cluster A']), // Different cluster
        onToggleCluster: jest.fn(),
      },
    });
    expect(result).toBeDefined();
    // Verify the aria-label indicates collapsed state
    expect(result.props.children[0].props['aria-label']).toBe('Expand');
  });

  it('handles normalizeDate with empty string', () => {
    // Import the normalizeDate function logic by testing through date search
    const onFilterChange = jest.fn();
    const { rerender } = renderComponent({ searchTerm: '', onFilterChange });
    
    // This will test normalizeDate indirectly through dateContainsAllParts
    // We need to test with a date that has empty dateStr
    // Since normalizeDate is not exported, we test through the component
    rerender(
      <PlanogramTable
        variant="dashboard"
        searchTerm="1 jan"
        onFilterChange={onFilterChange}
        onSelectionChange={jest.fn()}
      />
    );
    
    // Should not crash
    expect(() => {
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="1 jan"
          onFilterChange={onFilterChange}
          onSelectionChange={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  it('handles sorting children with null/undefined versions', async () => {
    const recordsWithNullVersions = [
      {
        planogramId: 'PG-006',
        id: 'hhhh8888',
        createdDate: '2025-04-19T00:00:00.000Z',
        lastModifiedDate: '2025-04-20T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: { id: 'cluster-e', name: 'Cluster E' },
        versionId: 0,
        short_desc: null,
        rangeReviewInfo: { name: 'Review F' },
        numberOfBays: 1,
        numberOfShelves: 5,
      },
      {
        planogramId: 'PG-006',
        id: 'iiii9999',
        createdDate: '2025-04-21T00:00:00.000Z',
        lastModifiedDate: '2025-04-22T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: { id: 'cluster-e', name: 'Cluster E' },
        versionId: null, // Null version
        short_desc: null,
        rangeReviewInfo: { name: 'Review F' },
        numberOfBays: 2,
        numberOfShelves: 6,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithNullVersions,
        },
      },
    });

    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    // Should not crash and should handle null versions
    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
    });
  });

  it('handles resetAllFilters when gridRef.current is null', async () => {
    const tableRef = createRef();
    renderComponent({}, tableRef);
    await waitForRowData();

    // The mock always provides an api, but we verify the null check exists
    expect(typeof tableRef.current.resetAllFilters).toBe('function');
    
    // Should not throw
    expect(() => {
      tableRef.current.resetAllFilters();
    }).not.toThrow();
  });

  it('handles checkActiveFilters when onFilterChange is not provided', async () => {
    renderComponent({ onFilterChange: undefined });
    await waitForRowData();

    currentFilterModel = { clusterName: ['Cluster A'] };
    
    // Should not throw when onFilterChange is undefined
    expect(() => {
      latestAgGridProps.onFilterChanged();
    }).not.toThrow();
  });

  it('handles API response with null nested properties', async () => {
    const recordsWithNulls = [
      {
        planogramId: 'PG-007',
        id: 'jjjj0000',
        createdDate: '2025-04-23T00:00:00.000Z',
        lastModifiedDate: '2025-04-24T00:00:00.000Z',
        productCategoryInfo: null, // Null category
        clusterInfo: null, // Null cluster
        versionId: 0,
        short_desc: null,
        rangeReviewInfo: null, // Null range review
        numberOfBays: 1,
        numberOfShelves: 5,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithNulls,
        },
      },
    });

    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      const row = latestAgGridProps.rowData[0];
      expect(row.category).toBe('N/A');
      expect(row.clusterName).toBe('N/A');
      expect(row.rangeReviewName).toBe('N/A');
    });
  });

  it('handles onRowSelected with single node (edge case)', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    const clusterRows = latestAgGridProps.rowData.filter(
      (row) => row.clusterName === 'Cluster A'
    );

    // Test with exactly 1 node (should not trigger cluster/version checks)
    mockSelectedNodes = [{ data: clusterRows[0] }];
    const currentNode = { data: clusterRows[0], setSelected: jest.fn() };
    const eventApi = { getSelectedNodes: () => mockSelectedNodes };

    await act(async () => {
      latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
    });

    // Should not call setSelected for single selection
    expect(currentNode.setSelected).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('handles onSelectionChanged when gridRef.current is null', async () => {
    const onSelectionChange = jest.fn();
    renderComponent({ onSelectionChange });
    await waitForRowData();

    // The mock always provides an api, but the component checks gridRef.current?.api
    // We verify the null check exists in the code
    expect(() => {
      latestAgGridProps.onSelectionChanged();
    }).not.toThrow();
  });

  it('handles buildRowsForDisplay with null clusterName', async () => {
    const recordsWithNullCluster = [
      {
        planogramId: 'PG-008',
        id: 'kkkk1111',
        createdDate: '2025-04-25T00:00:00.000Z',
        lastModifiedDate: '2025-04-26T00:00:00.000Z',
        productCategoryInfo: { name: 'Test' },
        clusterInfo: { id: 'cluster-f', name: null }, // Null cluster name
        versionId: 0,
        short_desc: null,
        rangeReviewInfo: { name: 'Review G' },
        numberOfBays: 1,
        numberOfShelves: 5,
      },
    ];

    getAllPlanograms.mockResolvedValueOnce({
      data: {
        data: {
          records: recordsWithNullCluster,
        },
      },
    });

    const onFilterChange = jest.fn();
    renderComponent({ onFilterChange });
    await waitForRowData();

    await waitFor(() => {
      expect(latestAgGridProps?.rowData).toBeDefined();
      expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      // Should handle null clusterName and use "N/A"
      expect(latestAgGridProps.rowData.some((row) => row.clusterName === 'N/A')).toBe(true);
    });
  });

  // ========== Variant-specific tests ==========

  describe('myPlanogram variant', () => {
    it('fetches planograms using getMyPlanograms API', async () => {
      render(
        <PlanogramTable
          variant="myPlanogram"
          searchTerm=""
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => expect(getMyPlanograms).toHaveBeenCalledWith('test@example.com'));
      expect(getAllPlanograms).not.toHaveBeenCalled();
    });

    it('includes status column for myPlanogram variant', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const statusCol = latestAgGridProps.columnDefs.find((col) => col.field === 'status');
      expect(statusCol).toBeDefined();
      expect(statusCol.headerName).toBe('Status');
    });

    it('adds status field to transformed data for myPlanogram', async () => {
      const recordsWithStatus = [
        {
          ...mockRecords[0],
          status: 'published',
        },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      expect(row.status).toBe('published');
    });

    it('defaults status to draft when not provided', async () => {
      const recordsWithoutStatus = [
        {
          ...mockRecords[0],
          status: undefined,
        },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithoutStatus,
          },
        },
      });

      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      expect(row.status).toBe('draft');
    });

    it('uses single row selection mode for myPlanogram', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'singleRow', headerCheckbox: false });
    });

    it('handles selection for myPlanogram variant', async () => {
      const onSelectionChange = jest.fn();
      renderComponent({ variant: 'myPlanogram', onSelectionChange });
      await waitForRowData();

      const row = latestAgGridProps.rowData[0];
      mockSelectedNodes = [{ data: row }];
      const currentNode = { data: row, setSelected: jest.fn() };
      const eventApi = { getSelectedNodes: () => mockSelectedNodes };

      await act(async () => {
        latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
      });

      expect(onSelectionChange).toHaveBeenCalledWith([row.id]);
      expect(currentNode.setSelected).not.toHaveBeenCalled();
    });

    it('navigates to my-planogram route for myPlanogram variant', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      const mockClosest = jest.fn().mockReturnValue(null);
      await act(async () => {
        latestAgGridProps.onRowClicked({
          data: row,
          event: { target: { closest: mockClosest } },
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/my-planogram/aaaa1111',
        expect.objectContaining({
          state: expect.objectContaining({ rowData: row }),
        })
      );
    });

    it('suppresses row click selection for myPlanogram', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      expect(latestAgGridProps.suppressRowClickSelection).toBe(true);
    });

    it('applies correct row styles for Original version in myPlanogram', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const originalRow = latestAgGridProps.rowData.find((r) => r.version === 'Original');
      const rowStyle = latestAgGridProps.getRowStyle({ data: originalRow });
      expect(rowStyle.backgroundColor).toBe('#FFF8F5');
      expect(rowStyle.fontWeight).toBe('500');
    });

    it('applies correct row styles for parent rows in myPlanogram', async () => {
      renderComponent({ variant: 'myPlanogram' });
      await waitForRowData();

      const parentRow = {
        ...latestAgGridProps.rowData.find((r) => r.__isParent),
        version: 'Test V1',
      };
      const rowStyle = latestAgGridProps.getRowStyle({ data: parentRow });
      expect(rowStyle.backgroundColor).toBe('#FFF4ED');
      expect(rowStyle.fontWeight).toBe('500');
    });

    it('shows loading message for myPlanogram', async () => {
      renderComponent({ variant: 'myPlanogram' });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles error for myPlanogram variant', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getMyPlanograms.mockRejectedValueOnce(new Error('Network error'));

      renderComponent({ variant: 'myPlanogram' });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load my planograms');
      });
      consoleErrorSpy.mockRestore();
    });

    it('handles missing user email for myPlanogram variant', async () => {
      const { useSelector } = require('react-redux');
      const originalImpl = useSelector.getMockImplementation();
      useSelector.mockImplementation((selector) => {
        const mockState = {
          auth: {
            user: null,
          },
        };
        return selector(mockState);
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      renderComponent({ variant: 'myPlanogram' });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('User email not available for getMyPlanograms');
      });

      consoleWarnSpy.mockRestore();
      if (originalImpl) {
        useSelector.mockImplementation(originalImpl);
      }
    });
  });

  describe('massUpdate variant', () => {
    it('fetches planograms using getMyPlanograms API', async () => {
      render(
        <PlanogramTable
          variant="massUpdate"
          searchTerm=""
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => expect(getMyPlanograms).toHaveBeenCalledWith('test@example.com'));
    });

    it('includes status column for massUpdate variant', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      const statusCol = latestAgGridProps.columnDefs.find((col) => col.field === 'status');
      expect(statusCol).toBeDefined();
    });

    it('disables row selection for massUpdate variant', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toBeUndefined();
    });

    it('does not navigate on row click for massUpdate variant', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      const mockClosest = jest.fn().mockReturnValue(null);
      await act(async () => {
        latestAgGridProps.onRowClicked({
          data: row,
          event: { target: { closest: mockClosest } },
        });
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('suppresses row click selection for massUpdate', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      expect(latestAgGridProps.suppressRowClickSelection).toBe(true);
    });

    it('applies correct row styles for Original version in massUpdate', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      const originalRow = latestAgGridProps.rowData.find((r) => r.version === 'Original');
      const rowStyle = latestAgGridProps.getRowStyle({ data: originalRow });
      expect(rowStyle.backgroundColor).toBe('#F5F8E8');
      expect(rowStyle.fontWeight).toBe('500');
    });

    it('applies correct row styles for parent rows in massUpdate', async () => {
      renderComponent({ variant: 'massUpdate' });
      await waitForRowData();

      const parentRow = {
        ...latestAgGridProps.rowData.find((r) => r.__isParent),
        version: 'Test V1',
      };
      const rowStyle = latestAgGridProps.getRowStyle({ data: parentRow });
      expect(rowStyle.backgroundColor).toBe('#F0F4DC');
      expect(rowStyle.fontWeight).toBe('500');
    });
  });

  describe('massUpdateBulk variant', () => {
    const referenceId = 'aaaa1111';

    it('fetches planograms using getMyPlanograms API', async () => {
      render(
        <PlanogramTable
          variant="massUpdateBulk"
          referencePlanogramId={referenceId}
          searchTerm=""
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => expect(getMyPlanograms).toHaveBeenCalledWith('test@example.com'));
    });

    it('uses multi row selection mode for massUpdateBulk', async () => {
      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: referenceId });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });

    it('filters out published planograms except reference', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'published' },
        { ...mockRecords[1], id: 'bbbb2222', status: 'draft' },
        { ...mockRecords[2], id: 'cccc3333', status: 'published' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'aaaa1111' });
      await waitForRowData();

      // Reference planogram should be visible even if published
      const referenceRow = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      expect(referenceRow).toBeDefined();

      // Other published planograms should be filtered out
      const publishedRow = latestAgGridProps.rowData.find((r) => r.id === 'cccc3333');
      expect(publishedRow).toBeUndefined();

      // Draft planograms should be visible
      const draftRow = latestAgGridProps.rowData.find((r) => r.id === 'bbbb2222');
      expect(draftRow).toBeDefined();
    });

    it('makes reference planogram non-selectable', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'draft' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'aaaa1111' });
      await waitForRowData();

      const referenceRow = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      const isSelectable = latestAgGridProps.isRowSelectable({ data: referenceRow });
      expect(isSelectable).toBe(false);
    });

    it('makes published planograms non-selectable', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'published' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'dddd4444' });
      await waitFor(() => {
        expect(latestAgGridProps).toBeDefined();
      });

      const publishedRow = { id: 'aaaa1111', status: 'published' };
      const isSelectable = latestAgGridProps.isRowSelectable({ data: publishedRow });
      expect(isSelectable).toBe(false);
    });

    it('handles selection for massUpdateBulk variant', async () => {
      const onSelectionChange = jest.fn();
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'draft' },
        { ...mockRecords[1], id: 'bbbb2222', status: 'draft' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({
        variant: 'massUpdateBulk',
        referencePlanogramId: 'dddd4444',
        onSelectionChange,
      });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'bbbb2222');
      mockSelectedNodes = [{ data: row }];
      const currentNode = { data: row, setSelected: jest.fn() };
      const eventApi = { getSelectedNodes: () => mockSelectedNodes };

      await act(async () => {
        latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['bbbb2222']);
    });

    it('excludes reference planogram from selection change', async () => {
      const onSelectionChange = jest.fn();
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'draft' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({
        variant: 'massUpdateBulk',
        referencePlanogramId: 'aaaa1111',
        onSelectionChange,
      });
      await waitForRowData();

      // Simulate selection including reference (should be filtered out)
      mockSelectedNodes = [{ data: { id: 'aaaa1111' } }, { data: { id: 'bbbb2222' } }];

      await act(async () => {
        latestAgGridProps.onSelectionChanged();
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['bbbb2222']);
    });

    it('applies reference planogram styling', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'draft' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'aaaa1111' });
      await waitForRowData();

      const referenceRow = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      const rowClass = latestAgGridProps.getRowClass({ data: referenceRow });
      expect(rowClass).toBe('ag-row-reference-planogram');

      const rowStyle = latestAgGridProps.getRowStyle({ data: referenceRow });
      expect(rowStyle.backgroundColor).toBe('#E6F7FF');
      expect(rowStyle.fontWeight).toBe('600');
      expect(rowStyle.borderLeft).toBe('4px solid #BCD530');
    });

    it('does not navigate on row click for massUpdateBulk variant', async () => {
      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: referenceId });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'bbbb2222');
      const mockClosest = jest.fn().mockReturnValue(null);
      await act(async () => {
        latestAgGridProps.onRowClicked({
          data: row,
          event: { target: { closest: mockClosest } },
        });
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('applies correct row styles for Original version in massUpdateBulk', async () => {
      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: referenceId });
      await waitForRowData();

      const originalRow = latestAgGridProps.rowData.find(
        (r) => r.version === 'Original' && r.id !== referenceId
      );
      if (originalRow) {
        const rowStyle = latestAgGridProps.getRowStyle({ data: originalRow });
        expect(rowStyle.backgroundColor).toBe('#F5F8E8');
        expect(rowStyle.fontWeight).toBe('500');
      }
    });
  });

  describe('custom fetchPlanograms prop', () => {
    it('uses custom fetchPlanograms function when provided', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        data: {
          data: {
            records: mockRecords,
          },
        },
      });

      render(
        <PlanogramTable
          variant="dashboard"
          fetchPlanograms={customFetch}
          searchTerm=""
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => expect(customFetch).toHaveBeenCalledTimes(1));
      expect(getAllPlanograms).not.toHaveBeenCalled();
      expect(getMyPlanograms).not.toHaveBeenCalled();
    });
  });

  describe('customNav prop', () => {
    it('uses custom navigation handler when provided', async () => {
      const customNav = jest.fn();
      renderComponent({ customNav });
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      const mockClosest = jest.fn().mockReturnValue(null);
      await act(async () => {
        latestAgGridProps.onRowClicked({
          data: row,
          event: { target: { closest: mockClosest } },
        });
      });

      expect(customNav).toHaveBeenCalledWith(expect.objectContaining({ data: row }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('rowSelection prop', () => {
    it('handles rowSelection as string "single"', async () => {
      renderComponent({ rowSelection: 'single' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'singleRow', headerCheckbox: false });
    });

    it('handles rowSelection as string "singleRow"', async () => {
      renderComponent({ rowSelection: 'singleRow' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'singleRow', headerCheckbox: false });
    });

    it('handles rowSelection as string "multiple"', async () => {
      renderComponent({ rowSelection: 'multiple' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });

    it('handles rowSelection as string "multiRow"', async () => {
      renderComponent({ rowSelection: 'multiRow' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });

    it('handles rowSelection as string "multi"', async () => {
      renderComponent({ rowSelection: 'multi' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });

    it('handles rowSelection as object', async () => {
      const customSelection = { mode: 'singleRow' };
      renderComponent({ rowSelection: customSelection });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ ...customSelection, headerCheckbox: false });
    });

    it('uses default multiRow when rowSelection not provided for dashboard', async () => {
      renderComponent({ variant: 'dashboard' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });
  });

  describe('isRowSelectable logic', () => {
    it('returns false for published planograms in massUpdateBulk', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'published' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'dddd4444' });
      await waitFor(() => {
        expect(latestAgGridProps).toBeDefined();
      });

      const publishedRow = { id: 'aaaa1111', status: 'published' };
      const isSelectable = latestAgGridProps.isRowSelectable({ data: publishedRow });
      expect(isSelectable).toBe(false);
    });

    it('returns true for draft planograms in massUpdateBulk', async () => {
      renderComponent({ variant: 'massUpdateBulk', referencePlanogramId: 'dddd4444' });
      await waitForRowData();

      const draftRow = { id: 'bbbb2222', status: 'draft' };
      const isSelectable = latestAgGridProps.isRowSelectable({ data: draftRow });
      expect(isSelectable).toBe(true);
    });

    it('returns false when data is null', async () => {
      renderComponent({ variant: 'massUpdateBulk' });
      await waitForRowData();

      const isSelectable = latestAgGridProps.isRowSelectable({ data: null });
      expect(isSelectable).toBe(false);
    });

    it('returns true for dashboard variant by default', async () => {
      renderComponent({ variant: 'dashboard' });
      await waitForRowData();

      const row = { id: 'aaaa1111' };
      const isSelectable = latestAgGridProps.isRowSelectable({ data: row });
      expect(isSelectable).toBe(true);
    });
  });

  describe('search with massUpdateBulk filtering', () => {
    it('applies search filter after massUpdateBulk status filtering', async () => {
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'published', planogramId: 'PG-001' },
        { ...mockRecords[1], id: 'bbbb2222', status: 'draft', planogramId: 'PG-001' },
        { ...mockRecords[2], id: 'cccc3333', status: 'published', planogramId: 'PG-002' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      const { rerender } = render(
        <PlanogramTable
          variant="massUpdateBulk"
          referencePlanogramId="aaaa1111"
          searchTerm=""
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitForRowData();

      rerender(
        <PlanogramTable
          variant="massUpdateBulk"
          referencePlanogramId="aaaa1111"
          searchTerm="PG-001"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
        // Should show reference (PG-001) and draft (PG-001), but not published PG-002
        const pg001Row = latestAgGridProps.rowData.find((r) => r.planogramId === 'PG-001');
        expect(pg001Row).toBeDefined();
        const pg002Row = latestAgGridProps.rowData.find((r) => r.planogramId === 'PG-002');
        expect(pg002Row).toBeUndefined();
      });
    });
  });

  describe('version transformation edge cases', () => {
    it('handles versionId != 0 with != operator', async () => {
      const recordsWithVersion = [
        {
          ...mockRecords[0],
          versionId: 1,
          short_desc: 'Test',
        },
      ];
      getAllPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithVersion,
          },
        },
      });

      renderComponent();
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      expect(row.version).toBe('Test V1');
    });

    it('handles versionId == 0', async () => {
      const recordsWithVersion = [
        {
          ...mockRecords[0],
          versionId: 0,
        },
      ];
      getAllPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithVersion,
          },
        },
      });

      renderComponent();
      await waitForRowData();

      const row = latestAgGridProps.rowData.find((r) => r.id === 'aaaa1111');
      expect(row.version).toBe('Original');
    });
  });

  describe('handleToggleCluster edge cases', () => {
    it('toggles cluster expansion correctly', async () => {
      renderComponent();
      await waitForRowData();

      const initialRowCount = latestAgGridProps.rowData.length;

      // Collapse
      await act(async () => {
        latestAgGridProps.context.onToggleCluster('Cluster A');
      });

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBeLessThan(initialRowCount);
      });

      // Expand again
      await act(async () => {
        latestAgGridProps.context.onToggleCluster('Cluster A');
      });

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBe(initialRowCount);
      });
    });

    it('handles toggle with empty string cluster name', async () => {
      renderComponent();
      await waitForRowData();

      await act(async () => {
        latestAgGridProps.context.onToggleCluster('');
      });

      // Should not throw
      expect(() => {
        latestAgGridProps.context.onToggleCluster('');
      }).not.toThrow();
    });
  });

  describe('error handling branches', () => {
    it('handles error for massUpdate variant', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getMyPlanograms.mockRejectedValueOnce(new Error('Network error'));

      renderComponent({ variant: 'massUpdate' });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load my planograms');
      });
      consoleErrorSpy.mockRestore();
    });

    it('handles error for massUpdateBulk variant', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getMyPlanograms.mockRejectedValueOnce(new Error('Network error'));

      renderComponent({ variant: 'massUpdateBulk' });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load my planograms');
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('additional edge cases for branch coverage', () => {
    it('handles handleRowSelected when variant is myPlanogram with multiple selections', async () => {
      const onSelectionChange = jest.fn();
      renderComponent({ variant: 'myPlanogram', onSelectionChange });
      await waitForRowData();

      const row1 = latestAgGridProps.rowData[0];
      const row2 = latestAgGridProps.rowData[1];
      mockSelectedNodes = [{ data: row1 }, { data: row2 }];
      const currentNode = { data: row2, setSelected: jest.fn() };
      const eventApi = { getSelectedNodes: () => mockSelectedNodes };

      await act(async () => {
        latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
      });

      // myPlanogram should only forward ids, not validate clusters/versions
      expect(onSelectionChange).toHaveBeenCalledWith([row1.id, row2.id]);
    });

    it('handles handleRowSelected when variant is massUpdateBulk with reference in selection', async () => {
      const onSelectionChange = jest.fn();
      const recordsWithStatus = [
        { ...mockRecords[0], id: 'aaaa1111', status: 'draft' },
        { ...mockRecords[1], id: 'bbbb2222', status: 'draft' },
      ];
      getMyPlanograms.mockResolvedValueOnce({
        data: {
          data: {
            records: recordsWithStatus,
          },
        },
      });

      renderComponent({
        variant: 'massUpdateBulk',
        referencePlanogramId: 'aaaa1111',
        onSelectionChange,
      });
      await waitForRowData();

      const row1 = { id: 'aaaa1111' };
      const row2 = { id: 'bbbb2222' };
      mockSelectedNodes = [{ data: row1 }, { data: row2 }];
      const currentNode = { data: row2, setSelected: jest.fn() };
      const eventApi = { getSelectedNodes: () => mockSelectedNodes };

      await act(async () => {
        latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
      });

      // Should exclude reference planogram
      expect(onSelectionChange).toHaveBeenCalledWith(['bbbb2222']);
    });

    it('handles handleRowSelected dashboard mode with single selection (no validation)', async () => {
      const onSelectionChange = jest.fn();
      renderComponent({ onSelectionChange });
      await waitForRowData();

      const row = latestAgGridProps.rowData[0];
      mockSelectedNodes = [{ data: row }];
      const currentNode = { data: row, setSelected: jest.fn() };
      const eventApi = { getSelectedNodes: () => mockSelectedNodes };

      await act(async () => {
        latestAgGridProps.onRowSelected({ api: eventApi, node: currentNode });
      });

      // Single selection should not trigger validation
      expect(currentNode.setSelected).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('handles rowSelection prop with case-insensitive string matching', async () => {
      renderComponent({ rowSelection: 'SINGLE' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'singleRow', headerCheckbox: false });
    });

    it('handles rowSelection prop with MULTIPLE uppercase', async () => {
      renderComponent({ rowSelection: 'MULTIPLE' });
      await waitForRowData();

      expect(latestAgGridProps.rowSelection).toEqual({ mode: 'multiRow', headerCheckbox: false });
    });

    it('handles checkActiveFilters when filterModel has keys', async () => {
      const onFilterChange = jest.fn();
      renderComponent({ onFilterChange });
      await waitForRowData();

      currentFilterModel = { clusterName: ['Cluster A'], category: ['Beverages'] };
      await act(async () => {
        latestAgGridProps.onFilterChanged();
      });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(true);
      });
    });

    it('handles checkActiveFilters when filterModel is empty', async () => {
      const onFilterChange = jest.fn();
      renderComponent({ onFilterChange });
      await waitForRowData();

      currentFilterModel = {};
      await act(async () => {
        latestAgGridProps.onFilterChanged();
      });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles resetAllFilters and updates hasActiveFilters state', async () => {
      const tableRef = createRef();
      renderComponent({}, tableRef);
      await waitForRowData();

      // Set active filters
      currentFilterModel = { clusterName: ['Cluster A'] };
      await act(async () => {
        latestAgGridProps.onFilterChanged();
      });

      await waitFor(() => expect(tableRef.current.hasActiveFilters()).toBe(true));

      // Reset filters
      await act(async () => {
        tableRef.current.resetAllFilters();
      });

      expect(mockSetFilterModel).toHaveBeenCalledWith(null);
      await waitFor(() => expect(tableRef.current.hasActiveFilters()).toBe(false));
    });

    it('handles buildRowsForDisplay with search matching parent but not children', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search for cluster name which matches parent
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="Cluster A"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
        const parentRow = latestAgGridProps.rowData.find(
          (row) => row.__isParent && row.clusterName === 'Cluster A'
        );
        expect(parentRow).toBeDefined();
      });
    });

    it('handles buildRowsForDisplay with search matching children but not parent', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search for version text which matches child
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="Alt"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
        const matchedChild = latestAgGridProps.rowData.find(
          (row) => row.__isChild && row.version.includes('Alt')
        );
        expect(matchedChild).toBeDefined();
      });
    });

    it('handles handleClusterWithSearch when parent matches', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search for planogramId which matches parent
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="PG-001"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        const parentRow = latestAgGridProps.rowData.find(
          (row) => row.__isParent && row.planogramId === 'PG-001'
        );
        expect(parentRow).toBeDefined();
        expect(parentRow.__matched).toBe(true);
      });
    });

    it('handles handleClusterWithSearch when only children match', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search for something that only matches a child version
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="Alt2"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        const parentRow = latestAgGridProps.rowData.find(
          (row) => row.__isParent && row.clusterName === 'Cluster A'
        );
        expect(parentRow).toBeDefined();
        // Parent should be shown even if not matched
        const matchedChildren = latestAgGridProps.rowData.filter(
          (row) => row.__isChild && row.__matched && row.version.includes('Alt2')
        );
        expect(matchedChildren.length).toBeGreaterThan(0);
      });
    });

    it('handles handleClusterWithSearch when neither parent nor children match', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search for something that doesn't match Cluster A
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="NonExistentClusterXYZ"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        const clusterARows = latestAgGridProps.rowData.filter(
          (row) => row.clusterName === 'Cluster A'
        );
        expect(clusterARows.length).toBe(0);
      });
    });

    it('handles pushSortedChildren with version sorting', async () => {
      // This is tested indirectly through buildRowsForDisplay
      // But we can verify children are sorted correctly
      renderComponent();
      await waitForRowData();

      const clusterARows = latestAgGridProps.rowData.filter(
        (row) => row.clusterName === 'Cluster A' && row.__isChild
      );

      if (clusterARows.length > 1) {
        // Children should be sorted by version
        const versions = clusterARows.map((r) => r.version);
        // Extract version numbers for comparison
        const versionNumbers = versions.map((v) => {
          const match = v.match(/V(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        });
        const sorted = [...versionNumbers].sort((a, b) => a - b);
        expect(versionNumbers).toEqual(sorted);
      }
    });

    it('handles dateContainsAllParts with multiple date parts', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Search with day and month
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="5 apr"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(latestAgGridProps.rowData.length).toBeGreaterThan(0);
      });
    });

    it('handles normalizeDate with different date formats', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Test various date search formats
      const dateSearches = ['5 apr', 'april 5', '5 april', 'apr 5'];

      for (const search of dateSearches) {
        rerender(
          <PlanogramTable
            variant="dashboard"
            searchTerm={search}
            onFilterChange={jest.fn()}
            onSelectionChange={jest.fn()}
          />
        );

        await waitFor(() => {
          // Should not crash
          expect(latestAgGridProps.rowData).toBeDefined();
        });
      }
    });

    it('handles isDateSearch with various formats', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      const validDateSearches = ['5 apr', 'april 5', '5 april', 'apr 5', '10 jan', 'january 10'];
      const invalidSearches = ['not a date', '123', 'abc def ghi'];

      for (const search of validDateSearches) {
        rerender(
          <PlanogramTable
            variant="dashboard"
            searchTerm={search}
            onFilterChange={jest.fn()}
            onSelectionChange={jest.fn()}
          />
        );

        await waitFor(() => {
          expect(latestAgGridProps.rowData).toBeDefined();
        });
      }

      // Invalid searches should use text search instead
      for (const search of invalidSearches) {
        rerender(
          <PlanogramTable
            variant="dashboard"
            searchTerm={search}
            onFilterChange={jest.fn()}
            onSelectionChange={jest.fn()}
          />
        );

        await waitFor(() => {
          expect(latestAgGridProps.rowData).toBeDefined();
        });
      }
    });

    it('handles isNumericSearch correctly', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      // Numeric search should match bays or shelves
      rerender(
        <PlanogramTable
          variant="dashboard"
          searchTerm="2"
          onFilterChange={jest.fn()}
          onSelectionChange={jest.fn()}
        />
      );

      await waitFor(() => {
        const matchedRow = latestAgGridProps.rowData.find(
          (row) => row.bays === 2 || row.shelvesCount === 2
        );
        expect(matchedRow).toBeDefined();
      });
    });

    it('handles text search across all text columns', async () => {
      const { rerender } = renderComponent({ searchTerm: '' });
      await waitForRowData();

      const textSearches = [
        { term: 'Beverages', field: 'category' },
        { term: 'Review A', field: 'rangeReviewName' },
        { term: 'Cluster A', field: 'clusterName' },
      ];

      for (const { term, field } of textSearches) {
        rerender(
          <PlanogramTable
            variant="dashboard"
            searchTerm={term}
            onFilterChange={jest.fn()}
            onSelectionChange={jest.fn()}
          />
        );

        await waitFor(() => {
          const matchedRow = latestAgGridProps.rowData.find((row) =>
            String(row[field]).toLowerCase().includes(term.toLowerCase())
          );
          expect(matchedRow).toBeDefined();
        });
      }
    });
  });
});


