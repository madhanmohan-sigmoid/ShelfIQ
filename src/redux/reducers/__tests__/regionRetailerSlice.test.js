import reducer, {
  setSelectedRegion,
  setSelectedRetailer,
  setSelectedCategory,
  setSelectedCountry,
  resetRegionRetailer,
  setRegionRetailerCategoryMappings,
  setLoading,
  setError,
  selectSelectedRegion,
  selectSelectedRetailer,
  selectSelectedCategory,
  selectSelectedCountry,
  selectRegionRetailerCategoryMappings,
  selectMappingsLoading,
  selectMappingsError,
  selectCategoryAccessType,
} from '../regionRetailerSlice';

describe('regionRetailerSlice', () => {
  const initialState = {
    selectedRegion: null,
    selectedRetailer: null,
    selectedCategory: null,
    selectedCountry: null,
    regionRetailerCategoryMappings: null,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setSelectedRegion', () => {
    it('should set selected region', () => {
      const region = { id: 1, name: 'North America' };
      const action = setSelectedRegion(region);
      const state = reducer(initialState, action);
      expect(state.selectedRegion).toEqual(region);
      // Verify other properties are preserved
      expect(state.regionRetailerCategoryMappings).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should reset dependent selections when region changes', () => {
      let state = reducer(initialState, setSelectedRetailer({ id: 1, name: 'Retailer 1' }));
      state = reducer(state, setSelectedCategory({ id: 1, name: 'Category 1' }));
      state = reducer(state, setSelectedCountry({ id: 1, name: 'USA' }));
      
      const region = { id: 2, name: 'Europe' };
      const action = setSelectedRegion(region);
      state = reducer(state, action);
      
      expect(state.selectedRegion).toEqual(region);
      expect(state.selectedRetailer).toBe(null);
      expect(state.selectedCategory).toBe(null);
      expect(state.selectedCountry).toBe(null);
    });
  });

  describe('setSelectedRetailer', () => {
    it('should set selected retailer', () => {
      const retailer = { id: 1, name: 'TESCO' };
      const action = setSelectedRetailer(retailer);
      const state = reducer(initialState, action);
      expect(state.selectedRetailer).toEqual(retailer);
    });

    it('should reset category when retailer changes', () => {
      let state = reducer(initialState, setSelectedCategory({ id: 1, name: 'Category 1' }));
      const retailer = { id: 2, name: 'ASDA' };
      const action = setSelectedRetailer(retailer);
      state = reducer(state, action);
      
      expect(state.selectedRetailer).toEqual(retailer);
      expect(state.selectedCategory).toBe(null);
    });
  });

  describe('setSelectedCategory', () => {
    it('should set selected category', () => {
      const category = { id: 1, name: 'ORAL CARE' };
      const action = setSelectedCategory(category);
      const state = reducer(initialState, action);
      expect(state.selectedCategory).toEqual(category);
    });
  });

  describe('setSelectedCountry', () => {
    it('should set selected country', () => {
      const country = { id: 1, name: 'USA' };
      const action = setSelectedCountry(country);
      const state = reducer(initialState, action);
      expect(state.selectedCountry).toEqual(country);
    });
  });

  describe('resetRegionRetailer', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setSelectedRegion({ id: 1, name: 'North America' }));
      state = reducer(state, setSelectedRetailer({ id: 1, name: 'TESCO' }));
      state = reducer(state, setSelectedCategory({ id: 1, name: 'ORAL CARE' }));
      // Modify other state properties to ensure they're reset
      state = reducer(state, setLoading(true));
      state = reducer(state, setError('Some error'));
      
      const action = resetRegionRetailer();
      state = reducer(state, action);
      
      expect(state).toEqual(initialState);
    });
  });

  describe('setRegionRetailerCategoryMappings', () => {
    it('should set regionRetailerCategoryMappings', () => {
      const mappings = [
        { region: 'EMEA', retailers: [{ id: 1, name: 'TESCO' }] },
      ];
      const action = setRegionRetailerCategoryMappings(mappings);
      const state = reducer(initialState, action);
      
      expect(state.regionRetailerCategoryMappings).toEqual(mappings);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should set loading to false when mappings are set', () => {
      let state = reducer(initialState, setLoading(true));
      const mappings = [{ region: 'EMEA', retailers: [] }];
      state = reducer(state, setRegionRetailerCategoryMappings(mappings));
      
      expect(state.loading).toBe(false);
    });

    it('should clear error when mappings are set', () => {
      let state = reducer(initialState, setError('Some error'));
      const mappings = [{ region: 'EMEA', retailers: [] }];
      state = reducer(state, setRegionRetailerCategoryMappings(mappings));
      
      expect(state.error).toBe(null);
    });

    it('should handle null mappings', () => {
      const action = setRegionRetailerCategoryMappings(null);
      const state = reducer(initialState, action);
      
      expect(state.regionRetailerCategoryMappings).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const action = setLoading(true);
      const state = reducer(initialState, action);
      
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      let state = reducer(initialState, setLoading(true));
      const action = setLoading(false);
      state = reducer(state, action);
      
      expect(state.loading).toBe(false);
    });

    it('should preserve other state properties', () => {
      let state = reducer(initialState, setSelectedRegion({ id: 1, name: 'EMEA' }));
      state = reducer(state, setLoading(true));
      
      expect(state.selectedRegion).toEqual({ id: 1, name: 'EMEA' });
      expect(state.loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to load mappings';
      const action = setError(errorMessage);
      const state = reducer(initialState, action);
      
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should set loading to false when error is set', () => {
      let state = reducer(initialState, setLoading(true));
      const action = setError('Some error');
      state = reducer(state, action);
      
      expect(state.error).toBe('Some error');
      expect(state.loading).toBe(false);
    });

    it('should handle null error', () => {
      let state = reducer(initialState, setError('Some error'));
      const action = setError(null);
      state = reducer(state, action);
      
      expect(state.error).toBe(null);
      expect(state.loading).toBe(false);
    });

    it('should preserve other state properties', () => {
      let state = reducer(initialState, setSelectedRegion({ id: 1, name: 'EMEA' }));
      state = reducer(state, setError('Error occurred'));
      
      expect(state.selectedRegion).toEqual({ id: 1, name: 'EMEA' });
      expect(state.error).toBe('Error occurred');
    });
  });

  describe('Selectors', () => {
    const mockState = {
      regionRetailer: {
        selectedRegion: 'EMEA',
        selectedRetailer: { id: 1, name: 'TESCO' },
        selectedCategory: { id: 1, name: 'ORAL CARE' },
        selectedCountry: { id: 1, name: 'USA' },
        regionRetailerCategoryMappings: [{ region: 'EMEA', retailers: [] }],
        loading: false,
        error: null,
      }
    };

    it('selectSelectedRegion should return selectedRegion', () => {
      expect(selectSelectedRegion(mockState)).toEqual('EMEA');
    });

    it('selectSelectedRetailer should return selectedRetailer', () => {
      expect(selectSelectedRetailer(mockState)).toEqual({ id: 1, name: 'TESCO' });
    });

    it('selectSelectedCategory should return selectedCategory', () => {
      expect(selectSelectedCategory(mockState)).toEqual({ id: 1, name: 'ORAL CARE' });
    });

    it('selectSelectedCountry should return selectedCountry', () => {
      expect(selectSelectedCountry(mockState)).toEqual({ id: 1, name: 'USA' });
    });

    it('selectRegionRetailerCategoryMappings should return mappings', () => {
      expect(selectRegionRetailerCategoryMappings(mockState)).toEqual([
        { region: 'EMEA', retailers: [] }
      ]);
    });

    it('selectMappingsLoading should return loading state', () => {
      expect(selectMappingsLoading(mockState)).toBe(false);
      
      const loadingState = {
        ...mockState,
        regionRetailer: { ...mockState.regionRetailer, loading: true }
      };
      expect(selectMappingsLoading(loadingState)).toBe(true);
    });

    it('selectMappingsError should return error state', () => {
      expect(selectMappingsError(mockState)).toBe(null);
      
      const errorState = {
        ...mockState,
        regionRetailer: { ...mockState.regionRetailer, error: 'Some error' }
      };
      expect(selectMappingsError(errorState)).toBe('Some error');
    });
  });

  describe('selectCategoryAccessType', () => {
    const createMockState = (overrides = {}) => ({
      regionRetailer: {
        selectedRegion: 'EMEA',
        selectedRetailer: { id: 1, name: 'TESCO' },
        selectedCategory: { id: 1, name: 'ORAL CARE' },
        selectedCountry: null,
        regionRetailerCategoryMappings: null,
        loading: false,
        error: null,
        ...overrides.regionRetailer,
      },
      auth: {
        user: {
          email: 'test@example.com',
          access_groups: {
            dev: {
              region_info: [
                {
                  name: 'EMEA',
                  retailers: [
                    {
                      id: 1,
                      categories: [
                        { id: 1, access_type: 'CONTRIBUTORS' }
                      ]
                    }
                  ]
                }
              ]
            }
          },
          ...overrides.auth?.user,
        },
        ...overrides.auth,
      },
    });

    it('should return null when no category is selected', () => {
      const state = createMockState({
        regionRetailer: { selectedCategory: null }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when no retailer is selected', () => {
      const state = createMockState({
        regionRetailer: { selectedRetailer: null }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when no region is selected', () => {
      const state = createMockState({
        regionRetailer: { selectedRegion: null }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when user has no access_groups', () => {
      const state = createMockState({
        auth: { user: { email: 'test@example.com' } }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when user is not present', () => {
      const state = createMockState({
        auth: { user: null }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return access_type when found in dev environment', () => {
      const state = createMockState();
      expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
    });

    it('should return access_type when found in qa environment', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              qa: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'USERS' }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe('USERS');
    });

    it('should return access_type when found in prod environment', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              prod: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'CONTRIBUTORS' }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
    });

    it('should check environments in order (dev, qa, prod)', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'CONTRIBUTORS' }
                        ]
                      }
                    ]
                  }
                ]
              },
              qa: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'USERS' }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      // Should return from dev (first match)
      expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
    });

    it('should map display region name to API region name', () => {
      const state = createMockState({
        regionRetailer: { selectedRegion: 'North America' },
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'NA', // API name
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'CONTRIBUTORS' }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
    });

    it('should handle unmapped region names', () => {
      const state = createMockState({
        regionRetailer: { selectedRegion: 'Unknown Region' },
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'Unknown Region', // Uses region name as-is
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1, access_type: 'CONTRIBUTORS' }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
    });

    it('should return null when region is not found in access_groups', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'APAC', // Different region
                    retailers: []
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when retailer is not found', () => {
      const state = createMockState({
        regionRetailer: { selectedRetailer: { id: 999, name: 'Unknown' } }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when category is not found', () => {
      const state = createMockState({
        regionRetailer: { selectedCategory: { id: 999, name: 'Unknown' } }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when category has no access_type', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1,
                        categories: [
                          { id: 1 } // No access_type
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should return null when accessGroups has no region_info', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {} // No region_info
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should handle all region name mappings', () => {
      const regionMappings = [
        { display: 'EMEA', api: 'EMEA' },
        { display: 'North America', api: 'NA' },
        { display: 'APAC', api: 'APAC' },
        { display: 'LATAM', api: 'LATAM' },
        { display: 'CIS', api: 'CIS' },
        { display: 'ANZ', api: 'ANZ' },
        { display: 'AMER', api: 'AMER' },
      ];

      regionMappings.forEach(({ display, api }) => {
        const state = createMockState({
          regionRetailer: { selectedRegion: display },
          auth: {
            user: {
              email: 'test@example.com',
              access_groups: {
                dev: {
                  region_info: [
                    {
                      name: api,
                      retailers: [
                        {
                          id: 1,
                          categories: [
                            { id: 1, access_type: 'CONTRIBUTORS' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        });
        expect(selectCategoryAccessType(state)).toBe('CONTRIBUTORS');
      });
    });

    it('should handle retailers array being undefined', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'EMEA'
                    // No retailers property
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });

    it('should handle categories array being undefined', () => {
      const state = createMockState({
        auth: {
          user: {
            email: 'test@example.com',
            access_groups: {
              dev: {
                region_info: [
                  {
                    name: 'EMEA',
                    retailers: [
                      {
                        id: 1
                        // No categories property
                      }
                    ]
                  }
                ]
              }
            }
          }
        }
      });
      expect(selectCategoryAccessType(state)).toBe(null);
    });
  });
});

