import reducer, {
  setMasterData,
  resetMasterData,
  selectMasterCountries,
  selectMasterAccounts,
  selectMasterClusters,
  selectMasterCompanies,
  selectMasterCurrencies,
  selectMasterProductCategories,
  selectMasterProductBrands,
  selectMasterProductSubCategories,
  selectMasterProductOrientations,
  selectMasterProducts,
  selectMasterStores,
  selectMasterTeams,
  selectMasterProductsMap,
} from '../dataTemplateSlice';

// Mock console.log to avoid test output noise
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('dataTemplateSlice', () => {
  const initialState = {
    master_countries: [],
    master_retailers: [],
    master_clusters: [],
    master_companies: [],
    master_currencies: [],
    master_product_categories: [],
    master_product_brands: [],
    master_product_sub_categories: [],
    master_product_orientations: [],
    master_products: [],
    master_stores: [],
    master_teams: [],
    master_productDetailsMap: {},
    status: "idle",
  };

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setMasterData', () => {
    it('should set master data from payload', () => {
      const payload = {
        master_countries: { data_list: [{ id: 1, name: 'USA' }] },
        master_retailers: { data_list: [{ id: 1, name: 'TESCO' }] },
        master_clusters: { data_list: [{ id: 1, name: 'Cluster1' }] },
        master_companies: { data_list: [{ id: 1, name: 'Company1' }] },
        master_currencies: { data_list: [{ id: 1, name: 'USD' }] },
        master_product_categories: { data_list: [{ id: 1, name: 'Category1' }] },
        master_product_brands: { data_list: [{ id: 1, name: 'Brand1' }] },
        master_product_sub_categories: { data_list: [{ id: 1, name: 'SubCategory1' }] },
        master_product_orientations: { data_list: [{ id: 1, name: 'Orientation1' }] },
        master_products: { data_list: [{ id: 1, product_name: 'Product1' }] },
        master_stores: { data_list: [{ id: 1, name: 'Store1' }] },
        master_teams: { data_list: [{ id: 1, name: 'Team1' }] },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(state.master_countries).toEqual([{ id: 1, name: 'USA' }]);
      expect(state.master_retailers).toEqual([{ id: 1, name: 'TESCO' }]);
      expect(state.master_clusters).toEqual([{ id: 1, name: 'Cluster1' }]);
      expect(state.master_companies).toEqual([{ id: 1, name: 'Company1' }]);
      expect(state.master_currencies).toEqual([{ id: 1, name: 'USD' }]);
      expect(state.master_product_categories).toEqual([{ id: 1, name: 'Category1' }]);
      expect(state.master_product_brands).toEqual([{ id: 1, name: 'Brand1' }]);
      expect(state.master_product_sub_categories).toEqual([{ id: 1, name: 'SubCategory1' }]);
      expect(state.master_product_orientations).toEqual([{ id: 1, name: 'Orientation1' }]);
      expect(state.master_products).toEqual([{ id: 1, product_name: 'Product1' }]);
      expect(state.master_stores).toEqual([{ id: 1, name: 'Store1' }]);
      expect(state.master_teams).toEqual([{ id: 1, name: 'Team1' }]);
    });

    it('should build enriched productDetailsMap from products', () => {
      const payload = {
        master_products: {
          data_list: [
            {
              id: 1,
              product_name: 'Product1',
              company_id: 10,
              category_id: 20,
              product_brand_id: 30,
              product_sub_group_id: 40,
              orientation_id: 50,
            }
          ]
        },
        master_companies: { data_list: [{ id: 10, name: 'Company1' }] },
        master_product_categories: { data_list: [{ id: 20, name: 'Category1' }] },
        master_product_brands: { data_list: [{ id: 30, name: 'Brand1' }] },
        master_product_sub_groups: { data_list: [{ id: 40, name: 'SubCategory1' }] },
        master_product_orientations: { data_list: [{ id: 50, name: 'Orientation1' }] },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(state.master_productDetailsMap[1]).toBeDefined();
      expect(state.master_productDetailsMap[1].name).toBe('Product1');
      expect(state.master_productDetailsMap[1].company_name).toBe('Company1');
      expect(state.master_productDetailsMap[1].category_name).toBe('Category1');
      expect(state.master_productDetailsMap[1].brand_name).toBe('Brand1');
      expect(state.master_productDetailsMap[1].subCategory_name).toBe('SubCategory1');
      expect(state.master_productDetailsMap[1].orientation_name).toBe('Orientation1');
    });

    it('should use product.name if product_name is not available', () => {
      const payload = {
        master_products: {
          data_list: [
            {
              id: 1,
              name: 'Product1',
              company_id: 10,
            }
          ]
        },
        master_companies: { data_list: [{ id: 10, name: 'Company1' }] },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(state.master_productDetailsMap[1].name).toBe('Product1');
    });

    it('should skip products without id', () => {
      const payload = {
        master_products: {
          data_list: [
            { product_name: 'Product without ID' },
            { id: 2, product_name: 'Product with ID' }
          ]
        },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(Object.keys(state.master_productDetailsMap)).not.toContain(undefined);
      expect(state.master_productDetailsMap[2]).toBeDefined();
    });

    it('should handle missing related data gracefully', () => {
      const payload = {
        master_products: {
          data_list: [
            {
              id: 1,
              product_name: 'Product1',
              company_id: 999, // Non-existent
              category_id: 999,
            }
          ]
        },
        master_companies: { data_list: [] },
        master_product_categories: { data_list: [] },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(state.master_productDetailsMap[1].company_name).toBe('');
      expect(state.master_productDetailsMap[1].category_name).toBe('');
    });

    it('should not update fields that are not in payload', () => {
      const payload = {
        master_countries: { data_list: [{ id: 1, name: 'USA' }] },
      };

      const action = setMasterData(payload);
      const state = reducer(initialState, action);

      expect(state.master_countries).toEqual([{ id: 1, name: 'USA' }]);
      expect(state.master_retailers).toEqual([]);
    });

    it('should reset productDetailsMap before building new one', () => {
      let state = reducer(initialState, setMasterData({
        master_products: { data_list: [{ id: 1, product_name: 'Product1' }] }
      }));

      const payload = {
        master_products: { data_list: [{ id: 2, product_name: 'Product2' }] }
      };
      const action = setMasterData(payload);
      state = reducer(state, action);

      expect(state.master_productDetailsMap[1]).toBeUndefined();
      expect(state.master_productDetailsMap[2]).toBeDefined();
    });
  });

  describe('resetMasterData', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setMasterData({
        master_countries: { data_list: [{ id: 1, name: 'USA' }] },
        master_products: { data_list: [{ id: 1, product_name: 'Product1' }] }
      }));

      const action = resetMasterData();
      state = reducer(state, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      masterData: {
        master_countries: [{ id: 1, name: 'USA' }],
        master_retailers: [{ id: 1, name: 'TESCO' }],
        master_clusters: [{ id: 1, name: 'Cluster1' }],
        master_companies: [{ id: 1, name: 'Company1' }],
        master_currencies: [{ id: 1, name: 'USD' }],
        master_product_categories: [{ id: 1, name: 'Category1' }],
        master_product_brands: [{ id: 1, name: 'Brand1' }],
        master_product_sub_categories: [{ id: 1, name: 'SubCategory1' }],
        master_product_orientations: [{ id: 1, name: 'Orientation1' }],
        master_products: [{ id: 1, name: 'Product1' }],
        master_stores: [{ id: 1, name: 'Store1' }],
        master_teams: [{ id: 1, name: 'Team1' }],
        master_productDetailsMap: {
          1: { id: 1, name: 'Product1' }
        },
      }
    };

    it('selectMasterCountries should return master_countries', () => {
      expect(selectMasterCountries(mockState)).toEqual([{ id: 1, name: 'USA' }]);
    });

    it('selectMasterAccounts should return master_retailers', () => {
      expect(selectMasterAccounts(mockState)).toEqual([{ id: 1, name: 'TESCO' }]);
    });

    it('selectMasterClusters should return master_clusters', () => {
      expect(selectMasterClusters(mockState)).toEqual([{ id: 1, name: 'Cluster1' }]);
    });

    it('selectMasterCompanies should return master_companies', () => {
      expect(selectMasterCompanies(mockState)).toEqual([{ id: 1, name: 'Company1' }]);
    });

    it('selectMasterCurrencies should return master_currencies', () => {
      expect(selectMasterCurrencies(mockState)).toEqual([{ id: 1, name: 'USD' }]);
    });

    it('selectMasterProductCategories should return master_product_categories', () => {
      expect(selectMasterProductCategories(mockState)).toEqual([{ id: 1, name: 'Category1' }]);
    });

    it('selectMasterProductBrands should return master_product_brands', () => {
      expect(selectMasterProductBrands(mockState)).toEqual([{ id: 1, name: 'Brand1' }]);
    });

    it('selectMasterProductSubCategories should return master_product_sub_categories', () => {
      expect(selectMasterProductSubCategories(mockState)).toEqual([{ id: 1, name: 'SubCategory1' }]);
    });

    it('selectMasterProductOrientations should return master_product_orientations', () => {
      expect(selectMasterProductOrientations(mockState)).toEqual([{ id: 1, name: 'Orientation1' }]);
    });

    it('selectMasterProducts should return master_products', () => {
      expect(selectMasterProducts(mockState)).toEqual([{ id: 1, name: 'Product1' }]);
    });

    it('selectMasterStores should return master_stores', () => {
      expect(selectMasterStores(mockState)).toEqual([{ id: 1, name: 'Store1' }]);
    });

    it('selectMasterTeams should return master_teams', () => {
      expect(selectMasterTeams(mockState)).toEqual([{ id: 1, name: 'Team1' }]);
    });

    it('selectMasterProductsMap should return master_productDetailsMap', () => {
      expect(selectMasterProductsMap(mockState)).toEqual({
        1: { id: 1, name: 'Product1' }
      });
    });
  });
});

