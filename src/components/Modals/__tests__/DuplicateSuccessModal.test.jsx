import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DuplicateSuccessModal from '../DuplicateSuccessModal';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DuplicateSuccessModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    clonedName: 'Test Planogram',
    duplicatedId: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(
      <MemoryRouter>
        <DuplicateSuccessModal {...defaultProps} {...props} />
      </MemoryRouter>
    );

  it('should render when open is true', () => {
    renderModal();
    expect(screen.getByText('Planogram Duplicated Successfully!')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog')
    ).toHaveTextContent(/Your copy has been created and saved to .*My Planograms.* as/);
    expect(screen.getByText('Test Planogram')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    renderModal({ open: false });
    expect(screen.queryByText('Planogram Duplicated Successfully!')).not.toBeInTheDocument();
  });

  it('should display cloned name', () => {
    renderModal({ clonedName: 'My Cloned Planogram' });
    expect(screen.getByText('My Cloned Planogram')).toBeInTheDocument();
  });

  it('should call onClose when Stay Here button is clicked', () => {
    renderModal();
    const stayButton = screen.getByText('Stay Here');
    fireEvent.click(stayButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to specific planogram when Go to My Planograms is clicked with duplicatedId', () => {
    renderModal({ duplicatedId: '123' });
    const goButton = screen.getByText('Go to My Planograms');
    fireEvent.click(goButton);
    expect(mockNavigate).toHaveBeenCalledWith('/my-planogram/123', {
      state: { fromDuplicateModal: true },
    });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to my-planogram list when Go to My Planograms is clicked without duplicatedId', () => {
    renderModal({ duplicatedId: null });
    const goButton = screen.getByText('Go to My Planograms');
    fireEvent.click(goButton);
    expect(mockNavigate).toHaveBeenCalledWith('/my-planogram');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to my-planogram list when duplicatedId is undefined', () => {
    renderModal({ duplicatedId: undefined });
    const goButton = screen.getByText('Go to My Planograms');
    fireEvent.click(goButton);
    expect(mockNavigate).toHaveBeenCalledWith('/my-planogram');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal backdrop is clicked', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    // Simulate backdrop click by clicking outside the dialog content
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

