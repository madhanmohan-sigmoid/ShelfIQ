import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SaveConfirmationModal from '../SaveConfirmationModal';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

import { useSelector } from 'react-redux';

describe('SaveConfirmationModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    planogramName: 'Test Planogram',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useSelector to return empty violations array by default
    useSelector.mockImplementation((selector) => {
      const mockState = {
        planogramVisualizerData: {
          violations: [],
        },
      };
      return selector(mockState) || [];
    });
  });

  it('should render when open is true', () => {
    render(<SaveConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Save Planogram')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to save/)).toBeInTheDocument();
    expect(screen.getByText('Test Planogram')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<SaveConfirmationModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Save Planogram')).not.toBeInTheDocument();
  });

  it('should use default planogramName when not provided', () => {
    render(<SaveConfirmationModal {...defaultProps} planogramName={undefined} />);
    expect(screen.getByText(/this planogram/)).toBeInTheDocument();
  });

  it('should display custom planogramName', () => {
    render(<SaveConfirmationModal {...defaultProps} planogramName="My Custom Planogram" />);
    expect(screen.getByText('My Custom Planogram')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<SaveConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and onClose when Save button is clicked', () => {
    render(<SaveConfirmationModal {...defaultProps} />);
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal backdrop is clicked', () => {
    render(<SaveConfirmationModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should display violations message when violations exist', () => {
    useSelector.mockImplementation((selector) => {
      const mockState = {
        planogramVisualizerData: {
          violations: [{ id: 'violation-1' }],
        },
      };
      return selector(mockState) || [];
    });

    render(<SaveConfirmationModal {...defaultProps} />);
    expect(screen.getByText(/(It contains violations)/)).toBeInTheDocument();
  });

  it('should not display violations message when no violations exist', () => {
    render(<SaveConfirmationModal {...defaultProps} />);
    expect(screen.queryByText(/(It contains violations)/)).not.toBeInTheDocument();
  });
});

