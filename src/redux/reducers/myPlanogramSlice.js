import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  viewMode: "list",
  searchTerm: "",
  selectedPlanogramIds: [], // for duplicate functionality
};

const myPlanogramSlice = createSlice({
  name: "myPlanogram",
  initialState,
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSelectedPlanogramIds: (state, action) => {
      state.selectedPlanogramIds = action.payload;
    },
    resetMyPlanogram: (state) => {
      state.viewMode = "list";
      state.searchTerm = "";
      state.selectedPlanogramIds = [];
    },
  },
});

export const {
  setViewMode,
  setSearchTerm,
  setSelectedPlanogramIds,
  resetMyPlanogram,
} = myPlanogramSlice.actions;

export default myPlanogramSlice.reducer;
