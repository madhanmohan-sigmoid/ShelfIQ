import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResetFilterButton from '../ResetFilterButton';

describe('ResetFilterButton', () => {
  const mockOnResetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<ResetFilterButton onResetFilters={mockOnResetFilters} />);
      expect(screen.getByText('Reset Filters')).toBeInTheDocument();
    });

    it('should render the filter icon', () => {
      const { container } = render(<ResetFilterButton onResetFilters={mockOnResetFilters} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('hasActiveFilters = false', () => {
    it('should be disabled when hasActiveFilters is false', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={false} 
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styling when hasActiveFilters is false', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={false} 
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toHaveClass('border-gray-300');
      expect(button).toHaveClass('text-gray-400');
      expect(button).toHaveClass('cursor-not-allowed');
      expect(button).toHaveClass('bg-white');
    });

    it('should not call onResetFilters when clicked while disabled', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={false} 
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      fireEvent.click(button);
      expect(mockOnResetFilters).not.toHaveBeenCalled();
    });
  });

  describe('hasActiveFilters = true', () => {
    it('should be enabled when hasActiveFilters is true', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true} 
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).not.toBeDisabled();
    });

    it('should call onResetFilters when clicked while enabled', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true} 
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      fireEvent.click(button);
      expect(mockOnResetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('useOrangeTheme = false (default)', () => {
    it('should use yellow theme when useOrangeTheme is false and hasActiveFilters is true', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true}
          useOrangeTheme={false}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toHaveClass('border-[#FFD473]');
      expect(button).toHaveClass('bg-[#FFD473]');
      expect(button).toHaveClass('text-black');
    });

    it('should use yellow theme by default when useOrangeTheme is not provided', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toHaveClass('border-[#FFD473]');
      expect(button).toHaveClass('bg-[#FFD473]');
      expect(button).toHaveClass('text-black');
    });
  });

  describe('useOrangeTheme = true', () => {
    it('should use orange theme when useOrangeTheme is true and hasActiveFilters is true', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true}
          useOrangeTheme={true}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toHaveClass('border-[#FFAE80]');
      expect(button).toHaveClass('bg-[#FFAE80]');
      expect(button).toHaveClass('text-black');
    });
  });

  describe('All combinations', () => {
    it('should handle hasActiveFilters=false, useOrangeTheme=false', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={false}
          useOrangeTheme={false}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('border-gray-300');
    });

    it('should handle hasActiveFilters=false, useOrangeTheme=true', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={false}
          useOrangeTheme={true}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('border-gray-300');
    });

    it('should handle hasActiveFilters=true, useOrangeTheme=false', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true}
          useOrangeTheme={false}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('bg-[#FFD473]');
    });

    it('should handle hasActiveFilters=true, useOrangeTheme=true', () => {
      render(
        <ResetFilterButton 
          onResetFilters={mockOnResetFilters} 
          hasActiveFilters={true}
          useOrangeTheme={true}
        />
      );
      const button = screen.getByText('Reset Filters').closest('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('bg-[#FFAE80]');
    });
  });
});
