import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ShowAllFilterDropdown from '../ShowAllFilterDropdown';
import productDataReducer, { resetFilters, removeFilterByValue } from '../../redux/reducers/productDataSlice';

describe('ShowAllFilterDropdown', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        productData: productDataReducer,
      },
      preloadedState: {
        productData: {
          productFilters: {
            selectedBrand: [],
            selectedCategory: [],
            selectedIntensity: [],
            selectedPlatform: [],
            ...initialState.productFilters,
          },
          ...initialState,
        },
      },
    });
  };

  it('should render without crashing', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    expect(screen.getByText('Show All')).toBeInTheDocument();
  });

  it('should display "No filters applied" when no filters are active', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);

    expect(screen.getByText('No filters applied')).toBeInTheDocument();
  });

  it('should display active filters when filters are applied', () => {
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1', 'Brand2'],
        selectedCategory: ['Category1'],
        selectedIntensity: [],
        selectedPlatform: [],
      },
    });

    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);

    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Sub Category')).toBeInTheDocument();
  });

  it('should call removeFilterByValue when filter is removed', () => {
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1'],
        selectedCategory: [],
        selectedIntensity: [],
        selectedPlatform: [],
      },
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);

    // Find and click the close button for a filter
    const removeButton = screen.getByLabelText('remove filter Brand1');
    fireEvent.click(removeButton);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: removeFilterByValue.type,
      payload: 'Brand1',
    }));

    dispatchSpy.mockRestore();
  });

  it('should call resetFilters when "Reset All Filters" is clicked', async () => {
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1'],
        selectedCategory: ['Category1'],
        selectedIntensity: [],
        selectedPlatform: [],
      },
    });

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);

    // Wait for the dropdown to open and reset button to appear
    const resetButton = await screen.findByText('Reset All Filters');
    expect(resetButton).toBeInTheDocument();
    fireEvent.click(resetButton);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: resetFilters.type,
    }));

    dispatchSpy.mockRestore();
  });

  it('should toggle dropdown on button click', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    
    // Initially closed
    expect(screen.queryByText('All Filters')).not.toBeInTheDocument();
    
    // Open
    fireEvent.click(button);
    expect(screen.getByText('All Filters')).toBeInTheDocument();
  });

  it('should not close dropdown when clicking the anchor button itself', () => {
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1'],
        selectedCategory: [],
        selectedIntensity: [],
        selectedPlatform: [],
      },
    });

    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);
    expect(screen.getByText('All Filters')).toBeInTheDocument();
    
    // Click the button again - handleClose should return early
    fireEvent.mouseDown(button);
    // Dropdown should remain open because event.target is inside anchorRef
    expect(screen.getByText('All Filters')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside the component', async () => {
    const user = userEvent.setup();
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1'],
        selectedCategory: [],
        selectedIntensity: [],
        selectedPlatform: [],
      },
    });

    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <Provider store={store}>
          <ShowAllFilterDropdown />
        </Provider>
      </div>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);
    expect(screen.getByText('All Filters')).toBeInTheDocument();
    
    // Click outside
    await user.click(document.body);

    await waitFor(() =>
      expect(screen.queryByText('All Filters')).not.toBeInTheDocument()
    );
  });

  it('should display multiple filter types when all are active', () => {
    const store = createTestStore({
      productFilters: {
        selectedBrand: ['Brand1', 'Brand2'],
        selectedCategory: ['Category1'],
        selectedIntensity: ['Intensity1'],
        selectedPlatform: ['Platform1'],
      },
    });

    render(
      <Provider store={store}>
        <ShowAllFilterDropdown />
      </Provider>
    );

    const button = screen.getByText('Show All');
    fireEvent.click(button);

    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Sub Category')).toBeInTheDocument();
    expect(screen.getByText('Intensity')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
  });
});

