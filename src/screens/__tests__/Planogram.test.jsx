// Mock modules that use import.meta.env before anything else
jest.mock('../../api/axiosInstance', () => {
  const mockAxios = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  };
  return {
    __esModule: true,
    default: mockAxios,
    baseURL: '/api/v1/',
  };
});

// Mock planogramShelfBuilder which imports axiosInstance
jest.mock('../../utils/planogramShelfBuilder', () => {
  const buildShelvesFromApi = jest.fn();
  global.__buildShelvesFromApiMock__ = buildShelvesFromApi;
  return { buildShelvesFromApi };
});

const getBuildShelvesFromApiMock = () => global.__buildShelvesFromApiMock__;


import React from 'react';
import { act, waitFor, screen } from '@testing-library/react';
import Planogram from '../Planogram';
import { renderWithProviders } from './testUtils';
import {
  setCurrentViolations,
  setZoomState,
} from '../../redux/reducers/planogramVisualizerSlice';

const planogramBarProps = {};
const filterModalProps = {};
const filterPanelProps = {};
const fullscreenViewProps = {};
const planogramChecksDrawerProps = {};

jest.mock('../../components/Planogram/PlanogramBar', () => {
  const MockPlanogramBar = (props) => {
    Object.assign(planogramBarProps, props);
    return <div data-testid="planogram-bar" />;
  };
  MockPlanogramBar.displayName = 'MockPlanogramBar';
  return MockPlanogramBar;
});

jest.mock('../../components/Planogram/ItemWithTooltip', () => {
  const MockItemWithTooltip = () => <div data-testid="item-with-tooltip" />;
  MockItemWithTooltip.displayName = 'MockItemWithTooltip';
  return MockItemWithTooltip;
});

jest.mock('../../components/Planogram/RightSideBar', () => {
  const MockRightSideBar = () => <div data-testid="right-sidebar" />;
  MockRightSideBar.displayName = 'MockRightSideBar';
  return MockRightSideBar;
});

jest.mock('../../components/Planogram/LeftSideBar', () => {
  const MockLeftSideBar = () => <div data-testid="left-sidebar" />;
  MockLeftSideBar.displayName = 'MockLeftSideBar';
  return MockLeftSideBar;
});

jest.mock('../../components/Planogram/FullscreenView', () => {
  const MockFullscreenView = (props) => {
    Object.assign(fullscreenViewProps, props);
    return <div data-testid="fullscreen-view" />;
  };
  MockFullscreenView.displayName = 'MockFullscreenView';
  return MockFullscreenView;
});

jest.mock('../../components/Planogram/FilterPanel', () => {
  const MockFilterPanel = (props) => {
    Object.assign(filterPanelProps, props);
    return <div data-testid="filter-panel" />;
  };
  MockFilterPanel.displayName = 'MockFilterPanel';
  return MockFilterPanel;
});

jest.mock('../../components/Modals/FilterModalWrapper', () => {
  const MockFilterModalWrapper = ({ children, ...props }) => {
    Object.assign(filterModalProps, props);
    return (
      <div data-testid="filter-modal-wrapper">
        modal
        {children}
      </div>
    );
  };
  MockFilterModalWrapper.displayName = 'MockFilterModalWrapper';
  return MockFilterModalWrapper;
});

jest.mock('../../components/SchematicView', () => {
  const MockSchematicView = () => <div data-testid="schematic-view" />;
  MockSchematicView.displayName = 'MockSchematicView';
  return MockSchematicView;
});


jest.mock('../../api/api', () => ({
  getAllPlanograms: jest.fn(),
  checkViolations: jest.fn(),
}));

jest.mock('../../utils/savePlanogramUtils', () => {
  const buildFullLayoutSnapshot = jest.fn(() => 'mock-layout-snapshot');
  const buildPlanogramProductsSnapshot = jest.fn(() => []);
  global.__buildFullLayoutSnapshotMock__ = buildFullLayoutSnapshot;
  return { buildFullLayoutSnapshot, buildPlanogramProductsSnapshot };
});

const getBuildFullLayoutSnapshotMock = () => global.__buildFullLayoutSnapshotMock__;

jest.mock('../../components/Planogram/PlanogramChecksDrawer', () => {
  const MockPlanogramChecksDrawer = (props) => {
    Object.assign(planogramChecksDrawerProps, props);
    return <div data-testid="planogram-checks-drawer" />;
  };
  MockPlanogramChecksDrawer.displayName = 'MockPlanogramChecksDrawer';
  return MockPlanogramChecksDrawer;
});

