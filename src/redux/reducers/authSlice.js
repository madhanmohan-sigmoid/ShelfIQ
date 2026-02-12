import { createSlice } from "@reduxjs/toolkit";

// Helper function to get user from localStorage
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getUserFromStorage(),
    token: localStorage.getItem("authToken") || null,
    isAuthenticated: !!localStorage.getItem("authToken"),
    loading: false,
    error: null,
  },
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = {
        ...action.payload.user,
        access_groups: action.payload.access_groups || null
      };
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("authToken", action.payload.token);
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;