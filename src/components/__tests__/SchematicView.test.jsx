import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SchematicView from '../SchematicView';
import planogramVisualizerReducer from '../../redux/reducers/planogramVisualizerSlice';
import { filteredProducts as mockFilteredProducts } from '../../utils/filterUtils';

jest.mock('ag-grid-community', () => ({
  ModuleRegistry: { registerModules: jest.fn() },
  ClientSideRowModelModule: {},
}));

const agGridPropsLog = [];

jest.mock('ag-grid-react', () => ({
  AgGridReact: (props) => {
    agGridPropsLog.push(props);
    return (
      <div data-testid="ag-grid">
        <div className="ag-center-cols-viewport" data-testid="center-viewport" />
        <div data-testid="row-count">{props.rowData?.length || 0}</div>
        <div data-testid="column-count">{props.columnDefs?.length || 0}</div>
      </div>
    );
  },
}));

jest.mock('ag-grid-community/styles/ag-grid.css', () => ({}));
jest.mock('ag-grid-community/styles/ag-theme-quartz.css', () => ({}));

jest.mock('../MultiFilter', () => function MockMultiFilter() {
  return <div data-testid="multi-filter">MultiFilter</div>;
});

jest.mock('../../utils/filterUtils', () => ({
  filteredProducts: jest.fn((products = [], filters) => products),
}));

