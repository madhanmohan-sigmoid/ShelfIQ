// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../../redux/reducers/planogramVisualizerSlice', () => ({
  setShelfLines: jest.fn((payload) => ({ type: 'SET_SHELF_LINES', payload })),
  markProductAsRemoved: jest.fn((payload) => ({ type: 'MARK_PRODUCT_AS_REMOVED', payload })),
  markProductAsRemovedWithPosition: jest.fn((payload) => ({ type: 'MARK_PRODUCT_AS_REMOVED_WITH_POSITION', payload })),
  markProductAsRepositionedWithPosition: jest.fn((payload) => ({ type: 'MARK_PRODUCT_AS_REPOSITIONED_WITH_POSITION', payload })),
  markProductAsOrientationChangedWithPosition: jest.fn((payload) => ({ type: 'MARK_PRODUCT_AS_ORIENTATION_CHANGED_WITH_POSITION', payload })),
  restoreRemovedProduct: jest.fn((payload) => ({ type: 'RESTORE_REMOVED_PRODUCT', payload })),
  setBays: jest.fn((payload) => ({ type: 'SET_BAYS', payload })),
  addViolation: jest.fn((payload) => ({ type: 'ADD_VIOLATION', payload })),
  removeViolation: jest.fn((payload) => ({ type: 'REMOVE_VIOLATION', payload })),
  pushHistoryEntry: jest.fn((payload) => ({ type: 'PUSH_HISTORY_ENTRY', payload })),
  addActivity: jest.fn((payload) => ({ type: 'ADD_ACTIVITY', payload })),
  setViolations: jest.fn((payload) => ({ type: 'SET_VIOLATIONS', payload })),
}));

jest.mock('../planogramOverflowUtils', () => ({
  checkViolationsAndMark: jest.fn((shelfLines, bays) => ({
    shelfLines: shelfLines || [],
    violations: [],
    bays: bays || [],
  })),
}));

import { toast } from 'react-hot-toast';
import {
  isWithinShelfWidth,
  onDragEnd,
  placeProductAtPosition,
  generatePayload,
  removeSelectiveFacings,
  changeOrientation,
  removeAllFacings,
} from '../planogramFunctions';
import {
  setShelfLines,
  markProductAsRemoved,
  markProductAsRemovedWithPosition,
  markProductAsRepositionedWithPosition,
  markProductAsOrientationChangedWithPosition,
  restoreRemovedProduct,
  setViolations,
} from '../../redux/reducers/planogramVisualizerSlice';
import { checkViolationsAndMark } from '../planogramOverflowUtils';

