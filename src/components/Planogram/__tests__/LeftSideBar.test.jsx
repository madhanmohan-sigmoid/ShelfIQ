import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import LeftSideBar from '../LeftSideBar';
import { renderWithProviders } from '../../../screens/__tests__/testUtils';

// Mock ProductInventory
jest.mock('../ProductInventory', () => {
  return function MockProductInventory() {
    return <div data-testid="product-inventory">ProductInventory</div>;
  };
});

describe('LeftSideBar', () => {
  it('should render without crashing', () => {
    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: null
        }
      }
    });
    expect(screen.getByTestId('product-inventory')).toBeInTheDocument();
  });

  it('should show ProductInventory when not collapsed', () => {
    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: null
        }
      }
    });
    expect(screen.getByTestId('product-inventory')).toBeInTheDocument();
  });

  it('should hide ProductInventory when collapsed', () => {
    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: true,
          productInventorySelectedProduct: null
        }
      }
    });
    expect(screen.queryByTestId('product-inventory')).not.toBeInTheDocument();
  });

  it('should toggle collapse state when button is clicked', () => {
    const { store } = renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: null
        }
      }
    });
    
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    const state = store.getState();
    expect(state.planogramVisualizerData.leftSidebarCollapsed).toBe(true);
  });

  it('should scroll to product when productInventorySelectedProduct has id', () => {
    // Create a mock element with scrollIntoView
    const mockScrollIntoView = jest.fn();
    const mockElement = document.createElement('div');
    mockElement.scrollIntoView = mockScrollIntoView;
    mockElement.id = '123';
    document.body.appendChild(mockElement);

    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: { id: '123', name: 'Test Product' }
        }
      }
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    document.body.removeChild(mockElement);
  });

  it('should not crash when productInventorySelectedProduct element not found', () => {
    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: { id: 'nonexistent', name: 'Test Product' }
        }
      }
    });

    // Should not throw error
    expect(screen.getByTestId('product-inventory')).toBeInTheDocument();
  });

  it('should not crash when element has no scrollIntoView method', () => {
    const mockElement = document.createElement('div');
    mockElement.id = '456';
    document.body.appendChild(mockElement);
    // Don't add scrollIntoView method

    renderWithProviders(<LeftSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          leftSidebarCollapsed: false,
          productInventorySelectedProduct: { id: '456', name: 'Test Product' }
        }
      }
    });

    // Should not throw error
    expect(screen.getByTestId('product-inventory')).toBeInTheDocument();

    document.body.removeChild(mockElement);
  });
});

