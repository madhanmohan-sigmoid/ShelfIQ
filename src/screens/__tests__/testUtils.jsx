import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../redux/reducers/authSlice';
import masterDataReducer from '../../redux/reducers/dataTemplateSlice';
import productDataReducer from '../../redux/reducers/productDataSlice';
import planogramVisualizerData from '../../redux/reducers/planogramVisualizerSlice';
import regionRetailerReducer from '../../redux/reducers/regionRetailerSlice';
import dashboardReducer from '../../redux/reducers/dashboardSlice';
import scorecardReducer from '../../redux/reducers/scorecardSlice';
import myPlanogramReducer from '../../redux/reducers/myPlanogramSlice';

// Create a test store with all reducers
export function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      masterData: masterDataReducer,
      productData: productDataReducer,
      planogramVisualizerData: planogramVisualizerData,
      regionRetailer: regionRetailerReducer,
      dashboard: dashboardReducer,
      scorecardData: scorecardReducer,
      myPlanogram: myPlanogramReducer,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
}

// Render helper with Redux and Router
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock useNavigate hook - will be set up in individual test files
export const mockNavigate = jest.fn();

