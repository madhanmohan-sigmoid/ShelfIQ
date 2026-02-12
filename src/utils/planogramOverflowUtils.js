// Utilities to detect and mark shelf overflow (violations) based on
// the physical capacity of each sub-shelf (baseWidth) vs. the total
// width of products placed on it.
//
// This is used both:
// - on initial planogram build, and
// - after interactive layout changes (drag/drop, click-to-place).

// Compute where overflow starts and how much it exceeds capacity, based on the
// *actual* layout, i.e. products + empty slots. Empty slots still consume
// horizontal space, so they must be included when determining whether any
// product's right edge extends beyond capacity.
//
// - subShelf: array of items (products + empty slots)
// - capacity: physical capacity of the shelf in px (typically baseWidth)
export const calculateOverflowInfo = (subShelf, capacity) => {
  let cursorX = 0; // running X including both products and empties
  let overflowStartIdx = null;
  let maxRight = 0; // furthest right edge of any product

  for (let i = 0; i < subShelf.length; i++) {
    const item = subShelf[i];
    if (!item) continue;

    // Width of this cell in the layout. Empties also take space but are not
    // themselves products, so we account for them via cursorX.
    const cellWidth =
      (item.width || 0) * (item.isEmpty ? 1 : item.facings_wide || 1);

    if (!item.isEmpty) {
      const itemWidth = (item.width || 0) * (item.facings_wide || 1);
      const rightEdge = cursorX + itemWidth;

      // First product whose right edge goes beyond capacity
      if (overflowStartIdx === null && rightEdge > capacity) {
        overflowStartIdx = i;
      }

      if (rightEdge > maxRight) {
        maxRight = rightEdge;
      }
    }

    cursorX += cellWidth;
  }

  const overflow = maxRight > capacity ? maxRight - capacity : 0;

  return { overflowStartIdx, overflow, maxRight };
};

// Process a single sub-shelf for overflow:
// - Clears any stale expandedByPx from previous runs.
// - If overflowing: marks overflowing items with expandedByPx and expands width.
// - If not overflowing: restores width back to physical capacity (capacity).
const clearExpandedFlags = (subShelf) =>
  subShelf.map((item) => {
    if (!item) return item;
    // eslint-disable-next-line no-unused-vars
    const { expandedByPx, ...rest } = item;
    return rest;
  });

const markOverflowItemsAndComputeWidth = ({
  updatedSubShelf,
  capacity,
  bayIdx,
  subShelfIdx,
  violations,
  overflow,
  subMeta,
  maxRight,
}) => {
  // Mark all products whose right edge is beyond the capacity.
  let cursorX = 0;

  for (let i = 0; i < updatedSubShelf.length; i++) {
    const item = updatedSubShelf[i];
    if (!item) {
      continue;
    }

    const cellWidth =
      (item.width || 0) * (item.isEmpty ? 1 : item.facings_wide || 1);

    if (!item.isEmpty) {
      const itemWidth = (item.width || 0) * (item.facings_wide || 1);
      const rightEdge = cursorX + itemWidth;

      if (rightEdge > capacity) {
        violations.push({
          type: "overflow",
          bayIdx,
          shelfIdx: subShelfIdx,
          productId: item.product_id,
          requiredWidth: overflow, // extra width beyond capacity
          timestamp: Date.now(),
        });

        updatedSubShelf[i] = { ...item, expandedByPx: overflow };
      }
    }

    cursorX += cellWidth;
  }

  // Expand width to accommodate all products (up to the furthest right edge).
  const base = typeof subMeta.baseWidth === "number" ? subMeta.baseWidth : 0;
  const newWidth = Math.max(maxRight, base);

  return { updatedSubShelf, newWidth };
};

export const processSubShelfOverflow = ({
  subShelf,
  capacity,
  bayIdx,
  subShelfIdx,
  violations,
  newBays,
}) => {
  // Clone and clear any previous expandedByPx so highlighting only reflects
  // the *current* overflow state.
  const updatedSubShelf = clearExpandedFlags(subShelf);

  const { overflow, maxRight } = calculateOverflowInfo(
    updatedSubShelf,
    capacity
  );

  const subMeta = newBays[bayIdx].subShelves[subShelfIdx];

  // Check if there's any overflow (any product extends beyond capacity)
  if (overflow > 0) {
    const result = markOverflowItemsAndComputeWidth({
      updatedSubShelf,
      capacity,
      bayIdx,
      subShelfIdx,
      violations,
      overflow,
      subMeta,
      maxRight,
    });

    subMeta.width = result.newWidth;
    return result.updatedSubShelf;
  }

  // No overflow: restore width back to physical capacity.
  subMeta.width = capacity;
  return updatedSubShelf;
};

// Clone bays shallowly, cloning subShelves objects so we can safely
// mutate width properties when marking overflow.
const cloneBaysForViolations = (bays) =>
  (bays || []).map((bay) => ({
    ...bay,
    subShelves: (bay.subShelves || []).map((sub) => ({ ...sub })),
  }));

// Main entry: given shelfLines + bays, return:
// - updated shelfLines with expandedByPx flags,
// - updated bays with corrected widths,
// - full violations array.
//
// NOTE: Capacity is derived from baseWidth when present, otherwise width.
export const checkViolationsAndMark = (shelfLines, bays) => {
  if (!Array.isArray(shelfLines)) {
    return { shelfLines: [], violations: [], bays: bays || [] };
  }

  const violations = [];
  const newBays = cloneBaysForViolations(bays);
  const updatedShelfLines = [];

  for (let bayIdx = 0; bayIdx < shelfLines.length; bayIdx++) {
    const bay = shelfLines[bayIdx] || [];
    const updatedBay = [];

    for (let subShelfIdx = 0; subShelfIdx < bay.length; subShelfIdx++) {
      const subShelf = bay[subShelfIdx] || [];
      const subMeta = newBays?.[bayIdx]?.subShelves?.[subShelfIdx];

      if (!subMeta) {
        updatedBay.push(subShelf);
        continue;
      }

      // Physical capacity: prefer baseWidth (original shelf width),
      // falling back to current width if baseWidth is not defined.
      const capacity =
        typeof subMeta.baseWidth === "number" && subMeta.baseWidth > 0
          ? subMeta.baseWidth
          : subMeta.width || 0;

      const updatedSubShelf = processSubShelfOverflow({
        subShelf,
        capacity,
        bayIdx,
        subShelfIdx,
        violations,
        newBays,
      });

      updatedBay.push(updatedSubShelf);
    }

    // Bay width is always the max of its sub-shelves' widths
    const widths = newBays[bayIdx].subShelves.map((s) => s.width || 0);
    newBays[bayIdx].width = widths.length ? Math.max(...widths) : 0;

    updatedShelfLines.push(updatedBay);
  }

  return { shelfLines: updatedShelfLines, violations, bays: newBays };
};
