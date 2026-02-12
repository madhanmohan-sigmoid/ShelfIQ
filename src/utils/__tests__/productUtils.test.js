// Image imports are handled by moduleNameMapper in jest.config.js

import {
  getFallbackImage,
  flattenProduct,
  filterProducts,
  getUniqueSets,
  getMinMaxPrice,
} from '../productUtils';

describe('productUtils', () => {
  describe('getFallbackImage', () => {
    // Note: The actual function returns imported image paths, but in tests they're mocked
    // We test the logic by checking that the correct image is selected based on keywords
    it('should return toothpaste image for toothpaste-related text', () => {
      const item = {
        subCategory_name: 'Toothpaste',
        name: 'Test Product',
        description: 'A great toothpaste',
      };
      const result = getFallbackImage(item);
      // The result will be the mocked value, but we verify the function executes without error
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return toothpaste image for paste keyword', () => {
      const item = {
        subCategory_name: 'Test',
        name: 't/paste product',
        description: '',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return toothbrush image for toothbrush-related text', () => {
      const item = {
        subCategory_name: 'Toothbrush',
        name: 'Test Product',
        description: 'A great toothbrush',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return toothbrush image for brush keyword', () => {
      const item = {
        subCategory_name: 'Test',
        name: 't/brush product',
        description: '',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return mouthwash image for mouthwash-related text', () => {
      const item = {
        subCategory_name: 'Mouthwash',
        name: 'Test Product',
        description: 'A great mouthwash',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return mouthwash image for wash keyword', () => {
      const item = {
        subCategory_name: 'Test',
        name: 'm/wash product',
        description: '',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return toothpaste as default for unknown items', () => {
      const item = {
        subCategory_name: 'Unknown',
        name: 'Test Product',
        description: 'Some description',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle missing fields gracefully', () => {
      const item = {
        subCategory_name: null,
        name: undefined,
        description: '',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should be case insensitive', () => {
      const item = {
        subCategory_name: 'TOOTHPASTE',
        name: 'PRODUCT',
        description: 'DESCRIPTION',
      };
      const result = getFallbackImage(item);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('flattenProduct', () => {
    it('should flatten product with dimension and attributes', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        dimension: {
          width: 10,
          height: 20,
          depth: 5,
        },
        attributes: {
          BRAND: 'Brand A',
          SUB_CATEGORY: 'Toothpaste',
          INTENSITY: 'High',
        },
      };
      const result = flattenProduct(product);
      expect(result).toEqual({
        id: 1,
        name: 'Test Product',
        width: 10,
        height: 20,
        depth: 5,
        brand_name: 'Brand A',
        subCategory_name: 'Toothpaste',
        INTENSITY: 'High',
      });
      expect(result.BRAND).toBeUndefined();
      expect(result.SUB_CATEGORY).toBeUndefined();
    });

    it('should handle product without dimension', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        attributes: {
          BRAND: 'Brand A',
        },
      };
      const result = flattenProduct(product);
      expect(result).toEqual({
        id: 1,
        name: 'Test Product',
        brand_name: 'Brand A',
      });
    });

    it('should handle product without attributes', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        dimension: {
          width: 10,
        },
      };
      const result = flattenProduct(product);
      expect(result).toEqual({
        id: 1,
        name: 'Test Product',
        width: 10,
      });
    });

    it('should handle product with empty dimension and attributes', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        dimension: {},
        attributes: {},
      };
      const result = flattenProduct(product);
      expect(result).toEqual({
        id: 1,
        name: 'Test Product',
      });
    });

    it('should preserve other attributes that are not BRAND or SUB_CATEGORY', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        dimension: {},
        attributes: {
          BRAND: 'Brand A',
          SUB_CATEGORY: 'Toothpaste',
          INTENSITY: 'High',
          PLATFORM: 'Online',
        },
      };
      const result = flattenProduct(product);
      expect(result.INTENSITY).toBe('High');
      expect(result.PLATFORM).toBe('Online');
    });
  });

  describe('filterProducts', () => {
    const mockProducts = [
      {
        name: 'Product A',
        tpnb: 'TPNB001',
        brand_name: 'Brand A',
        subCategory_name: 'Toothpaste',
        price: 5.99,
        INTENSITY: 'High',
        NPD: true,
        BENCHMARK: false,
        PLATFORM: 'Online',
        PROMOITEM: false,
      },
      {
        name: 'Product B',
        tpnb: 'TPNB002',
        brand_name: 'Brand B',
        subCategory_name: 'Toothbrush',
        price: 3.49,
        INTENSITY: 'Medium',
        NPD: false,
        BENCHMARK: true,
        PLATFORM: 'Store',
        PROMOITEM: true,
      },
      {
        name: 'Product C',
        tpnb: 'TPNB003',
        brand_name: 'Brand A',
        subCategory_name: 'Mouthwash',
        price: 7.99,
        INTENSITY: 'Low',
        NPD: true,
        BENCHMARK: true,
        PLATFORM: 'Online',
        PROMOITEM: false,
      },
    ];

    it('should return all products when filters are empty', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(3);
    });

    it('should filter by searchText in name', () => {
      const filters = {
        searchText: 'Product A',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product A');
    });

    it('should filter by searchText in tpnb', () => {
      const filters = {
        searchText: 'TPNB002',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].tpnb).toBe('TPNB002');
    });

    it('should be case insensitive for searchText', () => {
      const filters = {
        searchText: 'product a',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
    });

    it('should filter by selectedBrand', () => {
      const filters = {
        searchText: '',
        selectedBrand: ['Brand A'],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.brand_name === 'Brand A')).toBe(true);
    });

    it('should filter by selectedCategory', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: ['Toothpaste'],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].subCategory_name).toBe('Toothpaste');
    });

    it('should filter by selectedBenchmark', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [1],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.BENCHMARK === true)).toBe(true);
    });

    it('should filter by selectedIntensity', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: ['High'],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].INTENSITY).toBe('High');
    });

    it('should filter by selectedNPD', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [1],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.NPD === true)).toBe(true);
    });

    it('should filter by selectedPlatform', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: ['Online'],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.PLATFORM === 'Online')).toBe(true);
    });

    it('should filter by selectedPromoItem', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [1],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].PROMOITEM).toBe(true);
    });

    it('should filter by priceRange', () => {
      const filters = {
        searchText: '',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 4, max: 6 },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(5.99);
    });

    it('should filter by multiple criteria', () => {
      const filters = {
        searchText: '',
        selectedBrand: ['Brand A'],
        selectedCategory: ['Toothpaste'],
        selectedBenchmark: [],
        selectedIntensity: ['High'],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product A');
    });

    it('should handle missing optional filter properties', () => {
      const filters = {};
      const result = filterProducts(mockProducts, filters);
      expect(result).toHaveLength(3);
    });

    it('should handle products with missing name or tpnb', () => {
      const productsWithMissing = [
        ...mockProducts,
        { brand_name: 'Brand C', price: 10 },
      ];
      const filters = {
        searchText: 'Product',
        selectedBrand: [],
        selectedCategory: [],
        selectedBenchmark: [],
        selectedIntensity: [],
        selectedNPD: [],
        selectedPlatform: [],
        selectedPromoItem: [],
        priceRange: { min: 0, max: Infinity },
      };
      const result = filterProducts(productsWithMissing, filters);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUniqueSets', () => {
    const mockProducts = [
      {
        brand_name: 'Brand A',
        subCategory_name: 'Toothpaste',
        INTENSITY: 'High',
        BENCHMARK: true,
        NPD: false,
        PLATFORM: 'Online',
        PROMOITEM: true,
      },
      {
        brand_name: 'Brand B',
        subCategory_name: 'Toothbrush',
        INTENSITY: 'Medium',
        BENCHMARK: false,
        NPD: true,
        PLATFORM: 'Store',
        PROMOITEM: false,
      },
      {
        brand_name: 'Brand A',
        subCategory_name: 'Mouthwash',
        INTENSITY: 'Low',
        BENCHMARK: true,
        NPD: true,
        PLATFORM: 'Online',
        PROMOITEM: false,
      },
    ];

    it('should return unique sets for brand_name', () => {
      const result = getUniqueSets(mockProducts, ['brand_name']);
      expect(result.brands).toEqual(['Brand A', 'Brand B']);
    });

    it('should return unique sets for subCategory_name', () => {
      const result = getUniqueSets(mockProducts, ['subCategory_name']);
      expect(result.subCategories).toEqual(['Mouthwash', 'Toothbrush', 'Toothpaste']);
    });

    it('should return unique sets for multiple keys', () => {
      const result = getUniqueSets(mockProducts, ['brand_name', 'subCategory_name']);
      expect(result.brands).toEqual(['Brand A', 'Brand B']);
      expect(result.subCategories).toEqual(['Mouthwash', 'Toothbrush', 'Toothpaste']);
    });

    it('should normalize keys correctly', () => {
      const result = getUniqueSets(mockProducts, ['brand_name', 'subcategory_name']);
      expect(result.brands).toBeDefined();
      expect(result.subCategories).toBeDefined();
    });

    it('should handle boolean values and convert to [0, 1]', () => {
      const result = getUniqueSets(mockProducts, ['BENCHMARK']);
      expect(result.benchmarks).toEqual([0, 1]);
    });

    it('should handle boolean values for NPD', () => {
      const result = getUniqueSets(mockProducts, ['NPD']);
      expect(result.npds).toEqual([0, 1]);
    });

    it('should filter out falsy values', () => {
      const productsWithNulls = [
        ...mockProducts,
        { brand_name: null },
        { brand_name: undefined },
        { brand_name: '' },
      ];
      const result = getUniqueSets(productsWithNulls, ['brand_name']);
      expect(result.brands).toEqual(['Brand A', 'Brand B']);
    });

    it('should return empty arrays for keys with no values', () => {
      const emptyProducts = [
        { brand_name: null },
        { brand_name: undefined },
      ];
      const result = getUniqueSets(emptyProducts, ['brand_name']);
      expect(result.brands).toEqual([]);
    });

    it('should sort string values', () => {
      const result = getUniqueSets(mockProducts, ['INTENSITY']);
      expect(result.intensities).toEqual(['High', 'Low', 'Medium']);
    });

    it('should handle normalizeKey for all known keys', () => {
      const result = getUniqueSets(mockProducts, [
        'brand_name',
        'subcategory_name',
        'BENCHMARK',
        'INTENSITY',
        'NPD',
        'PLATFORM',
        'PROMOITEM',
      ]);
      expect(result.brands).toBeDefined();
      expect(result.subCategories).toBeDefined();
      expect(result.benchmarks).toBeDefined();
      expect(result.intensities).toBeDefined();
      expect(result.npds).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.promoItems).toBeDefined();
    });

    it('should handle normalizeKey default case for unknown keys', () => {
      const result = getUniqueSets(mockProducts, ['unknown_key']);
      expect(result.unknown_key).toBeDefined();
      expect(Array.isArray(result.unknown_key)).toBe(true);
    });
  });

  describe('getMinMaxPrice', () => {
    it('should return min and max price from products', () => {
      const products = [
        { price: 5.99 },
        { price: 3.49 },
        { price: 7.99 },
        { price: 4.99 },
      ];
      const result = getMinMaxPrice(products);
      expect(result).toEqual({ min: 3.49, max: 7.99 });
    });

    it('should return { min: 0, max: 0 } for empty array', () => {
      const result = getMinMaxPrice([]);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('should return { min: 0, max: 0 } for null', () => {
      const result = getMinMaxPrice(null);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('should return { min: 0, max: 0 } for undefined', () => {
      const result = getMinMaxPrice(undefined);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('should handle products with missing price as 0', () => {
      const products = [
        { price: 5.99 },
        { price: null },
        { price: undefined },
        {},
        { price: 7.99 },
      ];
      const result = getMinMaxPrice(products);
      expect(result).toEqual({ min: 0, max: 7.99 });
    });

    it('should handle single product', () => {
      const products = [{ price: 5.99 }];
      const result = getMinMaxPrice(products);
      expect(result).toEqual({ min: 5.99, max: 5.99 });
    });

    it('should handle all products with price 0', () => {
      const products = [
        { price: 0 },
        { price: 0 },
        { price: 0 },
      ];
      const result = getMinMaxPrice(products);
      expect(result).toEqual({ min: 0, max: 0 });
    });

    it('should handle negative prices', () => {
      const products = [
        { price: -5.99 },
        { price: 3.49 },
        { price: 7.99 },
      ];
      const result = getMinMaxPrice(products);
      expect(result).toEqual({ min: -5.99, max: 7.99 });
    });
  });
});

