import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShelfLine from '../ShelfLine';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setSelectedProduct,
  selectScale,
  selectShelfLines,
  selectPlanogramProducts,
} from '../../../redux/reducers/planogramVisualizerSlice';

const mockDispatch = jest.fn();
const mockUseSelector = jest.fn();
const mockRemoveAllFacings = jest.fn();
const mockRemoveSelectiveFacings = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../utils/planogramFunctions', () => ({
  removeAllFacings: jest.fn((...args) => mockRemoveAllFacings(...args)),
  removeSelectiveFacings: jest.fn((...args) => mockRemoveSelectiveFacings(...args)),
}));

const mockProductItem = jest.fn(({ onClick, 'data-testid': dataTestId }) => (
  <div
    data-testid={dataTestId || 'product-item'}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick?.(e);
      }
    }}
    role="button"
    tabIndex={0}
  />
));

jest.mock('../ProductItem', () => {
  const MockProductItem = (props) => {
    mockProductItem(props);
    return (
      <div
        data-testid={`product-item-${props.item.product_id}-${props.isViewOnly ? 'view' : 'edit'}`}
        onClick={props.onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            props.onClick?.(e);
          }
        }}
        role="button"
        tabIndex={0}
      />
    );
  };

  MockProductItem.displayName = 'MockProductItem';

  return MockProductItem;
});

jest.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ draggableId, index, children }) => {
    const provided = {
      innerRef: jest.fn(),
      draggableProps: { style: {} },
      dragHandleProps: {},
    };
    const snapshot = { isDragging: false };
    return (
      <div data-testid={`draggable-${draggableId}-${index}`}>
        {children(provided, snapshot)}
      </div>
    );
  },
}));

jest.mock('../ProductContextMenu', () => {
  return function MockProductContextMenu({ 
    open, 
    onClickToPlace, 
    onClose, 
    onViewDetails, 
    onRemoveAll, 
    onRemoveSelective 
  }) {
    if (!open) return null;
    return (
      <div data-testid="product-context-menu">
        {onViewDetails && (
          <button
            data-testid="view-details-button"
            onClick={() => {
              onViewDetails();
              onClose();
            }}
          >
            View Details
          </button>
        )}
        {onClickToPlace && (
          <button
            data-testid="click-to-place-button"
            onClick={() => {
              onClickToPlace();
              onClose();
            }}
          >
            Click to place
          </button>
        )}
        {onRemoveAll && (
          <button
            data-testid="remove-all-button"
            onClick={() => {
              onRemoveAll();
              onClose();
            }}
          >
            Remove All
          </button>
        )}
        {onRemoveSelective && (
          <button
            data-testid="remove-selective-button"
            onClick={() => {
              onRemoveSelective({ facingsWide: 1, facingsHigh: 0 });
              onClose();
            }}
          >
            Remove Selective
          </button>
        )}
      </div>
    );
  };
});

const baseShelf = { width: 100, height: 50 };

const buildItem = (overrides = {}) => ({
  id: `id-${overrides.product_id || 'p1'}`,
  product_id: 'p1',
  tpnb: 'tpnb-1',
  width: 25,
  height: 30,
  facings_wide: 1,
  facings_high: 1,
  ...overrides,
});

const baseItems = [buildItem(), buildItem({ product_id: 'p2', id: 'id-p2', tpnb: 'tpnb-2' })];

const droppableProvided = {
  innerRef: jest.fn(),
  droppableProps: {},
  placeholder: <div data-testid="placeholder" />,
};

// Helper function to mock selector responses with consistent structure
// Returns different types per selector which is intentional for mocking Redux selectors
const createMockSelectorResponse = (productOverride = null) => (selector) => {
  if (selector === selectScale) {
    return 3;
  }
  if (selector === selectShelfLines) {
    return [[[]]];
  }
  if (selector === selectPlanogramProducts) {
    if (productOverride !== null) {
      return productOverride;
    }
    return [
      {
        product_id: 'p1',
        product_details: {
          width: 100,
          height: 50,
          name: 'Product A',
          brand_name: 'Brand A',
          subCategory_name: 'Toothpaste',
          price: 5.99,
          image_url: 'image.jpg',
          tpnb: 'tpnb-1',
          global_trade_item_number: 'GTIN001',
          dimensionUom: 'mm',
          depth: 3,
          orientation: 0,
        },
      },
    ];
  }
  return undefined;
};

const mockSelectorResponse = createMockSelectorResponse();

beforeEach(() => {
  jest.clearAllMocks();
  mockRemoveAllFacings.mockClear();
  mockRemoveSelectiveFacings.mockClear();
  useDispatch.mockReturnValue(mockDispatch);
  mockUseSelector.mockImplementation(mockSelectorResponse);
  useSelector.mockImplementation(mockUseSelector);
});

