import {
  generateSavePayload,
  generateSaveSummary,
  buildFullLayoutSnapshot,
  buildPlanogramProductsSnapshot,
} from '../savePlanogramUtils';

describe('savePlanogramUtils', () => {
  describe('generateSavePayload', () => {
    const mockBays = [
      {
        width: 133,
        height: 180,
        subShelves: [
          { width: 133, height: 60 },
          { width: 133, height: 60 },
        ],
      },
    ];

    const mockShelfLines = [
      [
        [
          {
            isEmpty: false,
            isNewlyAdded: true,
            isRepositioned: false,
            product_id: 1,
            name: 'Product A',
            linear: 30,
            xPosition: 0,
            facings_wide: 2,
            facings_high: 1,
            actualWidth: 10,
            actualHeight: 5,
            depth: 3,
            product_orientation_id: 1,
          },
        ],
      ],
    ];

    it('should generate payload with newly added products', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.planogram_id).toBe('planogram-123');
      expect(payload.status).toBe('published');
      expect(payload.products_added).toHaveLength(1);
      expect(payload.products_added[0].number).toBe(1);
      expect(payload.products_added[0].shelf_details_list).toHaveLength(1);
      expect(payload.products_removed).toHaveLength(0);
    });

    it('should generate payload with removed products', () => {
      const removedProductsWithPosition = [
        {
          originalProductId: 2,
          bay: 1,
          shelf: 1,
          position: 50,
          linear: 20,
          facings_wide: 1,
          facings_high: 1,
          actualWidth: 8,
          actualHeight: 4,
          depth: 2,
          product_orientation_id: 1,
          product: { name: 'Product B' },
        },
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: [[[]]],
        bays: mockBays,
        removedProductsWithPosition,
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'draft',
        email: 'test@example.com',
      });

      expect(payload.status).toBe('draft');
      expect(payload.products_removed).toHaveLength(1);
      expect(payload.products_removed[0].shelf_details_list[0].product_info_list[0].product_id).toBe(2);
    });

    it('should generate payload with repositioned products', () => {
      const repositionedProductsWithPosition = [
        {
          originalProductId: 1,
          bay: 1,
          shelf: 1,
          position: 100,
          linear: 25,
          facings_wide: 2,
          facings_high: 1,
          actualWidth: 10,
          actualHeight: 5,
          depth: 3,
          product_orientation_id: 1,
          product: { name: 'Product A' },
        },
      ];

      const shelfLinesWithRepositioned = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: true,
              product_id: 1,
              name: 'Product A',
              linear: 25,
              xPosition: 100,
              facings_wide: 2,
              facings_high: 1,
              actualWidth: 10,
              actualHeight: 5,
              depth: 3,
              product_orientation_id: 1,
            },
          ],
        ],
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: shelfLinesWithRepositioned,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition,
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(1);
      expect(payload.products_removed).toHaveLength(1);
    });

    it('should handle zoom state correctly', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 2 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toBeDefined();
    });

    it('should use default zoom value when zoomState is missing', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: {},
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toBeDefined();
    });

    it('should convert linear value from pixels to mm correctly', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      const addedProduct = payload.products_added[0].shelf_details_list[0].product_info_list[0];
      expect(addedProduct.linear_value).toBeDefined();
      expect(typeof addedProduct.linear_value).toBe('number');
    });

    it('should handle multiple bays and shelves', () => {
      const multiBayShelfLines = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
              name: 'Product A',
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 10,
              actualHeight: 5,
              depth: 3,
            },
          ],
        ],
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 2,
              name: 'Product B',
              linear: 25,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 8,
              actualHeight: 4,
              depth: 2,
            },
          ],
        ],
      ];

      const multiBayBays = [
        {
          width: 133,
          height: 180,
          subShelves: [{ width: 133, height: 60 }],
        },
        {
          width: 133,
          height: 180,
          subShelves: [{ width: 133, height: 60 }],
        },
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: multiBayShelfLines,
        bays: multiBayBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(2);
    });

    it('should handle bays with undefined or missing subShelves', () => {
      const baysWithMissingSubShelves = [
        {
          width: 133,
          height: 180,
          subShelves: [
            { width: 133, height: 60 },
            { height: 60 }, // missing width
            null, // null subShelf
          ],
        },
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: baysWithMissingSubShelves,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload).toBeDefined();
      expect(payload.planogram_id).toBe('planogram-123');
    });

    it('should handle empty shelfLines', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: [[[]]],
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(0);
      expect(payload.products_removed).toHaveLength(0);
    });

    it('should use default values for missing product properties', () => {
      const shelfLinesWithMinimalData = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
              name: 'Product A',
              linear: 30,
              xPosition: 0,
              facings_wide: undefined,
              facings_high: undefined,
              actualWidth: 10,
              actualHeight: 5,
            },
          ],
        ],
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: shelfLinesWithMinimalData,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      const product = payload.products_added[0].shelf_details_list[0].product_info_list[0];
      expect(product.facing_wide).toBe(1);
      expect(product.facing_high).toBe(1);
    });

    it('should include email in payload', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'user@example.com',
      });

      expect(payload.email).toBe('user@example.com');
    });

    it('should use default email when not provided', () => {
      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: mockShelfLines,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
      });

      expect(payload.email).toBe('');
    });

    it('should include orientation-changed products in added and removed via orientationChangedProductsWithPosition', () => {
      const orientationChangedProductsWithPosition = [
        {
          originalProductId: 3,
          bay: 1,
          shelf: 1,
          position: 25,
          linear: 15,
          facings_wide: 2,
          facings_high: 1,
          actualWidth: 9,
          actualHeight: 5,
          depth: 2,
          orientation_id: 2,
          product: { name: 'Product C' },
        },
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: [[[]]],
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        orientationChangedProductsWithPosition,
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_removed).toHaveLength(1);
      expect(payload.products_removed[0].shelf_details_list[0].product_info_list[0].product_id).toBe(3);
      expect(payload.products_removed[0].shelf_details_list[0].product_info_list[0].product_orientation_id).toBe(2);
    });

    it('should include orientation-changed items from shelfLines in added products', () => {
      const shelfLinesWithOrientationChanged = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: false,
              isOrientationChanged: true,
              product_id: 1,
              name: 'Product A',
              linear: 30,
              xPosition: 0,
              facings_wide: 2,
              facings_high: 1,
              actualWidth: 10,
              actualHeight: 5,
              depth: 3,
              orientation_id: 2,
            },
          ],
        ],
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: shelfLinesWithOrientationChanged,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(1);
      const added = payload.products_added[0].shelf_details_list[0].product_info_list[0];
      expect(added.product_orientation_id).toBe(2);
    });

    it('should use orientation_id fallback when product_orientation_id missing', () => {
      const removedProductsWithPosition = [
        {
          originalProductId: 2,
          bay: 1,
          shelf: 1,
          position: 0,
          linear: 10,
          facings_wide: 1,
          facings_high: 1,
          actualWidth: 8,
          actualHeight: 4,
          depth: 2,
          orientation_id: 3,
          product: { name: 'Product B' },
        },
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: [[[]]],
        bays: mockBays,
        removedProductsWithPosition,
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      const removed = payload.products_removed[0].shelf_details_list[0].product_info_list[0];
      expect(removed.product_orientation_id).toBe(3);
    });

    it('should group multiple products on same bay and shelf correctly', () => {
      const shelfLinesSameShelf = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
              name: 'Product A',
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 10,
              actualHeight: 5,
              depth: 3,
            },
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 2,
              name: 'Product B',
              linear: 25,
              xPosition: 50,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 8,
              actualHeight: 4,
              depth: 2,
            },
          ],
        ],
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: shelfLinesSameShelf,
        bays: mockBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(1);
      expect(payload.products_added[0].shelf_details_list).toHaveLength(1);
      expect(payload.products_added[0].shelf_details_list[0].product_info_list).toHaveLength(2);
    });

    it('should compute shelf offset for second shelf correctly', () => {
      const twoShelfBays = [
        {
          width: 133,
          height: 180,
          subShelves: [
            { width: 100, height: 60 },
            { width: 33, height: 60 },
          ],
        },
      ];
      const shelfLinesSecondShelf = [
        [
          [],
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
              name: 'Product A',
              linear: 20,
              xPosition: 10,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 10,
              actualHeight: 5,
              depth: 3,
            },
          ],
        ],
      ];

      const payload = generateSavePayload({
        planogramId: 'planogram-123',
        shelfLines: shelfLinesSecondShelf,
        bays: twoShelfBays,
        removedProductsWithPosition: [],
        repositionedProductsWithPosition: [],
        SCALE: 3,
        zoomState: { newValue: 1 },
        status: 'published',
        email: 'test@example.com',
      });

      expect(payload.products_added).toHaveLength(1);
      const added = payload.products_added[0].shelf_details_list[0].product_info_list[0];
      expect(added.position).toBeGreaterThan(0);
    });
  });

  describe('generateSaveSummary', () => {
    it('should count newly added products', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
            },
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 2,
            },
          ],
        ],
      ];

      const summary = generateSaveSummary({
        shelfLines,
        removedProductIds: [],
      });

      expect(summary.newly_added_products_count).toBe(2);
      expect(summary.repositioned_products_count).toBe(0);
      expect(summary.total_added_products_count).toBe(2);
      expect(summary.removed_products_count).toBe(0);
      expect(summary.total_changes).toBe(2);
    });

    it('should count repositioned products', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: true,
              product_id: 1,
            },
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: true,
              product_id: 2,
            },
          ],
        ],
      ];

      const summary = generateSaveSummary({
        shelfLines,
        removedProductIds: [],
      });

      expect(summary.newly_added_products_count).toBe(0);
      expect(summary.repositioned_products_count).toBe(2);
      expect(summary.total_added_products_count).toBe(2);
    });

    it('should count both newly added and repositioned products', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
            },
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: true,
              product_id: 2,
            },
          ],
        ],
      ];

      const summary = generateSaveSummary({
        shelfLines,
        removedProductIds: [3, 4],
        planogramProducts: [],
      });

      expect(summary.newly_added_products_count).toBe(1);
      expect(summary.repositioned_products_count).toBe(1);
      expect(summary.total_added_products_count).toBe(2);
      expect(summary.removed_products_count).toBe(2);
      expect(summary.total_changes).toBe(4);
    });

    it('should ignore empty slots', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: true,
              isNewlyAdded: false,
              isRepositioned: false,
            },
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
            },
          ],
        ],
      ];

      const summary = generateSaveSummary({
        shelfLines,
        removedProductIds: [],
      });

      expect(summary.newly_added_products_count).toBe(1);
      expect(summary.total_added_products_count).toBe(1);
    });

    it('should handle empty shelfLines', () => {
      const summary = generateSaveSummary({
        shelfLines: [[[]]],
        removedProductIds: [],
        planogramProducts: [],
      });

      expect(summary.newly_added_products_count).toBe(0);
      expect(summary.repositioned_products_count).toBe(0);
      expect(summary.total_added_products_count).toBe(0);
      expect(summary.removed_products_count).toBe(0);
      expect(summary.total_changes).toBe(0);
    });

    it('should handle multiple bays and shelves', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: true,
              isRepositioned: false,
              product_id: 1,
            },
          ],
        ],
        [
          [
            {
              isEmpty: false,
              isNewlyAdded: false,
              isRepositioned: true,
              product_id: 2,
            },
          ],
        ],
      ];

      const summary = generateSaveSummary({
        shelfLines,
        removedProductIds: [3],
        planogramProducts: [],
      });

      expect(summary.newly_added_products_count).toBe(1);
      expect(summary.repositioned_products_count).toBe(1);
      expect(summary.total_added_products_count).toBe(2);
      expect(summary.removed_products_count).toBe(1);
      expect(summary.total_changes).toBe(3);
    });
  });

  describe('buildFullLayoutSnapshot', () => {
    const mockBays = [
      {
        width: 133,
        height: 180,
        subShelves: [
          { width: 133, height: 60 },
          { width: 133, height: 60 },
        ],
      },
    ];

    const mockShelfLines = [
      [
        [
          {
            isEmpty: false,
            product_id: 1,
            linear: 30,
            xPosition: 0,
            facings_wide: 2,
            facings_high: 1,
            product_orientation_id: 1,
          },
          {
            isEmpty: false,
            product_id: 2,
            linear: 25,
            xPosition: 50,
            facings_wide: 1,
            facings_high: 1,
            orientation_id: 2,
          },
        ],
      ],
    ];

    it('should generate a snapshot string', () => {
      const snapshot = buildFullLayoutSnapshot({
        shelfLines: mockShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(typeof snapshot).toBe('string');
      expect(snapshot.length).toBeGreaterThan(0);
    });

    it('should handle empty shelfLines', () => {
      const snapshot = buildFullLayoutSnapshot({
        shelfLines: [[[]]],
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Empty array serializes to "[]", not empty string
      expect(snapshot).toBe('[]');
    });

    it('should handle null or undefined inputs', () => {
      expect(
        buildFullLayoutSnapshot({
          shelfLines: null,
          bays: mockBays,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toBe('');

      expect(
        buildFullLayoutSnapshot({
          shelfLines: mockShelfLines,
          bays: null,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toBe('');
    });

    it('should handle zoom state correctly', () => {
      const snapshot1 = buildFullLayoutSnapshot({
        shelfLines: mockShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // With zoom 2, the same pixel values normalize to different mm values
      // because the normalization divides by zoom
      const snapshot2 = buildFullLayoutSnapshot({
        shelfLines: mockShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 2 },
      });

      // Snapshots should be valid JSON strings
      expect(typeof snapshot1).toBe('string');
      expect(typeof snapshot2).toBe('string');
      expect(() => JSON.parse(snapshot1)).not.toThrow();
      expect(() => JSON.parse(snapshot2)).not.toThrow();
      
      // With different zoom, same pixel values produce different normalized mm values
      // This is expected behavior - the snapshot normalizes the current state
      expect(snapshot1).not.toBe(snapshot2);
    });

    it('should handle missing zoomState', () => {
      const snapshot = buildFullLayoutSnapshot({
        shelfLines: mockShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: {},
      });

      expect(typeof snapshot).toBe('string');
    });

    it('should ignore empty items', () => {
      const shelfLinesWithEmpty = [
        [
          [
            {
              isEmpty: true,
            },
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithEmpty,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toContain('product_id');
      expect(snapshot).not.toContain('isEmpty');
    });

    it('should sort snapshot entries consistently', () => {
      const snapshot1 = buildFullLayoutSnapshot({
        shelfLines: mockShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Reverse the shelfLines order
      const reversedShelfLines = [
        [
          [
            ...mockShelfLines[0][0].slice().reverse(),
          ],
        ],
      ];

      const snapshot2 = buildFullLayoutSnapshot({
        shelfLines: reversedShelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      // Should produce the same snapshot due to sorting
      expect(snapshot1).toBe(snapshot2);
    });

    it('should handle missing product properties', () => {
      const shelfLinesWithMinimal = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 0,
              xPosition: 0,
            },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithMinimal,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(typeof snapshot).toBe('string');
      expect(snapshot.length).toBeGreaterThan(0);
    });

    it('should skip non-array bay entries', () => {
      const secondBay = [
        [
          {
            isEmpty: false,
            product_id: 1,
            linear: 30,
            xPosition: 0,
            facings_wide: 1,
            facings_high: 1,
          },
        ],
      ];
      const shelfLinesWithNonArrayBay = [null, secondBay];

      const secondBayConfig = {
        width: 133,
        height: 180,
        subShelves: [{ width: 133, height: 60 }],
      };
      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithNonArrayBay,
        bays: [...mockBays, secondBayConfig],
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toContain('product_id');
      expect(snapshot).toContain('"bay":2');
    });

    it('should skip non-array shelf entries', () => {
      const secondShelf = [
        {
          isEmpty: false,
          product_id: 1,
          linear: 30,
          xPosition: 0,
          facings_wide: 1,
          facings_high: 1,
        },
      ];
      const shelfLinesWithNonArrayShelf = [[null, secondShelf]];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithNonArrayShelf,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toContain('product_id');
      expect(snapshot).toContain('"shelf":2');
    });

    it('should return empty string when JSON.stringify throws', function () {
      if (typeof BigInt !== 'function') {
        this.skip();
      }
      const shelfLinesWithBigInt = [
        [
          [
            {
              isEmpty: false,
              product_id: BigInt(1),
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithBigInt,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toBe('');
    });

    it('should sort by facing_wide and facing_high when other keys equal', () => {
      const shelfLinesTwoProducts = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 2,
              facings_high: 1,
              product_orientation_id: 1,
            },
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 2,
              orientation_id: 1,
            },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesTwoProducts,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      const parsed = JSON.parse(snapshot);
      expect(parsed).toHaveLength(2);
      expect(Number.isFinite(parsed[0].facing_wide)).toBe(true);
      expect(Number.isFinite(parsed[1].facing_wide)).toBe(true);
    });

    it('should sort by product_id position and facings when comparing entries', () => {
      const shelfLinesMulti = [
        [
          [
            { isEmpty: false, product_id: 2, linear: 20, xPosition: 50, facings_wide: 1, facings_high: 1 },
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 2, facings_high: 1 },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesMulti,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      const parsed = JSON.parse(snapshot);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].product_id).toBe(1);
      expect(parsed[1].product_id).toBe(2);
    });

    it('should sort by facing_wide and facing_high for same bay shelf product position', () => {
      const shelfLinesSamePosition = [
        [
          [
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 2, facings_high: 1 },
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 1, facings_high: 2 },
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 1, facings_high: 1 },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesSamePosition,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      const parsed = JSON.parse(snapshot);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].facing_wide).toBe(1);
      expect(parsed[0].facing_high).toBe(1);
      expect(parsed[1].facing_wide).toBe(1);
      expect(parsed[1].facing_high).toBe(2);
      expect(parsed[2].facing_wide).toBe(2);
      expect(parsed[2].facing_high).toBe(1);
    });

    it('should sort by facing_high when facing_wide is equal', () => {
      const shelfLinesFacingHigh = [
        [
          [
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 1, facings_high: 2 },
            { isEmpty: false, product_id: 1, linear: 30, xPosition: 0, facings_wide: 1, facings_high: 1 },
          ],
        ],
      ];

      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesFacingHigh,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      const parsed = JSON.parse(snapshot);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].facing_high).toBe(1);
      expect(parsed[1].facing_high).toBe(2);
    });
  });

  describe('buildPlanogramProductsSnapshot', () => {
    const mockBays = [
      {
        width: 133,
        height: 180,
        subShelves: [
          { width: 133, height: 60 },
          { width: 133, height: 60 },
        ],
      },
    ];

    it('should return empty array when shelfLines is not an array', () => {
      expect(
        buildPlanogramProductsSnapshot({
          shelfLines: null,
          bays: mockBays,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toEqual([]);

      expect(
        buildPlanogramProductsSnapshot({
          shelfLines: undefined,
          bays: mockBays,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toEqual([]);
    });

    it('should return empty array when bays is not an array', () => {
      expect(
        buildPlanogramProductsSnapshot({
          shelfLines: [[[]]],
          bays: null,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toEqual([]);

      expect(
        buildPlanogramProductsSnapshot({
          shelfLines: [[[]]],
          bays: undefined,
          SCALE: 3,
          zoomState: { newValue: 1 },
        })
      ).toEqual([]);
    });

    it('should build snapshot with minimal item data', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toHaveLength(1);
      expect(snapshot[0]).toMatchObject({
        bay: 1,
        shelf: 1,
        product_id: 1,
        facings_wide: 1,
        facings_high: 1,
        total_facings: 1,
        orientation: 0,
      });
      expect(typeof snapshot[0].position).toBe('number');
      expect(typeof snapshot[0].linear).toBe('number');
      expect(snapshot[0].product_details).toBeDefined();
      expect(snapshot[0].product_details?.product_id).toBeUndefined();
      expect(snapshot[0].product_details?.tpnb).toBeUndefined();
    });

    it('should use productDetailsMap when provided', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];
      const productDetailsMap = {
        1: {
          tpnb: 'TPNB123',
          name: 'Mapped Product',
          tray_width: 100,
          tray_height: 50,
          trayDepth: 10,
        },
      };

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
        productDetailsMap,
      });

      expect(snapshot[0].product_details).toEqual(productDetailsMap[1]);
      expect(snapshot[0].traywidth).toBe(100);
      expect(snapshot[0].trayheight).toBe(50);
      expect(snapshot[0].traydepth).toBe(10);
    });

    it('should use item.product_details when productDetailsMap missing', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              product_details: { tpnb: 'ITEM-TPNB', name: 'Item Product' },
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot[0].product_details).toEqual({ tpnb: 'ITEM-TPNB', name: 'Item Product' });
    });

    it('should use buildFallbackProductDetails when no productDetailsMap or product_details', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 101,
              tpnb: 'TPNB-101',
              gtin: 'GTIN-101',
              name: 'Fallback Product',
              price: 9.99,
              image_url: 'http://img/1',
              width: 10,
              height: 20,
              depth: 5,
              tray_width: 8,
              tray_height: 18,
              tray_depth: 4,
              brand_name: 'Brand',
              subCategory_name: 'Category',
              dimensionUom: 'mm',
            },
            {
              isEmpty: false,
              product_id: 102,
              tpnb: 'TPNB-102',
              global_trade_item_number: 'GTIN-102',
              brand: 'Brand2',
              linear: 25,
              xPosition: 10,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toHaveLength(2);
      const first = snapshot[0].product_details;
      expect(first?.product_id).toBe('TPNB-101');
      expect(first?.tpnb).toBe('TPNB-101');
      expect(first?.global_trade_item_number).toBe('GTIN-101');
      expect(first?.name).toBe('Fallback Product');
      expect(first?.brand_name).toBe('Brand');

      const second = snapshot[1].product_details;
      expect(second?.global_trade_item_number).toBe('GTIN-102');
      expect(second?.brand_name).toBe('Brand2');
    });

    it('should use productKPIsByTpnb when item has tpnb', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              tpnb: 'TPNB-KPI',
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];
      const productKPIsByTpnb = {
        'TPNB-KPI': { score: 85, metric: 'test' },
      };

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
        productKPIsByTpnb,
      });

      expect(snapshot[0].product_kpis).toEqual({ score: 85, metric: 'test' });
    });

    it('should use item.product_kpis when present', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              tpnb: 'TPNB-X',
              product_kpis: { fromItem: true },
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];
      const productKPIsByTpnb = { 'TPNB-X': { fromMap: true } };

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
        productKPIsByTpnb,
      });

      expect(snapshot[0].product_kpis).toEqual({ fromItem: true });
    });

    it('should compute shelfheight and shelfwidth from subShelf dimensions', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(typeof snapshot[0].shelfheight).toBe('number');
      expect(typeof snapshot[0].shelfwidth).toBe('number');
    });

    it('should skip non-array bay and shelf', () => {
      const shelfLines = [
        null,
        [
          undefined,
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: [
          ...mockBays,
          { width: 133, height: 180, subShelves: [{ width: 133, height: 60 }] },
        ],
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toHaveLength(1);
      expect(snapshot[0].bay).toBe(2);
      expect(snapshot[0].shelf).toBe(2);
    });

    it('should skip empty and isEmpty items', () => {
      const shelfLines = [
        [
          [
            { isEmpty: true, product_id: 1 },
            null,
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toHaveLength(1);
    });

    it('should use actualWidth/actualHeight for tray when productDetails missing', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
              actualWidth: 15,
              actualHeight: 20,
              depth: 5,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(typeof snapshot[0].traywidth).toBe('number');
      expect(typeof snapshot[0].trayheight).toBe('number');
      expect(snapshot[0].traydepth).toBe(5);
    });

    it('should use default zoom when zoomState missing', () => {
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: mockBays,
        SCALE: 3,
        zoomState: {},
      });

      expect(snapshot).toHaveLength(1);
      expect(snapshot[0].position).toBeDefined();
    });

    it('should set shelfheight/shelfwidth undefined when subShelf missing dimensions', () => {
      const baysNoDims = [
        {
          width: 133,
          height: 180,
          subShelves: [{ height: 60 }, {}],
        },
      ];
      const shelfLines = [
        [
          [
            {
              isEmpty: false,
              product_id: 1,
              linear: 30,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
          [
            {
              isEmpty: false,
              product_id: 2,
              linear: 25,
              xPosition: 0,
              facings_wide: 1,
              facings_high: 1,
            },
          ],
        ],
      ];

      const snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays: baysNoDims,
        SCALE: 3,
        zoomState: { newValue: 1 },
      });

      expect(snapshot).toHaveLength(2);
      expect(typeof snapshot[0].shelfheight).toBe('number');
      expect(snapshot[0].shelfwidth).toBeUndefined();
      expect(snapshot[1].shelfheight).toBeUndefined();
      expect(snapshot[1].shelfwidth).toBeUndefined();
    });
  });
});

