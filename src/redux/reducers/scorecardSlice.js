import { createSlice } from "@reduxjs/toolkit";

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
    clusterName: "",
    version: "",
    storeIds: [],
    // Sub-Category Overview filters (DS module)
    subCategoryFilter: [],
    brandFilter: [],
    // Hierarchy-2 leaf filter (Platform/Intensity values under Brand)
    hierarchy2Filter: [],
    // Performance Overview hierarchy (sent only for Sub-Category Overview view)
    hierarchy_1: "",
    hierarchy_2: "",
    // Other scorecard filters (will be initialized/overwritten by UI effects)
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

const scorecardSlice = createSlice({
  name: "scorecardData",
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setScorecardLoading: (state, action) => {
      state.scorecardLoading = !!action.payload;
    },
    setScorecardData: (state, action) => {
      state.scorecardData = action.payload;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { ...initialState.filters };
    },

    setFilteredScorecardData: (state, action) => {
      state.filteredScorecardData = action.payload;
    },

    setClusterData: (state, action) => {
      state.clusterData = action.payload;
    },
    setOriginalPlanogramId: (state, action) => {
      state.originalPlanogramId = action.payload;
    },
    setSelectedPlanogramVersionId: (state, action) => {
      state.selectedPlanogramVersionId = action.payload;
    },

    setBrands: (state, action) => {
      state.brands = action.payload;
    },
    setSubCategories: (state, action) => {
      state.subCategories = action.payload;
    },
    setStoreIds: (state, action) => {
      state.storeIds = action.payload;
    },

    resetScorecardSliceData: () => ({
      ...initialState,
      filters: { ...initialState.filters },
    }),
  },
});

export const {
  setStatus,
  setSelectedTab,
  setViewMode,
  setScorecardLoading,
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
} = scorecardSlice.actions;

// selectors
export const selectStatus = (state) => state.scorecardData.status;
export const selectSelectedTab = (state) => state.scorecardData.selectedTab;
export const selectViewMode = (state) => state.scorecardData.viewMode;
export const selectScorecardLoading = (state) =>
  state.scorecardData.scorecardLoading;
export const selectScorecardData = (state) => state.scorecardData.scorecardData;
export const selectFilters = (state) => state.scorecardData.filters;
export const selectFilteredScorecardData = (state) =>
  state.scorecardData.filteredScorecardData;
export const selectClusterData = (state) => state.scorecardData.clusterData;
export const selectOriginalPlanogramId = (state) =>
  state.scorecardData.originalPlanogramId;
export const selectSelectedPlanogramVersionId = (state) =>
  state.scorecardData.selectedPlanogramVersionId;
export const selectBrands = (state) => state.scorecardData.brands;
export const selectSubCategories = (state) => state.scorecardData.subCategories;
export const selectStoreIds = (state) => state.scorecardData.storeIds;

export default scorecardSlice.reducer;
