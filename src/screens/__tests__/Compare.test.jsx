/* eslint-disable react/prop-types */
import React from 'react';
import { act, waitFor } from '@testing-library/react';
import Compare from '../Compare';
import { renderWithProviders } from './testUtils';
import { compareTwoPlanograms } from '../../api/api';

const planogramBarProps = {};
const paneProps = {};
const filterModalProps = {};
const filterPanelProps = {};

jest.mock('../../components/Planogram/ComparePlanogramBar', () => {
  const MockComparePlanogramBar = (props) => {
    Object.assign(planogramBarProps, props);
    return <div data-testid="compare-planogram-bar" />;
  };
  MockComparePlanogramBar.displayName = 'MockComparePlanogramBar';
  return MockComparePlanogramBar;
});

jest.mock('../../components/Planogram/ComparePane', () => {
  const MockComparePane = ({ paneId, ...props }) => {
    paneProps[paneId] = { paneId, ...props };
    return <div data-testid={`compare-pane-${paneId}`} />;
  };
  MockComparePane.displayName = 'MockComparePane';
  return MockComparePane;
});

jest.mock('../../components/Planogram/CompareFilterPanel', () => {
  const MockCompareFilterPanel = (props) => {
    Object.assign(filterPanelProps, props);
    return <div data-testid="compare-filter-panel" />;
  };
  MockCompareFilterPanel.displayName = 'MockCompareFilterPanel';
  return MockCompareFilterPanel;
});

jest.mock('../../components/Modals/FilterModalWrapper', () => {
  const MockFilterModalWrapper = ({ children, ...props }) => {
    Object.assign(filterModalProps, props);
    return (
      <div data-testid="filter-modal-wrapper">
        MockFilterModal
        {children}
      </div>
    );
  };
  MockFilterModalWrapper.displayName = 'MockFilterModalWrapper';
  return MockFilterModalWrapper;
});

jest.mock('../../api/api', () => ({
  compareTwoPlanograms: jest.fn(),
}));

let mockSearch = '?left=pg-left&right=pg-right';
const mockNavigate = jest.fn();

/** @type {jest.Mock} */
const compareTwoPlanogramsMock = compareTwoPlanograms;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ search: mockSearch }),
  useNavigate: () => mockNavigate,
}));

