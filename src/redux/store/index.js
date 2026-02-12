import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducers/authSlice";
import logger from "redux-logger";
import masterDataReducer from "../reducers/dataTemplateSlice";
import productDataReducer from "../reducers/productDataSlice";
import planogramVisualizerData from "../reducers/planogramVisualizerSlice";
import regionRetailerReducer from "../reducers/regionRetailerSlice";
import dashboardReducer from "../reducers/dashboardSlice";
import scorecardReducer from "../reducers/scorecardSlice";
import myPlanogramReducer from "../reducers/myPlanogramSlice";

import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
// Configure persistence for regionRetailer slice
const regionRetailerPersistConfig = {
  key: "regionRetailer",
  storage,
  whitelist: [
    "selectedRegion",
    "selectedRetailer",
    "selectedCategory",
    "selectedCountry",
  ], // Only persist these fields
};

// Configure persistence for auth slice (optional - for user session)
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated"], // Only persist user data
};

// Create persisted reducers
const persistedRegionRetailerReducer = persistReducer(
  regionRetailerPersistConfig,
  regionRetailerReducer
);
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const isLocalHostUrl = window.location.host.includes("localhost");

const store = configureStore({
  reducer: {
    // auth: authReducer,
    auth: persistedAuthReducer,
    masterData: masterDataReducer,
    productData: productDataReducer,
    planogramVisualizerData: planogramVisualizerData,
    // regionRetailer: regionRetailerReducer,
    regionRetailer: persistedRegionRetailerReducer,
    dashboard: dashboardReducer,
    scorecardData: scorecardReducer,
    myPlanogram: myPlanogramReducer,
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(isLocalHostUrl ? logger : []),
});
// Create persistor
export const persistor = persistStore(store);

export default store;
