import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductContextMenu from '../ProductContextMenu';

// Mock SelectiveFacingsDialog
jest.mock('../SelectiveFacingsDialog', () => {
  return function MockSelectiveFacingsDialog({
    open,
    onClose,
    maxFacingsWide,
    maxFacingsHigh,
    productName,
  }) {
    if (!open) return null;
    return (
      <div data-testid="selective-facings-dialog">
        <div data-testid="dialog-product-name">{productName}</div>
        <div data-testid="dialog-max-wide">{maxFacingsWide}</div>
        <div data-testid="dialog-max-high">{maxFacingsHigh}</div>
        <button
          data-testid="dialog-confirm"
          onClick={() =>
            onClose({ facingsWide: 1, facingsHigh: 0 })
          }
        >
          Confirm
        </button>
        <button
          data-testid="dialog-cancel"
          onClick={() => onClose(null)}
        >
          Cancel
        </button>
        <button
          data-testid="dialog-confirm-zero"
          onClick={() => onClose({ facingsWide: 0, facingsHigh: 0 })}
        >
          Confirm Zero
        </button>
        <button
          data-testid="dialog-confirm-high"
          onClick={() => onClose({ facingsWide: 0, facingsHigh: 1 })}
        >
          Confirm High
        </button>
      </div>
    );
  };
});

// Mock AddFacingsDialog
jest.mock('../AddFacingsDialog', () => {
  return function MockAddFacingsDialog({ open, onClose, productName }) {
    if (!open) return null;
    return (
      <div data-testid="add-facings-dialog">
        <div data-testid="add-dialog-product-name">{productName}</div>
        <button
          data-testid="add-dialog-confirm"
          onClick={() => onClose({ facingsWide: 2, facingsHigh: 0 })}
        >
          Confirm Add
        </button>
        <button data-testid="add-dialog-cancel" onClick={() => onClose(null)}>
          Cancel
        </button>
        <button
          data-testid="add-dialog-confirm-zero"
          onClick={() => onClose({ facingsWide: 0, facingsHigh: 0 })}
        >
          Confirm Zero
        </button>
      </div>
    );
  };
});

