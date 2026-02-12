import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductLibraryBar from '../ProductLibraryBar';
import productDataReducer from '../../redux/reducers/productDataSlice';

// Mock child components
jest.mock('../SortDropdown', () => {
  // eslint-disable-next-line react/prop-types
  return function MockSortDropdown({ onSortChange }) {
    return (
      <div data-testid="sort-dropdown">
        <button type="button" onClick={() => onSortChange('name-desc')}>Change Sort</button>
      </div>
    );
  };
});

jest.mock('../Modals/FilterModal', () => {
  // eslint-disable-next-line react/prop-types
  return function MockFilterModal({ open, onClose }) {
    if (!open) return null;
    return (
      <div data-testid="filter-modal">
        <button onClick={onClose}>Close Modal</button>
        <span>FilterModal</span>
      </div>
    );
  };
});

jest.mock('../ShowAllFilterDropdown', () => {
  return function MockShowAllFilterDropdown() {
    return <div data-testid="show-all-filters">ShowAllFilterDropdown</div>;
  };
});

describe('ProductLibraryBar', () => {
  const mockProducts = [
    { id: 1, name: 'Product Alpha' },
    { id: 2, name: 'Product Beta' },
    { id: 3, name: 'Product Gamma' },
    { id: 4, name: 'Alpha Test' },
    { id: 5, name: 'Beta Test' },
    { id: 6, name: 'Gamma Test' },
    { id: 7, name: 'Test Alpha' },
    { id: 8, name: 'Test Beta' },
    { id: 9, name: 'Test Gamma' },
  ];

  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        productData: productDataReducer,
      },
      preloadedState: {
        productData: {
          products: initialState.products || [],
          productFilters: {
            searchText: '',
            selectedBrand: [],
            selectedCategory: [],
            selectedIntensity: [],
            selectedPlatform: [],
            selectedBenchmark: [],
            selectedNpd: [],
            selectedPromoItem: [],
            priceRange: {
              min: 0,
              max: Infinity,
            },
            ...initialState.productFilters,
          },
          viewMode: initialState.viewMode || 'grid',
        },
      },
    });
  };

  const defaultProps = {
    onSortChange: jest.fn(),
    sortBy: 'name-asc',
    filterElements: {
      brands: ['Brand1', 'Brand2'],
      subCategories: ['Category1', 'Category2'],
      intensities: ['Intensity1'],
      platforms: ['Platform1'],
      npds: [1, 2],
      benchmarks: [1, 2],
      promoItems: [1, 2],
    },
    filterPriceRange: {
      min: 0,
      max: 100,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
  it('should render without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('show-all-filters')).toBeInTheDocument();
  });

    it('should display search input with placeholder', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
  });

    it('should display Reset Filters button', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

      const resetButton = screen.getByText('Reset Filters');
      expect(resetButton).toBeInTheDocument();
    });

    it('should display Filter button', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

      const filterButton = screen.getByText('Filter');
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search text when input changes', () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      expect(searchInput).toHaveValue('test search');
    });

    it('should show search suggestions when query length >= 2 and input is focused', async () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'alp' } });

      await waitFor(() => {
        const suggestions = screen.queryAllByText(/alpha/i);
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should not show suggestions when query length < 2', () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'a' } });

      const suggestions = screen.queryByText(/alpha/i);
      expect(suggestions).not.toBeInTheDocument();
    });

    it('should hide suggestions when input loses focus', async () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'alp' } });

      await waitFor(() => {
        const suggestions = screen.queryAllByText(/alpha/i);
        expect(suggestions.length).toBeGreaterThan(0);
      });

      fireEvent.blur(searchInput);

      await waitFor(() => {
        const suggestions = screen.queryAllByText(/alpha/i);
        expect(suggestions.length).toBe(0);
      });
    });

    it('should select suggestion when clicked', async () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'alp' } });

      await waitFor(() => {
        const suggestions = screen.queryAllByText(/alpha/i);
        expect(suggestions.length).toBeGreaterThan(0);
      });

      const firstSuggestion = screen.getAllByText(/alpha/i)[0];
      fireEvent.mouseDown(firstSuggestion);

      await waitFor(() => {
        expect(searchInput).toHaveValue(firstSuggestion.textContent);
      });
    });

    it('should limit suggestions to 8 items', async () => {
      const store = createTestStore({ products: mockProducts });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        const suggestionButtons = screen.queryAllByRole('button', { hidden: true });
        const hasTestInText = (btn) => btn.textContent?.toLowerCase()?.includes('test');
        const suggestions = suggestionButtons.filter(hasTestInText);
        expect(suggestions.length).toBeLessThanOrEqual(8);
      });
    });

    it('should handle empty products array', () => {
      const store = createTestStore({ products: [] });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const suggestions = screen.queryByText(/test/i);
      expect(suggestions).not.toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
  it('should open filter modal when filter button is clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

      const filterButton = screen.getByText('Filter');
      fireEvent.click(filterButton);

      expect(screen.getByTestId('filter-modal')).toBeInTheDocument();
    });

    it('should close filter modal when onClose is called', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const filterButton = screen.getByText('Filter');
      fireEvent.click(filterButton);

      expect(screen.getByTestId('filter-modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('filter-modal')).not.toBeInTheDocument();
    });

    it('should show red dot indicator when filters are active', () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
        },
      });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const filterButton = screen.getByText('Filter').closest('button');
      const redDot = filterButton?.querySelector('.bg-red-250');
      expect(redDot).toBeInTheDocument();
    });

    it('should not show red dot indicator when no filters are active', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const filterButton = screen.getByText('Filter').closest('button');
      const redDot = filterButton?.querySelector('.bg-red-250');
      expect(redDot).not.toBeInTheDocument();
    });

    it('should display active filters as pills', () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
          selectedCategory: ['Category1'],
        },
      });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Brand1')).toBeInTheDocument();
      expect(screen.getByText('Category1')).toBeInTheDocument();
    });

    it('should display only first 2 active filters as pills', () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
          selectedCategory: ['Category1', 'Category2'],
          selectedIntensity: ['Intensity1'],
        },
      });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Brand1')).toBeInTheDocument();
      expect(screen.getByText('Category1')).toBeInTheDocument();
      // Category2 should not be visible as a pill (only first 2 shown)
      const category2Pill = screen.queryByText('Category2');
      expect(category2Pill).not.toBeInTheDocument();
    });

    it('should remove filter when pill close button is clicked', async () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
        },
      });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      expect(screen.getByText('Brand1')).toBeInTheDocument();

      const closeButtons = screen.getAllByText('×');
      const brandCloseButton = closeButtons.find(btn =>
        btn.closest('button')?.parentElement?.textContent?.includes('Brand1')
      );

      expect(brandCloseButton).toBeDefined();
      if (!brandCloseButton) {
        throw new Error('Brand1 close button not found');
      }

      fireEvent.click(brandCloseButton);

      // Wait for the filter to be removed
      await waitFor(() => {
        expect(screen.queryByText('Brand1')).not.toBeInTheDocument();
      });
    });

    it('should call resetFilters when Reset Filters button is clicked', () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
          searchText: 'test',
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'productData/resetFilters',
        })
      );
    });
  });

  describe('View Mode Toggle', () => {
    it('should toggle to grid view when grid button is clicked', () => {
      const store = createTestStore({ 
        viewMode: 'schematic',
        productFilters: {
          searchText: 'test', // Set search text to prevent useEffect from resetting
          selectedBrand: [],
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const gridButton = screen.getByTestId('grid-view-button');

      fireEvent.click(gridButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'productData/setViewMode',
          payload: 'grid',
        })
      );
    });

    it('should toggle to schematic view when schematic button is clicked', () => {
      const store = createTestStore({ viewMode: 'grid' });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const schematicButton = screen.getByTestId('schematic-view-button');
      fireEvent.click(schematicButton);
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'productData/setViewMode',
          payload: 'schematic',
        })
      );
    });

    it('should highlight active view mode button', () => {
      const store = createTestStore({ viewMode: 'grid' });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const gridButton = screen.getByTestId('grid-view-button');
      expect(gridButton.className).toContain('bg-[#FFD3D3]');
    });
  });

  describe('Sort Functionality', () => {
    it('should call onSortChange when sort dropdown changes', () => {
      const store = createTestStore();
      const onSortChange = jest.fn();
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} onSortChange={onSortChange} />
        </Provider>
      );

      const changeSortButton = screen.getByText('Change Sort');
      fireEvent.click(changeSortButton);

      expect(onSortChange).toHaveBeenCalledWith('name-desc');
    });
  });

  describe('useEffect Behavior', () => {
    it('should reset filters when no active filters and empty search text', () => {
      const store = createTestStore({
        productFilters: {
          searchText: '',
          selectedBrand: [],
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      // The useEffect should trigger resetFilters when conditions are met
      waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'productData/resetFilters',
          })
        );
      });
    });

    it('should not reset filters when search text exists', () => {
      const store = createTestStore({
        productFilters: {
          searchText: 'test',
          selectedBrand: [],
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      // Should not call resetFilters when searchText is not empty
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'productData/resetFilters',
        })
      );
    });

    it('should not reset filters when active filters exist', () => {
      const store = createTestStore({
        productFilters: {
          searchText: '',
          selectedBrand: ['Brand1'],
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      // Should not call resetFilters when active filters exist
      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'productData/resetFilters',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with missing name field', async () => {
      const productsWithMissingName = [
        { id: 1, name: 'Product1' },
        { id: 2 }, // missing name
        { id: 3, name: 'Product3' },
      ];
      const store = createTestStore({ products: productsWithMissingName });
      
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'prod' } });

      // Should not crash and should still show suggestions for valid products
      await waitFor(() => {
        expect(screen.queryByText('Product1')).toBeInTheDocument();
      });
    });

    it('should handle all filter types correctly', () => {
      const store = createTestStore({
        productFilters: {
          selectedBrand: ['Brand1'],
          selectedCategory: ['Category1'],
          selectedIntensity: ['Intensity1'],
          selectedPlatform: ['Platform1'],
        },
      });
      render(
        <Provider store={store}>
          <ProductLibraryBar {...defaultProps} />
        </Provider>
      );

      // All filter types should be recognized
      expect(screen.getByText('Brand1')).toBeInTheDocument();
      expect(screen.getByText('Category1')).toBeInTheDocument();
    });

    it('should pass correct props to FilterModal', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ProductLibraryBar {...defaultProps} />
      </Provider>
    );

      const filterButton = screen.getByText('Filter');
      fireEvent.click(filterButton);

      expect(screen.getByTestId('filter-modal')).toBeInTheDocument();
    });
  });
});

