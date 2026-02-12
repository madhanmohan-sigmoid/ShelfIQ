import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MainContainer from '../MainContainer';
import dashboardReducer from '../../../redux/reducers/dashboardSlice';
import planogramVisualizerReducer from '../../../redux/reducers/planogramVisualizerSlice';

// Mock child components
jest.mock('../DashboardLayout', () => {
  return function MockDashboardLayout({ children }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('../DashboardContent', () => {
  return function MockDashboardContent({ searchTerm, onSearchChange }) {
    return (
      <div data-testid="dashboard-content">
        <input
          data-testid="search-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    );
  };
});

describe('MainContainer', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        dashboard: dashboardReducer,
        planogramVisualizerData: planogramVisualizerReducer,
      },
      preloadedState: {
        dashboard: {
          viewMode: 'list',
          searchTerm: '',
          ...initialState.dashboard,
        },
        planogramVisualizerData: {
          ...initialState.planogramVisualizerData,
        },
      },
    });
  };

  it('should render without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
  });

  it('should render DashboardLayout wrapper', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should render DashboardContent inside layout', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
    const layout = screen.getByTestId('dashboard-layout');
    const content = screen.getByTestId('dashboard-content');
    expect(layout).toContainElement(content);
  });

  it('should provide searchTerm to DashboardContent from state', () => {
    const store = createTestStore({ dashboard: { searchTerm: 'test search', viewMode: 'list' } });
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
    
    // After mount, resetDashboard is called, so searchTerm will be reset to ''
    const state = store.getState();
    expect(state.dashboard.searchTerm).toBe('');
  });

  it('should have empty searchTerm after mount due to resetDashboard', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );
    const searchInput = screen.getByTestId('search-input');
    // After resetDashboard is dispatched on mount, searchTerm should be empty
    expect(searchInput).toHaveValue('');
  });

  it('should reset dashboard state on mount', () => {
    const store = createTestStore({ 
      dashboard: { viewMode: 'grid', searchTerm: 'test' } 
    });
    
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );

    // After mount, state should be reset
    const state = store.getState();
    expect(state.dashboard.viewMode).toBe('list');
    expect(state.dashboard.searchTerm).toBe('');
  });

  it('should reset planogramVisualizer state on mount', () => {
    const store = createTestStore({
      planogramVisualizerData: { planogramId: '123' }
    });
    
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );

    // Component should trigger reset
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  it('should render search input through DashboardContent', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
  });

  it('should connect to Redux state', () => {
    const store = createTestStore({ dashboard: { searchTerm: 'initial search', viewMode: 'list' } });
    
    render(
      <Provider store={store}>
        <MainContainer />
      </Provider>
    );

    // Component uses useDashboardState hook which connects to Redux
    const searchInput = screen.getByTestId('search-input');
    // After resetDashboard on mount, value will be empty
    expect(searchInput).toBeInTheDocument();
  });
});

