import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedRegion: null, // Will be set after mappings load
    selectedRetailer: null,
    selectedCategory: null,
    selectedCountry: null,
    regionRetailerCategoryMappings: null,
    loading: false,
    error: null,
};

const regionRetailerSlice = createSlice({
    name: 'regionRetailer',
    initialState,
    reducers: {
        setSelectedRegion: (state, action) => {
            state.selectedRegion = action.payload;
            // Reset dependent selections when region changes
            state.selectedRetailer = null;
            state.selectedCategory = null;
            state.selectedCountry = null;
        },
        setSelectedRetailer: (state, action) => {
            state.selectedRetailer = action.payload;
            // Reset category when retailer changes
            state.selectedCategory = null;
        },
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
        },
        setSelectedCountry: (state, action) => {
            state.selectedCountry = action.payload;
        },
        resetRegionRetailer: () => initialState,
        setRegionRetailerCategoryMappings: (state, action) => {
            state.regionRetailerCategoryMappings = action.payload;
            state.loading = false;
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    setSelectedRegion,
    setSelectedRetailer,
    setSelectedCategory,
    setSelectedCountry,
    resetRegionRetailer,
    setRegionRetailerCategoryMappings,
    setLoading,
    setError,
} = regionRetailerSlice.actions;

// Selectors
export const selectSelectedRegion = (state) => state.regionRetailer.selectedRegion;
export const selectSelectedRetailer = (state) => state.regionRetailer.selectedRetailer;
export const selectSelectedCategory = (state) => state.regionRetailer.selectedCategory;
export const selectSelectedCountry = (state) => state.regionRetailer.selectedCountry;
export const selectRegionRetailerCategoryMappings = (state) => state.regionRetailer.regionRetailerCategoryMappings;
export const selectMappingsLoading = (state) => state.regionRetailer.loading;
export const selectMappingsError = (state) => state.regionRetailer.error;

// Helper function to get access_type for selected category
// Map display region name to API region name (same logic as in RegionRetailerPage)
const DISPLAY_TO_API_MAP = {
  "EMEA": "EMEA",
  "North America": "NA",
  "APAC": "APAC",
  "LATAM": "LATAM",
  "CIS": "CIS",
  "ANZ": "ANZ",
  "AMER": "AMER",
};

export const selectCategoryAccessType = (state) => {
  const selectedCategory = state.regionRetailer.selectedCategory;
  const selectedRetailer = state.regionRetailer.selectedRetailer;
  const selectedRegion = state.regionRetailer.selectedRegion;
  const user = state.auth.user;
  
  // If no category is selected, return null
  if (!selectedCategory || !selectedRetailer || !selectedRegion || !user?.access_groups) {
    return null;
  }
  
  // Get the environment (defaulting to 'dev' for now, but could be dynamic)
  // Check all environments: dev, qa, prod
  const environments = ['dev', 'qa', 'prod'];
  
  for (const environment of environments) {
    const accessGroups = user.access_groups[environment];
    
    if (!accessGroups?.region_info) {
      continue;
    }
    
    // Map display region name to API region name
    const apiRegionName = DISPLAY_TO_API_MAP[selectedRegion] || selectedRegion;
    
    // Find the region in access_groups
    const region = accessGroups.region_info.find((r) => r.name === apiRegionName);
    if (!region) {
      continue;
    }
    
    // Find the retailer
    const retailer = region.retailers?.find((ret) => ret.id === selectedRetailer.id);
    if (!retailer) {
      continue;
    }
    
    // Find the category and return its access_type
    const category = retailer.categories?.find((cat) => cat.id === selectedCategory.id);
    if (category) {
      return category.access_type || null;
    }
  }
  
  // If not found in any environment, return null
  return null;
};

export default regionRetailerSlice.reducer;