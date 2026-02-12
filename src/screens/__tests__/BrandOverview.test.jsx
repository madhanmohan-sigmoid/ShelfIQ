import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import BrandOverview from '../BrandOverview';
import scorecardReducer from '../../redux/reducers/scorecardSlice';
import * as scorecardSlice from '../../redux/reducers/scorecardSlice';

// Mock child components
jest.mock('../../components/scorecard/TableView', () => {
  return function MockTableView() {
    return <div data-testid="table-view">TableView</div>;
  };
});

jest.mock('../../components/scorecard/AttributeGraphicView', () => {
  const PropTypes = require('prop-types');
  function MockAttributeGraphicView({ attributeKey }) {
    return <div data-testid="attribute-graphic-view" data-attribute-key={attributeKey}>AttributeGraphicView</div>;
  }
  MockAttributeGraphicView.propTypes = {
    attributeKey: PropTypes.string,
  };
  return MockAttributeGraphicView;
});

describe('BrandOverview', () => {
  let store;

  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        scorecardData: scorecardReducer,
      },
      preloadedState: {
        scorecardData: {
          status: 'idle',
          selectedTab: 'brand',
          viewMode: 'schematic',
          scorecardData: {},
          brands: [],
          subCategories: [],
          storeIds: [],
          filters: {
            brands: [],
            subCategories: [],
            clusterName: '',
            version: '',
            year: '',
            storeIds: [],
          },
          filteredScorecardData: [],
          clusterData: [],
          originalPlanogramId: null,
          selectedPlanogramVersionId: null,
          ...initialState,
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      store = createTestStore({
        scorecardData: {
          'category1': {
            'BRAND1': {
              before: { sales: 100, total_space: 50 },
              after: { sales: 150, total_space: 75 },
            },
          },
        },
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('should render TableView when viewMode is schematic', () => {
      store = createTestStore({
        viewMode: 'schematic',
        scorecardData: {
          'category1': {
            'BRAND1': {
              before: { sales: 100, total_space: 50 },
              after: { sales: 150, total_space: 75 },
            },
          },
        },
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      expect(screen.getByTestId('table-view')).toBeInTheDocument();
      expect(screen.queryByTestId('attribute-graphic-view')).not.toBeInTheDocument();
    });

    it('should render AttributeGraphicView when viewMode is graphic', () => {
      store = createTestStore({
        viewMode: 'graphic',
        scorecardData: {
          'category1': {
            'BRAND1': {
              before: { sales: 100, total_space: 50 },
              after: { sales: 150, total_space: 75 },
            },
          },
        },
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      expect(screen.getByTestId('attribute-graphic-view')).toBeInTheDocument();
      expect(screen.getByTestId('attribute-graphic-view')).toHaveAttribute('data-attribute-key', 'brand');
      expect(screen.queryByTestId('table-view')).not.toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('should transform brand data correctly', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: {
              sales: 1000,
              total_space: 500,
              unique_item_count: 10,
              total_facings: 20,
              shelf_share: 25.5,
              sales_share: 30.0,
            },
            after: {
              sales: 1500,
              total_space: 750,
              unique_item_count: 15,
              total_facings: 25,
              shelf_share: 35.5,
              sales_share: 40.0,
            },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0]).toMatchObject({
          subcategory: 'CATEGORY1',
          brand: 'BRAND1',
          before_sales: 1000,
          before_shelf_space: 500,
          before_item_count: 10,
          before_facings: 20,
          before_shelf_share: 25.5,
          before_sales_share: 30.0,
          after_sales: 1500,
          after_shelf_space: 750,
          after_item_count: 15,
          after_facings: 25,
          after_shelf_share: 35.5,
          after_sales_share: 40.0,
          sales_lift: 500,
          sales_lift_percent: 50,
          shelf_space_lift: 250,
          shelf_space_lift_percent: 50,
        });
      });
    });

    it('should handle multiple brands across multiple categories', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
          'BRAND2': {
            before: { sales: 800, total_space: 400 },
            after: { sales: 1000, total_space: 500 },
          },
        },
        'Category2': {
          'BRAND1': {
            before: { sales: 500, total_space: 250 },
            after: { sales: 600, total_space: 300 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1', 'BRAND2'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(3);
        expect(filteredData.find((d) => d.brand === 'BRAND1' && d.subcategory === 'CATEGORY1')).toBeDefined();
        expect(filteredData.find((d) => d.brand === 'BRAND2' && d.subcategory === 'CATEGORY1')).toBeDefined();
        expect(filteredData.find((d) => d.brand === 'BRAND1' && d.subcategory === 'CATEGORY2')).toBeDefined();
      });
    });

    it('should filter brands based on selected filters', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
          'BRAND2': {
            before: { sales: 800, total_space: 400 },
            after: { sales: 1000, total_space: 500 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].brand).toBe('BRAND1');
      });
    });

    it('should handle case-insensitive brand matching', async () => {
      const mockBrandData = {
        'Category1': {
          'brand1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].brand).toBe('BRAND1');
      });
    });

    it('should calculate lift percentages correctly', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1500, total_space: 750 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].sales_lift).toBe(500);
        expect(filteredData[0].sales_lift_percent).toBe(50);
        expect(filteredData[0].shelf_space_lift).toBe(250);
        expect(filteredData[0].shelf_space_lift_percent).toBe(50);
      });
    });

    it('should handle zero before values for lift percentage', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 0, total_space: 0 },
            after: { sales: 1000, total_space: 500 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].sales_lift_percent).toBe(0);
        expect(filteredData[0].shelf_space_lift_percent).toBe(0);
      });
    });

    it('should handle negative lift values', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 800, total_space: 400 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].sales_lift).toBe(-200);
        expect(filteredData[0].sales_lift_percent).toBe(-20);
        expect(filteredData[0].shelf_space_lift).toBe(-100);
        expect(filteredData[0].shelf_space_lift_percent).toBe(-20);
      });
    });

    it('should handle missing optional fields with default values', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].before_item_count).toBe(0);
        expect(filteredData[0].before_facings).toBe(0);
        expect(filteredData[0].before_shelf_share).toBe(0);
        expect(filteredData[0].before_sales_share).toBe(0);
        expect(filteredData[0].after_item_count).toBe(0);
        expect(filteredData[0].after_facings).toBe(0);
        expect(filteredData[0].after_shelf_share).toBe(0);
        expect(filteredData[0].after_sales_share).toBe(0);
      });
    });

    it('should handle string numbers and convert them to numbers', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: '1000', total_space: '500' },
            after: { sales: '1500', total_space: '750' },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].before_sales).toBe(1000);
        expect(filteredData[0].after_sales).toBe(1500);
        expect(typeof filteredData[0].before_sales).toBe('number');
        expect(typeof filteredData[0].after_sales).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty brandData', async () => {
      store = createTestStore({
        scorecardData: {},
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle null brandData', async () => {
      store = createTestStore({
        scorecardData: null,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle empty filters.brands array', async () => {
      store = createTestStore({
        scorecardData: {
          'Category1': {
            'BRAND1': {
              before: { sales: 1000, total_space: 500 },
              after: { sales: 1200, total_space: 600 },
            },
          },
        },
        filters: {
          brands: [],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle missing filters object', async () => {
      store = createTestStore({
        scorecardData: {
          'Category1': {
            'BRAND1': {
              before: { sales: 1000, total_space: 500 },
              after: { sales: 1200, total_space: 600 },
            },
          },
        },
        filters: null,
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle missing before or after data', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            // Missing after
          },
          'BRAND2': {
            // Missing before
            after: { sales: 1200, total_space: 600 },
          },
          'BRAND3': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1', 'BRAND2', 'BRAND3'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Only BRAND3 should be included
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].brand).toBe('BRAND3');
      });
    });

    it('should handle invalid category data structure', async () => {
      const mockBrandData = {
        'Category1': null,
        'Category2': 'invalid',
        'Category3': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].brand).toBe('BRAND1');
      });
    });

    it('should handle unknown category names', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].subcategory).toBe('CATEGORY1');
      });
    });

    it('should handle unknown brand names', async () => {
      const mockBrandData = {
        'Category1': {
          '': {
            before: { sales: 1000, total_space: 500 },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: [''],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].brand).toBe('UNKNOWN');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid numeric data gracefully by converting to 0', async () => {
      // Create invalid data - null/undefined values
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: {
              sales: null,
              total_space: undefined,
            },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Number(null) = 0, Number(undefined) = NaN, then || 0 converts to 0
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].before_sales).toBe(0);
        expect(filteredData[0].before_shelf_space).toBe(0);
        expect(filteredData[0].after_sales).toBe(1200);
      });
    });

    it('should handle non-numeric string values by converting to 0', async () => {
      const mockBrandData = {
        'Category1': {
          'BRAND1': {
            before: {
              sales: 'invalid',
              total_space: 'not a number',
            },
            after: { sales: 1200, total_space: 600 },
          },
        },
      };

      store = createTestStore({
        scorecardData: mockBrandData,
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Number('invalid') = NaN, then || 0 converts to 0
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].before_sales).toBe(0);
        expect(filteredData[0].before_shelf_space).toBe(0);
      });
    });
  });

  describe('useEffect Dependencies', () => {
    it('should update when brandData changes', async () => {
      store = createTestStore({
        scorecardData: {
          'Category1': {
            'BRAND1': {
              before: { sales: 1000, total_space: 500 },
              after: { sales: 1200, total_space: 600 },
            },
          },
        },
        filters: {
          brands: ['BRAND1'],
        },
      });

      const { rerender } = render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(1);
      });

      // Update store with new data
      store.dispatch(
        scorecardSlice.setScorecardData({
          'Category2': {
            'BRAND2': {
              before: { sales: 2000, total_space: 1000 },
              after: { sales: 2500, total_space: 1250 },
            },
          },
        })
      );

      store.dispatch(
        scorecardSlice.setFilters({
          brands: ['BRAND2'],
        })
      );

      rerender(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].brand).toBe('BRAND2');
        expect(filteredData[0].subcategory).toBe('CATEGORY2');
      });
    });

    it('should update when filters change', async () => {
      store = createTestStore({
        scorecardData: {
          'Category1': {
            'BRAND1': {
              before: { sales: 1000, total_space: 500 },
              after: { sales: 1200, total_space: 600 },
            },
            'BRAND2': {
              before: { sales: 800, total_space: 400 },
              after: { sales: 1000, total_space: 500 },
            },
          },
        },
        filters: {
          brands: ['BRAND1'],
        },
      });

      render(
        <Provider store={store}>
          <BrandOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(1);
      });

      // Update filters
      store.dispatch(
        scorecardSlice.setFilters({
          brands: ['BRAND1', 'BRAND2'],
        })
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(2);
      });
    });
  });
});

