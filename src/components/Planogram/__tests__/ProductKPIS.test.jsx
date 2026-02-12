import React from 'react';
import { screen } from '@testing-library/react';
import ProductKPIS from '../ProductKPIS';
import { renderWithProviders } from '../../../screens/__tests__/testUtils';

describe('ProductKPIS', () => {
  const planogramId = 'planogram-42';
  const productId = 'product-123';
  const tpnb = 'TPNB123';

  const defaultPreloadedState = {
    planogramVisualizerData: {
      productKPIsByTpnb: {},
      planogramProducts: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('instructs the user to select a product when none is provided', () => {
    renderWithProviders(<ProductKPIS planogramId={planogramId} selectedProductID={null} />, {
      preloadedState: defaultPreloadedState
    });
    expect(
      screen.getByText(/Please select a product to view KPI details/i),
    ).toBeInTheDocument();
  });

  it('shows empty state when product is selected but no KPI data is available', () => {
    const selectedProduct = {
      product_id: productId,
      tpnb: tpnb,
    };

    renderWithProviders(
      <ProductKPIS 
        planogramId={planogramId} 
        selectedProductID={productId}
        selectedProduct={selectedProduct}
      />,
      {
        preloadedState: defaultPreloadedState
      }
    );

    expect(
      screen.getByText(/No KPI data available for the selected product/i),
    ).toBeInTheDocument();
  });

  it('renders KPI data from Redux when available', () => {
    const selectedProduct = {
      product_id: productId,
      tpnb: tpnb,
    };

    const preloadedState = {
      planogramVisualizerData: {
        productKPIsByTpnb: {
          [tpnb]: {
            sales: 1234,
            units: 56,
            DOS: 12,
          },
        },
        planogramProducts: [],
      },
    };

    renderWithProviders(
      <ProductKPIS 
        planogramId={planogramId} 
        selectedProductID={productId}
        selectedProduct={selectedProduct}
      />,
      {
        preloadedState
      }
    );

    expect(screen.getByText(/£ 1234/)).toBeInTheDocument();
    expect(screen.getByText(/56 units/)).toBeInTheDocument();
    expect(screen.getByText(/12 days/)).toBeInTheDocument();
  });

  it('renders KPI data from planogramProducts when available', () => {
    const selectedProduct = {
      product_id: productId,
      tpnb: tpnb,
    };

    const preloadedState = {
      planogramVisualizerData: {
        productKPIsByTpnb: {},
        planogramProducts: [
          {
            product_id: productId,
            product_kpis: {
              sales: 1234,
              units: 56,
              DOS: 12,
            },
          },
        ],
      },
    };

    renderWithProviders(
      <ProductKPIS 
        planogramId={planogramId} 
        selectedProductID={productId}
        selectedProduct={selectedProduct}
      />,
      {
        preloadedState
      }
    );

    expect(screen.getByText(/£ 1234/)).toBeInTheDocument();
    expect(screen.getByText(/56 units/)).toBeInTheDocument();
    expect(screen.getByText(/12 days/)).toBeInTheDocument();
  });
});

