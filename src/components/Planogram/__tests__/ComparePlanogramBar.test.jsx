import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import ComparePlanogramBar from '../ComparePlanogramBar';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('ComparePlanogramBar', () => {
  const mockNavigate = jest.fn();
  const mockOnToggleView = jest.fn();
  const mockOnFilterClick = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const defaultProps = {
    view: 'kpi',
    onToggleView: mockOnToggleView,
    onFilterClick: mockOnFilterClick,
    onDownload: mockOnDownload,
    activeFiltersCount: 0,
  };

  it('renders all main elements', () => {
    render(<ComparePlanogramBar {...defaultProps} />);

    expect(screen.getByText('Compare Planograms')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    render(<ComparePlanogramBar {...defaultProps} />);

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  describe('View toggle buttons', () => {
    it('calls onToggleView with "kpi" when KPI button is clicked', () => {
      render(<ComparePlanogramBar {...defaultProps} view="planogram" />);

      const kpiButton = screen.getByRole('button', { name: 'KPI View' });
      fireEvent.click(kpiButton);

      expect(mockOnToggleView).toHaveBeenCalledWith('kpi');
    });

    it('calls onToggleView with "planogram" when Planogram button is clicked', () => {
      render(<ComparePlanogramBar {...defaultProps} view="kpi" />);

      const planogramButton = screen.getByRole('button', { name: 'Planogram View' });
      fireEvent.click(planogramButton);

      expect(mockOnToggleView).toHaveBeenCalledWith('planogram');
    });

    it('calls onToggleView with "schematic" when Schematic button is clicked', () => {
      render(<ComparePlanogramBar {...defaultProps} view="kpi" />);

      const schematicButton = screen.getByRole('button', { name: 'Schematic View' });
      fireEvent.click(schematicButton);

      expect(mockOnToggleView).toHaveBeenCalledWith('schematic');
    });

    it('highlights KPI button when view is "kpi"', () => {
      render(<ComparePlanogramBar {...defaultProps} view="kpi" />);

      const kpiButton = screen.getByRole('button', { name: 'KPI View' });
      expect(kpiButton).toHaveClass('bg-[#FFEBBF]');
    });

    it('highlights Planogram button when view is "planogram"', () => {
      render(<ComparePlanogramBar {...defaultProps} view="planogram" />);

      const planogramButton = screen.getByRole('button', { name: 'Planogram View' });
      expect(planogramButton).toHaveClass('bg-[#FFEBBF]');
    });

    it('highlights Schematic button when view is "schematic"', () => {
      render(<ComparePlanogramBar {...defaultProps} view="schematic" />);

      const schematicButton = screen.getByRole('button', { name: 'Schematic View' });
      expect(schematicButton).toHaveClass('bg-[#FFEBBF]');
    });
  });

  describe('Filter button', () => {
    it('calls onFilterClick when filter button is clicked', () => {
      render(<ComparePlanogramBar {...defaultProps} />);

      const filterButton = screen.getByText('Filter').closest('button');
      fireEvent.click(filterButton);

      expect(mockOnFilterClick).toHaveBeenCalled();
    });

    it('does not show badge when activeFiltersCount is 0', () => {
      render(<ComparePlanogramBar {...defaultProps} activeFiltersCount={0} />);

      const badge = screen.queryByText('0');
      expect(badge).not.toBeInTheDocument();
    });

    it('shows badge with count when activeFiltersCount is greater than 0', () => {
      render(<ComparePlanogramBar {...defaultProps} activeFiltersCount={5} />);

      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-500');
    });

    it('shows badge with correct count value', () => {
      render(<ComparePlanogramBar {...defaultProps} activeFiltersCount={10} />);

      const badge = screen.getByText('10');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Download button', () => {
    it('calls onDownload when download button is clicked', () => {
      render(<ComparePlanogramBar {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: 'Download' });
      fireEvent.click(downloadButton);

      expect(mockOnDownload).toHaveBeenCalled();
    });
  });

  it('uses default props when not provided', () => {
    render(<ComparePlanogramBar onToggleView={mockOnToggleView} onFilterClick={mockOnFilterClick} onDownload={mockOnDownload} />);

    expect(screen.getByText('Compare Planograms')).toBeInTheDocument();
    const kpiButton = screen.getByRole('button', { name: 'KPI View' });
    expect(kpiButton).toHaveClass('bg-[#FFEBBF]');
  });
});