describe('SchematicView', () => {
  const createTestStore = (stateOverrides = {}) => {
    return configureStore({
      reducer: {
        planogramVisualizerData: planogramVisualizerReducer,
      },
      preloadedState: {
        planogramVisualizerData: {
          planogramProducts: [],
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
          ...stateOverrides,
        },
      },
    });
  };

  beforeEach(() => {
    agGridPropsLog.length = 0;
    jest.clearAllMocks();
  });

  const renderComponent = (ui, store) => render(<Provider store={store}>{ui}</Provider>);

  const findLatestGridProps = () => {
    for (let i = agGridPropsLog.length - 1; i >= 0; i -= 1) {
      const entry = agGridPropsLog[i];
      if (entry && Array.isArray(entry.rowData)) {
        return entry;
      }
    }
    return agGridPropsLog[agGridPropsLog.length - 1];
  };

  it('transforms planogram products into sorted rows and adds KPI columns', () => {
    const planogramProducts = [
      {
        bay: 2,
        shelf: 1,
        position: 3,
        linear: 150,
        shelfwidth: 300,
        orientation: 'FACING',
        facings_high: 2,
        facings_wide: 3,
        product_details: {
          name: 'Product C',
          tpnb: 'C123',
          tray_width: 20,
          tray_height: 10,
          tray_depth: 5,
          brand_name: 'Brand C',
          subCategory_name: 'Cat C',
        },
        product_kpis: {
          flag: 'OK',
          units_per_wk: 10,
          sales_per_wk: 100,
          total_space: 150,
          DOS: 5,
        },
      },
      {
        bay: 1,
        shelf: 2,
        position: 2,
        linear: 120,
        shelfwidth: 250,
        orientation: 'FACING',
        facings_high: 1,
        facings_wide: 2,
        product_details: {
          name: 'Product B',
          tpnb: 'B123',
          brand_name: 'Brand B',
          subCategory_name: 'Cat B',
        },
        product_kpis: {
          flag: 'CHECK',
          units_per_wk: 5,
          sales_per_wk: 50,
          total_space: 100,
          DOS: 3,
        },
      },
      {
        bay: 1,
        shelf: 1,
        position: 1,
        linear: 100,
        shelfwidth: 200,
        orientation: 'FACING',
        facings_high: 1,
        facings_wide: 1,
        product_details: {
          name: 'Product A',
          tpnb: 'A123',
          brand_name: 'Brand A',
          subCategory_name: 'Cat A',
        },
        product_kpis: {
          flag: 'WARN',
          units_per_wk: 7,
          sales_per_wk: 70,
          total_space: 110,
          DOS: 4,
        },
      },
    ];

    const store = createTestStore({ planogramProducts });

    renderComponent(<SchematicView />, store);

    expect(agGridPropsLog.length).toBeGreaterThan(0);
    const lastProps = findLatestGridProps();
    expect(lastProps.rowData).toHaveLength(3);
    expect(lastProps.rowData[0]).toMatchObject({
      name: 'Product A',
      tpnb: 'A123',
      bay: 1,
      shelf: 1,
      position: 1,
      status: 'WARN',
    });

    expect(lastProps.columnDefs.some((col) => col.field === 'status')).toBe(true);
    expect(screen.getByTestId('row-count')).toHaveTextContent('3');
  });

  it('omits KPI columns when products lack KPI data', () => {
    const planogramProducts = [
      {
        bay: 1,
        shelf: 1,
        position: 1,
        linear: 50,
        shelfwidth: 120,
        orientation: 'FACING',
        product_details: {
          name: 'No KPI',
          tpnb: 'NO1',
        },
      },
    ];

    const store = createTestStore({ planogramProducts });

    renderComponent(<SchematicView />, store);

    const lastProps = findLatestGridProps();
    expect(lastProps.columnDefs.some((col) => col.field === 'status')).toBe(false);
    expect(screen.getByTestId('column-count').textContent).not.toBe('0');
  });

  it('passes override filters to filteredProducts utility', () => {
    const planogramProducts = [{ bay: 1, shelf: 1, product_details: {} }];
    const store = createTestStore({ planogramProducts });
    const overrideFilters = { brands: ['Override Brand'] };

    mockFilteredProducts.mockReturnValue([{ bay: 1, shelf: 1, product_details: {} }]);

    renderComponent(<SchematicView overrideFilters={overrideFilters} />, store);

    expect(mockFilteredProducts).toHaveBeenCalledWith(planogramProducts, overrideFilters);
  });

  it('uses Redux filters when override filters are null', () => {
    const planogramProducts = [{ bay: 1, shelf: 1, product_details: {} }];
    const reduxFilters = { brands: ['Redux Brand'] };
    const store = createTestStore({ planogramProducts, planogramFilters: reduxFilters });

    renderComponent(<SchematicView overrideFilters={null} />, store);

    expect(mockFilteredProducts).toHaveBeenCalledWith(planogramProducts, reduxFilters);
  });

  it('provides row styling callbacks when orange theme is enabled', () => {
    const planogramProducts = [{ bay: 1, shelf: 1, product_details: {} }];
    const store = createTestStore({ planogramProducts });

    renderComponent(<SchematicView isOrangeTheme />, store);

    const { getRowStyle } = findLatestGridProps();
    expect(typeof getRowStyle).toBe('function');

    expect(getRowStyle({ data: { version: 'Original' } })).toMatchObject({ backgroundColor: '#FFF8F5' });
    expect(getRowStyle({ data: { __isParent: true } })).toMatchObject({ backgroundColor: '#FFDDCA' });
    expect(getRowStyle({ data: { __isChild: true } })).toMatchObject({ backgroundColor: '#ffffff' });
    expect(getRowStyle({ data: null })).toMatchObject({ backgroundColor: '#ffffff' });
  });

  it('forwards body scroll and grid ready callbacks to AgGridReact', () => {
    const planogramProducts = [{ bay: 1, shelf: 1, product_details: {} }];
    const store = createTestStore({ planogramProducts });
    const onBodyScrollExternal = jest.fn();
    const onGridReadyExternal = jest.fn();

    renderComponent(
      <SchematicView
        onBodyScrollExternal={onBodyScrollExternal}
        onGridReadyExternal={onGridReadyExternal}
      />,
      store,
    );

    const lastProps = findLatestGridProps();
    expect(lastProps.onBodyScroll).toBe(onBodyScrollExternal);
    expect(typeof lastProps.onGridReady).toBe('function');
  });

  it('exposes center viewport element via onViewportReadyExternal', () => {
    const store = createTestStore();
    const onViewportReadyExternal = jest.fn();

    renderComponent(
      <SchematicView onViewportReadyExternal={onViewportReadyExternal} />,
      store,
    );

    expect(onViewportReadyExternal).toHaveBeenCalledTimes(1);
    const viewportEl = onViewportReadyExternal.mock.calls[0][0];
    expect(viewportEl).toBeInstanceOf(HTMLElement);
    expect(viewportEl).toHaveClass('ag-center-cols-viewport');
  });
});
