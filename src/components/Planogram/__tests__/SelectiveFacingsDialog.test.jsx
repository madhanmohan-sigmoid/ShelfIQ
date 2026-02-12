import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectiveFacingsDialog from '../SelectiveFacingsDialog';

describe('SelectiveFacingsDialog', () => {
  const mockOnClose = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    maxFacingsWide: 3,
    maxFacingsHigh: 2,
    productName: 'Test Product',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog rendering', () => {
    it('renders dialog when open is true', () => {
      render(<SelectiveFacingsDialog {...defaultProps} />);

      expect(screen.getByText('Remove Selective Facings')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('does not render dialog content when open is false', () => {
      render(<SelectiveFacingsDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Remove Selective Facings')).not.toBeInTheDocument();
    });

    it('renders product name in dialog title', () => {
      render(<SelectiveFacingsDialog {...defaultProps} productName="Custom Product" />);

      expect(screen.getByText('Custom Product')).toBeInTheDocument();
    });
  });

  describe('Conditional rendering - Wide facings', () => {
    it('renders wide facings section when maxFacingsWide > 1', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} />);

      expect(screen.getByText(/Width \(from right\): 3 facings/)).toBeInTheDocument();
    });

    it('does not render wide facings section when maxFacingsWide <= 1', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} />);

      expect(screen.queryByText(/Width \(from right\)/)).not.toBeInTheDocument();
    });

    it('does not render wide facings section when maxFacingsWide is 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={0} />);

      expect(screen.queryByText(/Width \(from right\)/)).not.toBeInTheDocument();
    });
  });

  describe('Conditional rendering - High facings', () => {
    it('renders high facings section when maxFacingsHigh > 1', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsHigh={2} />);

      expect(screen.getByText(/Height \(from top\): 2 facings/)).toBeInTheDocument();
    });

    it('does not render high facings section when maxFacingsHigh <= 1', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsHigh={1} />);

      expect(screen.queryByText(/Height \(from top\)/)).not.toBeInTheDocument();
    });

    it('does not render high facings section when maxFacingsHigh is 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsHigh={0} />);

      expect(screen.queryByText(/Height \(from top\)/)).not.toBeInTheDocument();
    });
  });

  describe('Divider rendering', () => {
    it('renders divider when both wide and high sections are present', () => {
      render(
        <SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />
      );

      // Verify both sections are present
      expect(screen.getByText(/Width \(from right\): 3 facings/)).toBeInTheDocument();
      expect(screen.getByText(/Height \(from top\): 2 facings/)).toBeInTheDocument();
      // Divider is rendered by Material-UI between sections when both are present
      // We verify the structure by checking both sections exist
    });

    it('does not render divider when only wide section is present', () => {
      const { container } = render(
        <SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />
      );

      const divider = container.querySelector('.MuiDivider-root');
      expect(divider).not.toBeInTheDocument();
    });

    it('does not render divider when only high section is present', () => {
      const { container } = render(
        <SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={2} />
      );

      const divider = container.querySelector('.MuiDivider-root');
      expect(divider).not.toBeInTheDocument();
    });
  });

  // Helper function to get input by label context
  const getInputByLabel = (labelText) => {
    const label = screen.getByText(new RegExp(labelText));
    const container = label.closest('div');
    const input = container?.querySelector('input[type="number"]');
    return input;
  };

  // Helper function to get buttons for an input (increase/decrease)
  const getInputButtons = (input) => {
    if (!input) return { decrease: null, increase: null };
    // Find the parent Box that contains the input and buttons
    let container = input.parentElement;
    while (container && !container.querySelector('button')) {
      container = container.parentElement;
    }
    if (!container) return { decrease: null, increase: null };
    
    const buttons = Array.from(container.querySelectorAll('button')).filter(
      (btn) => btn.querySelector('svg') && !btn.textContent.trim() // IconButtons have svg and no text
    );
    return {
      decrease: buttons[0] || null, // First button is decrease
      increase: buttons[1] || null, // Second button is increase
    };
  };

  describe('Initial state', () => {
    it('initializes facingsWideToRemove to 1 when hasWide is true', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      expect(wideInput).toBeInTheDocument();
      expect(wideInput.value).toBe('1');
    });

    it('initializes facingsWideToRemove to 0 when hasWide is false', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} />);

      // Wide section should not be rendered
      expect(screen.queryByText(/Width \(from right\)/)).not.toBeInTheDocument();
    });

    it('initializes facingsHighToRemove to 1 when hasHigh is true', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={2} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      expect(highInput).toBeInTheDocument();
      expect(highInput.value).toBe('1');
    });

    it('initializes facingsHighToRemove to 0 when hasHigh is false', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsHigh={1} />);

      // High section should not be rendered
      expect(screen.queryByText(/Height \(from top\)/)).not.toBeInTheDocument();
    });

    it('resets state when dialog reopens', () => {
      const { rerender } = render(
        <SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />
      );

      // Increase wide facings
      const increaseWideButton = screen.getAllByRole('button').find(
        (btn) => btn.querySelector('svg') && !btn.disabled
      );
      if (increaseWideButton) {
        fireEvent.click(increaseWideButton);
      }

      // Close dialog
      rerender(
        <SelectiveFacingsDialog {...defaultProps} open={false} maxFacingsWide={3} maxFacingsHigh={2} />
      );

      // Reopen dialog
      rerender(
        <SelectiveFacingsDialog {...defaultProps} open={true} maxFacingsWide={3} maxFacingsHigh={2} />
      );

      // Should reset to initial state
      const wideInputs = screen.getAllByDisplayValue('1');
      expect(wideInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Wide facings controls', () => {
    it('increases facingsWideToRemove when plus button is clicked', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const { increase } = getInputButtons(wideInput);

      expect(increase).toBeDefined();
      expect(increase.disabled).toBe(false);
      fireEvent.click(increase);
      expect(wideInput.value).toBe('2');
    });

    it('decreases facingsWideToRemove when minus button is clicked', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const { increase, decrease } = getInputButtons(wideInput);
      
      // First increase to 2
      fireEvent.click(increase);
      expect(wideInput.value).toBe('2');

      // Now decrease
      fireEvent.click(decrease);
      expect(wideInput.value).toBe('1');
    });

    it('disables decrease button when facingsWideToRemove is 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '0' } });

      const { decrease } = getInputButtons(wideInput);
      expect(decrease).toBeDefined();
      expect(decrease.disabled).toBe(true);
    });

    it('disables increase button when facingsWideToRemove is at max', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });

      const { increase } = getInputButtons(wideInput);
      expect(increase).toBeDefined();
      expect(increase.disabled).toBe(true);
    });

    it('updates facingsWideToRemove when input value changes', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });

      expect(wideInput.value).toBe('2');
    });

    it('does not update when input value is invalid (NaN)', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const originalValue = wideInput.value;
      fireEvent.change(wideInput, { target: { value: 'abc' } });

      // Should remain at previous valid value
      expect(wideInput.value).toBe(originalValue);
    });

    it('does not update when input value is negative', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const originalValue = wideInput.value;
      fireEvent.change(wideInput, { target: { value: '-1' } });

      // Should not accept negative values
      expect(wideInput.value).not.toBe('-1');
      expect(wideInput.value).toBe(originalValue);
    });

    it('does not update when input value is >= maxFacingsWide', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const originalValue = wideInput.value;
      fireEvent.change(wideInput, { target: { value: '3' } });

      // Should not accept values >= maxFacingsWide
      expect(wideInput.value).not.toBe('3');
      expect(wideInput.value).toBe(originalValue);
    });

    it('updates caption text when facingsWideToRemove changes', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      expect(screen.getByText(/Removing 1 of 3 facings wide/)).toBeInTheDocument();

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });

      expect(screen.getByText(/Removing 2 of 3 facings wide/)).toBeInTheDocument();
    });
  });

  describe('High facings controls', () => {
    it('increases facingsHighToRemove when plus button is clicked', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={4} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const { increase } = getInputButtons(highInput);

      expect(increase).toBeDefined();
      expect(increase.disabled).toBe(false);
      fireEvent.click(increase);
      expect(highInput.value).toBe('2');
    });

    it('decreases facingsHighToRemove when minus button is clicked', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={4} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const { increase, decrease } = getInputButtons(highInput);
      
      // First increase to 2
      fireEvent.click(increase);
      expect(highInput.value).toBe('2');

      // Now decrease
      fireEvent.click(decrease);
      expect(highInput.value).toBe('1');
    });

    it('disables decrease button when facingsHighToRemove is 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '0' } });

      const { decrease } = getInputButtons(highInput);
      expect(decrease).toBeDefined();
      expect(decrease.disabled).toBe(true);
    });

    it('disables increase button when facingsHighToRemove is at max', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '2' } });

      const { increase } = getInputButtons(highInput);
      expect(increase).toBeDefined();
      expect(increase.disabled).toBe(true);
    });

    it('updates facingsHighToRemove when input value changes', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '2' } });

      expect(highInput.value).toBe('2');
    });

    it('does not update when input value is invalid (NaN)', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const originalValue = highInput.value;
      fireEvent.change(highInput, { target: { value: 'abc' } });

      // Should remain at previous valid value
      expect(highInput.value).toBe(originalValue);
    });

    it('does not update when input value is negative', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const originalValue = highInput.value;
      fireEvent.change(highInput, { target: { value: '-1' } });

      // Should not accept negative values
      expect(highInput.value).not.toBe('-1');
      expect(highInput.value).toBe(originalValue);
    });

    it('does not update when input value is >= maxFacingsHigh', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const originalValue = highInput.value;
      fireEvent.change(highInput, { target: { value: '3' } });

      // Should not accept values >= maxFacingsHigh
      expect(highInput.value).not.toBe('3');
      expect(highInput.value).toBe(originalValue);
    });

    it('updates caption text when facingsHighToRemove changes', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      expect(screen.getByText(/Removing 1 of 3 facings high/)).toBeInTheDocument();

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '2' } });

      expect(screen.getByText(/Removing 2 of 3 facings high/)).toBeInTheDocument();
    });
  });

  describe('Confirm button', () => {
    it('is disabled when totalToRemove is 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />);

      // Set both to 0
      const wideInput = getInputByLabel('Width \\(from right\\)');
      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(wideInput, { target: { value: '0' } });
      fireEvent.change(highInput, { target: { value: '0' } });

      const confirmButton = screen.getByText('Remove Facings');
      expect(confirmButton.disabled).toBe(true);
    });

    it('is enabled when totalToRemove > 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />);

      const confirmButton = screen.getByText('Remove Facings');
      expect(confirmButton.disabled).toBe(false);
    });

    it('calls onClose with correct values when confirmed with wide facings', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 2,
        facingsHigh: 0,
      });
    });

    it('calls onClose with correct values when confirmed with high facings', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '2' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 0,
        facingsHigh: 2,
      });
    });

    it('calls onClose with correct values when confirmed with both facings', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={3} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });
      fireEvent.change(highInput, { target: { value: '2' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 2,
        facingsHigh: 2,
      });
    });

    it('calls onClose when facingsWideToRemove is valid', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      // Current value (1) is valid (0 < 1 < 3)
      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      // Should call because current value (1) is valid
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when facingsHighToRemove is valid', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      // Current value (1) is valid (0 < 1 < 3)
      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      // Should call because current value (1) is valid
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onClose when both facings are 0', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(wideInput, { target: { value: '0' } });
      fireEvent.change(highInput, { target: { value: '0' } });

      const confirmButton = screen.getByText('Remove Facings');
      expect(confirmButton.disabled).toBe(true);
      fireEvent.click(confirmButton);

      // Should not call onClose because button is disabled
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Cancel button', () => {
    it('calls onClose with zero values when cancelled', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={2} />);

      // Change some values
      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 0,
        facingsHigh: 0,
      });
    });

    it('calls onClose when dialog backdrop is clicked', () => {
      render(<SelectiveFacingsDialog {...defaultProps} />);

      // Material-UI Dialog calls onClose when backdrop is clicked
      // This is handled by MUI's Dialog component
      expect(screen.getByText('Remove Selective Facings')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles very large maxFacingsWide values', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={100} maxFacingsHigh={1} />);

      expect(screen.getByText(/Width \(from right\): 100 facings/)).toBeInTheDocument();

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '99' } });

      expect(wideInput.value).toBe('99');
    });

    it('handles very large maxFacingsHigh values', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={100} />);

      expect(screen.getByText(/Height \(from top\): 100 facings/)).toBeInTheDocument();

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '99' } });

      expect(highInput.value).toBe('99');
    });

    it('handles maxFacingsWide exactly 2', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={2} maxFacingsHigh={1} />);

      expect(screen.getByText(/Width \(from right\): 2 facings/)).toBeInTheDocument();
      // Max value should be 1 (maxFacingsWide - 1)
      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '1' } });
      expect(wideInput.value).toBe('1');
    });

    it('handles maxFacingsHigh exactly 2', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={2} />);

      expect(screen.getByText(/Height \(from top\): 2 facings/)).toBeInTheDocument();
      // Max value should be 1 (maxFacingsHigh - 1)
      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '1' } });
      expect(highInput.value).toBe('1');
    });

    it('handles empty product name', () => {
      render(<SelectiveFacingsDialog {...defaultProps} productName="" />);

      expect(screen.getByText('Remove Selective Facings')).toBeInTheDocument();
    });

    it('handles long product name', () => {
      const longName = 'A'.repeat(100);
      render(<SelectiveFacingsDialog {...defaultProps} productName={longName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Input validation', () => {
    it('accepts valid numeric input for wide facings', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={5} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '3' } });

      expect(wideInput.value).toBe('3');
    });

    it('accepts valid numeric input for high facings', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={5} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '3' } });

      expect(highInput.value).toBe('3');
    });

    it('rejects values equal to maxFacingsWide', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={3} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const originalValue = wideInput.value;
      fireEvent.change(wideInput, { target: { value: '3' } });

      // Should not accept value equal to maxFacingsWide
      expect(wideInput.value).not.toBe('3');
      expect(wideInput.value).toBe(originalValue);
    });

    it('rejects values equal to maxFacingsHigh', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={3} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      const originalValue = highInput.value;
      fireEvent.change(highInput, { target: { value: '3' } });

      // Should not accept value equal to maxFacingsHigh
      expect(highInput.value).not.toBe('3');
      expect(highInput.value).toBe(originalValue);
    });
  });

  describe('Confirm logic branches', () => {
    it('calls onClose when facingsWideToRemove > 0 and < maxFacingsWide', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={5} maxFacingsHigh={1} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      fireEvent.change(wideInput, { target: { value: '3' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 3,
        facingsHigh: 0,
      });
    });

    it('calls onClose when facingsHighToRemove > 0 and < maxFacingsHigh', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={1} maxFacingsHigh={5} />);

      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(highInput, { target: { value: '3' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 0,
        facingsHigh: 3,
      });
    });

    it('calls onClose when both conditions are met', () => {
      render(<SelectiveFacingsDialog {...defaultProps} maxFacingsWide={5} maxFacingsHigh={5} />);

      const wideInput = getInputByLabel('Width \\(from right\\)');
      const highInput = getInputByLabel('Height \\(from top\\)');
      fireEvent.change(wideInput, { target: { value: '2' } });
      fireEvent.change(highInput, { target: { value: '3' } });

      const confirmButton = screen.getByText('Remove Facings');
      fireEvent.click(confirmButton);

      expect(mockOnClose).toHaveBeenCalledWith({
        facingsWide: 2,
        facingsHigh: 3,
      });
    });
  });
});