describe('Compare', () => {
  beforeEach(() => {
    mockSearch = '?left=pg-left&right=pg-right';
    mockNavigate.mockReset();
    compareTwoPlanogramsMock.mockReset();
    for (const key of Object.keys(planogramBarProps)) delete planogramBarProps[key];
    for (const key of Object.keys(paneProps)) delete paneProps[key];
    for (const key of Object.keys(filterModalProps)) delete filterModalProps[key];
    for (const key of Object.keys(filterPanelProps)) delete filterPanelProps[key];
    compareTwoPlanogramsMock.mockResolvedValue({
      data: {
        data: {
          comparison: [
            { planogram_id: 'pg-left', version: 3 },
            { planogram_id: 'pg-right', version: 2 },
          ],
        },
      },
    });
  });

  it('drives compare workflow end-to-end', async () => {
    const dispatchSpy = jest.spyOn(globalThis, 'dispatchEvent');

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {
            1: { product_id: '1' },
          },
        },
      },
    });

    await waitFor(() => expect(compareTwoPlanogramsMock).toHaveBeenCalledWith('pg-left', 'pg-right'));
    await waitFor(() => expect(planogramBarProps.onFilterClick).toBeDefined());

    // Scroll sync props should be wired with safe defaults
    expect(planogramBarProps.syncScrollEnabled).toBe(false);
    expect(typeof planogramBarProps.onToggleSyncScroll).toBe('function');

    // Each pane should receive scroll-related callbacks
    expect(typeof paneProps.left.onPlanogramScrollContainerReady).toBe('function');
    expect(typeof paneProps.left.onSchematicGridReady).toBe('function');
    expect(typeof paneProps.left.onSchematicBodyScroll).toBe('function');
    expect(typeof paneProps.left.onSchematicViewportReady).toBe('function');

    act(() => planogramBarProps.onDownload());
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    dispatchSpy.mockRestore();

    act(() => planogramBarProps.onFilterClick());
    expect(filterModalProps.open).toBe(true);

    act(() => filterPanelProps.setFilters({
      brands: ['Brand-A'],
      subCategories: ['Cat-A'],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    }));

    act(() => filterModalProps.onApply());
    await waitFor(() => expect(planogramBarProps.activeFiltersCount).toBe(2));
    await waitFor(() => expect(filterModalProps.open).toBe(false));

    act(() => filterModalProps.onReset());
    await waitFor(() => expect(planogramBarProps.activeFiltersCount).toBe(0));

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        {
          product_id: 'LeftOnly',
          product_details: {
            brand_name: 'LeftBrand',
            subCategory_name: 'LeftSub',
            price: 10,
            PLATFORM: 'Store',
          },
        },
      ]),
    );
    act(() =>
      paneProps.right.onProductsUpdate('right', [
        {
          product_id: 'RightOnly',
          product_details: {
            brand_name: 'RightBrand',
            subCategory_name: 'RightSub',
            price: 20,
            PLATFORM: 'Online',
          },
        },
      ]),
    );

    await waitFor(() => {
      expect(filterPanelProps.options.brands).toEqual(expect.arrayContaining(['LeftBrand', 'RightBrand']));
      expect(filterPanelProps.options.subCategories).toEqual(expect.arrayContaining(['LeftSub', 'RightSub']));
      expect(filterPanelProps.options.priceTiers).toEqual(expect.arrayContaining([10, 20]));
      expect(filterPanelProps.options.platforms).toEqual(expect.arrayContaining(['Online']));
    });

    act(() => paneProps.left.onMetadataUpdate('left', { version: 3 }));
    act(() => paneProps.right.onMetadataUpdate('right', { version: 2 }));

    await waitFor(() => {
      expect(paneProps.left.coloredProducts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ product_id: 'LeftOnly', brandColor: '#73C6BA' }),
        ]),
      );
      expect(paneProps.right.coloredProducts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ product_id: 'RightOnly', brandColor: '#CA1432' }),
        ]),
      );
    });

    act(() => paneProps.left.onPlanogramIdChange('left', 'pg-left-new'));
    await waitFor(() => expect(paneProps.right.otherPanePlanogramId).toBe('pg-left-new'));

    act(() => planogramBarProps.onToggleView('schematic'));
    await waitFor(() => expect(paneProps.left.view).toBe('schematic'));
  });

  it('redirects to dashboard when query params are missing', () => {
    mockSearch = '';

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to dashboard when left param is missing', () => {
    mockSearch = '?right=pg-right';

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to dashboard when right param is missing', () => {
    mockSearch = '?left=pg-left';

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('returns null when query params are missing', () => {
    mockSearch = '';

    const { container } = renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(container.firstChild).toBeNull();
  });

  it('provides empty modal options when no products are available', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(filterPanelProps.options).toEqual({
      subCategories: [],
      brands: [],
      priceTiers: [],
      intensities: [],
      platforms: [],
      npds: [0, 1],
      benchmarks: [0, 1],
      promoItems: [0, 1],
      allSubCategories: [],
      allBrands: [],
      allPriceTiers: [],
      allIntensities: [],
      allPlatforms: [],
      allNpds: [0, 1],
      allBenchmarks: [0, 1],
      allPromoItems: [0, 1],
    });
  });

  it('computes modal options with filters applied', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        {
          product_id: 'p1',
          product_details: {
            brand_name: 'Brand1',
            subCategory_name: 'Cat1',
            price: 10,
            INTENSITY: 'High',
            PLATFORM: 'Store',
            NPD: true,
            BENCHMARK: false,
            PROMOITEM: true,
          },
        },
        {
          product_id: 'p2',
          product_details: {
            brand_name: 'Brand2',
            subCategory_name: 'Cat2',
            price: 20,
            INTENSITY: 'Low',
            PLATFORM: 'Online',
            NPD: false,
            BENCHMARK: true,
            PROMOITEM: false,
          },
        },
      ]),
    );

    act(() => planogramBarProps.onFilterClick());

    act(() => filterPanelProps.setFilters({
      brands: ['Brand1'],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    }));

    await waitFor(() => {
      // When computing brands, brand filtering is excluded, so all brands matching other filters are shown
      expect(filterPanelProps.options.brands).toEqual(expect.arrayContaining(['Brand1', 'Brand2']));
      expect(filterPanelProps.options.allBrands).toEqual(expect.arrayContaining(['Brand1', 'Brand2']));
    });
  });

  it('handles product comparison when right version is newer', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        {
          product_id: 'common',
          product_details: { brand_name: 'Brand1' },
        },
        {
          product_id: 'left-only',
          product_details: { brand_name: 'Brand1' },
        },
      ]),
    );

    act(() =>
      paneProps.right.onProductsUpdate('right', [
        {
          product_id: 'common',
          product_details: { brand_name: 'Brand1' },
        },
        {
          product_id: 'right-only',
          product_details: { brand_name: 'Brand1' },
        },
      ]),
    );

    act(() => paneProps.left.onMetadataUpdate('left', { version: 2 }));
    act(() => paneProps.right.onMetadataUpdate('right', { version: 3 }));

    await waitFor(() => {
      expect(paneProps.left.coloredProducts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ product_id: 'left-only', brandColor: '#CA1432' }),
        ]),
      );
      expect(paneProps.right.coloredProducts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ product_id: 'right-only', brandColor: '#73C6BA' }),
        ]),
      );
    });
  });

  it('returns empty outlines when products are missing', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(paneProps.left.coloredProducts).toEqual([]);
    expect(paneProps.right.coloredProducts).toEqual([]);
  });

  it('returns empty outlines when versions are not set', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        { product_id: 'p1', product_details: { brand_name: 'Brand1' } },
      ]),
    );

    act(() =>
      paneProps.right.onProductsUpdate('right', [
        { product_id: 'p2', product_details: { brand_name: 'Brand2' } },
      ]),
    );

    await waitFor(() => {
      expect(paneProps.left.coloredProducts).toEqual([]);
      expect(paneProps.right.coloredProducts).toEqual([]);
    });
  });

  it('returns empty outlines when left products are empty', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.right.onProductsUpdate('right', [
        { product_id: 'p1', product_details: { brand_name: 'Brand1' } },
      ]),
    );

    act(() => paneProps.left.onMetadataUpdate('left', { version: 2 }));
    act(() => paneProps.right.onMetadataUpdate('right', { version: 3 }));

    await waitFor(() => {
      expect(paneProps.left.coloredProducts).toEqual([]);
      expect(paneProps.right.coloredProducts).toEqual([]);
    });
  });

  it('handles same products in both panes', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    const commonProduct = {
      product_id: 'common',
      product_details: { brand_name: 'Brand1' },
    };

    act(() => paneProps.left.onProductsUpdate('left', [commonProduct]));
    act(() => paneProps.right.onProductsUpdate('right', [commonProduct]));

    act(() => paneProps.left.onMetadataUpdate('left', { version: 3 }));
    act(() => paneProps.right.onMetadataUpdate('right', { version: 2 }));

    await waitFor(() => {
      expect(paneProps.left.coloredProducts).toEqual([]);
      expect(paneProps.right.coloredProducts).toEqual([]);
    });
  });

  it('toggles sync scroll enabled state', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(planogramBarProps.syncScrollEnabled).toBe(false);

    act(() => planogramBarProps.onToggleSyncScroll());
    expect(planogramBarProps.syncScrollEnabled).toBe(true);

    act(() => planogramBarProps.onToggleSyncScroll());
    expect(planogramBarProps.syncScrollEnabled).toBe(false);
  });

  it('handles planogram scroll container registration for both panes', () => {
    const leftEl = { scrollLeft: 0, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const rightEl = { scrollLeft: 0, addEventListener: jest.fn(), removeEventListener: jest.fn() };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => paneProps.left.onPlanogramScrollContainerReady('left', leftEl));
    act(() => paneProps.right.onPlanogramScrollContainerReady('right', rightEl));

    expect(paneProps.left.onPlanogramScrollContainerReady).toBeDefined();
    expect(paneProps.right.onPlanogramScrollContainerReady).toBeDefined();
  });

  it('handles schematic grid API registration for both panes', () => {
    const leftApi = { getDisplayedRowCount: jest.fn() };
    const rightApi = { getDisplayedRowCount: jest.fn() };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => paneProps.left.onSchematicGridReady('left', leftApi));
    act(() => paneProps.right.onSchematicGridReady('right', rightApi));

    expect(paneProps.left.onSchematicGridReady).toBeDefined();
    expect(paneProps.right.onSchematicGridReady).toBeDefined();
  });

  it('handles schematic viewport registration for both panes', () => {
    const leftViewport = { scrollLeft: 0 };
    const rightViewport = { scrollLeft: 0 };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => paneProps.left.onSchematicViewportReady('left', leftViewport));
    act(() => paneProps.right.onSchematicViewportReady('right', rightViewport));

    expect(paneProps.left.onSchematicViewportReady).toBeDefined();
    expect(paneProps.right.onSchematicViewportReady).toBeDefined();
  });

  it('handles schematic body scroll when sync is disabled', () => {
    const leftViewport = { scrollLeft: 0 };
    const rightViewport = { scrollLeft: 0 };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => paneProps.left.onSchematicViewportReady('left', leftViewport));
    act(() => paneProps.right.onSchematicViewportReady('right', rightViewport));

    act(() => {
      paneProps.left.onSchematicBodyScroll('left', { direction: 'horizontal' });
    });

    expect(rightViewport.scrollLeft).toBe(0);
  });

  it('handles schematic body scroll when view is not schematic', () => {
    const leftViewport = { scrollLeft: 100 };
    const rightViewport = { scrollLeft: 0 };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => planogramBarProps.onToggleSyncScroll());
    act(() => paneProps.left.onSchematicViewportReady('left', leftViewport));
    act(() => paneProps.right.onSchematicViewportReady('right', rightViewport));

    act(() => {
      paneProps.left.onSchematicBodyScroll('left', { direction: 'horizontal' });
    });

    expect(rightViewport.scrollLeft).toBe(0);
  });

  it('handles schematic body scroll with wrong direction', () => {
    const leftViewport = { scrollLeft: 100 };
    const rightViewport = { scrollLeft: 0 };

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => planogramBarProps.onToggleSyncScroll());
    act(() => planogramBarProps.onToggleView('schematic'));
    act(() => paneProps.left.onSchematicViewportReady('left', leftViewport));
    act(() => paneProps.right.onSchematicViewportReady('right', rightViewport));

    act(() => {
      paneProps.left.onSchematicBodyScroll('left', { direction: 'vertical' });
    });

    expect(rightViewport.scrollLeft).toBe(0);
  });

  it('handles comparison API error gracefully', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    compareTwoPlanogramsMock.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith('ERR', expect.any(Error));
    });

    consoleLogSpy.mockRestore();
  });

  it('handles comparison API response with missing data', async () => {
    compareTwoPlanogramsMock.mockResolvedValue({
      data: {
        data: {},
      },
    });

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(paneProps.left.comparisonData).toEqual({ byId: {} });
    });
  });

  it('handles comparison API response with empty array', async () => {
    compareTwoPlanogramsMock.mockResolvedValue({
      data: {
        data: {
          comparison: [],
        },
      },
    });

    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(paneProps.left.comparisonData).toEqual({ byId: {} });
    });
  });

  it('clears comparison data when one planogram ID is missing', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalled();
    });

    act(() => paneProps.left.onPlanogramIdChange('left', null));

    await waitFor(() => {
      expect(paneProps.left.comparisonData).toBeNull();
      expect(paneProps.left.comparisonLoading).toBe(false);
    });
  });

  it('passes comparisonLoading state to both panes', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    // Initially loading should be true while API call is in progress
    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalled();
    });

    // After API resolves, loading should be false
    await waitFor(() => {
      expect(paneProps.left.comparisonLoading).toBe(false);
      expect(paneProps.right.comparisonLoading).toBe(false);
    });
  });

  it('syncs modal filters with shared filters when opening modal', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => planogramBarProps.onFilterClick());
    act(() => filterPanelProps.setFilters({
      brands: ['Brand-A'],
      subCategories: ['Cat-A'],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    }));
    act(() => filterModalProps.onApply());

    act(() => planogramBarProps.onFilterClick());

    expect(filterPanelProps.filters).toEqual({
      brands: ['Brand-A'],
      subCategories: ['Cat-A'],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    });
  });

  it('closes modal when onClose is called', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => planogramBarProps.onFilterClick());
    expect(filterModalProps.open).toBe(true);

    act(() => filterModalProps.onClose());
    expect(filterModalProps.open).toBe(false);
  });

  it('computes active filters count for intensities and platforms', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() => planogramBarProps.onFilterClick());
    act(() => filterPanelProps.setFilters({
      brands: [],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: ['High', 'Low'],
      benchmarks: [],
      promoItems: [],
      platforms: ['Store', 'Online'],
    }));
    act(() => filterModalProps.onApply());

    await waitFor(() => {
      expect(planogramBarProps.activeFiltersCount).toBe(4);
    });
  });

  it('handles right pane callbacks correctly', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.right.onProductsUpdate('right', [
        { product_id: 'p1', product_details: { brand_name: 'Brand1' } },
      ]),
    );

    act(() => paneProps.right.onPlanogramIdChange('right', 'pg-right-new'));
    act(() => paneProps.right.onMetadataUpdate('right', { version: 5 }));

    expect(paneProps.left.otherPanePlanogramId).toBe('pg-right-new');
  });

  it('updates planogram ID and triggers comparison API call', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    await waitFor(() => {
      expect(compareTwoPlanogramsMock).toHaveBeenCalledWith('pg-left', 'pg-right');
    });

    compareTwoPlanogramsMock.mockClear();

    act(() => paneProps.left.onPlanogramIdChange('left', 'pg-left-new'));

    await waitFor(() => {
      expect(paneProps.left.planogramId).toBe('pg-left-new');
      expect(compareTwoPlanogramsMock).toHaveBeenCalledWith('pg-left-new', 'pg-right');
    });
  });

  it('handles modal options with all filter types', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        {
          product_id: 'p1',
          product_details: {
            brand_name: 'Brand1',
            subCategory_name: 'Cat1',
            price: 10,
            INTENSITY: 'High',
            PLATFORM: 'Store',
            NPD: true,
            BENCHMARK: false,
            PROMOITEM: true,
          },
        },
      ]),
    );

    act(() => planogramBarProps.onFilterClick());

    await waitFor(() => {
      expect(filterPanelProps.options.intensities).toEqual(['High']);
      expect(filterPanelProps.options.platforms).toEqual(['Store']);
      // getUniqueOptions returns raw boolean values, not converted to 0/1
      expect(filterPanelProps.options.npds).toEqual([true]);
      // BENCHMARK: false is filtered out by .filter(Boolean), so empty array falls back to [0, 1]
      expect(filterPanelProps.options.benchmarks).toEqual([0, 1]);
      expect(filterPanelProps.options.promoItems).toEqual([true]);
    });
  });

  it('handles modal options fallback to defaults for npds, benchmarks, promoItems', async () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    act(() =>
      paneProps.left.onProductsUpdate('left', [
        {
          product_id: 'p1',
          product_details: {
            brand_name: 'Brand1',
            subCategory_name: 'Cat1',
            price: 10,
          },
        },
      ]),
    );

    act(() => planogramBarProps.onFilterClick());

    await waitFor(() => {
      expect(filterPanelProps.options.npds).toEqual([0, 1]);
      expect(filterPanelProps.options.benchmarks).toEqual([0, 1]);
      expect(filterPanelProps.options.promoItems).toEqual([0, 1]);
    });
  });

  it('toggles view correctly', () => {
    renderWithProviders(<Compare />, {
      preloadedState: {
        productData: {
          productMap: {},
        },
      },
    });

    expect(planogramBarProps.view).toBe('kpi');

    act(() => planogramBarProps.onToggleView('planogram'));
    expect(planogramBarProps.view).toBe('planogram');

    act(() => planogramBarProps.onToggleView('schematic'));
    expect(planogramBarProps.view).toBe('schematic');
  });
});

