import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemWithTooltip from '../ItemWithTooltip';

describe('ItemWithTooltip', () => {
  const mockItem = {
    id: '123',
    name: 'Test Product',
    brand: 'Test Brand',
    description: 'Test Description',
    width: 10,
    height: 20,
    dimensionUom: 'cm',
    total_facings: 5,
    linear: 50,
    orientation: 90
  };

  it('should render without crashing', () => {
    render(
      <ItemWithTooltip item={mockItem}>
        <div>Child Content</div>
      </ItemWithTooltip>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should show tooltip on mouse enter', () => {
    render(
      <ItemWithTooltip item={mockItem}>
        <div>Child Content</div>
      </ItemWithTooltip>
    );
    
    const container = screen.getByText('Child Content').parentElement;
    fireEvent.mouseEnter(container);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/Brand: Test Brand/)).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave', () => {
    render(
      <ItemWithTooltip item={mockItem}>
        <div>Child Content</div>
      </ItemWithTooltip>
    );
    
    const container = screen.getByText('Child Content').parentElement;
    fireEvent.mouseEnter(container);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    
    fireEvent.mouseLeave(container);
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });

  it('should display item details in tooltip', () => {
    render(
      <ItemWithTooltip item={mockItem}>
        <div>Child Content</div>
      </ItemWithTooltip>
    );
    
    const container = screen.getByText('Child Content').parentElement;
    fireEvent.mouseEnter(container);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/Brand: Test Brand/)).toBeInTheDocument();
    const dimensionsNode = screen.getByText(/Dimensions:/);
    expect(dimensionsNode.textContent).toContain('10');
    expect(dimensionsNode.textContent).toContain('20');
    expect(dimensionsNode.textContent).toMatch(/cm$/);
    expect(screen.getByText(/Facings: 5/)).toBeInTheDocument();
    expect(screen.getByText(/ID: 123/)).toBeInTheDocument();
  });

  it('should not display description if not provided', () => {
    const itemWithoutDescription = { ...mockItem, description: null };
    render(
      <ItemWithTooltip item={itemWithoutDescription}>
        <div>Child Content</div>
      </ItemWithTooltip>
    );
    
    const container = screen.getByText('Child Content').parentElement;
    fireEvent.mouseEnter(container);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });
});