// Mock useLocation
const mockLocation = { search: '' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
}));

const apiModule = jest.requireMock('../../api/api');
/** @type {jest.Mock} */
const getAllPlanogramsMock = apiModule.getAllPlanograms;
/** @type {jest.Mock} */
const checkViolationsMock = apiModule.checkViolations;

describe('Planogram', () => {
  beforeEach(() => {
    mockLocation.search = '?id=planogram-1';
    getAllPlanogramsMock.mockReset();
    checkViolationsMock?.mockReset?.();
    getBuildShelvesFromApiMock()?.mockReset?.();
    getBuildShelvesFromApiMock()?.mockClear?.();
    getBuildFullLayoutSnapshotMock()?.mockReset?.();
    getBuildFullLayoutSnapshotMock()?.mockImplementation?.(() => 'mock-layout-snapshot');
    Object.keys(planogramBarProps).forEach((key) => delete planogramBarProps[key]);
    Object.keys(filterModalProps).forEach((key) => delete filterModalProps[key]);
    Object.keys(filterPanelProps).forEach((key) => delete filterPanelProps[key]);
    Object.keys(fullscreenViewProps).forEach((key) => delete fullscreenViewProps[key]);
    Object.keys(planogramChecksDrawerProps).forEach((key) => delete planogramChecksDrawerProps[key]);
  });

  const planogramRecord = {
    id: 'planogram-1',
    planogramId: 'planogram-1',
    createdDate: '2024-01-01',
    lastModifiedDate: '2024-01-01',
    productCategoryInfo: { name: 'Test Category' },
    clusterInfo: { id: 'cluster-1', name: 'Test Cluster' },
    versionId: 2,
    rangeReviewInfo: { name: 'Test Review' },
    numberOfBays: 1,
    numberOfShelves: 1,
    short_desc: 'v2',
    status: 'draft',
  };

  const dynamicShelves = [
    {
      width: 200,
      height: 100,
      subShelves: [{ width: 200, height: 80 }],
    },
  ];

  const planogramProducts = [
    {
      product_id: 'prod-1',
      bay: 1,
      shelf: 1,
      position: 0,
      facings_wide: 1,
      facings_high: 1,
      total_facings: 1,
      orientation: 0,
      product_details: {
        width: 50,
        height: 100,
        depth: 30,
        brand_name: 'Brand-A',
        subCategory_name: 'Cat-A',
        price: 10,
        name: 'Product A',
        image_url: '',
        tpnb: 'tp-1',
        dimensionUom: 'cm',
        global_trade_item_number: 'gtin-1',
      },
    },
    {
      product_id: 'prod-2',
      bay: 1,
      shelf: 1,
      position: 60,
      facings_wide: 1,
      facings_high: 1,
      total_facings: 1,
      orientation: 0,
      product_details: {
        width: 50,
        height: 100,
        depth: 30,
        brand_name: 'Brand-B',
        subCategory_name: 'Cat-B',
        price: 20,
        name: 'Product B',
        image_url: '',
        tpnb: 'tp-2',
        dimensionUom: 'cm',
        global_trade_item_number: 'gtin-2',
      },
    },
  ];

  const renderPlanogram = (overrides = {}) => {
    const apiOverrides = overrides.apiOverrides || {};
    if (apiOverrides.getAllPlanogramsReject) {
      getAllPlanogramsMock.mockRejectedValue(new Error('Fetch failed'));
    } else {
      getAllPlanogramsMock.mockResolvedValue(
        apiOverrides.getAllPlanograms ?? {
          data: {
            data: {
              records: [planogramRecord, { ...planogramRecord, id: 'planogram-2', short_desc: 'v1', versionId: 1 }],
            },
          },
        }
      );
    }

    getBuildShelvesFromApiMock()?.mockResolvedValue?.(
      apiOverrides.buildShelvesFromApi ?? {
        dynamicShelves,
        products: planogramProducts,
        ruleManager: { rules: [] },
      }
    );

    const defaultPreloadedState = {
      planogramVisualizerData: {
        planogramDetails: null,
        planogramFilters: {
          brands: [],
          subCategories: [],
          priceRange: [],
          intensities: [],
          benchmarks: [],
          npds: [],
          promoItems: [],
          platforms: [],
        },
        bays: [],
        shelfLines: [],
        planogramProducts: [],
        pendingPlacement: {
          active: false,
          product: null,
          facingsWide: 1,
          facingsHigh: 1,
          compatiblePositions: [],
        },
        zoomState: { oldValue: 1, newValue: 1 },
        isFullScreen: false,
        leftSidebarCollapsed: false,
        rightSidebarCollapsed: false,
        isSchemeticView: false, // Note: reducer has typo isSchemeticView
        tagMapFilters: {
          selectedType: null,
          selectedBrands: [],
          selectedSubCategories: [],
        },
        SCALE: 3,
      },
      productData: {
        products: [],
        productMap: {
          'prod-1': { product_id: 'prod-1' },
          'prod-2': { product_id: 'prod-2' },
        },
      },
      masterData: {
        master_product_brands: [],
        master_product_sub_categories: [],
      },
      regionRetailer: {
        selectedRegion: 'Region-1',
        selectedRetailer: 'Retailer-1',
        selectedCategory: 'Category-1',
      },
    };

    const preloadedState = {
      ...defaultPreloadedState,
      ...overrides.preloadedState,
      planogramVisualizerData: {
        ...defaultPreloadedState.planogramVisualizerData,
        ...overrides.preloadedState?.planogramVisualizerData,
      },
    };

    return renderWithProviders(<Planogram />, {
      preloadedState,
    });
  };

  it('initializes planogram data and manages filters', async () => {
    const { store } = renderPlanogram();

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => expect(planogramBarProps.rowData).toBeTruthy());
    expect(store.getState().planogramVisualizerData.planogramDetails.planogramId).toBe('planogram-1');

    act(() => planogramBarProps.onFilterClick());
    expect(filterModalProps.open).toBe(true);

    act(() =>
      filterPanelProps.setFilters({
        brands: ['Brand-A'],
        subCategories: ['Cat-A'],
        priceRange: [],
        npds: [],
        intensities: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      }),
    );

    act(() => filterModalProps.onApply());

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramFilters.brands).toEqual(['Brand-A']),
    );
    await waitFor(() => expect(filterModalProps.open).toBe(false));

    act(() => filterModalProps.onReset());
    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramFilters.brands).toEqual([]),
    );

    await waitFor(() =>
      expect(filterPanelProps.options.brands).toEqual(expect.arrayContaining(['Brand-A'])),
    );
    await waitFor(() =>
      expect(filterPanelProps.options.allBrands).toEqual(expect.arrayContaining(['Brand-A'])),
    );
    await waitFor(() =>
      expect(filterPanelProps.options.allSubCategories).toEqual(expect.arrayContaining(['Cat-A'])),
    );
    await waitFor(() =>
      expect(filterPanelProps.options.allPriceTiers).toEqual(expect.arrayContaining([10, 20])),
    );
    await waitFor(() =>
      expect(filterPanelProps.options.allIntensities).toBeDefined(),
    );
    await waitFor(() =>
      expect(filterPanelProps.options.allPlatforms).toBeDefined(),
    );
    await waitFor(() => expect(filterPanelProps.brandCounts).toBeDefined());

    expect(fullscreenViewProps.dimmedProductIds).toBeInstanceOf(Array);
    expect(fullscreenViewProps.coloredProducts).toBeDefined();
    expect(fullscreenViewProps.showProductNameTag).toBeDefined();
  });

  it('renders FullscreenView with correct props', async () => {
    const { store } = renderPlanogram();

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() => {
      expect(fullscreenViewProps.shelves).toBeDefined();
      expect(fullscreenViewProps.shelfLines).toBeDefined();
      expect(fullscreenViewProps.ItemWithTooltip).toBeDefined();
      expect(fullscreenViewProps.dimmedProductIds).toBeDefined();
      expect(fullscreenViewProps.onClose).toBeDefined();
      expect(fullscreenViewProps.showProductNameTag).toBeDefined();
      expect(fullscreenViewProps.coloredProducts).toBeDefined();
      expect(fullscreenViewProps.setShowProductNameTag).toBeDefined();
    });

    expect(fullscreenViewProps.dimmedProductIds).toBeInstanceOf(Array);
  });

  it('handles tag map mode and colored products', async () => {
    const { store } = renderPlanogram();

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() => {
      expect(fullscreenViewProps.showProductNameTag).toBe(true);
      expect(fullscreenViewProps.coloredProducts).toBeDefined();
    });

    // Test tag map mode toggle
    act(() => {
      if (fullscreenViewProps.setShowProductNameTag) {
        fullscreenViewProps.setShowProductNameTag(false);
      }
    });

    await waitFor(() => {
      expect(fullscreenViewProps.showProductNameTag).toBe(false);
    });
  });

  it('renders SchematicView when isSchematicView is true', async () => {
    renderPlanogram({
      preloadedState: {
        planogramVisualizerData: {
          isSchemeticView: true, // Note: reducer has typo isSchemeticView
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('schematic-view')).toBeInTheDocument();
    expect(screen.queryByTestId('fullscreen-view')).not.toBeInTheDocument();
  });

  it('renders PlanogramChecksDrawer with correct props', async () => {
    renderPlanogram();

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(planogramChecksDrawerProps.open).toBe(false);
      expect(planogramChecksDrawerProps.checks).toEqual([]);
      expect(planogramChecksDrawerProps.violationCount).toBe(0);
      expect(typeof planogramChecksDrawerProps.onClose).toBe('function');
    });
  });

  it('opens PlanogramChecksDrawer and runs checks when onToggleChecks is called', async () => {
    checkViolationsMock.mockResolvedValue({
      data: {
        data: {
          violation_count: 2,
          violations: [
            { id: 'v1', extras: { product_id_list: 'prod-1' } },
            { id: 'v2', extras: { product_id_list_shelf_1: 'prod-2' } },
          ],
        },
      },
    });

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    act(() => {
      fullscreenViewProps.onToggleChecks?.();
    });

    await waitFor(() => {
      expect(planogramChecksDrawerProps.open).toBe(true);
    });

    await waitFor(() => {
      expect(checkViolationsMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(planogramChecksDrawerProps.checks).toHaveLength(2);
      expect(planogramChecksDrawerProps.violationCount).toBe(2);
    });
  });

  it('closes PlanogramChecksDrawer when onClose is called', async () => {
    checkViolationsMock.mockResolvedValue({
      data: { data: { violation_count: 0, violations: [] } },
    });

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    await act(async () => {
      fullscreenViewProps.onToggleChecks?.();
    });

    await waitFor(() => expect(planogramChecksDrawerProps.open).toBe(true));

    act(() => planogramChecksDrawerProps.onClose?.());

    await waitFor(() => expect(planogramChecksDrawerProps.open).toBe(false));
  });

  it('handles checkViolations API error', async () => {
    checkViolationsMock.mockRejectedValue(new Error('Network error'));

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    await act(async () => fullscreenViewProps.onToggleChecks?.());

    await waitFor(() => {
      expect(planogramChecksDrawerProps.errorMessage).toBe('Network error');
    });
  });

  it('handles checkViolations error with response message', async () => {
    const errorWithResponse = {
      response: { data: { message: 'Custom API error' } },
      message: 'Generic error',
    };
    checkViolationsMock.mockRejectedValue(errorWithResponse);

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    await act(async () => fullscreenViewProps.onToggleChecks?.());

    await waitFor(() => {
      expect(planogramChecksDrawerProps.errorMessage).toBe('Custom API error');
    });
  });

  it('handles getAllPlanograms fetch error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderPlanogram({
      apiOverrides: {
        getAllPlanogramsReject: true,
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getAllPlanogramsMock).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles no planogram found for id', async () => {
    renderPlanogram({
      apiOverrides: {
        getAllPlanograms: {
          data: {
            data: {
              records: [{ id: 'other-id', planogramId: 'other' }],
            },
          },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(planogramBarProps.rowData).toBeNull();
    });
  });

  it('closes filter modal when onClose is called without apply', async () => {
    renderPlanogram();

    await waitFor(() => expect(planogramBarProps.rowData).toBeTruthy());

    act(() => planogramBarProps.onFilterClick());
    expect(filterModalProps.open).toBe(true);

    act(() => filterModalProps.onClose?.());
    expect(filterModalProps.open).toBe(false);
  });

  it('dispatches setIsFullScreen when FullscreenView onClose is called', async () => {
    const { store } = renderPlanogram();

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.getState().planogramVisualizerData.isFullScreen).toBe(false);

    act(() => fullscreenViewProps.onClose?.());
    expect(store.getState().planogramVisualizerData.isFullScreen).toBe(false);
  });

  it('passes violationProductIds to FullscreenView when violations exist', async () => {
    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    act(() => {
      store.dispatch(
        setCurrentViolations({
          violation_count: 1,
          violations: [{ extras: { product_id_list: 'prod-1,prod-2' } }],
        })
      );
    });

    await waitFor(() => {
      expect(fullscreenViewProps.violationProductIds).toContain('prod-1');
      expect(fullscreenViewProps.violationProductIds).toContain('prod-2');
    });
  });

  it('passes correct props to PlanogramBar', async () => {
    renderPlanogram();

    await waitFor(() => expect(planogramBarProps.rowData).toBeTruthy());

    expect(planogramBarProps).toMatchObject({
      selectedRegion: 'Region-1',
      selectedRetailer: 'Retailer-1',
      category: 'Category-1',
    });
    expect(typeof planogramBarProps.onFilterClick).toBe('function');
  });

  it('renders FilterModalWrapper with theme and handlers', async () => {
    renderPlanogram();

    await waitFor(() => expect(planogramBarProps.rowData).toBeTruthy());

    expect(filterModalProps.themeColor).toBe('#FFB000');
    expect(typeof filterModalProps.onReset).toBe('function');
    expect(typeof filterModalProps.onApply).toBe('function');
  });

  it('displays error fallback when checkViolations fails with no message', async () => {
    checkViolationsMock.mockRejectedValue({});

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    await act(async () => fullscreenViewProps.onToggleChecks?.());

    await waitFor(() => {
      expect(planogramChecksDrawerProps.errorMessage).toBe(
        'Failed to load violation checks. Please try again.',
      );
    });
  });

  it('extracts violation product IDs from array format', async () => {
    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    act(() => {
      store.dispatch(
        setCurrentViolations({
          violation_count: 1,
          violations: [
            { extras: { product_id_list: ['prod-1', 'prod-2'] } },
          ],
        })
      );
    });

    await waitFor(() => {
      expect(fullscreenViewProps.violationProductIds).toContain('prod-1');
      expect(fullscreenViewProps.violationProductIds).toContain('prod-2');
    });
  });

  it('filters tag map selections to available products', async () => {
    const { store } = renderPlanogram({
      preloadedState: {
        planogramVisualizerData: {
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: ['NonExistentBrand'],
            selectedSubCategories: ['NonExistentCat'],
          },
        },
      },
    });

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() => {
      const { selectedBrands, selectedSubCategories } =
        store.getState().planogramVisualizerData.tagMapFilters;
      expect(selectedBrands).not.toContain('NonExistentBrand');
      expect(selectedSubCategories).not.toContain('NonExistentCat');
    });
  });

  it('applies subcategory colors when tag map type is subcategory', async () => {
    const { store } = renderPlanogram({
      preloadedState: {
        planogramVisualizerData: {
          tagMapFilters: {
            selectedType: 'subcategory',
            selectedBrands: [],
            selectedSubCategories: ['Cat-A'],
          },
        },
      },
    });

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    act(() => fullscreenViewProps.setShowProductNameTag?.(false));

    await waitFor(() => {
      expect(fullscreenViewProps.showProductNameTag).toBe(false);
      expect(fullscreenViewProps.coloredProducts).toBeDefined();
    });
  });

  it('applies brand colors when tag map type is brand', async () => {
    const { store } = renderPlanogram({
      preloadedState: {
        planogramVisualizerData: {
          tagMapFilters: {
            selectedType: 'brand',
            selectedBrands: ['Brand-A'],
            selectedSubCategories: [],
          },
        },
      },
    });

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    act(() => fullscreenViewProps.setShowProductNameTag?.(false));

    await waitFor(() => {
      expect(fullscreenViewProps.showProductNameTag).toBe(false);
      expect(fullscreenViewProps.coloredProducts).toBeDefined();
    });
  });

  it('updates zoom state without breaking planogram data', async () => {
    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    act(() => {
      store.dispatch(setZoomState({ oldValue: 1, newValue: 1.5 }));
    });

    await waitFor(() => {
      const state = store.getState().planogramVisualizerData;
      expect(state.zoomState.newValue).toBe(1.5);
      expect(state.shelfLines.length).toBeGreaterThan(0);
      expect(state.bays.length).toBeGreaterThan(0);
    });
  });

  it('handles buildFullLayoutSnapshot error when running checks', async () => {
    getBuildFullLayoutSnapshotMock()?.mockImplementationOnce?.(() => {
      throw new Error('Snapshot build failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { store } = renderPlanogram();

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.planogramProducts.length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(store.getState().planogramVisualizerData.shelfLines.length).toBeGreaterThan(0),
    );

    await act(async () => fullscreenViewProps.onToggleChecks?.());

    expect(checkViolationsMock).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not run checks when planogram data is missing', async () => {
    const { store } = renderPlanogram({
      apiOverrides: {
        buildShelvesFromApi: {
          dynamicShelves: [],
          products: [],
          ruleManager: { rules: [] },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      const state = store.getState().planogramVisualizerData;
      expect(state.bays.length).toBe(0);
    });

    act(() => fullscreenViewProps.onToggleChecks?.());

    expect(checkViolationsMock).not.toHaveBeenCalled();
  });
});

