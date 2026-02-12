import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductLibraryTable from '../ProductLibraryTable';

// Mock AG Grid with more detailed mock to test branches
jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData, columnDefs, onRowClicked, getRowStyle, defaultColDef, components }) => {
    // Test cell renderers with different values
    const testCellRenderers = () => {
      const promoColumn = columnDefs?.find(col => col.field === 'PROMOITEM');
      const npdColumn = columnDefs?.find(col => col.field === 'NPD');
      const benchmarkColumn = columnDefs?.find(col => col.field === 'BENCHMARK');
      
      return (
        <div data-testid="cell-renderers">
          {promoColumn?.cellRenderer && (
            <div data-testid="promo-renderer">
              <div data-testid="promo-null">{promoColumn.cellRenderer({ value: null })}</div>
              <div data-testid="promo-undefined">{promoColumn.cellRenderer({ value: undefined })}</div>
              <div data-testid="promo-true">{promoColumn.cellRenderer({ value: true })}</div>
              <div data-testid="promo-false">{promoColumn.cellRenderer({ value: false })}</div>
            </div>
          )}
          {npdColumn?.cellRenderer && (
            <div data-testid="npd-renderer">
              <div data-testid="npd-null">{npdColumn.cellRenderer({ value: null })}</div>
              <div data-testid="npd-true">{npdColumn.cellRenderer({ value: true })}</div>
            </div>
          )}
          {benchmarkColumn?.cellRenderer && (
            <div data-testid="benchmark-renderer">
              <div data-testid="benchmark-null">{benchmarkColumn.cellRenderer({ value: null })}</div>
              <div data-testid="benchmark-true">{benchmarkColumn.cellRenderer({ value: true })}</div>
            </div>
          )}
        </div>
      );
    };

    // Test value formatters
    const testValueFormatters = () => {
      const trayWidthCol = columnDefs?.find(col => col.field === 'tray_width');
      const trayHeightCol = columnDefs?.find(col => col.field === 'tray_height');
      
      return (
        <div data-testid="value-formatters">
          {trayWidthCol?.valueFormatter && (
            <div>
              <div data-testid="tray-width-value">{trayWidthCol.valueFormatter({ value: 100 })}</div>
              <div data-testid="tray-width-null">{trayWidthCol.valueFormatter({ value: null })}</div>
            </div>
          )}
          {trayHeightCol?.valueFormatter && (
            <div>
              <div data-testid="tray-height-value">{trayHeightCol.valueFormatter({ value: 200 })}</div>
              <div data-testid="tray-height-null">{trayHeightCol.valueFormatter({ value: undefined })}</div>
            </div>
          )}
        </div>
      );
    };

    // Test getRowStyle with different scenarios
    const testRowStyles = () => {
      if (getRowStyle) {
        return (
          <div data-testid="row-styles">
            <div data-testid="row-selected">{JSON.stringify(getRowStyle({ node: { isSelected: () => true, rowIndex: 0 } }))}</div>
            <div data-testid="row-even">{JSON.stringify(getRowStyle({ node: { isSelected: () => false, rowIndex: 0 } }))}</div>
            <div data-testid="row-odd">{JSON.stringify(getRowStyle({ node: { isSelected: () => false, rowIndex: 1 } }))}</div>
          </div>
        );
      }
      return null;
    };

    return (
      <div data-testid="ag-grid">
        <div data-testid="row-count">{rowData?.length || 0}</div>
        <div data-testid="column-count">{columnDefs?.length || 0}</div>
        {testCellRenderers()}
        {testValueFormatters()}
        {testRowStyles()}
        {defaultColDef && <div data-testid="default-col-def">Default Col Def</div>}
        {components && <div data-testid="components">Components</div>}
      </div>
    );
  },
}));

// Mock CSS imports
jest.mock('ag-grid-community/styles/ag-grid.css', () => ({}));
jest.mock('ag-grid-community/styles/ag-theme-quartz.css', () => ({}));

// Mock MultiFilter
jest.mock('../MultiFilter', () => {
  return function MockMultiFilter() {
    return <div data-testid="multi-filter">MultiFilter</div>;
  };
});

// Mock productUtils
jest.mock('../../utils/productUtils', () => ({
  getFallbackImage: jest.fn(() => 'fallback-image.png'),
}));

describe('ProductLibraryTable', () => {
  const mockProducts = [
    {
      tpnb: '123456',
      name: 'Test Product 1',
      brand_name: 'Test Brand',
      subCategory_name: 'Test Category',
      price: 1000,
      width: 100,
      height: 200,
      depth: 50,
      PROMOITEM: true,
      NPD: false,
      BENCHMARK: null,
      tray_width: 100,
      tray_height: 200,
    },
    {
      tpnb: '789012',
      name: 'Test Product 2',
      brand_name: 'Test Brand 2',
      subCategory_name: 'Test Category 2',
      price: 2000,
      width: 150,
      height: 250,
      depth: 60,
      PROMOITEM: null,
      NPD: true,
      BENCHMARK: undefined,
      tray_width: null,
      tray_height: undefined,
    },
  ];

  const defaultProps = {
    products: mockProducts,
    onProductClick: jest.fn(),
    onEditClick: jest.fn(),
  };

  it('should render without crashing', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument();
  });

  it('should display correct number of rows', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
  });

  it('should display columns', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('column-count')).toBeInTheDocument();
  });

  it('should handle empty products array', () => {
    render(<ProductLibraryTable products={[]} onProductClick={jest.fn()} onEditClick={jest.fn()} />);
    expect(screen.getByTestId('row-count')).toHaveTextContent('0');
  });

  it('should handle undefined products', () => {
    render(<ProductLibraryTable products={undefined} onProductClick={jest.fn()} onEditClick={jest.fn()} />);
    expect(screen.getByTestId('ag-grid')).toBeInTheDocument();
  });

  it('should render cell renderers for PROMOITEM with null/undefined values', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('promo-null')).toHaveTextContent('-');
    expect(screen.getByTestId('promo-undefined')).toHaveTextContent('-');
  });

  it('should render cell renderers for PROMOITEM with boolean values', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('promo-true')).toHaveTextContent('true');
    expect(screen.getByTestId('promo-false')).toHaveTextContent('false');
  });

  it('should render cell renderers for NPD with null values', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('npd-null')).toHaveTextContent('-');
  });

  it('should render cell renderers for BENCHMARK with null values', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('benchmark-null')).toHaveTextContent('-');
  });

  it('should format tray dimensions with values', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('tray-width-value')).toHaveTextContent('100');
    expect(screen.getByTestId('tray-height-value')).toHaveTextContent('200');
  });

  it('should format tray dimensions with null/undefined as dash', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('tray-width-null')).toHaveTextContent('-');
    expect(screen.getByTestId('tray-height-null')).toHaveTextContent('-');
  });

  it('should apply row styles for selected rows', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    const selectedStyle = screen.getByTestId('row-selected');
    expect(selectedStyle).toBeInTheDocument();
    expect(selectedStyle.textContent).toContain('FF9F9F');
  });

  it('should apply alternating row styles for even/odd rows', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    const evenRow = screen.getByTestId('row-even');
    const oddRow = screen.getByTestId('row-odd');
    expect(evenRow).toBeInTheDocument();
    expect(oddRow).toBeInTheDocument();
  });

  it('should include default column definitions', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('default-col-def')).toBeInTheDocument();
  });

  it('should include custom filter components', () => {
    render(<ProductLibraryTable {...defaultProps} />);
    expect(screen.getByTestId('components')).toBeInTheDocument();
  });
});

