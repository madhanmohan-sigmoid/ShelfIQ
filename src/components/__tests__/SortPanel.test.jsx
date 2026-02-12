import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortPanel from '../SortPanel';

describe('SortPanel', () => {
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  it('should render without crashing', () => {
    render(<SortPanel sortBy="name-asc" onSortChange={mockOnSortChange} />);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('should display all field options', () => {
    render(<SortPanel sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('should display direction options', () => {
    render(<SortPanel sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    expect(screen.getByText('Ascending')).toBeInTheDocument();
    expect(screen.getByText('Descending')).toBeInTheDocument();
  });

  it('should call onSortChange when field is clicked', () => {
    render(<SortPanel sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const priceButton = screen.getByText('Price');
    fireEvent.click(priceButton);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('price-asc');
  });

  it('should call onSortChange when direction is clicked', () => {
    render(<SortPanel sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const descButton = screen.getByText('Descending');
    fireEvent.click(descButton);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('name-desc');
  });

  it('should highlight selected field', () => {
    render(<SortPanel sortBy="price-asc" onSortChange={mockOnSortChange} />);
    
    const priceButton = screen.getByText('Price').closest('button');
    expect(priceButton).toHaveClass('hover:bg-gray-100');
  });

  it('should handle empty sortBy prop', () => {
    render(<SortPanel sortBy="" onSortChange={mockOnSortChange} />);
    
    const nameButton = screen.getByText('Name');
    fireEvent.click(nameButton);
    
    expect(mockOnSortChange).toHaveBeenCalled();
  });
});

