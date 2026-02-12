import reducer, {
  setProducts,
  resetProducts,
  setViewMode,
  setPriceRange,
  setSearchText,
  setSelectedBrand,
  setSelectedCategory,
  setSelectedBenchmark,
  setSelectedIntensity,
  setSelectedNpd,
  setSelectedPlatform,
  setSelectedPromoItem,
  resetFilters,
  removeFilterByValue,
  selectAllProducts,
  selectProductById,
  selectProductMap,
  selectFilters,
  selectViewMode,
} from '../productDataSlice';

// Mock dependencies
jest.mock('../../../config/productCategoryColorCode', () => ({
  getProductCategoryColor: jest.fn((category) => {
    const colorMap = {
      'SENSITIVE TOOTHPASTE': '#F44336',
      'REGULAR TOOTHPASTE': '#2196F3',
    };
    return colorMap[category?.toUpperCase()] || '#9E9E9E';
  }),
}));

jest.mock('../../../utils/productUtils', () => ({
  flattenProduct: jest.fn((product) => {
    const { dimension = {}, attributes = {}, ...rest } = product;
    const mappedAttributes = { ...attributes };
    if ('BRAND' in mappedAttributes) {
      mappedAttributes.brand_name = mappedAttributes.BRAND;
      delete mappedAttributes.BRAND;
    }
    if ('SUB_CATEGORY' in mappedAttributes) {
      mappedAttributes.subCategory_name = mappedAttributes.SUB_CATEGORY;
      delete mappedAttributes.SUB_CATEGORY;
    }
    return {
      ...rest,
      ...dimension,
      ...mappedAttributes,
    };
  }),
}));

import { getProductCategoryColor } from '../../../config/productCategoryColorCode';
import { flattenProduct } from '../../../utils/productUtils';