describe('planogramFunctions', () => {
  let mockDispatch;
  let mockState;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset checkViolationsAndMark to default return value
    checkViolationsAndMark.mockImplementation((shelfLines, bays) => ({
      shelfLines: shelfLines || [],
      violations: [],
      bays: bays || [],
    }));
    mockState = {
      productData: {
        products: [
          {
            id: 'product-1',
            name: 'Product A',
            width: 100,
            height: 50,
            brand_name: 'Brand A',
            subCategory_name: 'Toothpaste',
            price: 5.99,
            image_url: 'image.jpg',
            tpnb: 'TPNB001',
            global_trade_item_number: 'GTIN001',
            dimensionUom: 'mm',
            facing_wide: 1,
            facing_high: 1,
            depth: 3,
            orientation: 0,
          },
        ],
      },
      planogramVisualizerData: {
        bays: [
          {
            width: 300,
            subShelves: [
              { width: 300, baseWidth: 300 },
              { width: 300, baseWidth: 300 },
            ],
          },
        ],
        violations: [],
        removedProductIds: [],
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
      },
    };
    mockDispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        return action(mockDispatch, () => mockState);
      }
      return action;
    });
  });

  describe('isWithinShelfWidth', () => {
    it('should return true when item fits within shelf width', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(true);
    });

    it('should return false when item does not fit within shelf width', () => {
      const shelfRow = [
        { isEmpty: true, width: 30 },
        { isEmpty: true, width: 30 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 2 }; // Different index
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(false);
    });

    it('should ignore non-empty slots when calculating available width', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: false, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 2 }; // Different index
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(false);
    });

    it('should account for the item being moved when calculating available width', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 1 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 1, 100, source);
      expect(result).toBe(true);
    });
  });

  describe('onDragEnd', () => {
    it('should return early when destination is null', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: null,
        draggableId: 'product-1',
      };
      const shelfLines = [[[]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });

    it('should place item from inventory to shelf', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'product-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // The function calls dispatch(setShelfLines(...)) which is mocked
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should remove item from shelf to inventory', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'items', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[{
        id: 'item-1',
        isEmpty: false,
        width: 100,
        facings_wide: 1,
        product_id: 'product-1',
        name: 'Product A',
        xPosition: 0,
        linear: 100,
        facings_high: 1,
        actualWidth: 10,
        actualHeight: 5,
        depth: 3,
        expandedByPx: 15,
      }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(markProductAsRemoved).toHaveBeenCalled();
      expect(markProductAsRemovedWithPosition).toHaveBeenCalled();
      expect(checkViolationsAndMark).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should move item within shelf', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 1 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[
        {
          id: 'item-1',
          isEmpty: false,
          width: 100,
          facings_wide: 1,
          product_id: 'product-1',
          expandedByPx: 12,
        },
        { isEmpty: true, width: 100 },
      ]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should move item between shelves', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'shelf-line-0-1', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[
        [{
          id: 'item-1',
          isEmpty: false,
          width: 100,
          facings_wide: 1,
          product_id: 'product-1',
          expandedByPx: 10,
        }],
        [{ isEmpty: true, width: 200 }],
      ]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(markProductAsRepositionedWithPosition).toHaveBeenCalled();
      expect(checkViolationsAndMark).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should restore removed product when placing from inventory', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'product-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();
      const removedProduct = {
        ...mockState.productData.products[0],
        isRemoved: true,
        product_id: 'product-1',
      };
      mockState = {
        ...mockState,
        productData: {
          products: [removedProduct],
        },
      };

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(restoreRemovedProduct).toHaveBeenCalledWith('product-1');
    });
  });

  describe('placeProductAtPosition', () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Product A',
      width: 100,
      height: 50,
      brand_name: 'Brand A',
      subCategory_name: 'Toothpaste',
      price: 5.99,
      image_url: 'image.jpg',
      tpnb: 'TPNB001',
      global_trade_item_number: 'GTIN001',
      dimensionUom: 'mm',
      orientation: 0,
      depth: 3,
    };

    it('should place product at specified position', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      
      // Mock checkViolationsAndMark to return proper structure
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 2,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should return false for invalid parameters', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];

      const result1 = placeProductAtPosition({
        bayIdx: -1,
        shelfIdx: 0,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result1).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid placement parameters');

      const result2 = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: null,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result2).toBe(false);
    });

    it('should return false for invalid shelf position', () => {
      const shelfLines = [[[]]];

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 999,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid shelf position');
    });

    it('should add overflow violation when expansion is required', () => {
      const shelfLines = [[[{ isEmpty: true, width: 40 }]]];
      mockState = {
        ...mockState,
        planogramVisualizerData: {
          bays: [
            {
              width: 40,
              subShelves: [{ width: 40, baseWidth: 40 }],
            },
          ],
          violations: [],
          removedProductIds: [],
          removedProductsWithPosition: [],
          repositionedProductsWithPosition: [],
        },
      };

      // Mock checkViolationsAndMark to return violations
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: true, width: 40 }]]],
        violations: [
          {
            type: 'overflow',
            bayIdx: 0,
            shelfIdx: 0,
            productId: 'product-1',
            requiredWidth: 20,
          },
        ],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 3,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      expect(checkViolationsAndMark).toHaveBeenCalled();
      expect(setViolations).toHaveBeenCalled();
    });

    it('should restore removed product when placing', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const productWithRemovedFlag = { ...mockProduct, isRemoved: true };

      placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: productWithRemovedFlag,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(restoreRemovedProduct).toHaveBeenCalledWith('product-1');
    });

    it('should handle errors gracefully', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by making dispatch throw
      const errorDispatch = jest.fn(() => {
        throw new Error('Test error');
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: errorDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to place product. Please try again.');

      consoleErrorSpy.mockRestore();
    });

    it('should handle reposition move by removing original item and replacing with empty spaces', () => {
      const originalItem = {
        id: 'original-item-1',
        product_id: 'product-1',
        isEmpty: false,
        width: 100,
        facings_wide: 2,
        facings_high: 1,
        xPosition: 0,
        linear: 200,
        actualWidth: 10,
        actualHeight: 5,
        depth: 3,
        name: 'Product A',
        tpnb: 'TPNB001',
        price: 5.99,
        image_url: 'image.jpg',
      };

      const shelfLines = [[[originalItem, { isEmpty: true, width: 50 }]]];

      const productWithReposition = {
        ...mockProduct,
        isRepositionMove: true,
        originalUniqueItemId: 'original-item-1',
        originalProductId: 'product-1',
        originalBay: 1,
        originalShelf: 1,
        originalPosition: 0,
        originalLinear: 200,
        originalFacingsWide: 2,
        originalFacingsHigh: 1,
        originalActualWidth: 10,
        originalActualHeight: 5,
        originalDepth: 3,
      };

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 1,
        product: productWithReposition,
        facingsWide: 2,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      // Should mark the original item as repositioned
      expect(markProductAsRepositionedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should mark repositioned item correctly (not as newly added)', () => {
      const originalItem = {
        id: 'original-item-1',
        product_id: 'product-1',
        isEmpty: false,
        width: 100,
        facings_wide: 1,
        facings_high: 1,
        xPosition: 0,
        linear: 100,
        actualWidth: 10,
        actualHeight: 5,
        depth: 3,
        name: 'Product A',
        tpnb: 'TPNB001',
        price: 5.99,
        image_url: 'image.jpg',
      };

      const shelfLines = [[[originalItem, { isEmpty: true, width: 200 }]]];

      const productWithReposition = {
        ...mockProduct,
        isRepositionMove: true,
        originalUniqueItemId: 'original-item-1',
        originalProductId: 'product-1',
        originalBay: 1,
        originalShelf: 1,
        originalPosition: 0,
        originalLinear: 100,
        originalFacingsWide: 1,
        originalFacingsHigh: 1,
        originalActualWidth: 10,
        originalActualHeight: 5,
        originalDepth: 3,
      };

      // Mock the updated shelfLines to verify the item is marked correctly
      const updatedShelfLines = [[[
        { isEmpty: true, width: 100 },
        {
          id: expect.stringContaining('product-1'),
          isEmpty: false,
          isNewlyAdded: false,
          isRepositioned: true,
        },
      ]]];

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: updatedShelfLines,
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 1,
        product: productWithReposition,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      expect(markProductAsRepositionedWithPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'original-item-1',
          originalProductId: 'product-1',
          bay: 1,
          shelf: 1,
        })
      );
    });
  });

  describe('generatePayload', () => {
    const mockShelfLines = [
      [
        [
          {
            isEmpty: false,
            id: 'product-1_0_0_123',
            name: 'Product A',
            width: 100,
            height: 50,
            brand: 'Brand A',
            price: 5.99,
            description: 'Toothpaste - Product A',
          },
        ],
      ],
    ];

    const mockSHELVES = [
      {
        name: 'Shelf 1',
        subShelves: [
          { width: 300, height: 100 },
        ],
      },
    ];

    it('should generate payload with correct structure', () => {
      const payload = generatePayload({
        shelfLines: mockShelfLines,
        SHELVES: mockSHELVES,
        SCALE: 3,
      });

      expect(payload).toHaveProperty('shelves');
      expect(Array.isArray(payload.shelves)).toBe(true);
      expect(payload.shelves.length).toBe(1);
    });

    it('should include items in payload', () => {
      const payload = generatePayload({
        shelfLines: mockShelfLines,
        SHELVES: mockSHELVES,
        SCALE: 3,
      });

      expect(payload.shelves[0].subShelves[0].items.length).toBe(1);
      expect(payload.shelves[0].subShelves[0].items[0]).toMatchObject({
        id: 'product-1',
        name: 'Product A',
      });
    });

    it('should calculate position correctly', () => {
      const payload = generatePayload({
        shelfLines: mockShelfLines,
        SHELVES: mockSHELVES,
        SCALE: 3,
      });

      const item = payload.shelves[0].subShelves[0].items[0];
      expect(item).toHaveProperty('position');
      expect(item.position).toHaveProperty('x');
      expect(item.position).toHaveProperty('y');
      expect(item.position).toHaveProperty('width');
      expect(item.position).toHaveProperty('height');
    });

    it('should exclude empty slots from payload', () => {
      const shelfLinesWithEmpty = [
        [
          [
            { isEmpty: true, width: 50 },
            {
              isEmpty: false,
              id: 'product-1_0_0_123',
              name: 'Product A',
              width: 100,
              height: 50,
              brand: 'Brand A',
              price: 5.99,
              description: 'Toothpaste - Product A',
            },
          ],
        ],
      ];

      const payload = generatePayload({
        shelfLines: shelfLinesWithEmpty,
        SHELVES: mockSHELVES,
        SCALE: 3,
      });

      expect(payload.shelves[0].subShelves[0].items.length).toBe(1);
    });

    it('should handle multiple shelves', () => {
      const multiShelfLines = [
        [
          [
            {
              isEmpty: false,
              id: 'product-1_0_0_123',
              name: 'Product A',
              width: 100,
              height: 50,
              brand: 'Brand A',
              price: 5.99,
              description: 'Toothpaste - Product A',
            },
          ],
          [
            {
              isEmpty: false,
              id: 'product-2_0_1_123',
              name: 'Product B',
              width: 80,
              height: 40,
              brand: 'Brand B',
              price: 4.99,
              description: 'Toothbrush - Product B',
            },
          ],
        ],
      ];

      const multiSHELVES = [
        {
          name: 'Shelf 1',
          subShelves: [
            { width: 300, height: 100 },
            { width: 300, height: 100 },
          ],
        },
      ];

      const payload = generatePayload({
        shelfLines: multiShelfLines,
        SHELVES: multiSHELVES,
        SCALE: 3,
      });

      expect(payload.shelves[0].subShelves.length).toBe(2);
      expect(payload.shelves[0].subShelves[0].items.length).toBe(1);
      expect(payload.shelves[0].subShelves[1].items.length).toBe(1);
    });

    it('should include metadata in items', () => {
      const payload = generatePayload({
        shelfLines: mockShelfLines,
        SHELVES: mockSHELVES,
        SCALE: 3,
      });

      const item = payload.shelves[0].subShelves[0].items[0];
      expect(item).toHaveProperty('metadata');
      expect(item.metadata).toMatchObject({
        brand: 'Brand A',
        price: 5.99,
        description: 'Toothpaste - Product A',
      });
    });
  });

  describe('removeSelectiveFacings', () => {
    const mockItem = {
      id: 'item-1',
      product_id: 'product-1',
      name: 'Product A',
      isEmpty: false,
      width: 100,
      height: 50,
      facings_wide: 3,
      facings_high: 2,
      xPosition: 0,
      linear: 300,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      tpnb: 'TPNB001',
      price: 5.99,
      image_url: 'image.jpg',
    };

    it('should return false when itemId is missing', () => {
      const shelfLines = [[[mockItem]]];
      const result = removeSelectiveFacings({
        itemId: null,
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
    });

    it('should return false when both facings to remove are zero or negative', () => {
      const shelfLines = [[[mockItem]]];
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
    });

    it('should return false when product is not found', () => {
      const shelfLines = [[[{ isEmpty: true, width: 50 }]]];
      const result = removeSelectiveFacings({
        itemId: 'non-existent',
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should return false when item is empty', () => {
      const emptyItem = { ...mockItem, isEmpty: true };
      const shelfLines = [[[emptyItem]]];
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should return false when trying to remove all width facings', () => {
      const shelfLines = [[[mockItem]]];
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 3,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Cannot remove all width facings. Use \'Remove All\' instead.');
    });

    it('should return false when trying to remove all height facings', () => {
      const shelfLines = [[[mockItem]]];
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 2,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Cannot remove all height facings. Use \'Remove All\' instead.');
    });

    it('should remove width facings successfully', () => {
      const shelfLines = [[[mockItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...mockItem, facings_wide: 2 }, { isEmpty: true, width: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(markProductAsRemovedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should remove height facings successfully', () => {
      const shelfLines = [[[mockItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...mockItem, facings_high: 1 }, { isEmpty: true, width: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(markProductAsRemovedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should remove both width and height facings successfully', () => {
      const shelfLines = [[[mockItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...mockItem, facings_wide: 2, facings_high: 1 }, { isEmpty: true, width: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 1,
        facingsHighToRemove: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(markProductAsRemovedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle items with default facings (1x1)', () => {
      const singleFacingItem = {
        ...mockItem,
        facings_wide: 1,
        facings_high: 1,
        linear: 100,
      };
      const shelfLines = [[[singleFacingItem]]];
      
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(false);
    });

    it('should add empty space after removing width facings', () => {
      const shelfLines = [[[mockItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...mockItem, facings_wide: 2 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(setShelfLines).toHaveBeenCalled();
    });
  });

  describe('changeOrientation', () => {
    const mockItem = {
      id: 'item-1',
      product_id: 'product-1',
      name: 'Product A',
      isEmpty: false,
      width: 100,
      height: 50,
      facings_wide: 2,
      facings_high: 1,
      xPosition: 0,
      linear: 200,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      tpnb: 'TPNB001',
      price: 5.99,
      image_url: 'image.jpg',
      isRotated90: false,
      baseUnitWidthPx: 100,
      baseUnitHeightPx: 50,
      baseActualWidth: 10,
      baseActualHeight: 5,
    };

    it('should return false when itemId is missing', () => {
      const shelfLines = [[[mockItem]]];
      const result = changeOrientation({
        itemId: null,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
    });

    it('should return false when product is not found', () => {
      const shelfLines = [[[{ isEmpty: true, width: 50 }]]];
      const result = changeOrientation({
        itemId: 'non-existent',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should return false when item is empty', () => {
      const emptyItem = { ...mockItem, isEmpty: true };
      const shelfLines = [[[emptyItem]]];
      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should change orientation successfully (2x1 to 1x2)', () => {
      const shelfLines = [[[mockItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...mockItem, facings_wide: 1, facings_high: 2, isRotated90: true }, { isEmpty: true, width: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(markProductAsOrientationChangedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle product getting narrower (add empty space)', () => {
      const wideItem = {
        ...mockItem,
        width: 100,
        height: 50,
        facings_wide: 3,
        facings_high: 1,
        linear: 300,
      };
      const shelfLines = [[[wideItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...wideItem, facings_wide: 1, facings_high: 3, width: 50, height: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle product getting wider (consume empty space)', () => {
      const narrowItem = {
        ...mockItem,
        width: 50,
        height: 100,
        facings_wide: 1,
        facings_high: 2,
        linear: 50,
        isRotated90: true,
      };
      const shelfLines = [[[narrowItem, { isEmpty: true, width: 100 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...narrowItem, facings_wide: 2, facings_high: 1, width: 100, height: 50, isRotated90: false }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle item with baseUnitWidthPx and baseUnitHeightPx', () => {
      const itemWithBaseDims = {
        ...mockItem,
        baseUnitWidthPx: 100,
        baseUnitHeightPx: 50,
        baseActualWidth: 10,
        baseActualHeight: 5,
      };
      const shelfLines = [[[itemWithBaseDims]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...itemWithBaseDims, facings_wide: 1, facings_high: 2 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(markProductAsOrientationChangedWithPosition).toHaveBeenCalled();
    });

    it('should handle item without base dimensions (fallback)', () => {
      const itemWithoutBaseDims = {
        ...mockItem,
        baseUnitWidthPx: undefined,
        baseUnitHeightPx: undefined,
      };
      const shelfLines = [[[itemWithoutBaseDims]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...itemWithoutBaseDims, facings_wide: 1, facings_high: 2 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
    });

    it('should handle already rotated item (toggle back)', () => {
      const rotatedItem = {
        ...mockItem,
        isRotated90: true,
        width: 50,
        height: 100,
      };
      const shelfLines = [[[rotatedItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...rotatedItem, facings_wide: 2, facings_high: 1, isRotated90: false, width: 100, height: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
    });

    it('should handle no width change (delta = 0)', () => {
      const squareItem = {
        ...mockItem,
        width: 50,
        height: 50,
        facings_wide: 2,
        facings_high: 2,
        linear: 100,
      };
      const shelfLines = [[[squareItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...squareItem, facings_wide: 2, facings_high: 2 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
    });

    it('should handle merging empty space when product gets narrower', () => {
      const wideItem = {
        ...mockItem,
        width: 100,
        height: 50,
        facings_wide: 3,
        facings_high: 1,
        linear: 300,
      };
      const shelfLines = [[[wideItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...wideItem, facings_wide: 1, facings_high: 3, width: 50, height: 100 }, { isEmpty: true, width: 200 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle partial consumption of empty space when product gets wider', () => {
      const narrowItem = {
        ...mockItem,
        width: 50,
        height: 100,
        facings_wide: 1,
        facings_high: 2,
        linear: 50,
        isRotated90: true,
      };
      const shelfLines = [[[narrowItem, { isEmpty: true, width: 200 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...narrowItem, facings_wide: 2, facings_high: 1, width: 100, height: 50, isRotated90: false }, { isEmpty: true, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });
  });

  describe('removeAllFacings', () => {
    const mockItem = {
      id: 'item-1',
      product_id: 'product-1',
      name: 'Product A',
      isEmpty: false,
      width: 100,
      height: 50,
      facings_wide: 2,
      facings_high: 1,
      xPosition: 0,
      linear: 200,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      tpnb: 'TPNB001',
      price: 5.99,
      image_url: 'image.jpg',
    };

    it('should return false when itemId is missing', () => {
      const shelfLines = [[[mockItem]]];
      const result = removeAllFacings({
        itemId: null,
        shelfLines,
        dispatch: mockDispatch,
      });
      expect(result).toBe(false);
    });

    it('should return false when product is not found', () => {
      const shelfLines = [[[{ isEmpty: true, width: 50 }]]];
      const result = removeAllFacings({
        itemId: 'non-existent',
        shelfLines,
        dispatch: mockDispatch,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should return false when item is empty', () => {
      const emptyItem = { ...mockItem, isEmpty: true };
      const shelfLines = [[[emptyItem]]];
      const result = removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });
      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Product not found');
    });

    it('should remove all facings successfully', () => {
      const shelfLines = [[[mockItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: true, width: 200 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });

      expect(result).toBe(true);
      expect(markProductAsRemoved).toHaveBeenCalledWith('product-1');
      expect(markProductAsRemovedWithPosition).toHaveBeenCalled();
      expect(setShelfLines).toHaveBeenCalled();
      expect(setViolations).toHaveBeenCalled();
    });

    it('should find item in nested shelf structure', () => {
      const shelfLines = [
        [
          [{ isEmpty: true, width: 50 }],
          [mockItem],
        ],
      ];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [
          [
            [{ isEmpty: true, width: 50 }],
            [{ isEmpty: true, width: 200 }],
          ],
        ],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });

      expect(result).toBe(true);
      expect(markProductAsRemoved).toHaveBeenCalled();
    });

    it('should handle item with single facing', () => {
      const singleFacingItem = {
        ...mockItem,
        facings_wide: 1,
        facings_high: 1,
        linear: 100,
      };
      const shelfLines = [[[singleFacingItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: true, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });

      expect(result).toBe(true);
      expect(markProductAsRemoved).toHaveBeenCalled();
    });

    it('should replace item with empty spaces of correct width', () => {
      const shelfLines = [[[mockItem]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: true, width: 200 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });

      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle multiple items in shelf', () => {
      const item2 = {
        ...mockItem,
        id: 'item-2',
        product_id: 'product-2',
        name: 'Product B',
      };
      const shelfLines = [[[mockItem, item2]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: true, width: 200 }, item2]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeAllFacings({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
      });

      expect(result).toBe(true);
      expect(markProductAsRemoved).toHaveBeenCalledWith('product-1');
    });
  });

  describe('onDragEnd - additional edge cases', () => {
    it('should return early when item is not found', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'non-existent-product',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });

    it('should notify when new violations are detected', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'product-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();
      
      mockState = {
        ...mockState,
        planogramVisualizerData: {
          ...mockState.planogramVisualizerData,
          violations: [
            { bayIdx: 0, shelfIdx: 0, productId: 'product-2' },
          ],
        },
      };

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [
          { bayIdx: 0, shelfIdx: 0, productId: 'product-2' },
          { bayIdx: 0, shelfIdx: 0, productId: 'product-1' }, // New violation
        ],
        bays: mockState.planogramVisualizerData.bays,
      });

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Violation: The shelf does not have enough space to fit all products.',
        { duration: 4000 }
      );
    });

    it('should not notify when violations are not arrays', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'product-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();
      
      mockState = {
        ...mockState,
        planogramVisualizerData: {
          ...mockState.planogramVisualizerData,
          violations: null, // Not an array
        },
      };

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should not call toast.error for violations notification
      expect(toast.error).not.toHaveBeenCalledWith(
        'Violation: The shelf does not have enough space to fit all products.',
        expect.anything()
      );
    });

    it('should handle same position drag (no-op)', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[{
        id: 'item-1',
        isEmpty: false,
        width: 100,
        facings_wide: 1,
        product_id: 'product-1',
      }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should not call setShelfLines when same position
      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });

    it('should handle invalid source shelf', () => {
      const result = {
        source: { droppableId: 'shelf-line-999-0', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should return early when source shelf doesn't exist
      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });

    it('should handle missing item when removing from shelf', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'items', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[]]]; // Empty shelf
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should return early when item doesn't exist
      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });

    it('should handle inventory drag without requiring zoom', () => {
      const result = {
        source: { droppableId: 'items', index: 0 },
        destination: { droppableId: 'shelf-line-0-0', index: 0 },
        draggableId: 'product-1',
      };
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle invalid destination shelf', () => {
      const result = {
        source: { droppableId: 'shelf-line-0-0', index: 0 },
        destination: { droppableId: 'shelf-line-999-0', index: 0 },
        draggableId: 'item-1',
      };
      const shelfLines = [[[{
        id: 'item-1',
        isEmpty: false,
        width: 100,
        facings_wide: 1,
        product_id: 'product-1',
      }]]];
      const setShelfLinesFn = jest.fn();

      onDragEnd({
        result,
        shelfLines,
        setShelfLines: setShelfLinesFn,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should return early when destination shelf doesn't exist
      expect(setShelfLinesFn).not.toHaveBeenCalled();
    });
  });

  describe('isWithinShelfWidth - additional edge cases', () => {
    it('should handle empty shelf row', () => {
      const shelfRow = [];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(false);
    });

    it('should handle item width exactly matching available width', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(true);
    });

    it('should handle item width slightly less than available width', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 99, source);
      expect(result).toBe(true);
    });

    it('should handle position beyond shelf length', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 10, 100, source);
      expect(result).toBe(false);
    });

    it('should handle facings_wide in calculation', () => {
      const shelfRow = [
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      // Item with 2 facings wide, each 50 units = 100 total width
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      expect(result).toBe(true);
    });

    it('should handle slot without width property', () => {
      const shelfRow = [
        { isEmpty: true }, // No width property - undefined adds NaN to availableWidth
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      const source = { droppableId: 'shelf-line-0-0', index: 0 };
      // When slot.width is undefined, availableWidth += undefined makes it NaN
      // NaN >= itemWidth is false, so should return false
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      // If starting at position 0, first slot adds undefined (NaN), so result should be false
      // But if the source index matches, it adds itemWidth instead
      // Let's test with source index = 0, position = 0 - should add itemWidth
      const sourceAtPosition = { droppableId: 'shelf-line-0-0', index: 0 };
      const resultWithSource = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, sourceAtPosition);
      expect(resultWithSource).toBe(true); // Because isSameItemBeingMoved is true, adds itemWidth
      
      // Test with different source index
      const sourceDifferent = { droppableId: 'shelf-line-0-0', index: 1 };
      const resultDifferent = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, sourceDifferent);
      // Position 0 slot has no width, so adds undefined (NaN), NaN >= 100 is false
      expect(resultDifferent).toBe(false);
    });

    it('should handle slot with zero width', () => {
      const shelfRow = [
        { isEmpty: true, width: 0 },
        { isEmpty: true, width: 50 },
      ];
      const shelfLines = [[shelfRow]];
      // When source index matches position 1, isSameItemBeingMoved adds itemWidth
      const source = { droppableId: 'shelf-line-0-0', index: 1 };
      const result = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, source);
      // Position 0 adds 0, position 1 isSameItemBeingMoved adds itemWidth (100), total = 100 >= 100
      expect(result).toBe(true);
      
      // Test with source index that doesn't match any position
      const sourceDifferent = { droppableId: 'shelf-line-0-0', index: 2 };
      const result2 = isWithinShelfWidth(shelfLines, 0, 0, 0, 100, sourceDifferent);
      // Position 0 adds 0, position 1 adds 50, total = 50 < 100
      expect(result2).toBe(false);
    });
  });

  describe('placeProductAtPosition - additional edge cases', () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Product A',
      width: 100,
      height: 50,
      brand_name: 'Brand A',
      subCategory_name: 'Toothpaste',
      price: 5.99,
      image_url: 'image.jpg',
      tpnb: 'TPNB001',
      global_trade_item_number: 'GTIN001',
      dimensionUom: 'mm',
      orientation: 0,
      depth: 3,
    };

    it('should handle reposition move when original item is not found', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];
      const productWithReposition = {
        ...mockProduct,
        isRepositionMove: true,
        originalUniqueItemId: 'non-existent',
      };

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: productWithReposition,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      // Should still place the product even if original not found
      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle invalid startItemIdx', () => {
      const shelfLines = [[[{ isEmpty: true, width: 200 }]]];

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: -1,
        product: mockProduct,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid placement parameters');
    });

    it('should handle null shelfLines', () => {
      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 0,
        product: mockProduct,
        facingsWide: 1,
        facingsHigh: 1,
        shelfLines: null,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Invalid placement parameters');
    });

    it('should handle rebalance success case when space can be rebalanced', () => {
      // Create a scenario where rebalancing succeeds
      const shelfLines = [[[
        { isEmpty: true, width: 20 },
        { isEmpty: true, width: 20 },
        { isEmpty: true, width: 20 },
        { isEmpty: true, width: 20 },
      ]]];

      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ isEmpty: false, width: 100 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = placeProductAtPosition({
        bayIdx: 0,
        shelfIdx: 0,
        startItemIdx: 1, // Start in middle to trigger rebalancing
        product: mockProduct,
        facingsWide: 2, // Requires 200 width
        facingsHigh: 1,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });
  });

  describe('removeSelectiveFacings - additional edge cases', () => {
    const mockItem = {
      id: 'item-1',
      product_id: 'product-1',
      name: 'Product A',
      isEmpty: false,
      width: 100,
      height: 50,
      facings_wide: 3,
      facings_high: 2,
      xPosition: 0,
      linear: 300,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      tpnb: 'TPNB001',
      price: 5.99,
      image_url: 'image.jpg',
    };

    it('should handle item with undefined facings', () => {
      const itemWithUndefinedFacings = {
        ...mockItem,
        facings_wide: undefined,
        facings_high: undefined,
      };
      const shelfLines = [[[itemWithUndefinedFacings]]];

      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(false);
    });

    it('should handle item found in different bay and shelf', () => {
      const shelfLines = [
        [
          [{ isEmpty: true, width: 50 }],
          [{ isEmpty: true, width: 50 }],
        ],
        [
          [{ isEmpty: true, width: 50 }],
          [mockItem],
        ],
      ];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [
          [
            [{ isEmpty: true, width: 50 }],
            [{ isEmpty: true, width: 50 }],
          ],
          [
            [{ isEmpty: true, width: 50 }],
            [{ ...mockItem, facings_wide: 2 }],
          ],
        ],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 1,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
    });

    it('should not track removed facings when both are zero', () => {
      const shelfLines = [[[mockItem]]];
      // This should return false early, but let's test the trackRemovedFacings early return
      const result = removeSelectiveFacings({
        itemId: 'item-1',
        facingsWideToRemove: 0,
        facingsHighToRemove: 0,
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(false);
      // trackRemovedFacings should not be called (early return in function)
    });
  });

  describe('changeOrientation - additional edge cases', () => {
    const mockItem = {
      id: 'item-1',
      product_id: 'product-1',
      name: 'Product A',
      isEmpty: false,
      width: 100,
      height: 50,
      facings_wide: 2,
      facings_high: 1,
      xPosition: 0,
      linear: 200,
      actualWidth: 10,
      actualHeight: 5,
      depth: 3,
      tpnb: 'TPNB001',
      price: 5.99,
      image_url: 'image.jpg',
      isRotated90: false,
      baseUnitWidthPx: 100,
      baseUnitHeightPx: 50,
      baseActualWidth: 10,
      baseActualHeight: 5,
    };

    it('should handle partial consumption of empty space when getting wider', () => {
      const narrowItem = {
        ...mockItem,
        width: 50,
        height: 100,
        facings_wide: 1,
        facings_high: 2,
        linear: 50,
        isRotated90: true,
      };
      // Create empty space that's larger than needed to test partial consumption
      const shelfLines = [[[narrowItem, { isEmpty: true, width: 150 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...narrowItem, facings_wide: 2, facings_high: 1, width: 100, height: 50, isRotated90: false }, { isEmpty: true, width: 50 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });

    it('should handle merging empty space when product gets narrower', () => {
      const wideItem = {
        ...mockItem,
        width: 100,
        height: 50,
        facings_wide: 3,
        facings_high: 1,
        linear: 300,
      };
      // Create empty space after item to test merging
      const shelfLines = [[[wideItem, { isEmpty: true, width: 50 }]]];
      checkViolationsAndMark.mockReturnValueOnce({
        shelfLines: [[[{ ...wideItem, facings_wide: 1, facings_high: 3, width: 50, height: 100 }, { isEmpty: true, width: 200 }]]],
        violations: [],
        bays: mockState.planogramVisualizerData.bays,
      });

      const result = changeOrientation({
        itemId: 'item-1',
        shelfLines,
        dispatch: mockDispatch,
        SCALE: 3,
      });

      expect(result).toBe(true);
      expect(setShelfLines).toHaveBeenCalled();
    });
  });
});

