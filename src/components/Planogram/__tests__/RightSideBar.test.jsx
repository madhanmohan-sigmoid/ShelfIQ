import React from 'react';
import {  screen, fireEvent } from '@testing-library/react';
import RightSideBar from '../RightSideBar';
import { renderWithProviders } from '../../../screens/__tests__/testUtils';

// Mock child components
jest.mock('../ProductDetails', () => {
  return function MockProductDetails({ selectedProduct }) {
    return <div data-testid="product-details">ProductDetails: {selectedProduct?.name}</div>;
  };
});

jest.mock('../ProductKPIS', () => {
  return function MockProductKPIS({ selectedProductID }) {
    return <div data-testid="product-kpis">ProductKPIS: {selectedProductID}</div>;
  };
});

jest.mock('../../../utils/productUtils', () => ({
  getFallbackImage: jest.fn(() => 'fallback-image.png')
}));

describe('RightSideBar', () => {
  const mockProduct = {
    product_id: '123',
    name: 'Test Product',
    image_url: 'test-image.jpg'
  };

  it('should render without crashing', () => {
    renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: false,
          selectedProduct: null,
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    // The component auto-collapses when selectedProduct is null (see useEffect)
    // So we just verify it renders without crashing
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('should display product details when product is selected', () => {
    renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: false,
          selectedProduct: mockProduct,
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    expect(screen.getByTestId('product-details')).toBeInTheDocument();
    expect(screen.getByText('ProductDetails: Test Product')).toBeInTheDocument();
  });

  it('should show tabs for Product and KPIs', () => {
    renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: false,
          selectedProduct: mockProduct,
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('KPIs')).toBeInTheDocument();
  });

  it('should switch to KPIs tab when clicked', () => {
    renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: false,
          selectedProduct: mockProduct,
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    
    const kpisTab = screen.getByText('KPIs');
    fireEvent.click(kpisTab);
    
    expect(screen.getByTestId('product-kpis')).toBeInTheDocument();
  });

  it('should collapse when toggle button is clicked', () => {
    const { store } = renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: false,
          selectedProduct: mockProduct, // Need a product to prevent auto-collapse
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    
    // Find the collapse button (it has aria-label)
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);
    
    const state = store.getState();
    expect(state.planogramVisualizerData.rightSidebarCollapsed).toBe(true);
  });

  it('should hide content when collapsed', async () => {
    const { store } = renderWithProviders(<RightSideBar />, {
      preloadedState: {
        planogramVisualizerData: {
          rightSidebarCollapsed: true,
          selectedProduct: null, // No product to prevent auto-expand
          isFullScreen: false,
          planogramId: 'planogram-1'
        }
      }
    });
    
    // When collapsed and no product, the content inside {!collapsed && ...} won't render
    // So Product tab should not be visible
    expect(screen.queryByText('Product')).not.toBeInTheDocument();
    // But the expand button should be visible
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    
    // Verify the state is actually collapsed
    const state = store.getState();
    expect(state.planogramVisualizerData.rightSidebarCollapsed).toBe(true);
  });
});