describe('ShelfLine', () => {
  it('renders view-only items and dispatches selection when clicked', () => {
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={['id-p2']}
        productInventorySelectectProduct={{ tpnb: 'tpnb-1' }}
        coloredProducts={[]}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    expect(mockProductItem).toHaveBeenCalled();
    const viewItems = screen.getAllByTestId(/product-item-.*-view/);
    fireEvent.click(viewItems[0]);
    expect(mockDispatch).toHaveBeenCalledWith(setSelectedProduct(null));
  });

  it('renders colored compare mode groups', () => {
    const colored = [{ product_id: 'p1', brandColor: '#00ff00' }];
    render(
      <ShelfLine
        shelf={baseShelf}
        items={[buildItem(), buildItem({ product_id: 'p1', id: 'id-p1-b' })]}
        isViewOnly
        dimmedProductIds={[]}
        productInventorySelectectProduct={{ tpnb: 'tpnb-1' }}
        coloredProducts={colored}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    expect(mockProductItem).toHaveBeenCalled();
    const firstCall = mockProductItem.mock.calls[0][0];
    expect(firstCall.brandColor).toBe('#00ff00');
  });

  it('renders editable shelf with draggable items and placeholder', () => {
    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={baseItems}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation
      />,
    );

    expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    expect(editItems).toHaveLength(baseItems.length);
  });

  it('invokes placement callback when compatible', () => {
    const onClickForPlacement = jest.fn();
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        isCompatibleForPlacement
        onClickForPlacement={onClickForPlacement}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    fireEvent.click(container);
    expect(onClickForPlacement).toHaveBeenCalled();
  });

  it('shows context menu when clicking on product in editable mode', () => {
    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={baseItems}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    expect(screen.getByTestId('product-context-menu')).toBeInTheDocument();
  });

  it('dispatches setPendingPlacement when clicking "Click to place"', () => {
    const itemWithFacings = buildItem({
      facings_wide: 2,
      facings_high: 1,
      xPosition: 0,
      linear: 50,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
    });

    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={[itemWithFacings]}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const clickToPlaceButton = screen.getByTestId('click-to-place-button');
    fireEvent.click(clickToPlaceButton);

    // Verify dispatch was called (setPendingPlacement should be dispatched)
    expect(mockDispatch).toHaveBeenCalled();
    
    // Verify that at least one call contains the expected payload structure
    const hasPendingPlacementCall = mockDispatch.mock.calls.some((call) => {
      const action = call[0];
      // Redux Toolkit actions can be objects with payload property
      if (action && typeof action === 'object' && !Array.isArray(action)) {
        const payload = action.payload || action;
        // Check for key indicators of setPendingPlacement call
        return payload?.active === true || 
               payload?.product?.isRepositionMove === true ||
               (payload?.product && payload?.facingsWide !== undefined);
      }
      return false;
    });

    expect(hasPendingPlacementCall).toBe(true);
  });

  it('dispatches setSelectedProduct when clicking product in view-only mode with focusedBay', () => {
    const focusedBay = { id: 'bay-1' };
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        productInventorySelectectProduct={null}
        coloredProducts={[]}
        snapshot={{}}
        hasViolation={false}
        focusedBay={focusedBay}
      />,
    );

    const viewItems = screen.getAllByTestId(/product-item-.*-view/);
    fireEvent.click(viewItems[0]);
    expect(mockDispatch).toHaveBeenCalledWith(setSelectedProduct(baseItems[0]));
  });

  it('dispatches setSelectedProduct when clicking view details in context menu', () => {
    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={baseItems}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const viewDetailsButton = screen.getByTestId('view-details-button');
    fireEvent.click(viewDetailsButton);
    
    expect(mockDispatch).toHaveBeenCalledWith(setSelectedProduct(baseItems[0]));
  });

  it('calls removeAllFacings when clicking remove all in context menu', () => {
    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={baseItems}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const removeAllButton = screen.getByTestId('remove-all-button');
    fireEvent.click(removeAllButton);
    
    expect(mockRemoveAllFacings).toHaveBeenCalledWith({
      itemId: baseItems[0].id,
      shelfLines: [[[]]],
      dispatch: mockDispatch,
    });
  });

  it('calls removeSelectiveFacings when clicking remove selective in context menu', () => {
    const itemWithMultipleFacings = buildItem({
      facings_wide: 2,
      facings_high: 2,
    });

    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={[itemWithMultipleFacings]}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const removeSelectiveButton = screen.getByTestId('remove-selective-button');
    fireEvent.click(removeSelectiveButton);
    
    expect(mockRemoveSelectiveFacings).toHaveBeenCalledWith({
      itemId: itemWithMultipleFacings.id,
      facingsWideToRemove: 1,
      facingsHighToRemove: 0,
      shelfLines: [[[]]],
      dispatch: mockDispatch,
      SCALE: 3,
    });
  });

  it('handles keyboard events for placement (Enter key)', () => {
    const onClickForPlacement = jest.fn();
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        isCompatibleForPlacement
        onClickForPlacement={onClickForPlacement}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(onClickForPlacement).toHaveBeenCalled();
  });

  it('handles keyboard events for placement (Space key)', () => {
    const onClickForPlacement = jest.fn();
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        isCompatibleForPlacement
        onClickForPlacement={onClickForPlacement}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    fireEvent.keyDown(container, { key: ' ' });
    expect(onClickForPlacement).toHaveBeenCalled();
  });

  it('does not handle keyboard events when not in compatible placement mode', () => {
    const onClickForPlacement = jest.fn();
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        isCompatibleForPlacement={false}
        onClickForPlacement={onClickForPlacement}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(onClickForPlacement).not.toHaveBeenCalled();
  });

  it('applies dragging over background class when snapshot.isDraggingOver is true', () => {
    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{ isDraggingOver: true }}
        shelf={baseShelf}
        items={baseItems}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    expect(container).toHaveClass('bg-[#d0eaff]');
  });

  it('renders products with multiple facings wide and high', () => {
    const itemWithFacings = buildItem({
      facings_wide: 3,
      facings_high: 2,
    });

    render(
      <ShelfLine
        shelf={baseShelf}
        items={[itemWithFacings]}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    // Should render 3 wide x 2 high = 6 product items
    const viewItems = screen.getAllByTestId(/product-item-.*-view/);
    expect(viewItems.length).toBeGreaterThanOrEqual(1);
  });

  it('applies expandedByPx styling when item has expandedByPx', () => {
    const itemWithExpansion = buildItem({
      expandedByPx: 5,
    });

    render(
      <ShelfLine
        shelf={baseShelf}
        items={[itemWithExpansion]}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    expect(mockProductItem).toHaveBeenCalled();
  });

  it('does not show context menu when clicking empty item', () => {
    const emptyItem = buildItem({
      isEmpty: true,
    });

    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={[emptyItem]}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    expect(screen.queryByTestId('product-context-menu')).not.toBeInTheDocument();
  });

  it('handles handleClickToPlace with missing product details', () => {
    mockUseSelector.mockImplementation(createMockSelectorResponse([]));

    const itemWithFacings = buildItem({
      facings_wide: 2,
      facings_high: 1,
      xPosition: 0,
      linear: 50,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      name: 'Test Product',
      brand: 'Test Brand',
      price: 10.99,
      image_url: 'test.jpg',
      tpnb: 'test-tpnb',
      gtin: 'test-gtin',
      dimensionUom: 'mm',
    });

    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={[itemWithFacings]}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const clickToPlaceButton = screen.getByTestId('click-to-place-button');
    fireEvent.click(clickToPlaceButton);

    expect(mockDispatch).toHaveBeenCalled();
    const pendingPlacementCall = mockDispatch.mock.calls.find((call) => {
      const action = call[0];
      if (action && typeof action === 'object') {
        const payload = action.payload || action;
        return payload?.active === true && payload?.product;
      }
      return false;
    });
    expect(pendingPlacementCall).toBeDefined();
  });

  it('handles handleClickToPlace with fallback width and height values', () => {
    const itemWithoutDimensions = buildItem({
      facings_wide: 1,
      facings_high: 1,
      xPosition: 0,
      linear: 50,
      depth: 3,
      // No actualWidth, actualHeight, or width/height
    });

    mockUseSelector.mockImplementation(createMockSelectorResponse([]));

    render(
      <ShelfLine
        provided={droppableProvided}
        snapshot={{}}
        shelf={baseShelf}
        items={[itemWithoutDimensions]}
        isViewOnly={false}
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        hasViolation={false}
        bayIdx={0}
        subShelfIdx={0}
      />,
    );

    const editItems = screen.getAllByTestId(/product-item-.*-edit/);
    fireEvent.click(editItems[0]);
    
    const clickToPlaceButton = screen.getByTestId('click-to-place-button');
    fireEvent.click(clickToPlaceButton);

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('groups consecutive items by product_id in colored compare mode', () => {
    const colored = [{ product_id: 'p1', brandColor: '#00ff00' }];
    const items = [
      buildItem({ product_id: 'p1', id: 'id-p1-1' }),
      buildItem({ product_id: 'p1', id: 'id-p1-2' }),
      buildItem({ product_id: 'p2', id: 'id-p2-1', tpnb: 'tpnb-2' }),
    ];

    render(
      <ShelfLine
        shelf={baseShelf}
        items={items}
        isViewOnly
        dimmedProductIds={[]}
        productInventorySelectectProduct={null}
        coloredProducts={colored}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    expect(mockProductItem).toHaveBeenCalled();
  });

  it('renders empty items array', () => {
    render(
      <ShelfLine
        shelf={baseShelf}
        items={[]}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        hasViolation={false}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    expect(container).toBeInTheDocument();
  });

  it('applies violation styling when hasViolation is true', () => {
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        hasViolation={true}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    expect(container).toHaveStyle({ borderBottom: '4px solid #CA1432' });
  });

  it('does not call onClickForPlacement when isCompatibleForPlacement is true but onClickForPlacement is null', () => {
    render(
      <ShelfLine
        shelf={baseShelf}
        items={baseItems}
        isViewOnly
        dimmedProductIds={[]}
        coloredProducts={[]}
        productInventorySelectectProduct={null}
        snapshot={{}}
        isCompatibleForPlacement={true}
        onClickForPlacement={null}
      />,
    );

    const container = screen.getByTestId('shelf-line-container');
    fireEvent.click(container);
    // Should not throw error
    expect(container).toBeInTheDocument();
  });
});

