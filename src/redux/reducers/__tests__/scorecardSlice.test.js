import reducer, {
  setStatus,
  setSelectedTab,
  setViewMode,
  setScorecardData,
  setFilters,
  resetFilters,
  setFilteredScorecardData,
  setClusterData,
  setOriginalPlanogramId,
  setSelectedPlanogramVersionId,
  setBrands,
  setSubCategories,
  setStoreIds,
  resetScorecardSliceData,
  selectStatus,
  selectSelectedTab,
  selectViewMode,
  selectScorecardData,
  selectFilters,
  selectFilteredScorecardData,
  selectClusterData,
  selectOriginalPlanogramId,
  selectSelectedPlanogramVersionId,
  selectBrands,
  selectSubCategories,
  selectStoreIds,
} from '../scorecardSlice';

describe('scorecardSlice', () => {
  const initialState = {
    status: "idle",
    selectedTab: "cluster",
    viewMode: "schematic",
    scorecardLoading: false,
    scorecardData: [],
    brands: [],
    subCategories: [],
    storeIds: [],
    filters: {
      brands: [],
      subCategories: [],
      clusterName: '',
      version: '',
      storeIds: [],
      subCategoryFilter: [],
      brandFilter: [],
      hierarchy2Filter: [],
      hierarchy_1: '',
      hierarchy_2: '',
      scorecardView: "Category Overview",
      time_period: "6 Months",
      kpi: [],
      productView: [],
      showLiftKPIs: false,
    },
    filteredScorecardData: [],
    clusterData: [],
    originalPlanogramId: null,
    selectedPlanogramVersionId: null,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setStatus', () => {
    it('should set status', () => {
      const action = setStatus('loading');
      const state = reducer(initialState, action);
      expect(state.status).toBe('loading');
    });
  });

  describe('setSelectedTab', () => {
    it('should set selected tab', () => {
      const action = setSelectedTab('store');
      const state = reducer(initialState, action);
      expect(state.selectedTab).toBe('store');
    });
  });

  describe('setViewMode', () => {
    it('should set view mode', () => {
      const action = setViewMode('list');
      const state = reducer(initialState, action);
      expect(state.viewMode).toBe('list');
    });
  });

  describe('setScorecardData', () => {
    it('should set scorecard data', () => {
      const data = [{ id: 1, name: 'Scorecard 1' }];
      const action = setScorecardData(data);
      const state = reducer(initialState, action);
      expect(state.scorecardData).toEqual(data);
    });
  });

  describe('setFilters', () => {
    it('should merge filters with existing filters', () => {
      let state = reducer(initialState, setFilters({ brands: ['Brand1'] }));
      const action = setFilters({ subCategories: ['Category1'] });
      state = reducer(state, action);
      
      expect(state.filters.brands).toEqual(['Brand1']);
      expect(state.filters.subCategories).toEqual(['Category1']);
    });

    it('should update existing filter values', () => {
      let state = reducer(initialState, setFilters({ clusterName: 'Cluster1' }));
      const action = setFilters({ clusterName: 'Cluster2' });
      state = reducer(state, action);
      
      expect(state.filters.clusterName).toBe('Cluster2');
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to initial state', () => {
      let state = reducer(initialState, setFilters({ brands: ['Brand1'], clusterName: 'Cluster1' }));
      const action = resetFilters();
      state = reducer(state, action);
      
      expect(state.filters).toEqual(initialState.filters);
    });
  });

  describe('setFilteredScorecardData', () => {
    it('should set filtered scorecard data', () => {
      const data = [{ id: 1, name: 'Filtered Scorecard 1' }];
      const action = setFilteredScorecardData(data);
      const state = reducer(initialState, action);
      expect(state.filteredScorecardData).toEqual(data);
    });
  });

  describe('setClusterData', () => {
    it('should set cluster data', () => {
      const data = [{ id: 1, name: 'Cluster 1' }];
      const action = setClusterData(data);
      const state = reducer(initialState, action);
      expect(state.clusterData).toEqual(data);
    });
  });

  describe('setOriginalPlanogramId', () => {
    it('should set original planogram ID', () => {
      const action = setOriginalPlanogramId('planogram-123');
      const state = reducer(initialState, action);
      expect(state.originalPlanogramId).toBe('planogram-123');
    });
  });

  describe('setSelectedPlanogramVersionId', () => {
    it('should set selected planogram version ID', () => {
      const action = setSelectedPlanogramVersionId('version-123');
      const state = reducer(initialState, action);
      expect(state.selectedPlanogramVersionId).toBe('version-123');
    });
  });

  describe('setBrands', () => {
    it('should set brands', () => {
      const brands = ['Brand1', 'Brand2'];
      const action = setBrands(brands);
      const state = reducer(initialState, action);
      expect(state.brands).toEqual(brands);
    });
  });

  describe('setSubCategories', () => {
    it('should set sub categories', () => {
      const subCategories = ['Category1', 'Category2'];
      const action = setSubCategories(subCategories);
      const state = reducer(initialState, action);
      expect(state.subCategories).toEqual(subCategories);
    });
  });

  describe('setStoreIds', () => {
    it('should set store IDs', () => {
      const storeIds = ['store-1', 'store-2'];
      const action = setStoreIds(storeIds);
      const state = reducer(initialState, action);
      expect(state.storeIds).toEqual(storeIds);
    });
  });

  describe('resetScorecardSliceData', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setStatus('loading'));
      state = reducer(state, setSelectedTab('store'));
      state = reducer(state, setScorecardData([{ id: 1 }]));
      state = reducer(state, setFilters({ brands: ['Brand1'] }));
      
      const action = resetScorecardSliceData();
      state = reducer(state, action);
      
      expect(state.status).toBe('idle');
      expect(state.selectedTab).toBe('cluster');
      expect(state.scorecardData).toEqual([]);
      expect(state.filters).toEqual(initialState.filters);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      scorecardData: {
        status: 'loading',
        selectedTab: 'store',
        viewMode: 'list',
        scorecardData: [{ id: 1 }],
        brands: ['Brand1'],
        subCategories: ['Category1'],
        storeIds: ['store-1'],
        filters: {
          brands: ['Brand1'],
          subCategories: ['Category1'],
          clusterName: 'Cluster1',
          version: 'v1',
          year: '2024',
          storeIds: ['store-1']
        },
        filteredScorecardData: [{ id: 1 }],
        clusterData: [{ id: 1 }],
        originalPlanogramId: 'planogram-123',
        selectedPlanogramVersionId: 'version-123',
      }
    };

    it('selectStatus should return status', () => {
      expect(selectStatus(mockState)).toBe('loading');
    });

    it('selectSelectedTab should return selectedTab', () => {
      expect(selectSelectedTab(mockState)).toBe('store');
    });

    it('selectViewMode should return viewMode', () => {
      expect(selectViewMode(mockState)).toBe('list');
    });

    it('selectScorecardData should return scorecardData', () => {
      expect(selectScorecardData(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectFilters should return filters', () => {
      expect(selectFilters(mockState)).toEqual(mockState.scorecardData.filters);
    });

    it('selectFilteredScorecardData should return filteredScorecardData', () => {
      expect(selectFilteredScorecardData(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectClusterData should return clusterData', () => {
      expect(selectClusterData(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectOriginalPlanogramId should return originalPlanogramId', () => {
      expect(selectOriginalPlanogramId(mockState)).toBe('planogram-123');
    });

    it('selectSelectedPlanogramVersionId should return selectedPlanogramVersionId', () => {
      expect(selectSelectedPlanogramVersionId(mockState)).toBe('version-123');
    });

    it('selectBrands should return brands', () => {
      expect(selectBrands(mockState)).toEqual(['Brand1']);
    });

    it('selectSubCategories should return subCategories', () => {
      expect(selectSubCategories(mockState)).toEqual(['Category1']);
    });

    it('selectStoreIds should return storeIds', () => {
      expect(selectStoreIds(mockState)).toEqual(['store-1']);
    });
  });
});

