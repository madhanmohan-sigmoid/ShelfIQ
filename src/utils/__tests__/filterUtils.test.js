import {
  getFilteredProducts,
  getUniqueOptions,
  getBrandCounts,
  getSubCategoryCounts,
  filteredProducts,
} from '../filterUtils';

describe('filterUtils', () => {
  const mockProducts = [
    {
      product_details: {
        subCategory_name: 'Toothpaste',
        brand_name: 'Brand A',
        price: 5.99,
        INTENSITY: 'High',
        NPD: true,
        BENCHMARK: false,
        PROMOITEM: true,
        PLATFORM: 'Online',
      },
    },
    {
      product_details: {
        subCategory_name: 'Toothbrush',
        brand_name: 'Brand B',
        price: 3.49,
        INTENSITY: 'Medium',
        NPD: false,
        BENCHMARK: true,
        PROMOITEM: false,
        PLATFORM: 'Store',
      },
    },
    {
      product_details: {
        subCategory_name: 'Toothpaste',
        brand_name: 'Brand A',
        price: 7.99,
        INTENSITY: 'Low',
        NPD: true,
        BENCHMARK: true,
        PROMOITEM: false,
        PLATFORM: 'Online',
      },
    },
    {
      product_details: {
        subCategory_name: 'Mouthwash',
        brand_name: 'Brand C',
        price: 4.99,
        INTENSITY: 'High',
        NPD: false,
        BENCHMARK: false,
        PROMOITEM: true,
        PLATFORM: 'Store',
      },
    },
  ];

  describe('getFilteredProducts', () => {
    it('should return empty array when apiProducts is null or undefined', () => {
      expect(getFilteredProducts(null, {})).toEqual([]);
      expect(getFilteredProducts(undefined, {})).toEqual([]);
    });

    it('should return all products when filters are empty', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by subCategory', () => {
      const filters = {
        subCategories: ['Toothpaste'],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.subCategory_name === 'Toothpaste')).toBe(true);
    });

    it('should filter by brand', () => {
      const filters = {
        subCategories: [],
        brands: ['Brand A'],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.brand_name === 'Brand A')).toBe(true);
    });

    it('should filter by price range', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [4, 6],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => {
        const price = p.product_details.price;
        return price >= 4 && price <= 6;
      })).toBe(true);
    });

    it('should filter by intensity', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: ['High'],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.INTENSITY === 'High')).toBe(true);
    });

    it('should filter by NPD', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [1],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.NPD === true)).toBe(true);
    });

    it('should filter by benchmark', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [1],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.BENCHMARK === true)).toBe(true);
    });

    it('should filter by promoItem', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [1],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.PROMOITEM === true)).toBe(true);
    });

    it('should filter by platform', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: ['Online'],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.PLATFORM === 'Online')).toBe(true);
    });

    it('should filter by multiple criteria', () => {
      const filters = {
        subCategories: ['Toothpaste'],
        brands: ['Brand A'],
        priceRange: [5, 8],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => {
        return (
          p.product_details.subCategory_name === 'Toothpaste' &&
          p.product_details.brand_name === 'Brand A' &&
          p.product_details.price >= 5 &&
          p.product_details.price <= 8
        );
      })).toBe(true);
    });

    it('should exclude filter by excludeKey for subCategories', () => {
      const filters = {
        subCategories: ['Toothbrush'],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters, 'subCategories');
      expect(result).toHaveLength(4);
    });

    it('should exclude filter by excludeKey for brands', () => {
      const filters = {
        subCategories: [],
        brands: ['Brand C'],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters, 'brands');
      expect(result).toHaveLength(4);
    });

    it('should exclude filter by excludeKey for priceRange', () => {
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [1, 2],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(mockProducts, filters, 'priceRange');
      expect(result).toHaveLength(4);
    });

    it('should handle products with missing product_details', () => {
      const productsWithMissing = [
        ...mockProducts,
        { product_details: null },
        {},
      ];
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(productsWithMissing, filters);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle price as non-number', () => {
      const productsWithStringPrice = [
        {
          product_details: {
            subCategory_name: 'Test',
            brand_name: 'Test',
            price: 'invalid',
            INTENSITY: 'High',
            NPD: false,
            BENCHMARK: false,
            PROMOITEM: false,
            PLATFORM: 'Online',
          },
        },
      ];
      const filters = {
        subCategories: [],
        brands: [],
        priceRange: [1, 10],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = getFilteredProducts(productsWithStringPrice, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('getUniqueOptions', () => {
    it('should return unique values for a given key', () => {
      const result = getUniqueOptions(mockProducts, 'subCategory_name');
      expect(result).toEqual(['Toothpaste', 'Toothbrush', 'Mouthwash']);
    });

    it('should return unique values for brand_name', () => {
      const result = getUniqueOptions(mockProducts, 'brand_name');
      expect(result).toEqual(['Brand A', 'Brand B', 'Brand C']);
    });

    it('should filter out falsy values', () => {
      const productsWithNulls = [
        ...mockProducts,
        { product_details: { subCategory_name: null } },
        { product_details: { subCategory_name: undefined } },
        { product_details: { subCategory_name: '' } },
      ];
      const result = getUniqueOptions(productsWithNulls, 'subCategory_name');
      expect(result).toEqual(['Toothpaste', 'Toothbrush', 'Mouthwash']);
    });

    it('should return empty array when no products match', () => {
      const result = getUniqueOptions([], 'subCategory_name');
      expect(result).toEqual([]);
    });

    it('should handle missing product_details', () => {
      const productsWithMissing = [
        ...mockProducts,
        { product_details: null },
        {},
      ];
      const result = getUniqueOptions(productsWithMissing, 'subCategory_name');
      expect(result).toEqual(['Toothpaste', 'Toothbrush', 'Mouthwash']);
    });
  });

  describe('getBrandCounts', () => {
    it('should return empty object when apiProducts is null', () => {
      const filters = {
        subCategories: [],
        priceRange: [],
      };
      expect(getBrandCounts(null, filters)).toEqual({});
    });

    it('should count brands without filters', () => {
      const filters = {
        subCategories: [],
        priceRange: [],
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result).toEqual({
        'Brand A': 2,
        'Brand B': 1,
        'Brand C': 1,
      });
    });

    it('should count brands with subCategory filter', () => {
      const filters = {
        subCategories: ['Toothpaste'],
        priceRange: [],
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result).toEqual({
        'Brand A': 2,
        'Brand B': 0,
        'Brand C': 0,
      });
    });

    it('should count brands with price range filter', () => {
      const filters = {
        subCategories: [],
        priceRange: [4, 6],
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result['Brand A']).toBe(1);
      expect(result['Brand C']).toBe(1);
    });

    it('should count brands with both subCategory and price filters', () => {
      const filters = {
        subCategories: ['Toothpaste'],
        priceRange: [5, 8],
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result['Brand A']).toBe(2);
    });

    it('should handle empty price range', () => {
      const filters = {
        subCategories: [],
        priceRange: [],
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result['Brand A']).toBe(2);
    });

    it('should compute price range from products when malformed', () => {
      const filters = {
        subCategories: [],
        priceRange: [1], // malformed - should compute from products
      };
      const result = getBrandCounts(mockProducts, filters);
      expect(result).toBeDefined();
      expect(typeof result['Brand A']).toBe('number');
    });

    it('should handle malformed price range with no valid prices', () => {
      const productsWithNoPrices = [
        {
          product_details: {
            brand_name: 'Brand A',
            price: null,
            subCategory_name: 'Test',
          },
        },
        {
          product_details: {
            brand_name: 'Brand B',
            price: undefined,
            subCategory_name: 'Test',
          },
        },
      ];
      const filters = {
        subCategories: [],
        priceRange: [1], // malformed - should compute from products
      };
      const result = getBrandCounts(productsWithNoPrices, filters);
      // Should use default range [0, 1000000] when no valid prices
      // But products with null/undefined prices won't match price filter (requires typeof price === "number")
      expect(result).toBeDefined();
      expect(result['Brand A']).toBe(0);
      expect(result['Brand B']).toBe(0);
    });

    it('should handle products with missing price', () => {
      const productsWithMissingPrice = [
        ...mockProducts,
        {
          product_details: {
            brand_name: 'Brand D',
            price: undefined,
            subCategory_name: 'Test',
          },
        },
      ];
      const filters = {
        subCategories: [],
        priceRange: [1, 10],
      };
      const result = getBrandCounts(productsWithMissingPrice, filters);
      expect(result['Brand D']).toBe(0);
    });
  });

  describe('getSubCategoryCounts', () => {
    it('should return empty object when apiProducts is null', () => {
      const filters = {
        brands: [],
        priceRange: [],
      };
      expect(getSubCategoryCounts(null, filters)).toEqual({});
    });

    it('should count subCategories without filters', () => {
      const filters = {
        brands: [],
        priceRange: [],
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result).toEqual({
        'Toothpaste': 2,
        'Toothbrush': 1,
        'Mouthwash': 1,
      });
    });

    it('should count subCategories with brand filter', () => {
      const filters = {
        brands: ['Brand A'],
        priceRange: [],
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result).toEqual({
        'Toothpaste': 2,
        'Toothbrush': 0,
        'Mouthwash': 0,
      });
    });

    it('should count subCategories with price range filter', () => {
      const filters = {
        brands: [],
        priceRange: [4, 6],
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result['Toothpaste']).toBe(1);
      expect(result['Mouthwash']).toBe(1);
    });

    it('should count subCategories with both brand and price filters', () => {
      const filters = {
        brands: ['Brand A'],
        priceRange: [5, 8],
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result['Toothpaste']).toBe(2);
    });

    it('should handle empty price range', () => {
      const filters = {
        brands: [],
        priceRange: [],
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result['Toothpaste']).toBe(2);
    });

    it('should compute price range from products when malformed', () => {
      const filters = {
        brands: [],
        priceRange: [1], // malformed - should compute from products
      };
      const result = getSubCategoryCounts(mockProducts, filters);
      expect(result).toBeDefined();
      expect(typeof result['Toothpaste']).toBe('number');
    });

    it('should handle malformed price range with no valid prices', () => {
      const productsWithNoPrices = [
        {
          product_details: {
            subCategory_name: 'Test A',
            brand_name: 'Brand A',
            price: null,
          },
        },
        {
          product_details: {
            subCategory_name: 'Test B',
            brand_name: 'Brand B',
            price: undefined,
          },
        },
      ];
      const filters = {
        brands: [],
        priceRange: [1], // malformed - should compute from products
      };
      const result = getSubCategoryCounts(productsWithNoPrices, filters);
      // Should use default range [0, 1000000] when no valid prices
      // But products with null/undefined prices won't match price filter (requires typeof price === "number")
      expect(result).toBeDefined();
      expect(result['Test A']).toBe(0);
      expect(result['Test B']).toBe(0);
    });
  });

  describe('filteredProducts', () => {
    it('should call getFilteredProducts with same arguments', () => {
      const filters = {
        subCategories: ['Toothpaste'],
        brands: [],
        priceRange: [],
        intensities: [],
        npds: [],
        benchmarks: [],
        promoItems: [],
        platforms: [],
      };
      const result = filteredProducts(mockProducts, filters);
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.product_details.subCategory_name === 'Toothpaste')).toBe(true);
    });
  });
});

