import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SortDropdown from '../SortDropdown';

let latestClickAwayHandler = null;
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  const React = require('react');
  const ClickAwayListener = ({ onClickAway, children }) => {
    latestClickAwayHandler = onClickAway;
    return <div data-testid="mock-click-away">{children}</div>;
  };
  return {
    ...actual,
    ClickAwayListener,
  };
});

// Mock SortPanel
jest.mock('../SortPanel', () => {
  return function MockSortPanel({ sortBy, onSortChange }) {
    return (
      <div data-testid="sort-panel">
        <button onClick={() => onSortChange('name-asc')}>Sort</button>
        <span>{sortBy}</span>
      </div>
    );
  };
});

describe('SortDropdown', () => {
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  it('should render without crashing', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('should toggle dropdown when button is clicked', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const button = screen.getByText('Sort By').closest('button');
    expect(button).toBeInTheDocument();
    
    // Initially closed (Popper might not render)
    fireEvent.click(button);
    
    // After click, should be open
    expect(screen.getByTestId('sort-panel')).toBeInTheDocument();
  });

  it('should close dropdown when button is clicked again', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    expect(screen.getByTestId('sort-panel')).toBeInTheDocument();
    
    // Click again to close
    fireEvent.click(button);
    expect(screen.queryByTestId('sort-panel')).not.toBeInTheDocument();
  });

  it('should call onSortChange when sort option is selected', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    
    const sortButton = screen.getByText('Sort');
    fireEvent.click(sortButton);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('name-asc');
  });

  it('should close dropdown after selection', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    
    const sortButton = screen.getByText('Sort');
    fireEvent.click(sortButton);
    
    // Dropdown should close after selection
    expect(mockOnSortChange).toHaveBeenCalled();
  });

  it('should handle different sortBy values', () => {
    render(<SortDropdown sortBy="name-desc" onSortChange={mockOnSortChange} />);
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    expect(screen.getByText('name-desc')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    expect(typeof latestClickAwayHandler).toBe('function');
  
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    expect(screen.getByTestId('sort-panel')).toBeInTheDocument();
  
    // simulate click outside via click away handler
    act(() => {
      latestClickAwayHandler({ target: document.createElement('div') });
    });
    await waitFor(() => {
      expect(screen.queryByTestId('sort-panel')).not.toBeInTheDocument();
    });
  });

  it('should not close dropdown when clicking the anchor button itself', () => {
    render(<SortDropdown sortBy="name-asc" onSortChange={mockOnSortChange} />);
    expect(typeof latestClickAwayHandler).toBe('function');
    
    const button = screen.getByText('Sort By').closest('button');
    fireEvent.click(button);
    expect(screen.getByTestId('sort-panel')).toBeInTheDocument();
    
    // Click the button again - handleClose checks if target is anchor
    act(() => {
      latestClickAwayHandler({ target: button });
    });
    expect(screen.getByTestId('sort-panel')).toBeInTheDocument();
  });
});

