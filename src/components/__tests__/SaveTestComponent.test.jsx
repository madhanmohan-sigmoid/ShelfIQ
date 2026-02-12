import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SaveTestComponent from '../SaveTestComponent';
import planogramVisualizerData from '../../redux/reducers/planogramVisualizerSlice';

describe('SaveTestComponent', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        planogramVisualizerData: planogramVisualizerData,
      },
      preloadedState: {
        planogramVisualizerData: {
          savedPlanogramState: initialState.savedPlanogramState || null,
        },
      },
    });
  };

  it('should render without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <SaveTestComponent />
      </Provider>
    );

    expect(screen.getByText('Saved Planogram State')).toBeInTheDocument();
  });

  it('should display saved state when available', () => {
    const mockSavedState = {
      planogramId: 'test-id',
      bays: [],
      shelfLines: [],
    };

    const store = createTestStore({
      savedPlanogramState: mockSavedState,
    });

    render(
      <Provider store={store}>
        <SaveTestComponent />
      </Provider>
    );

    expect(screen.getByText('Saved Planogram State')).toBeInTheDocument();
    expect(screen.getByText(/test-id/)).toBeInTheDocument();
  });

  it('should display null when no saved state', () => {
    const store = createTestStore({
      savedPlanogramState: null,
    });

    render(
      <Provider store={store}>
        <SaveTestComponent />
      </Provider>
    );

    expect(screen.getByText('Saved Planogram State')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });
});