describe('productDataSlice', () => {
  const initialState = {
    products: [],
    productDetailsMap: {},
    viewMode: 'grid',
    productFilters: {
      selectedCategory: [],
      selectedBrand: [],
      selectedBenchmark: [],
      selectedIntensity: [],
      selectedNpd: [],
      selectedPlatform: [],
      selectedPromoItem: [],
      searchText: '',
      priceRange: {
        min: 0,
        max: Infinity,
      }
    },
    dimensionFilters: {
      width: { min: 0, max: 1000 },
      height: { min: 0, max: 1000 },
      depth: { min: 0, max: 1000 },
    },
    status: "idle",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setProducts', () => {
    it('should set products and productDetailsMap', () => {
      const products = [
        {
          id: 'product-1',
          name: 'Product 1',
          dimension: { width: 100, height: 200 },
          attributes: { BRAND: 'Brand1', SUB_CATEGORY: 'SENSITIVE TOOTHPASTE' }
        },
        {
          id: 'product-2',
          name: 'Product 2',
          dimension: { width: 150, height: 250 },
          attributes: { BRAND: 'Brand2', SUB_CATEGORY: 'REGULAR TOOTHPASTE' }
        }
      ];

      const action = setProducts(products);
      const state = reducer(initialState, action);

      expect(flattenProduct).toHaveBeenCalledTimes(2);
      expect(getProductCategoryColor).toHaveBeenCalled();
      expect(state.products).toHaveLength(2);
      expect(state.productDetailsMap['product-1']).toBeDefined();
      expect(state.productDetailsMap['product-2']).toBeDefined();
    });

    it('should handle empty array', () => {
      const action = setProducts([]);
      const state = reducer(initialState, action);
      expect(state.products).toEqual([]);
      expect(state.productDetailsMap).toEqual({});
    });

    it('should handle null payload', () => {
      const action = setProducts(null);
      const state = reducer(initialState, action);
      expect(state.products).toEqual([]);
      expect(state.productDetailsMap).toEqual({});
    });

    it('should not add products without id to productDetailsMap', () => {
      const products = [
        {
          name: 'Product without ID',
          dimension: { width: 100 },
        }
      ];
      const action = setProducts(products);
      const state = reducer(initialState, action);
      expect(state.products.length).toBeGreaterThan(0);
      expect(Object.keys(state.productDetailsMap).length).toBe(0);
    });
  });

  describe('resetProducts', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setProducts([{ id: 'product-1' }]));
      const action = resetProducts();
      state = reducer(state, action);
      expect(state).toEqual(initialState);
    });
  });

  describe('setViewMode', () => {
    it('should set view mode', () => {
      const action = setViewMode('list');
      const state = reducer(initialState, action);
      expect(state.viewMode).toBe('list');
    });
  });

  describe('setSelectedCategory', () => {
    it('should set selected category', () => {
      const categories = ['Category1', 'Category2'];
      const action = setSelectedCategory(categories);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedCategory).toEqual(categories);
    });
  });

  describe('setSelectedBrand', () => {
    it('should set selected brand', () => {
      const brands = ['Brand1', 'Brand2'];
      const action = setSelectedBrand(brands);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedBrand).toEqual(brands);
    });
  });

  describe('setSelectedBenchmark', () => {
    it('should set selected benchmark', () => {
      const benchmarks = ['Benchmark1'];
      const action = setSelectedBenchmark(benchmarks);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedBenchmark).toEqual(benchmarks);
    });
  });

  describe('setSelectedIntensity', () => {
    it('should set selected intensity', () => {
      const intensities = ['Intensity1'];
      const action = setSelectedIntensity(intensities);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedIntensity).toEqual(intensities);
    });
  });

  describe('setSelectedNpd', () => {
    it('should set selected npd', () => {
      const npds = ['Npd1'];
      const action = setSelectedNpd(npds);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedNpd).toEqual(npds);
    });
  });

  describe('setSelectedPlatform', () => {
    it('should set selected platform', () => {
      const platforms = ['Platform1'];
      const action = setSelectedPlatform(platforms);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedPlatform).toEqual(platforms);
    });
  });

  describe('setSelectedPromoItem', () => {
    it('should set selected promo item', () => {
      const promoItems = ['Promo1'];
      const action = setSelectedPromoItem(promoItems);
      const state = reducer(initialState, action);
      expect(state.productFilters.selectedPromoItem).toEqual(promoItems);
    });
  });

  describe('setSearchText', () => {
    it('should set search text', () => {
      const action = setSearchText('test search');
      const state = reducer(initialState, action);
      expect(state.productFilters.searchText).toBe('test search');
    });
  });

  describe('setPriceRange', () => {
    it('should set price range', () => {
      const priceRange = { min: 10, max: 100 };
      const action = setPriceRange(priceRange);
      const state = reducer(initialState, action);
      expect(state.productFilters.priceRange.min).toBe(10);
      expect(state.productFilters.priceRange.max).toBe(100);
    });
  });

  describe('removeFilterByValue', () => {
    it('should remove value from array filters', () => {
      let state = reducer(initialState, setSelectedBrand(['Brand1', 'Brand2', 'Brand3']));
      state = reducer(state, setSelectedCategory(['Category1', 'Category2']));
      
      const action = removeFilterByValue('Brand2');
      state = reducer(state, action);
      
      expect(state.productFilters.selectedBrand).not.toContain('Brand2');
      expect(state.productFilters.selectedBrand).toContain('Brand1');
      expect(state.productFilters.selectedBrand).toContain('Brand3');
    });

    it('should remove value from multiple array filters', () => {
      let state = reducer(initialState, setSelectedBrand(['Brand1', 'Brand2']));
      state = reducer(state, setSelectedCategory(['Brand2'])); // Same value in different filter
      
      const action = removeFilterByValue('Brand2');
      state = reducer(state, action);
      
      expect(state.productFilters.selectedBrand).not.toContain('Brand2');
      expect(state.productFilters.selectedCategory).not.toContain('Brand2');
    });

    it('should not affect non-array filters', () => {
      let state = reducer(initialState, setSearchText('test'));
      const action = removeFilterByValue('test');
      state = reducer(state, action);
      expect(state.productFilters.searchText).toBe('test');
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to initial state', () => {
      let state = reducer(initialState, setSelectedBrand(['Brand1']));
      state = reducer(state, setSelectedCategory(['Category1']));
      state = reducer(state, setSearchText('test'));
      state = reducer(state, setPriceRange({ min: 10, max: 100 }));
      
      const action = resetFilters();
      state = reducer(state, action);
      
      expect(state.productFilters).toEqual(initialState.productFilters);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      productData: {
        products: [{ id: 'product-1', name: 'Product 1' }],
        productDetailsMap: {
          'product-1': { id: 'product-1', name: 'Product 1' }
        },
        viewMode: 'list',
        productFilters: {
          selectedCategory: ['Category1'],
          selectedBrand: ['Brand1'],
          selectedBenchmark: [],
          selectedIntensity: [],
          selectedNpd: [],
          selectedPlatform: [],
          selectedPromoItem: [],
          searchText: 'test',
          priceRange: { min: 0, max: Infinity }
        }
      }
    };

    it('selectAllProducts should return products', () => {
      expect(selectAllProducts(mockState)).toEqual([{ id: 'product-1', name: 'Product 1' }]);
    });

    it('selectProductById should return product by id', () => {
      expect(selectProductById(mockState, 'product-1')).toEqual({ id: 'product-1', name: 'Product 1' });
      expect(selectProductById(mockState, 'non-existent')).toBe(null);
    });

    it('selectProductMap should return productDetailsMap', () => {
      expect(selectProductMap(mockState)).toEqual({
        'product-1': { id: 'product-1', name: 'Product 1' }
      });
    });

    it('selectFilters should return productFilters', () => {
      expect(selectFilters(mockState)).toEqual(mockState.productData.productFilters);
    });

    it('selectViewMode should return viewMode', () => {
      expect(selectViewMode(mockState)).toBe('list');
    });
  });
});

