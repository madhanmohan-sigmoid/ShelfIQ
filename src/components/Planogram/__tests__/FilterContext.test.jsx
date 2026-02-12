import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterProvider, useFilter } from '../FilterContext';

// Test component that uses the filter context
const TestComponent = () => {
  const { filters, setFilters, options, setOptions, resetFilters } = useFilter();
  
  return (
    <div>
      <div data-testid="filters">{JSON.stringify(filters)}</div>
      <div data-testid="options">{JSON.stringify(options)}</div>
      <button onClick={() => setFilters({ subCategories: ['test'] })}>Set Filters</button>
      <button onClick={() => setOptions({ brands: ['brand1'] })}>Set Options</button>
      <button onClick={resetFilters}>Reset</button>
    </div>
  );
};

describe('FilterContext', () => {
  it('should provide default filters and options', () => {
    render(
      <FilterProvider>
        <TestComponent />
      </FilterProvider>
    );
    
    const filtersElement = screen.getByTestId('filters');
    expect(filtersElement.textContent).toContain('subCategories');
    expect(filtersElement.textContent).toContain('brands');
    expect(filtersElement.textContent).toContain('priceTiers');
  });

  it('should allow updating filters', () => {
    render(
      <FilterProvider>
        <TestComponent />
      </FilterProvider>
    );
    
    const setFiltersButton = screen.getByText('Set Filters');
    fireEvent.click(setFiltersButton);
    
    const filtersElement = screen.getByTestId('filters');
    expect(filtersElement.textContent).toContain('test');
  });

  it('should allow updating options', () => {
    render(
      <FilterProvider>
        <TestComponent />
      </FilterProvider>
    );
    
    const setOptionsButton = screen.getByText('Set Options');
    fireEvent.click(setOptionsButton);
    
    const optionsElement = screen.getByTestId('options');
    expect(optionsElement.textContent).toContain('brand1');
  });

  it('should reset filters to default', () => {
    render(
      <FilterProvider>
        <TestComponent />
      </FilterProvider>
    );
    
    // Set filters first
    fireEvent.click(screen.getByText('Set Filters'));
    expect(screen.getByTestId('filters').textContent).toContain('test');
    
    // Reset
    fireEvent.click(screen.getByText('Reset'));
    const filtersElement = screen.getByTestId('filters');
    expect(filtersElement.textContent).not.toContain('test');
    expect(filtersElement.textContent).toContain('[]');
  });
});

