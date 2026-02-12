import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ProductLibrary from '../ProductLibrary';
import { renderWithProviders } from './testUtils';

// Variable to control the mocked return value
let mockCategoryAccessTypeValue = 'CONTRIBUTORS';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  const originalUseSelector = actual.useSelector;
  const { selectCategoryAccessType } = jest.requireActual('../../redux/reducers/regionRetailerSlice');
  
  return {
    ...actual,
    useSelector: jest.fn((selector) => {
      // Intercept selectCategoryAccessType
      if (selector === selectCategoryAccessType) {
        return mockCategoryAccessTypeValue;
      }
      // For all other selectors, use the real implementation
      return originalUseSelector(selector);
    }),
  };
});

jest.mock('../../utils/productUtils', () => {
  const actual = jest.requireActual('../../utils/productUtils');
  return {
    ...actual,
    getFallbackImage: jest.fn(() => 'fallback-image.png'),
  };
});

const mockProductLibraryBar = jest.fn();
const mockProductLibraryTable = jest.fn();
const mockProductLibrarySidePanel = jest.fn();

jest.mock('../../components/ProductLibraryBar', () => {
  return function MockProductLibraryBar(props) {
    mockProductLibraryBar(props);
    return (
      <div data-testid="product-library-bar" onClick={() => props.onSortChange?.('name-asc')}>
        ProductLibraryBar
      </div>
    );
  };
});

jest.mock('../../components/ProductLibraryTable', () => {
  return function MockProductLibraryTable(props) {
    mockProductLibraryTable(props);
    return <div data-testid="product-library-table">ProductLibraryTable</div>;
  };
});

jest.mock('../../components/ProductLibrarySidePanel', () => {
  return function MockProductLibrarySidePanel(props) {
    mockProductLibrarySidePanel(props);
    return <div data-testid="product-library-side-panel">ProductLibrarySidePanel</div>;
  };
});

jest.mock('../../components/Modals/ProductDetailModal', () => {
  return function MockProductDetailModal(props) {
    return (
      <div data-testid="product-detail-modal">
        ProductDetailModal
        <button
          type="button"
          onClick={() => props.onClose?.()}
          data-testid="product-detail-modal-close"
        >
          Close
        </button>
      </div>
    );
  };
});

