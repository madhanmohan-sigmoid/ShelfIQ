import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  viewMode: "list",
  searchTerm: "",
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetDashboard: (state) => {
      state.viewMode = "list";
      state.searchTerm = "";
    },
  },
});

export const { setViewMode, setSearchTerm, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer; 