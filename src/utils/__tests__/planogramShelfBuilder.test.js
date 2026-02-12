// Mock API calls
jest.mock('../../api/api', () => ({
  getPlanogramVisualizer: jest.fn(),
  getProductKPIs: jest.fn(),
}));

import { buildShelvesFromApi } from '../planogramShelfBuilder';
import { getPlanogramVisualizer, getProductKPIs } from '../../api/api';

describe('planogramShelfBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
  });

  describe('buildShelvesFromApi', () => {
    const mockBayDetailsList = [
      {
        number: 1,
        width: 1330,
        height: 2400,
        shelf_details_list: [
          {
            number: 1,
            width: 1330,
            height: 800,
            product_info_list: [
              {
                product_id: 1,
                position: 0,
                facing_wide: 2,
                facing_high: 1,
                tray_height: 50,
                tray_width: 100,
                tray_depth: 30,
                orientation: 0,
                width: 133,
                linear_value: 200,
              },
            ],
          },
          {
            number: 2,
            width: 1330,
            height: 800,
            product_info_list: [
              {
                product_id: 2,
                position: 100,
                facing_wide: 1,
                facing_high: 1,
                tray_height: 40,
                tray_width: 80,
                tray_depth: 25,
                orientation: 0,
                width: 133,
                linear_value: 150,
              },
            ],
          },
        ],
      },
    ];

    const mockMasterProductMap = {
      1: {
        id: 1,
        tpnb: 'TPNB001',
        name: 'Product A',
        brand_name: 'Brand A',
        subCategory_name: 'Toothpaste',
      },
      2: {
        id: 2,
        tpnb: 'TPNB002',
        name: 'Product B',
        brand_name: 'Brand B',
        subCategory_name: 'Toothbrush',
      },
    };

    const mockProductKPIs = [
      {
        tpnb: 'TPNB001',
        sales: 1000,
        revenue: 5000,
      },
      {
        tpnb: 'TPNB002',
        sales: 800,
        revenue: 4000,
      },
    ];

    it('should build shelves and products from API data', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: mockBayDetailsList,
            planogram_rules: { rule1: 'value1' },
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: mockProductKPIs,
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.dynamicShelves).toBeDefined();
      expect(Array.isArray(result.dynamicShelves)).toBe(true);
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.ruleManager).toEqual({ rule1: 'value1' });
      expect(getPlanogramVisualizer).toHaveBeenCalledWith('planogram-123');
      expect(getProductKPIs).toHaveBeenCalledWith('planogram-123');
    });

    it('should flatten products correctly with all required fields', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: mockBayDetailsList,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: mockProductKPIs,
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products).toHaveLength(2);
      expect(result.products[0]).toMatchObject({
        bay: 1,
        shelf: 1,
        product_id: 1,
        product_details: mockMasterProductMap[1],
      });
      expect(result.products[0].shelfheight).toBe(80); // height / 10
      expect(result.products[0].position).toBe(0); // position / 10
      expect(result.products[0].facings_wide).toBe(2);
      expect(result.products[0].total_facings).toBe(2); // 2 * 1
    });

    it('should handle products with missing KPIs', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: mockBayDetailsList,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [], // No KPIs
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products).toHaveLength(2);
      expect(result.products[0].product_kpis).toBeUndefined();
    });

    it('should handle products with missing master product data', async () => {
      const bayDetailsWithUnknownProduct = [
        {
          number: 1,
          width: 1330,
          height: 2400,
          shelf_details_list: [
            {
              number: 1,
              width: 1330,
              height: 800,
              product_info_list: [
                {
                  product_id: 999, // Unknown product
                  position: 0,
                  facing_wide: 1,
                  facing_high: 1,
                  tray_height: 50,
                  tray_width: 100,
                  tray_depth: 30,
                  orientation: 0,
                  width: 133,
                  linear_value: 200,
                },
              ],
            },
          ],
        },
      ];

      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: bayDetailsWithUnknownProduct,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].product_details).toBeUndefined();
    });

    it('should use default values for missing product properties', async () => {
      const bayDetailsWithMinimalData = [
        {
          number: 1,
          width: 1330,
          height: 2400,
          shelf_details_list: [
            {
              number: 1,
              width: 1330,
              height: 800,
              product_info_list: [
                {
                  product_id: 1,
                  position: 0,
                  // Missing facing_wide, facing_high, etc.
                },
              ],
            },
          ],
        },
      ];

      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: bayDetailsWithMinimalData,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products[0].shelfwidth).toBe(133); // Default fallback
      expect(result.products[0].orientation).toBe(0); // Default fallback
      expect(result.products[0].total_facings).toBe(0); // 0 * 0
    });

    it('should build shelves with correct dimensions', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: mockBayDetailsList,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: mockProductKPIs,
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.dynamicShelves.length).toBeGreaterThan(0);
      expect(result.dynamicShelves[0]).toHaveProperty('height');
      expect(result.dynamicShelves[0]).toHaveProperty('width');
      expect(result.dynamicShelves[0]).toHaveProperty('baseWidth');
      expect(result.dynamicShelves[0]).toHaveProperty('subShelves');
    });

    it('should handle multiple bays', async () => {
      const multiBayDetails = [
        ...mockBayDetailsList,
        {
          number: 2,
          width: 1330,
          height: 2400,
          shelf_details_list: [
            {
              number: 1,
              width: 1330,
              height: 800,
              product_info_list: [
                {
                  product_id: 3,
                  position: 0,
                  facing_wide: 1,
                  facing_high: 1,
                  tray_height: 50,
                  tray_width: 100,
                  tray_depth: 30,
                  orientation: 0,
                  width: 133,
                  linear_value: 200,
                },
              ],
            },
          ],
        },
      ];

      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: multiBayDetails,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: mockProductKPIs,
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products.length).toBe(3);
      expect(result.products.some((p) => p.bay === 2)).toBe(true);
    });

    it('should return empty arrays when API call fails', async () => {
      getPlanogramVisualizer.mockRejectedValue(new Error('API Error'));
      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.dynamicShelves).toEqual([]);
      expect(result.products).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle empty bay_details_list', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: [],
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products).toEqual([]);
      expect(result.dynamicShelves).toEqual([]);
    });

    it('should handle missing shelf_details_list', async () => {
      const bayDetailsWithoutShelves = [
        {
          number: 1,
          width: 1330,
          height: 2400,
          // Missing shelf_details_list
        },
      ];

      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: bayDetailsWithoutShelves,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      expect(result.products).toEqual([]);
    });

    it('should map product KPIs correctly by product_id', async () => {
      getPlanogramVisualizer.mockResolvedValue({
        data: {
          data: {
            bay_details_list: mockBayDetailsList,
            planogram_rules: {},
          },
        },
      });

      getProductKPIs.mockResolvedValue({
        data: {
          data: {
            data: mockProductKPIs,
          },
        },
      });

      const result = await buildShelvesFromApi(3, 'planogram-123', mockMasterProductMap);

      // Product KPIs are mapped by tpnb, so product with tpnb 'TPNB001' should have the KPI data
      expect(result.products[0].product_kpis).toEqual({
        sales: 1000,
        revenue: 5000,
      });
      expect(result.productKPIsByTpnb).toEqual({
        TPNB001: { sales: 1000, revenue: 5000 },
        TPNB002: { sales: 800, revenue: 4000 },
      });
      expect(result.products[1].product_kpis).toEqual({
        sales: 800,
        revenue: 4000,
      });
    });
  });
});

