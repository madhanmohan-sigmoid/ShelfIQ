import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductNameTag from '../ProductNameTag';

describe('ProductNameTag', () => {
  const mockShelfLines = [
    [
      [
        {
          id: '1',
          name: 'Product 1',
          price: 500,
          linear: 30,
          isEmpty: false
        },
        {
          id: '2',
          name: 'Product 2',
          price: 750,
          linear: 25,
          isEmpty: false
        }
      ]
    ]
  ];

  const mockIsDimmed = jest.fn(() => false);

  it('should render without crashing', () => {
    render(
      <ProductNameTag
        shelfLines={mockShelfLines}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should display product names', () => {
    render(
      <ProductNameTag
        shelfLines={mockShelfLines}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should format price correctly', () => {
    render(
      <ProductNameTag
        shelfLines={mockShelfLines}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    // Price is in pence, so 500 = £5.00
    expect(screen.getByText('£5.00')).toBeInTheDocument();
    expect(screen.getByText('£7.50')).toBeInTheDocument();
  });

  it('should handle empty items', () => {
    const shelfLinesWithEmpty = [
      [
        [
          {
            id: '1',
            name: 'Product 1',
            price: 500,
            linear: 30,
            isEmpty: true
          }
        ]
      ]
    ];

    render(
      <ProductNameTag
        shelfLines={shelfLinesWithEmpty}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should apply dimmed styling when isDimmed returns true', () => {
    const isDimmedTrue = jest.fn(() => true);
    const { container } = render(
      <ProductNameTag
        shelfLines={mockShelfLines}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={isDimmedTrue}
      />
    );
    // Check that dimmed class is applied
    const productDiv = container.querySelector('.opacity-30');
    expect(productDiv).toBeInTheDocument();
  });

  it('should apply smaller text size when linear is less than 25', () => {
    const shelfLinesWithSmallLinear = [
      [
        [
          {
            id: '1',
            name: 'Small Product',
            price: 500,
            linear: 20, // < 25
            isEmpty: false
          }
        ]
      ]
    ];

    const { container } = render(
      <ProductNameTag
        shelfLines={shelfLinesWithSmallLinear}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    // Check for text-[5px] class
    const priceElement = container.querySelector('.text-\\[5px\\]');
    expect(priceElement).toBeInTheDocument();
  });

  it('should apply larger text size when linear is 25 or more', () => {
    const shelfLinesWithLargeLinear = [
      [
        [
          {
            id: '1',
            name: 'Large Product',
            price: 500,
            linear: 30, // >= 25
            isEmpty: false
          }
        ]
      ]
    ];

    const { container } = render(
      <ProductNameTag
        shelfLines={shelfLinesWithLargeLinear}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    // Check for text-[7px] class
    const priceElement = container.querySelector('.text-\\[7px\\]');
    expect(priceElement).toBeInTheDocument();
  });

  it('should scale linear width when displayZoom is provided', () => {
    const { container } = render(
      <ProductNameTag
        shelfLines={mockShelfLines}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
        displayZoom={2}
      />
    );

    const productElement = container.querySelector('[title="Product 1"]');
    expect(productElement).toBeInTheDocument();
    expect(productElement.style.width).toBe('60px');
  });

  it('should handle non-numeric price', () => {
    const shelfLinesWithNonNumericPrice = [
      [
        [
          {
            id: '1',
            name: 'Product with invalid price',
            price: 'invalid',
            linear: 30,
            isEmpty: false
          }
        ]
      ]
    ];

    render(
      <ProductNameTag
        shelfLines={shelfLinesWithNonNumericPrice}
        shelfIdx={0}
        subShelfIdx={0}
        isDimmed={mockIsDimmed}
      />
    );
    expect(screen.getByText('Product with invalid price')).toBeInTheDocument();
    // Price should not be displayed
    expect(screen.queryByText(/£/)).not.toBeInTheDocument();
  });
});

