import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SubcategoryOverview from '../SubcategoryOverview';
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

describe('SubcategoryOverview', () => {
  let store;

  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        scorecardData: scorecardReducer,
      },
      preloadedState: {
        scorecardData: {
          status: 'idle',
          selectedTab: 'subcategory',
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
          'subcategory1': {
            before: { avg_sales: 100, avg_shelf_space: 50 },
            after: { avg_sales: 150, avg_shelf_space: 75 },
          },
        },
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('should render TableView when viewMode is schematic', () => {
      store = createTestStore({
        viewMode: 'schematic',
        scorecardData: {
          'subcategory1': {
            before: { avg_sales: 100, avg_shelf_space: 50 },
            after: { avg_sales: 150, avg_shelf_space: 75 },
          },
        },
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      expect(screen.getByTestId('table-view')).toBeInTheDocument();
      expect(screen.queryByTestId('attribute-graphic-view')).not.toBeInTheDocument();
    });

    it('should render AttributeGraphicView when viewMode is graphic', () => {
      store = createTestStore({
        viewMode: 'graphic',
        scorecardData: {
          'subcategory1': {
            before: { avg_sales: 100, avg_shelf_space: 50 },
            after: { avg_sales: 150, avg_shelf_space: 75 },
          },
        },
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      expect(screen.getByTestId('attribute-graphic-view')).toBeInTheDocument();
      expect(screen.getByTestId('attribute-graphic-view')).toHaveAttribute('data-attribute-key', 'subcategory');
      expect(screen.queryByTestId('table-view')).not.toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('should transform subcategory data correctly', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: {
            avg_sales: 1000,
            avg_shelf_space: 500,
            avg_unique_item_count: 10,
            avg_facing_count: 20,
            avg_shelf_share: 25.5,
            avg_sales_share: 30.0,
          },
          after: {
            avg_sales: 1500,
            avg_shelf_space: 750,
            avg_unique_item_count: 15,
            avg_facing_count: 25,
            avg_shelf_share: 35.5,
            avg_sales_share: 40.0,
          },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0]).toMatchObject({
          subcategory: 'SUBCATEGORY1',
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

    it('should handle multiple subcategories', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
        'subcategory2': {
          before: { avg_sales: 800, avg_shelf_space: 400 },
          after: { avg_sales: 1000, avg_shelf_space: 500 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1', 'subcategory2'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(2);
        expect(filteredData.find((d) => d.subcategory === 'SUBCATEGORY1')).toBeDefined();
        expect(filteredData.find((d) => d.subcategory === 'SUBCATEGORY2')).toBeDefined();
      });
    });

    it('should filter subcategories based on selected filters', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
        'subcategory2': {
          before: { avg_sales: 800, avg_shelf_space: 400 },
          after: { avg_sales: 1000, avg_shelf_space: 500 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY1');
      });
    });

    it('should handle different case variations in subcategory names', async () => {
      const mockSubcategoryData = {
        'Subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
        'SUBCATEGORY2': {
          before: { avg_sales: 800, avg_shelf_space: 400 },
          after: { avg_sales: 1000, avg_shelf_space: 500 },
        },
        'subcategory3': {
          before: { avg_sales: 600, avg_shelf_space: 300 },
          after: { avg_sales: 700, avg_shelf_space: 350 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['Subcategory1', 'SUBCATEGORY2', 'subcategory3'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(3);
        expect(filteredData.find((d) => d.subcategory === 'SUBCATEGORY1')).toBeDefined();
        expect(filteredData.find((d) => d.subcategory === 'SUBCATEGORY2')).toBeDefined();
        expect(filteredData.find((d) => d.subcategory === 'SUBCATEGORY3')).toBeDefined();
      });
    });

    it('should handle subcategory names with spaces', async () => {
      const mockSubcategoryData = {
        'subcategory 1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory 1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY 1');
      });
    });

    it('should calculate lift percentages correctly', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1500, avg_shelf_space: 750 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 0, avg_shelf_space: 0 },
          after: { avg_sales: 1000, avg_shelf_space: 500 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 800, avg_shelf_space: 400 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: '1000', avg_shelf_space: '500' },
          after: { avg_sales: '1500', avg_shelf_space: '750' },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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

    it('should handle subcategory key lookup with different formats', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['Subcategory1'], // Different case
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY1');
      });
    });

    it('should handle subcategory key lookup with spaces removed', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['sub category 1'], // With spaces
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Should try to find by lowercase with spaces removed
        expect(filteredData).toHaveLength(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scorecardData', async () => {
      store = createTestStore({
        scorecardData: {},
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle null scorecardData', async () => {
      store = createTestStore({
        scorecardData: null,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle empty filters.subCategories array', async () => {
      store = createTestStore({
        scorecardData: {
          'subcategory1': {
            before: { avg_sales: 1000, avg_shelf_space: 500 },
            after: { avg_sales: 1200, avg_shelf_space: 600 },
          },
        },
        filters: {
          subCategories: [],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
          'subcategory1': {
            before: { avg_sales: 1000, avg_shelf_space: 500 },
            after: { avg_sales: 1200, avg_shelf_space: 600 },
          },
        },
        filters: null,
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });

    it('should handle missing before or after data', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          // Missing after
        },
        'subcategory2': {
          // Missing before
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
        'subcategory3': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1', 'subcategory2', 'subcategory3'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Only subcategory3 should be included
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY3');
      });
    });

    it('should handle null or empty subcategory names', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: [null, '', 'subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        // Should only process valid subcategory names
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY1');
      });
    });

    it('should handle unknown subcategory names', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY1');
      });
    });

    it('should handle subcategory not found in scorecardData', async () => {
      const mockSubcategoryData = {
        'subcategory1': {
          before: { avg_sales: 1000, avg_shelf_space: 500 },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['nonexistent'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toEqual([]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid numeric data gracefully by converting to 0', async () => {
      // Create invalid data - null/undefined values
      const mockSubcategoryData = {
        'subcategory1': {
          before: {
            avg_sales: null,
            avg_shelf_space: undefined,
          },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
      const mockSubcategoryData = {
        'subcategory1': {
          before: {
            avg_sales: 'invalid',
            avg_shelf_space: 'not a number',
          },
          after: { avg_sales: 1200, avg_shelf_space: 600 },
        },
      };

      store = createTestStore({
        scorecardData: mockSubcategoryData,
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
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
    it('should update when scorecardData changes', async () => {
      store = createTestStore({
        scorecardData: {
          'subcategory1': {
            before: { avg_sales: 1000, avg_shelf_space: 500 },
            after: { avg_sales: 1200, avg_shelf_space: 600 },
          },
        },
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      const { rerender } = render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(1);
      });

      // Update store with new data
      store.dispatch(
        scorecardSlice.setScorecardData({
          'subcategory2': {
            before: { avg_sales: 2000, avg_shelf_space: 1000 },
            after: { avg_sales: 2500, avg_shelf_space: 1250 },
          },
        })
      );

      store.dispatch(
        scorecardSlice.setFilters({
          subCategories: ['subcategory2'],
        })
      );

      rerender(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        const filteredData = state.scorecardData.filteredScorecardData;
        expect(filteredData).toHaveLength(1);
        expect(filteredData[0].subcategory).toBe('SUBCATEGORY2');
      });
    });

    it('should update when filters change', async () => {
      store = createTestStore({
        scorecardData: {
          'subcategory1': {
            before: { avg_sales: 1000, avg_shelf_space: 500 },
            after: { avg_sales: 1200, avg_shelf_space: 600 },
          },
          'subcategory2': {
            before: { avg_sales: 800, avg_shelf_space: 400 },
            after: { avg_sales: 1000, avg_shelf_space: 500 },
          },
        },
        filters: {
          subCategories: ['subcategory1'],
        },
      });

      render(
        <Provider store={store}>
          <SubcategoryOverview />
        </Provider>
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(1);
      });

      // Update filters
      store.dispatch(
        scorecardSlice.setFilters({
          subCategories: ['subcategory1', 'subcategory2'],
        })
      );

      await waitFor(() => {
        const state = store.getState();
        expect(state.scorecardData.filteredScorecardData).toHaveLength(2);
      });
    });
  });
});