describe('ProductLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryAccessTypeValue = 'CONTRIBUTORS';
  });

  const defaultState = {
    preloadedState: {
      productData: {
        products: [],
        productFilters: {
          searchText: '',
          priceRange: { min: null, max: null },
          selectedBrand: [],
          selectedCategory: [],
          selectedBenchmark: [],
          selectedIntensity: [],
          selectedNpd: [],
          selectedPlatform: [],
          selectedPromoItem: []
        },
        viewMode: 'table'
      },
      regionRetailer: {
        categoryAccessType: 'CONTRIBUTORS',
      },
    }
  };

  it('should render without crashing', () => {
    renderWithProviders(<ProductLibrary />, defaultState);
    expect(screen.getByTestId('product-library-bar')).toBeInTheDocument();
  });

  it('should render ProductLibraryBar component', () => {
    renderWithProviders(<ProductLibrary />, defaultState);
    expect(screen.getByTestId('product-library-bar')).toBeInTheDocument();
  });

  it('should render ProductLibraryTable component', () => {
    renderWithProviders(<ProductLibrary />, defaultState);
    expect(screen.getByTestId('product-library-table')).toBeInTheDocument();
  });

  it('should pass sorted products to ProductLibraryTable in table view', async () => {
    const products = [
      { id: '2', name: 'Bravo', price: 500, tpnb: 'b' },
      { id: '1', name: 'Alpha', price: 300, tpnb: 'a' }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'table'
        }
      }
    });

    await waitFor(() => {
      expect(mockProductLibraryTable).toHaveBeenCalled();
    });

    const tableProps = mockProductLibraryTable.mock.calls.at(-1)[0];
    const productNames = tableProps.products.map((p) => p.name);
    expect(productNames).toEqual(['Alpha', 'Bravo']);
    expect(typeof tableProps.onProductClick).toBe('function');
    expect(typeof tableProps.onEditClick).toBe('function');

    tableProps.onProductClick(products[0]);
    tableProps.onEditClick(products[1]);

    await waitFor(() => {
      expect(screen.getByTestId('product-library-table')).toBeInTheDocument();
    });
  });

  it('should update sort order when onSortChange is called', async () => {
    const products = [
      { id: '1', name: 'Alpha', price: 100, tpnb: 'a' },
      { id: '2', name: 'Bravo', price: 300, tpnb: 'b' }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'table'
        }
      }
    });

    const { onSortChange } = mockProductLibraryBar.mock.calls[0][0];
    onSortChange('price-desc');

    await waitFor(() => {
      const lastCall = mockProductLibraryTable.mock.calls.at(-1);
      expect(lastCall[0].products.map((p) => p.price)).toEqual([300, 100]);
    });
  });

  it('should reset filters on mount', async () => {
    const preloadedState = {
      productData: {
        products: [],
        productFilters: {
          searchText: 'foo',
          priceRange: { min: 10, max: 20 },
          selectedBrand: ['Brand A'],
          selectedCategory: ['Category A'],
          selectedBenchmark: [1],
          selectedIntensity: ['High'],
          selectedNpd: [1],
          selectedPlatform: ['Online'],
          selectedPromoItem: [1]
        },
        viewMode: 'table'
      }
    };

    const { store } = renderWithProviders(<ProductLibrary />, { preloadedState });

    await waitFor(() => {
      const { productFilters } = store.getState().productData;
      expect(productFilters.selectedBrand).toEqual([]);
      expect(productFilters.selectedCategory).toEqual([]);
      expect(productFilters.searchText).toBe('');
      expect(productFilters.priceRange.min).toBe(0);
      expect(productFilters.priceRange.max).toBe(Infinity);
    });
  });

  it('should render grid view with products and open side panel on click', async () => {
    const products = [
      {
        id: '1',
        tpnb: '1001',
        name: 'Alpha Product',
        price: 199,
        brand_name: 'Brand A',
        subCategory_name: 'Category A',
        BENCHMARK: true,
        INTENSITY: 'High',
        NPD: false,
        PLATFORM: 'Online',
        PROMOITEM: false,
        image_url: 'https://example.com/image1.png'
      },
      {
        id: '2',
        tpnb: '1002',
        name: 'Beta Product',
        price: 299,
        brand_name: 'Brand B',
        subCategory_name: 'Category B',
        BENCHMARK: false,
        INTENSITY: 'Low',
        NPD: true,
        PLATFORM: 'In Store',
        PROMOITEM: true,
        image_url: 'https://example.com/image2.png'
      }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'grid'
        }
      }
    });

    expect(screen.getByText(/PRODUCT LIBRARY \(2\)/i)).toBeInTheDocument();
    expect(screen.queryByTestId('product-library-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('product-library-side-panel')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Alpha Product'));

    await waitFor(() =>
      expect(screen.getByTestId('product-library-side-panel')).toBeInTheDocument()
    );
  });

  it('should close the side panel when onClose is triggered', async () => {
    const products = [
      {
        id: '1',
        tpnb: '1001',
        name: 'Alpha Product',
        price: 199,
        brand_name: 'Brand A',
        subCategory_name: 'Category A',
        BENCHMARK: true,
        INTENSITY: 'High',
        NPD: false,
        PLATFORM: 'Online',
        PROMOITEM: false,
        image_url: 'https://example.com/image1.png'
      }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'grid'
        }
      }
    });

    fireEvent.click(screen.getByText('Alpha Product'));

    await waitFor(() =>
      expect(screen.getByTestId('product-library-side-panel')).toBeInTheDocument()
    );

    const sidePanelProps = mockProductLibrarySidePanel.mock.calls[0][0];
    expect(typeof sidePanelProps.onClose).toBe('function');
    sidePanelProps.onClose();

    await waitFor(() =>
      expect(screen.queryByTestId('product-library-side-panel')).not.toBeInTheDocument()
    );
  });

  it('should show empty state when no products in grid view', () => {
    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products: [],
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'grid'
        }
      }
    });

    expect(screen.getByText('No Products Available')).toBeInTheDocument();
  });

  it('should open and close add product modal when clicking the add product button', async () => {
    renderWithProviders(<ProductLibrary />, defaultState);

    const addButton = screen.getByRole('button', { name: /add product/i });
    expect(addButton).not.toBeDisabled();

    fireEvent.click(addButton);

    expect(screen.getByTestId('product-detail-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('product-detail-modal-close'));
    await waitFor(() =>
      expect(screen.queryByTestId('product-detail-modal')).not.toBeInTheDocument()
    );
  });

  it('should disable add product button when categoryAccessType is USERS', () => {
    mockCategoryAccessTypeValue = 'USERS';
    
    renderWithProviders(<ProductLibrary />, defaultState);

    const addButton = screen.getByRole('button', { name: /add product/i });
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should show tooltip when add product button is disabled for USERS', async () => {
    mockCategoryAccessTypeValue = 'USERS';
    
    renderWithProviders(<ProductLibrary />, defaultState);

    const addButton = screen.getByRole('button', { name: /add product/i });
    
    // Hover to trigger tooltip - MUI Tooltip needs mouseEnter on the span wrapper
    const tooltipWrapper = addButton.closest('span');
    fireEvent.mouseEnter(tooltipWrapper || addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/You do not have permission to add products/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should enable add product button when categoryAccessType is CONTRIBUTORS', () => {
    renderWithProviders(<ProductLibrary />, defaultState);

    const addButton = screen.getByRole('button', { name: /add product/i });
    expect(addButton).not.toBeDisabled();
    expect(addButton).not.toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should compute filter elements for ProductLibraryBar', () => {
    const products = [
      {
        id: '1',
        tpnb: '1001',
        name: 'Alpha Product',
        price: 500,
        brand_name: 'Brand A',
        subCategory_name: 'Category A',
        BENCHMARK: true,
        INTENSITY: 'High',
        NPD: false,
        PLATFORM: 'Online',
        PROMOITEM: true
      },
      {
        id: '2',
        tpnb: '1002',
        name: 'Beta Product',
        price: 100,
        brand_name: 'Brand B',
        subCategory_name: 'Category B',
        BENCHMARK: false,
        INTENSITY: 'Low',
        NPD: true,
        PLATFORM: 'In Store',
        PROMOITEM: false
      }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'table'
        }
      }
    });

    const { filterElements, filterPriceRange } = mockProductLibraryBar.mock.calls[0][0];
    expect(filterElements.brands).toEqual(['Brand A', 'Brand B']);
    expect(filterElements.subCategories).toEqual(['Category A', 'Category B']);
    expect(filterElements.benchmarks).toEqual([0, 1]);
    expect(filterElements.intensities).toEqual(['High', 'Low']);
    expect(filterElements.npds).toEqual([0, 1]);
    expect(filterElements.platforms).toEqual(['In Store', 'Online']);
    expect(filterElements.promoItems).toEqual([0, 1]);
    expect(filterPriceRange).toEqual({ min: 100, max: 500 });
  });

  it('should dispatch setPriceRange when filters have null values', async () => {
    const products = [
      { id: '1', name: 'Alpha', price: 100, tpnb: 'a' },
      { id: '2', name: 'Bravo', price: 300, tpnb: 'b' }
    ];

    const { store } = renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'table'
        }
      }
    });

    await waitFor(() => {
      const { priceRange } = store.getState().productData.productFilters;
      expect(priceRange).toEqual({ min: 100, max: 300 });
    });
  });

  it('should support different sort fields', async () => {
    const products = [
      { id: '1', name: 'Alpha', price: 200, tpnb: 'b', sales: 150, volume: 5 },
      { id: '2', name: 'Bravo', price: 100, tpnb: 'a', sales: 250, volume: 10 },
      { id: '3', name: 'Charlie', price: 300, tpnb: 'c', sales: 50, volume: 1 }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'table'
        }
      }
    });

    const { onSortChange } = mockProductLibraryBar.mock.calls[0][0];

    onSortChange('id-desc');
    await waitFor(() => {
      const lastCall = mockProductLibraryTable.mock.calls.at(-1);
      expect(lastCall[0].products.map((p) => p.tpnb)).toEqual(['c', 'b', 'a']);
    });

    onSortChange('sales-asc');
    await waitFor(() => {
      const lastCall = mockProductLibraryTable.mock.calls.at(-1);
      expect(lastCall[0].products.map((p) => p.sales)).toEqual([50, 150, 250]);
    });

    onSortChange('volume-desc');
    await waitFor(() => {
      const lastCall = mockProductLibraryTable.mock.calls.at(-1);
      expect(lastCall[0].products.map((p) => p.volume)).toEqual([10, 5, 1]);
    });

    onSortChange('unknown-asc');
    await waitFor(() => {
      const lastCall = mockProductLibraryTable.mock.calls.at(-1);
      expect(lastCall[0].products.length).toBe(3);
    });
  });

  it('should show fallback image on error', async () => {
    const utils = require('../../utils/productUtils');
    const products = [
      {
        id: '1',
        tpnb: '1001',
        name: 'Alpha Product',
        price: 199,
        brand_name: 'Brand A',
        subCategory_name: 'Category A',
        BENCHMARK: true,
        INTENSITY: 'High',
        NPD: false,
        PLATFORM: 'Online',
        PROMOITEM: false,
        image_url: 'https://example.com/image1.png'
      }
    ];

    renderWithProviders(<ProductLibrary />, {
      preloadedState: {
        productData: {
          products,
          productFilters: {
            searchText: '',
            priceRange: { min: null, max: null },
            selectedBrand: [],
            selectedCategory: [],
            selectedBenchmark: [],
            selectedIntensity: [],
            selectedNpd: [],
            selectedPlatform: [],
            selectedPromoItem: []
          },
          viewMode: 'grid'
        }
      }
    });

    const image = screen.getByRole('img', { name: 'Alpha Product' });
    fireEvent.error(image);

    expect(utils.getFallbackImage).toHaveBeenCalledWith(products[0]);
    expect(image.getAttribute('src')).toBe('fallback-image.png');
  });
});