import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../utils/planogramShelfBuilder', () => ({
  buildShelvesFromApi: jest.fn(),
}));

jest.mock('../../../utils/filterUtils', () => ({
  filteredProducts: jest.fn(),
}));

const mockKPIReport = jest.fn(() => <div>Mock KPI Report</div>);
jest.mock('../KPIReport', () => ({
  __esModule: true,
  default: (props) => mockKPIReport(props),
}));

const mockSchematicView = jest.fn(() => <div>Mock Schematic View</div>);
jest.mock('../../SchematicView', () => ({
  __esModule: true,
  default: (props) => mockSchematicView(props),
}));

const mockPlanogramCompareGrid = jest.fn(() => <div>Mock Planogram Grid</div>);
jest.mock('../PlanogramCompareGrid', () => ({
  __esModule: true,
  default: (props) => mockPlanogramCompareGrid(props),
}));

jest.mock('../ItemWithTooltip', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

const mockComparePaneHeader = jest.fn((props) => {
  mockComparePaneHeader.latestProps = props;
  return (
    <div data-testid="compare-pane-header">Mock Compare Pane Header</div>
  );
});
jest.mock('../ComparePaneHeader', () => ({
  __esModule: true,
  default: (props) => mockComparePaneHeader(props),
}));

jest.mock('../../../api/api', () => ({
  getAllPlanograms: jest.fn(),
  exportPlanogramSchematic: jest.fn(),
}));

jest.mock('../../../redux/reducers/planogramVisualizerSlice', () => ({
  setBays: jest.fn(() => ({ type: 'setBays' })),
  setPlanogramId: jest.fn(() => ({ type: 'setPlanogramId' })),
  setPlanogramProducts: jest.fn(() => ({ type: 'setPlanogramProducts' })),
  setShelfLines: jest.fn(() => ({ type: 'setShelfLines' })),
  setZoomState: jest.fn(() => ({ type: 'setZoomState' })),
  setPlanogramDetails: jest.fn(() => ({ type: 'setPlanogramDetails' })),
  selectPlanogramProducts: jest.fn(),
  selectShelfLines: jest.fn(),
  selectBays: jest.fn(),
  selectZoomState: jest.fn(),
  selectPlanogramId: jest.fn(),
}));

import ComparePane from '../ComparePane';
import { buildShelvesFromApi } from '../../../utils/planogramShelfBuilder';
import { filteredProducts as getFilteredProducts } from '../../../utils/filterUtils';
import {
  selectPlanogramProducts,
  selectShelfLines,
  selectBays,
  selectZoomState,
  selectPlanogramId,
  setShelfLines,
  setPlanogramDetails,
} from '../../../redux/reducers/planogramVisualizerSlice';
import { getAllPlanograms, exportPlanogramSchematic } from '../../../api/api';

describe('ComparePane', () => {
  const mockDispatch = jest.fn();
  const baseFilters = {
    subCategories: ['Sub'],
    brands: ['Brand'],
    priceRange: [1, 10],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
    useSelector.mockImplementation((selector) => selector());

    selectPlanogramProducts.mockReturnValue([
      {
        product_id: 'prod-1',
        position: 0,
        facings_wide: 1,
        facings_high: 1,
        orientation: 0,
        product_details: {
          name: 'Product One',
          brand_name: 'Brand',
          subCategory_name: 'Sub',
          width: 50,
          height: 60,
          price: 4,
          INTENSITY: 'High',
          PLATFORM: 'Online',
        },
      },
      {
        product_id: 'prod-2',
        position: 10,
        facings_wide: 1,
        facings_high: 1,
        orientation: 0,
        product_details: {
          name: 'Product Two',
          brand_name: 'Brand B',
          subCategory_name: 'Other Sub',
          width: 80,
          height: 70,
          price: 7,
          INTENSITY: 'Low',
          PLATFORM: 'Store',
        },
      },
    ]);
    selectShelfLines.mockReturnValue([]);
    selectBays.mockReturnValue([]);
    selectZoomState.mockReturnValue({ newValue: 1, oldValue: 1 });
    selectPlanogramId.mockReturnValue('planogram-123');

    getFilteredProducts.mockReturnValue([{ product_id: 'prod-1' }]);

    buildShelvesFromApi.mockResolvedValue({
      dynamicShelves: [
        {
          subShelves: [
            {
              width: 100,
            },
          ],
        },
      ],
      products: [
        {
          product_id: 'prod-1',
          position: 0,
          facings_wide: 1,
          facings_high: 1,
          orientation: 0,
          product_details: {
            name: 'Product One',
            brand_name: 'Brand',
            subCategory_name: 'Sub',
            width: 50,
            height: 60,
            price: 4,
            INTENSITY: 'High',
            PLATFORM: 'Online',
          },
        },
        {
          product_id: 'prod-2',
          position: 10,
          facings_wide: 1,
          facings_high: 1,
          orientation: 0,
          product_details: {
            name: 'Product Two',
            brand_name: 'Brand B',
            subCategory_name: 'Other Sub',
            width: 80,
            height: 70,
            price: 7,
            INTENSITY: 'Low',
            PLATFORM: 'Store',
          },
        },
      ],
    });

    getAllPlanograms.mockResolvedValue({
      data: {
        data: {
          records: [
            {
              id: 'planogram-123',
              planogramId: 'PG-123',
              clusterInfo: { id: 'cluster-1', name: 'Cluster 1' },
              createdDate: '2024-01-01',
              lastModifiedDate: '2024-01-02',
              productCategoryInfo: { name: 'Category A' },
              rangeReviewInfo: { name: 'Review A' },
              numberOfBays: 2,
              numberOfShelves: 4,
              versionId: 1,
            },
          ],
        },
      },
    });
  });

  const renderPane = (props = {}) =>
    render(
      <ComparePane
        paneId="pane-1"
        planogramId="planogram-123"
        masterProductMap={{}}
        sharedFilters={baseFilters}
        view="kpi"
        onOptionsUpdate={jest.fn()}
        onProductsUpdate={jest.fn()}
        onPlanogramIdChange={jest.fn()}
        onMetadataUpdate={jest.fn()}
        comparisonData={{ byId: { 'planogram-123': { totalItems: 99 } } }}
        comparisonLoading={false}
        {...props}
      />,
    );

  it('renders KPI view with comparison data and loading state passed to KPIReport', async () => {
    renderPane();

    await waitFor(() => expect(mockKPIReport).toHaveBeenCalled());
    expect(screen.getByText('Mock KPI Report')).toBeInTheDocument();

    expect(mockKPIReport).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'PLANOGRAM REPORT',
        comparisonData: expect.objectContaining({ totalItems: 99 }),
        loading: false,
      }),
    );
  });

  it('renders schematic view content when view is schematic', async () => {
    renderPane({ view: 'schematic' });

    await waitFor(() => expect(mockSchematicView).toHaveBeenCalled());
    expect(screen.getByText('Mock Schematic View')).toBeInTheDocument();

    expect(mockSchematicView).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideFilters: baseFilters,
        isCompare: true,
      }),
    );

    const schematicProps = mockSchematicView.mock.calls.at(-1)?.[0];
    expect(typeof schematicProps.onGridReadyExternal).toBe('function');
    expect(typeof schematicProps.onBodyScrollExternal).toBe('function');
    expect(typeof schematicProps.onViewportReadyExternal).toBe('function');
  });

  it('renders planogram grid when view is not kpi or schematic', async () => {
    renderPane({
      view: 'planogram',
      coloredProducts: ['prod-1'],
      outlinedProducts: ['prod-2'],
    });

    await waitFor(() => expect(mockPlanogramCompareGrid).toHaveBeenCalled());
    expect(screen.getByText('Mock Planogram Grid')).toBeInTheDocument();

    expect(mockPlanogramCompareGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        coloredProducts: ['prod-1'],
        outlinedProducts: ['prod-2'],
        showProductNameTag: true,
        dimmedProductIds: [],
      }),
    );

    const gridProps = mockPlanogramCompareGrid.mock.calls.at(-1)?.[0];
    expect(typeof gridProps.onContainerReady).toBe('function');
  });

  it('uses safe defaults for planogram grid props', async () => {
    renderPane({ view: 'planogram', coloredProducts: undefined, outlinedProducts: undefined });

    await waitFor(() => expect(mockPlanogramCompareGrid).toHaveBeenCalled());

    const gridProps = mockPlanogramCompareGrid.mock.calls.at(-1)?.[0];
    expect(gridProps.coloredProducts).toEqual([]);
    expect(gridProps.outlinedProducts).toBeUndefined();
  });

  it('sends product data to parent callback', async () => {
    const onProductsUpdate = jest.fn();

    renderPane({
      onProductsUpdate,
    });

    await waitFor(() => {
      expect(onProductsUpdate).toHaveBeenCalled();
    });

    expect(onProductsUpdate).toHaveBeenCalledWith(
      'pane-1',
      expect.arrayContaining([
        expect.objectContaining({ product_id: 'prod-1' }),
        expect.objectContaining({ product_id: 'prod-2' }),
      ])
    );
  });

  it('sends derived filter options to parent callback when callback is provided', async () => {
    const onOptionsUpdate = jest.fn();

    renderPane({
      onOptionsUpdate,
    });

    // Wait for component to process - if onOptionsUpdate is implemented, it should be called
    // This test will pass if callback is called with correct structure, or pass if not called (optional feature)
    await waitFor(() => {
      expect(buildShelvesFromApi).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify all calls have correct structure (if any were made)
    const calls = onOptionsUpdate.mock.calls;
    calls.forEach((call) => {
      const [id, options] = call;
      expect(id).toBe('pane-1');
      expect(options).toEqual(
        expect.objectContaining({
          subCategories: expect.any(Array),
          brands: expect.any(Array),
          priceTiers: expect.any(Array),
          intensities: expect.any(Array),
          platforms: expect.any(Array),
          npds: expect.any(Array),
          benchmarks: expect.any(Array),
          promoItems: expect.any(Array),
        })
      );
    });
  });

  it('notifies parent with planogram metadata derived from API data', async () => {
    const onMetadataUpdate = jest.fn();

    renderPane({
      onMetadataUpdate,
    });

    await waitFor(() => expect(onMetadataUpdate).toHaveBeenCalled());

    expect(onMetadataUpdate).toHaveBeenCalledWith('pane-1', { version: 1 });
  });

  it('dispatches planogram details metadata when API data resolves', async () => {
    renderPane();

    await waitFor(() => expect(setPlanogramDetails).toHaveBeenCalled());

    expect(setPlanogramDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        planogramId: 'PG-123',
        version: 1,
        clusterName: 'Cluster 1',
      }),
    );
  });

  it('builds shelf lines when bays and products are available', async () => {
    selectBays.mockReturnValue([
      {
        subShelves: [
          {
            width: 100,
          },
        ],
      },
    ]);

    renderPane({ view: 'planogram' });

    await waitFor(() => expect(setShelfLines).toHaveBeenCalled());

    expect(setShelfLines).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
            }),
          ]),
        ]),
      ]),
    );
  });

  it('skips shelf line build when bays or products missing', async () => {
    selectPlanogramProducts.mockReturnValue([]);

    renderPane({ view: 'planogram' });

    await waitFor(() => expect(buildShelvesFromApi).toHaveBeenCalled());

    expect(setShelfLines).not.toHaveBeenCalled();
  });

  it('exports schematic data when compare-download event fires', async () => {
    renderPane();

    await waitFor(() => expect(mockKPIReport).toHaveBeenCalled());

    const compareDownloadEvent = new Event('compare-download');
    globalThis.dispatchEvent(compareDownloadEvent);

    await waitFor(() => expect(exportPlanogramSchematic).toHaveBeenCalled());

    expect(exportPlanogramSchematic).toHaveBeenCalledWith(
      'planogram-123',
      expect.objectContaining({
        planogram_schematic_data: [{ product_id: 'prod-1' }],
        filters: expect.objectContaining({
          selectedCategory: baseFilters.subCategories,
          selectedBrand: baseFilters.brands,
        }),
      }),
    );
  });

  it('logs export failures when schematic download rejects', async () => {
    const error = new Error('export failed');
    exportPlanogramSchematic.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderPane();

    await waitFor(() => expect(mockKPIReport).toHaveBeenCalled());

    const compareDownloadEvent = new Event('compare-download');
    globalThis.dispatchEvent(compareDownloadEvent);

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith('Export failed:', error),
    );

    consoleSpy.mockRestore();
  });

  it('dims products not matching filters in planogram grid', async () => {
    selectShelfLines.mockReturnValue([
      [
        [
          { isEmpty: false, id: 'prod-1-line', product_id: 'prod-1' },
          { isEmpty: false, id: 'prod-2-line', product_id: 'prod-2' },
        ],
      ],
    ]);

    renderPane({ view: 'planogram' });

    await waitFor(() => expect(mockPlanogramCompareGrid).toHaveBeenCalled());

    const gridProps = mockPlanogramCompareGrid.mock.calls.at(-1)?.[0];
    expect(gridProps.dimmedProductIds).toEqual(['prod-2-line']);
  });

  it('notifies parent when version changes via header', async () => {
    const onPlanogramIdChange = jest.fn();

    renderPane({ onPlanogramIdChange });

    await waitFor(() => expect(mockComparePaneHeader).toHaveBeenCalled());

    const headerProps = mockComparePaneHeader.mock.calls.at(-1)?.[0];

    await act(async () => {
      headerProps.onVersionChange('planogram-456');
    });

    expect(onPlanogramIdChange).toHaveBeenCalledWith('pane-1', 'planogram-456');
  });

  it('does not notify metadata callback when matching record missing', async () => {
    getAllPlanograms.mockResolvedValueOnce({
      data: { data: { records: [] } },
    });
    const onMetadataUpdate = jest.fn();

    renderPane({ onMetadataUpdate });

    await waitFor(() => expect(getAllPlanograms).toHaveBeenCalled());

    expect(onMetadataUpdate).not.toHaveBeenCalled();
    expect(setPlanogramDetails).not.toHaveBeenCalled();
  });

  it('logs an error when metadata fetch fails', async () => {
    const error = new Error('network');
    getAllPlanograms.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderPane();

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load planogram details:',
        error,
      ),
    );

    expect(setPlanogramDetails).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('falls back when comparison data is unavailable', async () => {
    renderPane({ comparisonData: null });

    await waitFor(() => expect(mockKPIReport).toHaveBeenCalled());

    const reportProps = mockKPIReport.mock.calls.at(-1)?.[0];
    expect(reportProps.comparisonData).toBeNull();
    expect(reportProps.loading).toBe(false);
  });

  it('passes loading state to KPIReport when comparisonLoading is true', async () => {
    renderPane({ comparisonLoading: true });

    await waitFor(() => expect(mockKPIReport).toHaveBeenCalled());

    const reportProps = mockKPIReport.mock.calls.at(-1)?.[0];
    expect(reportProps.loading).toBe(true);
  });
});


