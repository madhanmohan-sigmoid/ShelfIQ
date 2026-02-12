import {
  calculateOverflowInfo,
  processSubShelfOverflow,
  checkViolationsAndMark,
} from '../planogramOverflowUtils';

describe('planogramOverflowUtils', () => {
  describe('calculateOverflowInfo', () => {
    it('should return no overflow when items fit within capacity', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 150;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(0);
      expect(result.overflowStartIdx).toBeNull();
      expect(result.maxRight).toBe(100);
    });

    it('should detect overflow when items exceed capacity', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(50);
      expect(result.overflowStartIdx).toBe(2); // product-3 is the first to exceed capacity
      expect(result.maxRight).toBe(150);
    });

    it('should handle empty slots correctly', () => {
      const subShelf = [
        { isEmpty: true, width: 30 },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: true, width: 20 },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(50);
      expect(result.overflowStartIdx).toBe(3);
      expect(result.maxRight).toBe(150);
    });

    it('should account for facings_wide when calculating width', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 2, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(50);
      expect(result.overflowStartIdx).toBe(1); // product-2 is the first to exceed capacity (starts at 100, ends at 150)
      expect(result.maxRight).toBe(150);
    });

    it('should handle empty shelf', () => {
      const subShelf = [];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(0);
      expect(result.overflowStartIdx).toBeNull();
      expect(result.maxRight).toBe(0);
    });

    it('should handle null/undefined items', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        null,
        undefined,
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(0);
      expect(result.maxRight).toBe(100);
    });

    it('should handle items without width property', () => {
      const subShelf = [
        { isEmpty: false, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.maxRight).toBe(50);
    });

    it('should handle items without facings_wide property', () => {
      const subShelf = [
        { isEmpty: false, width: 50, product_id: 'product-1' },
        { isEmpty: false, width: 50, product_id: 'product-2' },
      ];
      const capacity = 100;

      const result = calculateOverflowInfo(subShelf, capacity);

      expect(result.overflow).toBe(0);
      expect(result.maxRight).toBe(100);
    });
  });

  describe('processSubShelfOverflow', () => {
    it('should return shelf unchanged when no overflow', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 150;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 150, baseWidth: 150 }],
        },
      ];

      const result = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(result).toEqual(subShelf);
      expect(violations).toEqual([]);
      expect(newBays[0].subShelves[0].width).toBe(150);
    });

    it('should mark overflow items with expandedByPx', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
      ];
      const capacity = 100;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toMatchObject({
        type: 'overflow',
        bayIdx: 0,
        shelfIdx: 0,
        productId: 'product-3', // product-3 is the first to exceed capacity
      });
      expect(result[2].expandedByPx).toBeDefined();
      expect(newBays[0].subShelves[0].width).toBeGreaterThan(100);
    });

    it('should clear existing expandedByPx flags', () => {
      const subShelf = [
        {
          isEmpty: false,
          width: 50,
          facings_wide: 1,
          product_id: 'product-1',
          expandedByPx: 20,
        },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 150;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 150, baseWidth: 150 }],
        },
      ];

      const result = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(result[0].expandedByPx).toBeUndefined();
    });

    it('should update bay width when overflow occurs', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
      ];
      const capacity = 100;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(newBays[0].subShelves[0].width).toBeGreaterThan(100);
    });

    it('should use baseWidth when available for capacity', () => {
      const subShelf = [
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
        { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
      ];
      const capacity = 100;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 150, baseWidth: 100 }],
        },
      ];

      const result = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(result).toEqual(subShelf);
      expect(violations).toEqual([]);
    });

    it('should handle empty shelf', () => {
      const subShelf = [];
      const capacity = 100;
      const violations = [];
      const newBays = [
        {
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx: 0,
        subShelfIdx: 0,
        violations,
        newBays,
      });

      expect(result).toEqual([]);
      expect(violations).toEqual([]);
      expect(newBays[0].subShelves[0].width).toBe(100);
    });
  });

  describe('checkViolationsAndMark', () => {
    it('should return empty arrays for invalid shelfLines', () => {
      const result = checkViolationsAndMark(null, []);
      expect(result).toEqual({
        shelfLines: [],
        violations: [],
        bays: [],
      });

      const result2 = checkViolationsAndMark(undefined, []);
      expect(result2).toEqual({
        shelfLines: [],
        violations: [],
        bays: [],
      });
    });

    it('should handle empty shelfLines', () => {
      const bays = [];
      const result = checkViolationsAndMark([], bays);

      expect(result.shelfLines).toEqual([]);
      expect(result.violations).toEqual([]);
      expect(result.bays).toEqual([]);
    });

    it('should process single bay with single sub-shelf', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.shelfLines.length).toBe(1);
      expect(result.shelfLines[0].length).toBe(1);
      expect(result.violations).toEqual([]);
      expect(result.bays.length).toBe(1);
    });

    it('should detect violations across multiple sub-shelves', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
          ],
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-4' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [
            { width: 100, baseWidth: 100 },
            { width: 100, baseWidth: 100 },
          ],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toMatchObject({
        type: 'overflow',
        bayIdx: 0,
        shelfIdx: 0,
      });
    });

    it('should handle multiple bays', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
          ],
        ],
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.shelfLines.length).toBe(2);
      expect(result.bays.length).toBe(2);
    });

    it('should calculate bay width as max of sub-shelf widths', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
          ],
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-4' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [
            { width: 100, baseWidth: 100 },
            { width: 100, baseWidth: 100 },
          ],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      const maxSubShelfWidth = Math.max(
        ...result.bays[0].subShelves.map((s) => s.width || 0)
      );
      expect(result.bays[0].width).toBe(maxSubShelfWidth);
    });

    it('should handle missing subMeta gracefully', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.shelfLines.length).toBe(1);
      expect(result.shelfLines[0].length).toBe(1);
    });

    it('should use width when baseWidth is not available', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100 }], // no baseWidth
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.shelfLines.length).toBe(1);
      expect(result.violations).toEqual([]);
    });

    it('should handle sub-shelves with zero or undefined width', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 0 }],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      expect(result.shelfLines.length).toBe(1);
    });

    it('should clone bays to avoid mutating original', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const originalBaysWidth = bays[0].width;
      const originalSubShelfWidth = bays[0].subShelves[0].width;
      const result = checkViolationsAndMark(shelfLines, bays);

      // Original bays should not be mutated
      expect(bays[0].width).toBe(originalBaysWidth);
      expect(bays[0].subShelves[0].width).toBe(originalSubShelfWidth);
      // Result should have new bay objects (different reference)
      expect(result.bays).not.toBe(bays);
      expect(result.bays[0]).not.toBe(bays[0]);
    });

    it('should mark all products that overflow', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-4' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      // Should have violations for products that overflow
      expect(result.violations.length).toBeGreaterThan(0);
      const productIds = result.violations.map((v) => v.productId);
      // product-2 ends exactly at capacity (100), so it doesn't overflow
      // product-3 and product-4 overflow
      expect(productIds).toContain('product-3');
      expect(productIds).toContain('product-4');
    });

    it('should include timestamp in violations', () => {
      const shelfLines = [
        [
          [
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-1' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-2' },
            { isEmpty: false, width: 50, facings_wide: 1, product_id: 'product-3' },
          ],
        ],
      ];
      const bays = [
        {
          width: 100,
          subShelves: [{ width: 100, baseWidth: 100 }],
        },
      ];

      const result = checkViolationsAndMark(shelfLines, bays);

      // Ensure violations exist (3 products of 50 width = 150, capacity is 100, so overflow occurs)
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].timestamp).toBeDefined();
      expect(typeof result.violations[0].timestamp).toBe('number');
    });
  });
});

