import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductDetails from '../ProductDetails';

describe('ProductDetails', () => {
  const baseProduct = {
    name: 'Test Product',
    tpnb: '123456',
    brand: 'BrandX',
    price: 250,
    description: 'Rich and foamy',
    actualWidth: 5,
    actualHeight: 10,
    depth: 12,
    total_facings: 6,
    facings_wide: 3,
    facings_high: 2,
    dimensionUom: 'cm',
    gtin: '987654321',
    orientation: 90,
  };

  it('renders key product fields with formatted price', () => {
    render(<ProductDetails selectedProduct={baseProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/TPNB: 123456/)).toBeInTheDocument();
    expect(screen.getByText(/Brand: BrandX/)).toBeInTheDocument();
    expect(screen.getByText('£2.50')).toBeInTheDocument();
    expect(screen.getByText('Rich and foamy')).toBeInTheDocument();
    expect(screen.getByText('GTIN: 987654321')).toBeInTheDocument();
    expect(screen.getByText('Orientation: 90°')).toBeInTheDocument();
  });

  it('handles low price values and missing description gracefully', () => {
    const product = {
      ...baseProduct,
      price: 75,
      description: '',
    };

    render(<ProductDetails selectedProduct={product} />);

    expect(screen.getByText('75p')).toBeInTheDocument();
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });
});

