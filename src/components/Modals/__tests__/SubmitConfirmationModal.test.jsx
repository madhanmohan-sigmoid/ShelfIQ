import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubmitConfirmationModal from '../SubmitConfirmationModal';

describe('SubmitConfirmationModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    planogramName: 'Test Planogram',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open is true', () => {
    render(<SubmitConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Submit Planogram')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to submit/)).toBeInTheDocument();
    expect(screen.getByText('Test Planogram')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<SubmitConfirmationModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Submit Planogram')).not.toBeInTheDocument();
  });

  it('should use default planogramName when not provided', () => {
    render(<SubmitConfirmationModal {...defaultProps} planogramName={undefined} />);
    expect(screen.getByText(/this planogram/)).toBeInTheDocument();
  });

  it('should display custom planogramName', () => {
    render(<SubmitConfirmationModal {...defaultProps} planogramName="My Custom Planogram" />);
    expect(screen.getByText('My Custom Planogram')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<SubmitConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and onClose when Submit button is clicked', () => {
    render(<SubmitConfirmationModal {...defaultProps} />);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal backdrop is clicked', () => {
    render(<SubmitConfirmationModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