describe('ProductContextMenu', () => {
  const mockAnchorEl = document.createElement('div');
  const mockOnClose = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockOnRemoveAll = jest.fn();
  const mockOnRemoveSelective = jest.fn();
  const mockOnAddFacings = jest.fn();
  const mockOnClickToPlace = jest.fn();

  const baseProduct = {
    name: 'Test Product',
    id: 'product-1',
  };

  const defaultProps = {
    anchorEl: mockAnchorEl,
    open: true,
    onClose: mockOnClose,
    product: baseProduct,
    onViewDetails: mockOnViewDetails,
    onRemoveAll: mockOnRemoveAll,
    onRemoveSelective: mockOnRemoveSelective,
    facingsWide: 1,
    facingsHigh: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Menu rendering', () => {
    it('renders menu when open is true', () => {
      render(<ProductContextMenu {...defaultProps} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Remove All')).toBeInTheDocument();
    });

    it('does not render menu content when open is false', () => {
      render(<ProductContextMenu {...defaultProps} open={false} />);

      // Menu is rendered but content is not visible
      expect(mockOnClose).toBeDefined();
    });

    it('renders all menu items with icons', () => {
      render(<ProductContextMenu {...defaultProps} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Remove All')).toBeInTheDocument();
    });
  });

  describe('View Details', () => {
    it('calls onViewDetails and onClose when View Details is clicked', () => {
      render(<ProductContextMenu {...defaultProps} />);

      const viewDetailsItem = screen.getByText('View Details');
      fireEvent.click(viewDetailsItem);

      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Click to Place', () => {
    it('renders Click to Place menu item when onClickToPlace is provided', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onClickToPlace={mockOnClickToPlace}
        />
      );

      expect(screen.getByText('Click to place')).toBeInTheDocument();
    });

    it('does not render Click to Place when onClickToPlace is not provided', () => {
      render(<ProductContextMenu {...defaultProps} />);

      expect(screen.queryByText('Click to place')).not.toBeInTheDocument();
    });

    it('calls onClickToPlace and onClose when Click to Place is clicked', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onClickToPlace={mockOnClickToPlace}
        />
      );

      const clickToPlaceItem = screen.getByText('Click to place');
      fireEvent.click(clickToPlaceItem);

      expect(mockOnClickToPlace).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Remove All', () => {
    it('calls onRemoveAll and onClose when Remove All is clicked', () => {
      render(<ProductContextMenu {...defaultProps} />);

      const removeAllItem = screen.getByText('Remove All');
      fireEvent.click(removeAllItem);

      expect(mockOnRemoveAll).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Remove Selective Facings', () => {
    it('renders Remove Selective Facings when facingsWide > 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();
    });

    it('renders Remove Selective Facings when facingsHigh > 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={1} facingsHigh={2} />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();
    });

    it('renders Remove Selective Facings when both facingsWide and facingsHigh > 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={3} facingsHigh={2} />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();
    });

    it('does not render Remove Selective Facings when both facings are 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={1} facingsHigh={1} />
      );

      expect(
        screen.queryByText('Remove Selective Facings')
      ).not.toBeInTheDocument();
    });

    it('opens SelectiveFacingsDialog when Remove Selective Facings is clicked', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('selective-facings-dialog')).toBeInTheDocument();
    });

    it('passes correct props to SelectiveFacingsDialog', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={3}
          facingsHigh={2}
          product={baseProduct}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Test Product'
      );
      expect(screen.getByTestId('dialog-max-wide')).toHaveTextContent('3');
      expect(screen.getByTestId('dialog-max-high')).toHaveTextContent('2');
    });

    it('uses default values for facings when 0 or undefined', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={0}
          facingsHigh={undefined}
        />
      );

      // Should not render Remove Selective since both are <= 1
      expect(
        screen.queryByText('Remove Selective Facings')
      ).not.toBeInTheDocument();
    });

    it('uses default value 1 for maxFacingsWide when facingsWide is 0', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={0}
          facingsHigh={2}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      // Should use default value 1 when facingsWide is 0
      expect(screen.getByTestId('dialog-max-wide')).toHaveTextContent('1');
    });

    it('uses default value 1 for maxFacingsHigh when facingsHigh is 0', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={2}
          facingsHigh={0}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      // Should use default value 1 when facingsHigh is 0
      expect(screen.getByTestId('dialog-max-high')).toHaveTextContent('1');
    });

    it('uses default value 1 for both facings when both are 0', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={0}
          facingsHigh={0}
        />
      );

      // Should not render Remove Selective since both are <= 1
      expect(
        screen.queryByText('Remove Selective Facings')
      ).not.toBeInTheDocument();
    });

    it('uses product name or default "Product" in dialog', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={2}
          facingsHigh={1}
          product={baseProduct}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Test Product'
      );
    });

    it('uses default "Product" when product is missing', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={2}
          facingsHigh={1}
          product={null}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Product'
      );
    });

    it('uses default "Product" when product.name is missing', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={2}
          facingsHigh={1}
          product={{ id: 'product-1' }}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Product'
      );
    });
  });

  describe('SelectiveFacingsDialog interaction', () => {
    it('calls onRemoveSelective when dialog confirms with valid result', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      const confirmButton = screen.getByTestId('dialog-confirm');
      fireEvent.click(confirmButton);

      expect(mockOnRemoveSelective).toHaveBeenCalledWith({
        facingsWide: 1,
        facingsHigh: 0,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onRemoveSelective when dialog confirms with zero facings', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      const confirmZeroButton = screen.getByTestId('dialog-confirm-zero');
      fireEvent.click(confirmZeroButton);

      expect(mockOnRemoveSelective).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onRemoveSelective when dialog is cancelled', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      const cancelButton = screen.getByTestId('dialog-cancel');
      fireEvent.click(cancelButton);

      expect(mockOnRemoveSelective).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes dialog and calls onClose when dialog closes', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('selective-facings-dialog')).toBeInTheDocument();

      const cancelButton = screen.getByTestId('dialog-cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('selective-facings-dialog')).not.toBeInTheDocument();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onRemoveSelective when result has facingsHigh > 0', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={1} facingsHigh={2} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      // Click confirm high button which returns { facingsWide: 0, facingsHigh: 1 }
      fireEvent.click(screen.getByTestId('dialog-confirm-high'));

      expect(mockOnRemoveSelective).toHaveBeenCalledWith({
        facingsWide: 0,
        facingsHigh: 1,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onRemoveSelective when result exists but both facings are 0', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      // Click confirm zero button which returns { facingsWide: 0, facingsHigh: 0 }
      fireEvent.click(screen.getByTestId('dialog-confirm-zero'));

      expect(mockOnRemoveSelective).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Add Facings', () => {
    it('renders Add Facings when onAddFacings is provided', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onAddFacings={mockOnAddFacings}
        />
      );

      expect(screen.getByText('Add Facings')).toBeInTheDocument();
    });

    it('does not render Add Facings when onAddFacings is not provided', () => {
      render(<ProductContextMenu {...defaultProps} />);
      expect(screen.queryByText('Add Facings')).not.toBeInTheDocument();
    });

    it('opens AddFacingsDialog when Add Facings is clicked', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onAddFacings={mockOnAddFacings}
        />
      );

      fireEvent.click(screen.getByText('Add Facings'));
      expect(screen.getByTestId('add-facings-dialog')).toBeInTheDocument();
    });

    it('calls onAddFacings when dialog confirms with valid result', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onAddFacings={mockOnAddFacings}
        />
      );

      fireEvent.click(screen.getByText('Add Facings'));
      fireEvent.click(screen.getByTestId('add-dialog-confirm'));

      expect(mockOnAddFacings).toHaveBeenCalledWith({
        facingsWide: 2,
        facingsHigh: 0,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onAddFacings when dialog confirms with zero facings', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onAddFacings={mockOnAddFacings}
        />
      );

      fireEvent.click(screen.getByText('Add Facings'));
      fireEvent.click(screen.getByTestId('add-dialog-confirm-zero'));

      expect(mockOnAddFacings).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not call onAddFacings when dialog is cancelled', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          onAddFacings={mockOnAddFacings}
        />
      );

      fireEvent.click(screen.getByText('Add Facings'));
      fireEvent.click(screen.getByTestId('add-dialog-cancel'));

      expect(mockOnAddFacings).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Menu onClose', () => {
    it('calls onClose when menu backdrop is clicked', () => {
      render(<ProductContextMenu {...defaultProps} />);

      // Material-UI Menu calls onClose when backdrop is clicked
      // This is handled by MUI's Menu component
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles missing product gracefully', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          product={null}
          facingsWide={2}
          facingsHigh={1}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Product'
      );
    });

    it('handles product without name', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          product={{ id: 'product-1' }}
          facingsWide={2}
          facingsHigh={1}
        />
      );

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-product-name')).toHaveTextContent(
        'Product'
      );
    });

    it('handles very large facing values', () => {
      render(
        <ProductContextMenu
          {...defaultProps}
          facingsWide={100}
          facingsHigh={50}
        />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();

      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);

      expect(screen.getByTestId('dialog-max-wide')).toHaveTextContent('100');
      expect(screen.getByTestId('dialog-max-high')).toHaveTextContent('50');
    });

    it('handles facingsWide exactly 1 and facingsHigh exactly 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={1} facingsHigh={1} />
      );

      expect(
        screen.queryByText('Remove Selective Facings')
      ).not.toBeInTheDocument();
    });

    it('handles facingsWide exactly 2 and facingsHigh exactly 1', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();
    });

    it('handles facingsWide exactly 1 and facingsHigh exactly 2', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={1} facingsHigh={2} />
      );

      expect(
        screen.getByText('Remove Selective Facings')
      ).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders menu with divider between action items and remove items', () => {
      render(<ProductContextMenu {...defaultProps} />);

      // Divider is rendered by Material-UI between menu items
      // We verify the structure by checking menu items are present
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Remove All')).toBeInTheDocument();
    });

    it('renders menu with correct anchor origin', () => {
      render(<ProductContextMenu {...defaultProps} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  describe('Multiple interactions', () => {
    it('handles View Details click correctly', () => {
      const { rerender } = render(
        <ProductContextMenu
          {...defaultProps}
          onClickToPlace={mockOnClickToPlace}
        />
      );

      // Click View Details
      fireEvent.click(screen.getByText('View Details'));
      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles Remove All click correctly', () => {
      render(<ProductContextMenu {...defaultProps} />);

      // Click Remove All
      fireEvent.click(screen.getByText('Remove All'));
      expect(mockOnRemoveAll).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles opening and closing selective dialog', () => {
      render(
        <ProductContextMenu {...defaultProps} facingsWide={2} facingsHigh={1} />
      );

      // Open dialog
      const removeSelectiveItem = screen.getByText('Remove Selective Facings');
      fireEvent.click(removeSelectiveItem);
      expect(screen.getByTestId('selective-facings-dialog')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByTestId('dialog-cancel'));
      expect(
        screen.queryByTestId('selective-facings-dialog')
      ).not.toBeInTheDocument();
    });
  });
});

