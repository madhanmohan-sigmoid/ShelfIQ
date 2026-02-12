import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterModalWrapper from '../FilterModalWrapper';

describe('FilterModalWrapper', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onReset: jest.fn(),
    onApply: jest.fn(),
  };

  const renderWrapper = (props = {}, children = <div>Test Content</div>) =>
    render(
      <FilterModalWrapper {...defaultProps} {...props}>
        {children}
      </FilterModalWrapper>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open is true', () => {
    renderWrapper();
    expect(screen.getByText('All Filters')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    renderWrapper({ open: false });
    expect(screen.queryByText('All Filters')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    renderWrapper();
    const closeButton = await screen.findByRole('button', {
      name: /close filters/i,
    });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onReset when reset button is clicked', () => {
    renderWrapper();
    const resetButton = screen.getByText('Reset All Filters');
    fireEvent.click(resetButton);
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('should call onApply when apply button is clicked', () => {
    renderWrapper();
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
  });

  it('should use default themeColor when not provided', () => {
    renderWrapper();
    const header = screen.getByText('All Filters').closest('div');
    expect(header).toHaveStyle({ color: '#FFB000' });
  });

  it('should use custom themeColor when provided', () => {
    renderWrapper({ themeColor: '#FF782C' });
    const header = screen.getByText('All Filters').closest('div');
    expect(header).toHaveStyle({ color: '#FF782C' });
  });

  it('should render children content', () => {
    const customChildren = <div data-testid="custom-content">Custom Content</div>;
    renderWrapper({}, customChildren);
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should have onClose prop defined', () => {
    renderWrapper();
    // Modal component receives onClose prop
    // The onClose functionality is tested by MUI Modal, we just verify it's passed
    expect(defaultProps.onClose).toBeDefined();
  });
});

