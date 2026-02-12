import { toast } from "react-hot-toast";
import {
  setShelfLines,
  markProductAsRemoved,
  markProductAsRemovedWithPosition,
  markProductAsRepositionedWithPosition,
  markProductAsOrientationChangedWithPosition,
  restoreRemovedProduct,
  setBays,
  pushHistoryEntry,
  addActivity,
  setViolations,
} from "../redux/reducers/planogramVisualizerSlice";
import { checkViolationsAndMark } from "./planogramOverflowUtils";

const checkAndNotifyNewViolations = (previousViolations, newViolations) => {
  if (!Array.isArray(previousViolations) || !Array.isArray(newViolations)) {
    return;
  }

  const previousKeys = new Set(
    previousViolations.map((v) => `${v.bayIdx}-${v.shelfIdx}-${v.productId}`)
  );

  const hasNewViolations = newViolations.some(
    (v) => !previousKeys.has(`${v.bayIdx}-${v.shelfIdx}-${v.productId}`)
  );

  if (hasNewViolations) {
    toast.error(
      "Violation: The shelf does not have enough space to fit all products.",
      { duration: 4000 }
    );
  }
};

export function isWithinShelfWidth(
  shelfLines,
  shelfIdx,
  subShelfIdx,
  position,
  itemWidth,
  source
) {
  const shelfRow = shelfLines[shelfIdx][subShelfIdx];
  let availableWidth = 0;
  let currentIndex = position;

  while (currentIndex < shelfRow.length && availableWidth < itemWidth) {
    const slot = shelfRow[currentIndex];
    const isSameItemBeingMoved =
      source.droppableId === `shelf-line-${shelfIdx}-${subShelfIdx}` &&
      currentIndex === source.index;
    if (isSameItemBeingMoved) {
      availableWidth += itemWidth;
    } else if (slot?.isEmpty) {
      availableWidth += slot.width;
    } else {
      break;
    }
    currentIndex++;
  }
  return availableWidth >= itemWidth;
}

const createEmptySpaces = (totalWidth, shelfIdx, subShelfIdx) => {
  const emptySpaces = [];
  const EMPTY_SPACE_WIDTH = 5;
  while (totalWidth > 0) {
    const width = Math.min(totalWidth, EMPTY_SPACE_WIDTH);
    emptySpaces.push({
      id: `empty-${shelfIdx}-${subShelfIdx}-${Date.now()}-${Math.random()}`,
      width,
      height: 0,
      bgColor: "#f0f0f0",
      isEmpty: true,
      linear: width,
    });
    totalWidth -= width;
  }
  return emptySpaces;
};

const getRequiredWidth = (item) => item.width * (item.facings_wide || 1);

const countContiguousEmptySpace = (destShelf, startIndex, requiredWidth) => {
  let idx = startIndex;
  let available = 0;
  while (
    idx < destShelf.length &&
    destShelf[idx]?.isEmpty &&
    available < requiredWidth
  ) {
    available += destShelf[idx].width || 0;
    idx++;
  }
  return { available, consumedCells: idx - startIndex };
};

let emptySlotIdCounter = 0;

const generateEmptySlotId = (shelfIdx, subShelfIdx) => {
  const hasGlobalContext = typeof globalThis === "object";
  const cryptoObj = hasGlobalContext ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return `empty-${shelfIdx}-${subShelfIdx}-${cryptoObj.randomUUID()}`;
  }

  emptySlotIdCounter += 1;
  return `empty-${shelfIdx}-${subShelfIdx}-${emptySlotIdCounter}`;
};

const createEmptySlot = (shelfIdx, subShelfIdx, width) => ({
  id: generateEmptySlotId(shelfIdx, subShelfIdx),
  width,
  height: 0,
  bgColor: "#f0f0f0",
  isEmpty: true,
  linear: width,
});

const insertItemAtIndex = ({ destShelf, startIndex, consumedCells, item }) => {
  if (consumedCells > 0) {
    destShelf.splice(startIndex, consumedCells, item);
    return startIndex;
  }
  destShelf.splice(startIndex, 0, item);
  return startIndex;
};

const insertLeftoverEmpty = ({
  destShelf,
  startIndex,
  leftover,
  shelfIdx,
  subShelfIdx,
}) => {
  if (leftover <= 0) return;
  destShelf.splice(
    startIndex + 1,
    0,
    createEmptySlot(shelfIdx, subShelfIdx, leftover)
  );
};

const recalculateShelfLayoutAndTrackRepositions = ({
  destShelf,
  shelfIdx,
  subShelfIdx,
  SCALE,
  dispatch,
}) => {
  if (!Array.isArray(destShelf) || !dispatch) return;

  let runningWidthPx = 0;
  const EPSILON = 0.0001;

  for (let i = 0; i < destShelf.length; i++) {
    const cell = destShelf[i];
    if (!cell) continue;

    const facingsWide = cell.facings_wide || 1;
    const cellWidthPx = (cell.width || 0) * (cell.isEmpty ? 1 : facingsWide);

    const xBeforePx = runningWidthPx;

    if (!cell.isEmpty) {
      const oldX =
        typeof cell.xPosition === "number" ? cell.xPosition : xBeforePx / SCALE;
      const newX = xBeforePx / SCALE;
      const hasMoved = Math.abs(newX - oldX) > EPSILON;

      let updatedCell = {
        ...cell,
        xPosition: newX,
        linear: cellWidthPx,
      };

      if (hasMoved && !cell.isNewlyAdded && !cell.isRepositioned) {
        dispatch(
          markProductAsRepositionedWithPosition({
            productId: cell.id,
            originalProductId: cell.product_id,
            bay: shelfIdx + 1,
            shelf: subShelfIdx + 1,
            position: oldX,
            linear: cell.linear,
            facings_wide: cell.facings_wide,
            facings_high: cell.facings_high,
            actualWidth: cell.actualWidth,
            actualHeight: cell.actualHeight,
            depth: cell.depth,
            product: {
              id: cell.product_id,
              name: cell.name,
              tpnb: cell.tpnb,
              price: cell.price,
              image_url: cell.image_url,
            },
          })
        );
        updatedCell.isRepositioned = true;
      }

      destShelf[i] = updatedCell;
    }

    runningWidthPx += cellWidthPx;
  }
};

const totalEmptyWidth = (destShelf) =>
  destShelf.reduce(
    (sum, cell) => sum + (cell?.isEmpty ? cell.width || 0 : 0),
    0
  );

const consumeEmptyToRight = (destShelf, startIdx, need) => {
  let cursor = startIdx;
  let remaining = need;
  while (cursor < destShelf.length && remaining > 0) {
    const cell = destShelf[cursor];
    if (cell?.isEmpty) {
      remaining -= cell.width || 0;
      destShelf.splice(cursor, 1);
      continue;
    }
    cursor++;
  }
  return remaining;
};

const consumeEmptyToLeft = (destShelf, startIdx, need, currentIndex) => {
  let cursor = startIdx;
  let remaining = need;
  let updatedIndex = currentIndex;
  while (cursor >= 0 && remaining > 0) {
    const cell = destShelf[cursor];
    if (cell?.isEmpty) {
      remaining -= cell.width || 0;
      destShelf.splice(cursor, 1);
      updatedIndex -= 1;
      cursor -= 1;
      continue;
    }
    cursor -= 1;
  }
  return { remaining, updatedIndex };
};

const tryRebalanceWithoutExpansion = ({
  destShelf,
  startIndex,
  missing,
  requiredWidth,
  shelfIdx,
  subShelfIdx,
  SCALE,
}) => {
  if (totalEmptyWidth(destShelf) < requiredWidth) {
    return { ok: false };
  }

  let remaining = missing;
  let currentIndex = startIndex;

  remaining = consumeEmptyToRight(destShelf, currentIndex + 1, remaining);
  const leftResult = consumeEmptyToLeft(
    destShelf,
    currentIndex - 1,
    remaining,
    currentIndex
  );
  remaining = leftResult.remaining;
  currentIndex = leftResult.updatedIndex;

  if (remaining > 0) {
    return { ok: false };
  }

  if (remaining < 0) {
    insertLeftoverEmpty({
      destShelf,
      startIndex: currentIndex,
      leftover: Math.abs(remaining),
      shelfIdx,
      subShelfIdx,
    });
  }

  return { ok: true, newIndex: currentIndex };
};

const cloneShelfLines = (shelfLines) =>
  (shelfLines || []).map((shelf) =>
    (shelf || []).map((subShelf) => [...subShelf])
  );

// Capture current layout state for Undo history
const pushLayoutHistory = (dispatch, currentShelfLines) => {
  const state = dispatch((_, getState) => getState());
  const {
    bays,
    violations,
    removedProductIds,
    removedProductsWithPosition,
    repositionedProductsWithPosition,
    orientationChangedProductsWithPosition,
  } = state.planogramVisualizerData || {};

  const snapshot = {
    shelfLines: cloneShelfLines(currentShelfLines || []),
    bays: (bays || []).map((bay) => ({
      ...bay,
      subShelves: (bay.subShelves || []).map((sub) => ({ ...sub })),
    })),
    violations: (violations || []).map((v) => ({ ...v })),
    removedProductIds: [...(removedProductIds || [])],
    removedProductsWithPosition: (removedProductsWithPosition || []).map(
      (p) => ({ ...p })
    ),
    repositionedProductsWithPosition: (
      repositionedProductsWithPosition || []
    ).map((p) => ({ ...p })),
    orientationChangedProductsWithPosition: (
      orientationChangedProductsWithPosition || []
    ).map((p) => ({ ...p })),
  };

  dispatch(pushHistoryEntry(snapshot));
};

// Local-only activity logger (frontend; ready for future backend integration)
let activityIdCounter = 0;

const generateActivityId = () => {
  // Prefer cryptographically strong IDs when available
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `act-${crypto.randomUUID()}`;
  }

  // Fallback: time-based, monotonically increasing ID (no weak RNG usage)
  activityIdCounter += 1;
  return `act-${Date.now()}-${activityIdCounter}`;
};

const createActivityEvent = (partial) => ({
  id: partial.id || generateActivityId(),
  timestamp: partial.timestamp || Date.now(),
  ...partial,
});

const logLocalActivity = (dispatch, partial) => {
  if (!dispatch || !partial?.type) return;
  dispatch(addActivity(createActivityEvent(partial)));
};

const parseShelfDroppableId = (droppableId) =>
  droppableId.replace("shelf-line-", "").split("-").map(Number);

const isInventoryToShelf = (source, destination) =>
  source.droppableId === "items" &&
  destination.droppableId.startsWith("shelf-line-");

const isShelfToInventory = (source, destination) =>
  source.droppableId.startsWith("shelf-line-") &&
  destination.droppableId === "items";

const isShelfToShelf = (source, destination) =>
  source.droppableId.startsWith("shelf-line-") &&
  destination.droppableId.startsWith("shelf-line-");

const getDraggedItem = ({ source, shelfLines, dispatch, draggableId }) => {
  if (source.droppableId === "items") {
    const state = dispatch((_, getState) => getState());
    const allProducts = state.productData.products;
    const inventoryItem = allProducts.find(
      (product) => product.id === draggableId
    );
    if (!inventoryItem) {
      console.error("Item not found:", draggableId);
    }
    return inventoryItem || null;
  }

  if (source.droppableId.startsWith("shelf-line-")) {
    const [shelfIdx, subShelfIdx] = parseShelfDroppableId(source.droppableId);
    return shelfLines[shelfIdx]?.[subShelfIdx]?.[source.index] || null;
  }

  return null;
};

const transformInventoryItem = ({ item, shelfIdx, subShelfIdx, SCALE }) => {
  const rawWidth = item.width ?? 50;
  const rawHeight = item.height ?? 50;

  const scaledWidth = (rawWidth / 10) * SCALE;
  const scaledHeight = (rawHeight / 10) * SCALE;

  return {
    ...item,
    id: `${item.id}_${shelfIdx}_${subShelfIdx}_${Date.now()}`,
    width: scaledWidth,
    height: scaledHeight,
    baseUnitWidthPx: scaledWidth,
    baseUnitHeightPx: scaledHeight,
    actualHeight: scaledHeight / SCALE,
    actualWidth: scaledWidth / SCALE,
    baseActualWidth: scaledWidth / SCALE,
    baseActualHeight: scaledHeight / SCALE,
    depth: item.depth,
    isEmpty: false,
    product_id: item.id,
    brand: item.brand_name,
    subCategory_name: item.subCategory_name,
    brand_name: item.brand_name,
    name: item.name,
    description: `${item.subCategory_name} - ${item.name}`,
    price: item.price || 0,
    image_url: item.image_url,
    tpnb: item.tpnb,
    gtin: item.global_trade_item_number,
    global_trade_item_number: item.global_trade_item_number,
    dimensionUom: item.dimensionUom,
    facings_wide: item.facing_wide || 1,
    facings_high: item.facing_high || 1,
    total_facings: (item.facing_high || 1) * (item.facing_wide || 1),
    orientation: item.orientation,
    linear: (item.facing_wide || 1) * scaledWidth,
    isNewlyAdded: true,
    xPosition: 0,
  };
};

const handleInventoryToShelf = ({
  item,
  destination,
  newShelfLines,
  SCALE,
  dispatch,
}) => {
  const [shelfIdx, subShelfIdx] = parseShelfDroppableId(
    destination.droppableId
  );
  const destShelf = newShelfLines[shelfIdx]?.[subShelfIdx];
  if (!destShelf) {
    return false;
  }

  const transformedItem = transformInventoryItem({
    item,
    shelfIdx,
    subShelfIdx,
    SCALE,
  });
  placeWithExpansionAtIndex({
    destShelf,
    startIndex: destination.index,
    item: transformedItem,
    shelfIdx,
    subShelfIdx,
    SCALE,
    dispatch,
  });

  if (item.isRemoved) {
    dispatch(restoreRemovedProduct(item.product_id));
  }

  logLocalActivity(dispatch, {
    type: "PRODUCT_ADDED",
    productId: transformedItem.product_id,
    productName: transformedItem.name,
    bay: shelfIdx + 1,
    shelf: subShelfIdx + 1,
    message: `Added ${transformedItem.name} to Bay ${shelfIdx + 1}, Shelf ${
      subShelfIdx + 1
    }`,
  });

  return true;
};

const handleShelfToInventory = ({ source, newShelfLines, dispatch }) => {
  const [shelfIdx, subShelfIdx] = parseShelfDroppableId(source.droppableId);
  const sourceShelf = newShelfLines[shelfIdx]?.[subShelfIdx];
  if (!sourceShelf) {
    return false;
  }

  const removedItem = sourceShelf.splice(source.index, 1)[0];
  if (!removedItem) {
    return false;
  }

  const emptySpaces = createEmptySpaces(
    removedItem.width * (removedItem.facings_wide || 1),
    shelfIdx,
    subShelfIdx
  );
  sourceShelf.splice(source.index, 0, ...emptySpaces);

  const productId = removedItem.product_id;
  const uniqueItemId = removedItem.id;

  dispatch(markProductAsRemoved(productId));
  dispatch(
    markProductAsRemovedWithPosition({
      productId: uniqueItemId,
      originalProductId: productId,
      bay: shelfIdx + 1,
      shelf: subShelfIdx + 1,
      position: removedItem.xPosition,
      linear: removedItem.linear,
      facings_wide: removedItem.facings_wide,
      facings_high: removedItem.facings_high,
      actualWidth: removedItem.actualWidth,
      actualHeight: removedItem.actualHeight,
      depth: removedItem.depth,
      product: {
        id: removedItem.product_id,
        name: removedItem.name,
        tpnb: removedItem.tpnb,
        price: removedItem.price,
        image_url: removedItem.image_url,
      },
    })
  );

  logLocalActivity(dispatch, {
    type: "PRODUCT_REMOVED",
    productId: removedItem.product_id,
    productName: removedItem.name,
    bay: shelfIdx + 1,
    shelf: subShelfIdx + 1,
    message: `Removed ${removedItem.name} from Bay ${shelfIdx + 1}, Shelf ${
      subShelfIdx + 1
    }`,
  });

  return true;
};

const handleShelfToShelf = ({
  source,
  destination,
  newShelfLines,
  dispatch,
  SCALE,
}) => {
  const [srcShelfIdx, srcSubShelfIdx] = parseShelfDroppableId(
    source.droppableId
  );
  const [destShelfIdx, destSubShelfIdx] = parseShelfDroppableId(
    destination.droppableId
  );
  const isSamePosition =
    source.index === destination.index &&
    srcShelfIdx === destShelfIdx &&
    srcSubShelfIdx === destSubShelfIdx;
  if (isSamePosition) {
    return false;
  }

  const sourceShelf = newShelfLines[srcShelfIdx]?.[srcSubShelfIdx];
  const destShelf = newShelfLines[destShelfIdx]?.[destSubShelfIdx];
  if (!sourceShelf || !destShelf) {
    return false;
  }

  const isSameShelf =
    srcShelfIdx === destShelfIdx && srcSubShelfIdx === destSubShelfIdx;

  // Remove the dragged item once from the source shelf
  const [removedItem] = sourceShelf.splice(source.index, 1);
  if (!removedItem) {
    toast.error("Unable to move item: missing source data");
    return false;
  }

  // Always record original position for save payloads
  dispatch(
    markProductAsRepositionedWithPosition({
      productId: removedItem.id,
      originalProductId: removedItem.product_id,
      bay: srcShelfIdx + 1,
      shelf: srcSubShelfIdx + 1,
      position: removedItem.xPosition,
      linear: removedItem.linear,
      facings_wide: removedItem.facings_wide,
      facings_high: removedItem.facings_high,
      actualWidth: removedItem.actualWidth,
      actualHeight: removedItem.actualHeight,
      depth: removedItem.depth,
      product: {
        id: removedItem.product_id,
        name: removedItem.name,
        tpnb: removedItem.tpnb,
        price: removedItem.price,
        image_url: removedItem.image_url,
      },
    })
  );

  if (isSameShelf) {
    // PURE REORDER within the same bay & sub-shelf(DnD's canonical pattern): no empties, no bay width changes
    const targetIndex = destination.index;

    const insertItem = { ...removedItem, isRepositioned: true };
    sourceShelf.splice(targetIndex, 0, insertItem);

    // Normalize xPositions and mark any shifted products as repositioned
    recalculateShelfLayoutAndTrackRepositions({
      destShelf: sourceShelf,
      shelfIdx: srcShelfIdx,
      subShelfIdx: srcSubShelfIdx,
      SCALE,
      dispatch,
    });

    logLocalActivity(dispatch, {
      type: "PRODUCT_MOVED",
      productId: removedItem.product_id,
      productName: removedItem.name,
      from: {
        bay: srcShelfIdx + 1,
        shelf: srcSubShelfIdx + 1,
      },
      to: {
        bay: destShelfIdx + 1,
        shelf: destSubShelfIdx + 1,
      },
      message: `Moved ${removedItem.name} within Bay ${
        srcShelfIdx + 1
      }, Shelf ${srcSubShelfIdx + 1}`,
    });

    return true;
  }

  // CROSS-SHELF CASE: keep empties so layout stays consistent; widths & violations
  // are now recomputed globally.
  const removedTotalWidth = removedItem.width * (removedItem.facings_wide || 1);
  const emptySpaces = createEmptySpaces(
    removedTotalWidth,
    srcShelfIdx,
    srcSubShelfIdx
  );
  sourceShelf.splice(source.index, 0, ...emptySpaces);

  const insertItem = { ...removedItem, isRepositioned: true };
  delete insertItem.expandedByPx;

  placeWithExpansionAtIndex({
    destShelf,
    startIndex: destination.index,
    item: insertItem,
    shelfIdx: destShelfIdx,
    subShelfIdx: destSubShelfIdx,
    SCALE,
    dispatch,
  });

  logLocalActivity(dispatch, {
    type: "PRODUCT_MOVED",
    productId: removedItem.product_id,
    productName: removedItem.name,
    from: {
      bay: srcShelfIdx + 1,
      shelf: srcSubShelfIdx + 1,
    },
    to: {
      bay: destShelfIdx + 1,
      shelf: destSubShelfIdx + 1,
    },
    message: `Moved ${removedItem.name} from Bay ${srcShelfIdx + 1}, Shelf ${
      srcSubShelfIdx + 1
    } to Bay ${destShelfIdx + 1}, Shelf ${destSubShelfIdx + 1}`,
  });

  return true;
};

// Place at a specific index: consume contiguous empties to the right,
// then rely on global overflow recomputation for width/violations.
const placeWithExpansionAtIndex = ({
  destShelf,
  startIndex,
  item,
  shelfIdx,
  subShelfIdx,
  SCALE,
  dispatch,
}) => {
  const requiredWidth = getRequiredWidth(item);
  const { available, consumedCells } = countContiguousEmptySpace(
    destShelf,
    startIndex,
    requiredWidth
  );
  const missing = Math.max(0, requiredWidth - available);
  const insertedIdx = insertItemAtIndex({
    destShelf,
    startIndex,
    consumedCells,
    item,
  });

  if (missing > 0) {
    const rebalanceResult = tryRebalanceWithoutExpansion({
      destShelf,
      startIndex: insertedIdx,
      missing,
      requiredWidth,
      shelfIdx,
      subShelfIdx,
      SCALE,
    });
    if (rebalanceResult.ok) {
      recalculateShelfLayoutAndTrackRepositions({
        destShelf,
        shelfIdx,
        subShelfIdx,
        SCALE,
        dispatch,
      });
      return { ok: true, missing: 0 };
    }
  }

  const leftover = Math.max(0, available - requiredWidth);
  insertLeftoverEmpty({
    destShelf,
    startIndex: insertedIdx,
    leftover,
    shelfIdx,
    subShelfIdx,
  });
  // Normalize xPositions for the entire shelf and track shifted products.
  recalculateShelfLayoutAndTrackRepositions({
    destShelf,
    shelfIdx,
    subShelfIdx,
    SCALE,
    dispatch,
  });

  return { ok: true, missing };
};

export function onDragEnd({
  result,
  shelfLines,
  setShelfLines,
  dispatch,
  SCALE = 3,
}) {
  const { source, destination, draggableId } = result;
  if (!destination) return;

  const item = getDraggedItem({ source, shelfLines, dispatch, draggableId });
  if (!item) return;

  const newShelfLines = cloneShelfLines(shelfLines);
  let handled = false;

  if (isInventoryToShelf(source, destination)) {
    handled = handleInventoryToShelf({
      item,
      destination,
      newShelfLines,
      SCALE,
      dispatch,
    });
  } else if (isShelfToInventory(source, destination)) {
    handled = handleShelfToInventory({ source, newShelfLines, dispatch });
  } else if (isShelfToShelf(source, destination)) {
    handled = handleShelfToShelf({
      source,
      destination,
      newShelfLines,
      dispatch,
      SCALE,
    });
  }

  if (handled) {
    // Save previous state for Undo before applying the change
    pushLayoutHistory(dispatch, shelfLines);

    // Recompute violations and corrected bay widths based on new layout
    const state = dispatch((_, getState) => getState());
    const bays = state.planogramVisualizerData?.bays || [];
    const previousViolations = state.planogramVisualizerData?.violations || [];
    const {
      shelfLines: shelfLinesWithViolations,
      violations,
      bays: baysWithFix,
    } = checkViolationsAndMark(newShelfLines, bays);

    checkAndNotifyNewViolations(previousViolations, violations);

    dispatch(setShelfLines(shelfLinesWithViolations));
    dispatch(setBays(baysWithFix));
    dispatch(setViolations(violations));
  }
}

// Helper function to validate placement parameters
const validatePlacementParams = (product, shelfLines, bayIdx, shelfIdx, startItemIdx) => {
  if (
    !product ||
    !shelfLines ||
    bayIdx < 0 ||
    shelfIdx < 0 ||
    startItemIdx < 0
  ) {
    toast.error("Invalid placement parameters");
    return false;
  }

  if (!shelfLines[bayIdx]?.[shelfIdx]) {
    toast.error("Invalid shelf position");
    return false;
  }

  return true;
};

// Helper function to find and remove original item for reposition
const findAndRemoveOriginalItem = (product, newShelfLines) => {
  for (let b = 0; b < newShelfLines.length; b++) {
    for (let s = 0; s < newShelfLines[b].length; s++) {
      const idx = newShelfLines[b][s].findIndex(
        (it) => it.id === product.originalUniqueItemId
      );
      if (idx !== -1) {
        const originalItem = newShelfLines[b][s].splice(idx, 1)[0];
        const removedTotalWidth =
          (originalItem.width || 0) * (originalItem.facings_wide || 1);
        const empties = createEmptySpaces(removedTotalWidth, b, s);
        newShelfLines[b][s].splice(idx, 0, ...empties);
        return { originalItem, bay: b, shelf: s };
      }
    }
  }
  return null;
};

// Helper function to handle reposition move
const handleRepositionMove = (product, newShelfLines, dispatch) => {
  if (!product.isRepositionMove || !product.originalUniqueItemId) {
    return;
  }

  const result = findAndRemoveOriginalItem(product, newShelfLines);
  if (!result) {
    return;
  }

  const { originalItem, bay: b, shelf: s } = result;
  dispatch(
    markProductAsRepositionedWithPosition({
      productId: originalItem.id,
      originalProductId:
        product.originalProductId || originalItem.product_id,
      bay: product.originalBay || b + 1,
      shelf: product.originalShelf || s + 1,
      position: product.originalPosition ?? originalItem.xPosition,
      linear: product.originalLinear ?? originalItem.linear,
      facings_wide:
        product.originalFacingsWide ?? originalItem.facings_wide,
      facings_high:
        product.originalFacingsHigh ?? originalItem.facings_high,
      actualWidth:
        product.originalActualWidth ?? originalItem.actualWidth,
      actualHeight:
        product.originalActualHeight ?? originalItem.actualHeight,
      depth: product.originalDepth ?? originalItem.depth,
      product: {
        id:
          product.originalProductId ||
          originalItem.product_id ||
          product.id,
        name: originalItem.name,
        tpnb: originalItem.tpnb,
        price: originalItem.price,
        image_url: originalItem.image_url,
      },
    })
  );
};

// Helper function to create transformed item
const createTransformedItem = ({ product, bayIdx, shelfIdx, facingsWide, facingsHigh, scaledWidth, scaledHeight, SCALE }) => {
  return {
    ...product,
    id: `${product.id}_${bayIdx}_${shelfIdx}_${Date.now()}`,
    width: scaledWidth,
    height: scaledHeight,
    baseUnitWidthPx: scaledWidth,
    baseUnitHeightPx: scaledHeight,
    actualHeight: scaledHeight / SCALE,
    actualWidth: scaledWidth / SCALE,
    baseActualWidth: scaledWidth / SCALE,
    baseActualHeight: scaledHeight / SCALE,
    depth: product.depth,
    isEmpty: false,
    product_id: product.id,
    brand: product.brand_name,
    subCategory_name: product.subCategory_name,
    brand_name: product.brand_name,
    name: product.name,
    description: `${product.subCategory_name} - ${product.name}`,
    price: product.price || 0,
    image_url: product.image_url,
    tpnb: product.tpnb,
    gtin: product.global_trade_item_number,
    global_trade_item_number: product.global_trade_item_number,
    dimensionUom: product.dimensionUom,
    facings_wide: facingsWide,
    facings_high: facingsHigh,
    total_facings: facingsWide * facingsHigh,
    orientation: product.orientation,
    linear: facingsWide * scaledWidth,
    isNewlyAdded: !product.isRepositionMove,
    isRepositioned: product.isRepositionMove ? true : undefined,
    xPosition: 0,
  };
};

// Helper function to update layout after placement
const updateLayoutAfterPlacement = (newShelfLines, dispatch, product, bayIdx, shelfIdx, facingsWide, facingsHigh) => {
  const state = dispatch((_, getState) => getState());
  const bays = state.planogramVisualizerData?.bays || [];
  const previousViolations = state.planogramVisualizerData?.violations || [];
  const {
    shelfLines: shelfLinesWithViolations,
    violations,
    bays: baysWithFix,
  } = checkViolationsAndMark(newShelfLines, bays);

  checkAndNotifyNewViolations(previousViolations, violations);

  dispatch(setShelfLines(shelfLinesWithViolations));
  dispatch(setBays(baysWithFix));
  dispatch(setViolations(violations));
  toast.success(
    `Placed ${product.name} with ${facingsWide}x${facingsHigh} facings`
  );

  logLocalActivity(dispatch, {
    type: "PRODUCT_ADDED",
    productId: product.id,
    productName: product.name,
    bay: bayIdx + 1,
    shelf: shelfIdx + 1,
    message: `Placed ${product.name} on Bay ${bayIdx + 1}, Shelf ${
      shelfIdx + 1
    } (${facingsWide}x${facingsHigh} facings)`,
  });
};

// Click-to-place function for pending placement mode
export function placeProductAtPosition({
  bayIdx,
  shelfIdx,
  startItemIdx,
  product,
  facingsWide,
  facingsHigh,
  shelfLines,
  dispatch,
  SCALE = 3,
}) {
  try {
    if (!validatePlacementParams(product, shelfLines, bayIdx, shelfIdx, startItemIdx)) {
      return false;
    }

    const newShelfLines = shelfLines.map((shelf) =>
      shelf.map((subShelf) => [...subShelf])
    );

    handleRepositionMove(product, newShelfLines, dispatch);

    const scaledWidth = (product.width / 10) * SCALE;
    const scaledHeight = (product.height / 10) * SCALE;
    const transformedItem = createTransformedItem({
      product,
      bayIdx,
      shelfIdx,
      facingsWide,
      facingsHigh,
      scaledWidth,
      scaledHeight,
      SCALE,
    });

    const destShelf = newShelfLines[bayIdx][shelfIdx];
    pushLayoutHistory(dispatch, shelfLines);

    placeWithExpansionAtIndex({
      destShelf,
      startIndex: startItemIdx,
      item: transformedItem,
      shelfIdx: bayIdx,
      subShelfIdx: shelfIdx,
      SCALE,
      dispatch,
    });

    if (product.isRemoved) {
      dispatch(restoreRemovedProduct(product.id));
    }

    updateLayoutAfterPlacement(newShelfLines, dispatch, product, bayIdx, shelfIdx, facingsWide, facingsHigh);

    return true;
  } catch (error) {
    console.error("Error placing product:", error);
    toast.error("Failed to place product. Please try again.");
    return false;
  }
}

/**
 * Finds an item in shelfLines and returns its location
 * @param {Array} shelfLines - Current shelf lines
 * @param {string} itemId - The unique item ID to find
 * @returns {Object|null} Object with foundItem, bayIdx, shelfIdx, itemIdx or null
 */
function findItemInShelfLines(shelfLines, itemId) {
  for (let b = 0; b < shelfLines.length; b++) {
    for (let s = 0; s < shelfLines[b].length; s++) {
      const idx = shelfLines[b][s].findIndex((item) => item.id === itemId);
      if (idx !== -1) {
        return {
          foundItem: shelfLines[b][s][idx],
          bayIdx: b,
          shelfIdx: s,
          itemIdx: idx,
        };
      }
    }
  }
  return null;
}

/**
 * Validates removal amounts against current facings
 * @param {number} facingsWideToRemove - Facings to remove from width
 * @param {number} facingsHighToRemove - Facings to remove from height
 * @param {number} currentFacingsWide - Current width facings
 * @param {number} currentFacingsHigh - Current height facings
 * @returns {boolean} True if valid, false otherwise
 */
function validateRemovalAmounts(
  facingsWideToRemove,
  facingsHighToRemove,
  currentFacingsWide,
  currentFacingsHigh
) {
  if (facingsWideToRemove > 0 && facingsWideToRemove >= currentFacingsWide) {
    toast.error("Cannot remove all width facings. Use 'Remove All' instead.");
    return false;
  }

  if (facingsHighToRemove > 0 && facingsHighToRemove >= currentFacingsHigh) {
    toast.error("Cannot remove all height facings. Use 'Remove All' instead.");
    return false;
  }

  return true;
}

/**
 * Calculates remaining facings and removed width after removal
 * @param {Object} foundItem - The item being modified
 * @param {number} facingsWideToRemove - Facings to remove from width
 * @param {number} facingsHighToRemove - Facings to remove from height
 * @returns {Object} Object with remainingFacingsWide, remainingFacingsHigh, removedWidth, unitWidth, unitHeight
 */
function calculateRemainingFacings(foundItem, facingsWideToRemove, facingsHighToRemove) {
  const currentFacingsWide = foundItem.facings_wide || 1;
  const currentFacingsHigh = foundItem.facings_high || 1;
  const unitWidth = foundItem.width;
  const unitHeight = foundItem.height;

  let remainingFacingsWide = currentFacingsWide;
  let remainingFacingsHigh = currentFacingsHigh;
  let removedWidth = 0;

  if (facingsWideToRemove > 0) {
    remainingFacingsWide = currentFacingsWide - facingsWideToRemove;
    removedWidth = unitWidth * facingsWideToRemove;
  }

  if (facingsHighToRemove > 0) {
    remainingFacingsHigh = currentFacingsHigh - facingsHighToRemove;
  }

  return {
    remainingFacingsWide,
    remainingFacingsHigh,
    removedWidth,
    unitWidth,
    unitHeight,
  };
}

/**
 * Tracks removed facings in Redux state
 * @param {Object} params - Parameters for tracking removal
 */
function trackRemovedFacings({
  foundItem,
  facingsWideToRemove,
  facingsHighToRemove,
  bayIdx,
  shelfIdx,
  remainingFacingsWide,
  unitWidth,
  SCALE,
  dispatch,
}) {
  if (facingsWideToRemove <= 0 && facingsHighToRemove <= 0) {
    return;
  }

  const currentFacingsWide = foundItem.facings_wide || 1;
  const linearPerFacing = foundItem.linear / currentFacingsWide;
  const removedLinear = linearPerFacing * (facingsWideToRemove || 0);

  let removedPosition = foundItem.xPosition;
  if (facingsWideToRemove > 0) {
    removedPosition = foundItem.xPosition + (unitWidth * remainingFacingsWide) / SCALE;
  }

  let removedFacingsHigh = 0;
  if (facingsHighToRemove > 0) {
    removedFacingsHigh = facingsHighToRemove;
  } else if (facingsWideToRemove > 0) {
    removedFacingsHigh = foundItem.facings_high || 1;
  }

  dispatch(
    markProductAsRemovedWithPosition({
      productId: foundItem.id,
      originalProductId: foundItem.product_id,
      bay: bayIdx + 1,
      shelf: shelfIdx + 1,
      position: removedPosition,
      linear: removedLinear,
      facings_wide: facingsWideToRemove || 0,
      facings_high: removedFacingsHigh,
      actualWidth: foundItem.actualWidth,
      actualHeight: foundItem.actualHeight,
      depth: foundItem.depth,
      product: {
        id: foundItem.product_id,
        name: foundItem.name,
        tpnb: foundItem.tpnb,
        price: foundItem.price,
        image_url: foundItem.image_url,
      },
    })
  );
}

/**
 * Creates removal messages for logging
 * @param {number} facingsWideToRemove - Facings removed from width
 * @param {number} facingsHighToRemove - Facings removed from height
 * @returns {Array} Array of removal message strings
 */
function createRemovalMessages(facingsWideToRemove, facingsHighToRemove) {
  const messages = [];
  if (facingsWideToRemove > 0) {
    messages.push(`${facingsWideToRemove} width facing${facingsWideToRemove > 1 ? "s" : ""}`);
  }
  if (facingsHighToRemove > 0) {
    messages.push(`${facingsHighToRemove} height facing${facingsHighToRemove > 1 ? "s" : ""}`);
  }
  return messages;
}

/**
 * Updates layout after removal and checks for violations
 * @param {Object} params - Parameters for updating layout
 */
function updateLayoutAfterRemoval({
  newShelfLines,
  bayIdx,
  shelfIdx,
  itemIdx,
  removedWidth,
  SCALE,
  dispatch,
}) {
  // Add empty space after the item to fill the gap left by removed width facings
  if (removedWidth > 0) {
    const emptySpaces = createEmptySpaces(removedWidth, bayIdx, shelfIdx);
    newShelfLines[bayIdx][shelfIdx].splice(itemIdx + 1, 0, ...emptySpaces);
  }

  // Recalculate shelf layout
  recalculateShelfLayoutAndTrackRepositions({
    destShelf: newShelfLines[bayIdx][shelfIdx],
    shelfIdx: bayIdx,
    subShelfIdx: shelfIdx,
    SCALE,
    dispatch,
  });

  // Recompute violations
  const state = dispatch((_, getState) => getState());
  const bays = state.planogramVisualizerData?.bays || [];
  const previousViolations = state.planogramVisualizerData?.violations || [];
  const {
    shelfLines: shelfLinesWithViolations,
    violations,
    bays: baysWithFix,
  } = checkViolationsAndMark(newShelfLines, bays);

  checkAndNotifyNewViolations(previousViolations, violations);

  dispatch(setShelfLines(shelfLinesWithViolations));
  dispatch(setBays(baysWithFix));
  dispatch(setViolations(violations));
}

/**
 * Removes selective facings from a product (width and/or height)
 * @param {Object} params
 * @param {string} params.itemId - The unique item ID in shelfLines
 * @param {number} params.facingsWideToRemove - Number of facings to remove from right (width)
 * @param {number} params.facingsHighToRemove - Number of facings to remove from top (height)
 * @param {Array} params.shelfLines - Current shelf lines
 * @param {Function} params.dispatch - Redux dispatch
 * @param {number} params.SCALE - Scale factor
 */
export function removeSelectiveFacings({
  itemId,
  facingsWideToRemove = 0,
  facingsHighToRemove = 0,
  shelfLines,
  dispatch,
  SCALE = 3,
}) {
  if (!itemId || (facingsWideToRemove <= 0 && facingsHighToRemove <= 0)) {
    return false;
  }

  const newShelfLines = shelfLines.map((shelf) =>
    shelf.map((subShelf) => [...subShelf])
  );

  const itemLocation = findItemInShelfLines(newShelfLines, itemId);
  if (!itemLocation) {
    toast.error("Product not found");
    return false;
  }

  const { foundItem, bayIdx, shelfIdx, itemIdx } = itemLocation;

  if (foundItem.isEmpty) {
    toast.error("Product not found");
    return false;
  }

  const currentFacingsWide = foundItem.facings_wide || 1;
  const currentFacingsHigh = foundItem.facings_high || 1;

  if (!validateRemovalAmounts(
    facingsWideToRemove,
    facingsHighToRemove,
    currentFacingsWide,
    currentFacingsHigh
  )) {
    return false;
  }

  pushLayoutHistory(dispatch, shelfLines);

  const {
    remainingFacingsWide,
    remainingFacingsHigh,
    removedWidth,
    unitWidth,
    unitHeight,
  } = calculateRemainingFacings(foundItem, facingsWideToRemove, facingsHighToRemove);

  trackRemovedFacings({
    foundItem,
    facingsWideToRemove,
    facingsHighToRemove,
    bayIdx,
    shelfIdx,
    remainingFacingsWide,
    unitWidth,
    SCALE,
    dispatch,
  });

  // Update the item with remaining facings
  const updatedItem = {
    ...foundItem,
    facings_wide: remainingFacingsWide,
    facings_high: remainingFacingsHigh,
    width: unitWidth,
    height: unitHeight,
    linear: unitWidth * remainingFacingsWide,
    isRepositioned: true,
  };

  newShelfLines[bayIdx][shelfIdx][itemIdx] = updatedItem;

  updateLayoutAfterRemoval({
    newShelfLines,
    bayIdx,
    shelfIdx,
    itemIdx,
    removedWidth,
    SCALE,
    dispatch,
  });

  const removalMessages = createRemovalMessages(facingsWideToRemove, facingsHighToRemove);
  const messageText = removalMessages.join(" and ");

  logLocalActivity(dispatch, {
    type: "PRODUCT_FACINGS_REMOVED",
    productId: foundItem.product_id,
    productName: foundItem.name,
    bay: bayIdx + 1,
    shelf: shelfIdx + 1,
    facingsWideRemoved: facingsWideToRemove,
    facingsHighRemoved: facingsHighToRemove,
    remainingFacingsWide: remainingFacingsWide,
    remainingFacingsHigh: remainingFacingsHigh,
    message: `Removed ${messageText} from ${foundItem.name}`,
  });

  toast.success(`Removed ${messageText} from ${foundItem.name}`);

  return true;
}

/**
 * Adds selective facings to a placed product (width and/or height).
 * Width facings expand the block footprint; height facings only change vertical stacking.
 *
 * This function preserves the product's anchor index as best as possible by:
 * - replacing the old block with empty space of its old footprint
 * - re-placing the updated block at the same index using the shared placement logic
 */
export function addSelectiveFacings({
  itemId,
  facingsWideToAdd = 0,
  facingsHighToAdd = 0,
  shelfLines,
  dispatch,
  SCALE = 3,
}) {
  // Height-facing add is intentionally not supported (removed).
  // Keep `facingsHighToAdd` in the signature for backwards compatibility.
  if (!itemId || facingsWideToAdd <= 0) {
    return false;
  }

  const newShelfLines = shelfLines.map((shelf) =>
    shelf.map((subShelf) => [...subShelf])
  );

  const itemLocation = findItemInShelfLines(newShelfLines, itemId);
  if (!itemLocation) {
    toast.error("Product not found");
    return false;
  }

  const { foundItem, bayIdx, shelfIdx, itemIdx } = itemLocation;
  if (!foundItem || foundItem.isEmpty) {
    toast.error("Product not found");
    return false;
  }

  const safeWideToAdd = Math.max(0, facingsWideToAdd);

  // Save previous state for Undo
  pushLayoutHistory(dispatch, shelfLines);

  const destShelf = newShelfLines[bayIdx][shelfIdx];

  // Wide additions become a *new block* immediately to the right,
  //    rather than inflating facings_wide on the original block. This ensures
  //    the save payload contains a second position instead of multiple facings
  //    at the same position.
  const baseItem = destShelf[itemIdx];
  if (!baseItem || baseItem.isEmpty) {
    toast.error("Product not found");
    return false;
  }

  const heightForNewBlock = baseItem.facings_high || 1;
  const uniqueId = `${baseItem.product_id}_${bayIdx}_${shelfIdx}_${Date.now()}`;
  const newBlock = {
    ...baseItem,
    id: uniqueId,
    facings_wide: safeWideToAdd,
    facings_high: heightForNewBlock,
    total_facings: safeWideToAdd * heightForNewBlock,
    linear: (baseItem.width || 0) * safeWideToAdd,
    isNewlyAdded: true,
  };
  // Avoid inheriting change flags on the new block.
  delete newBlock.isRepositioned;
  delete newBlock.isOrientationChanged;
  delete newBlock.expandedByPx;

  placeWithExpansionAtIndex({
    destShelf,
    startIndex: itemIdx + 1,
    item: newBlock,
    shelfIdx: bayIdx,
    subShelfIdx: shelfIdx,
    SCALE,
    dispatch,
  });

  // Recompute violations and corrected bay widths
  const state = dispatch((_, getState) => getState());
  const bays = state.planogramVisualizerData?.bays || [];
  const previousViolations = state.planogramVisualizerData?.violations || [];
  const {
    shelfLines: shelfLinesWithViolations,
    violations,
    bays: baysWithFix,
  } = checkViolationsAndMark(newShelfLines, bays);

  checkAndNotifyNewViolations(previousViolations, violations);

  dispatch(setShelfLines(shelfLinesWithViolations));
  dispatch(setBays(baysWithFix));
  dispatch(setViolations(violations));

  const msgParts = [];
  if (safeWideToAdd > 0) msgParts.push(`${safeWideToAdd} width`);
  const msgText = msgParts.length ? msgParts.join(" and ") : "facings";

  logLocalActivity(dispatch, {
    type: "PRODUCT_FACINGS_ADDED",
    productId: foundItem.product_id,
    productName: foundItem.name,
    bay: bayIdx + 1,
    shelf: shelfIdx + 1,
    facingsWideAdded: safeWideToAdd,
    facingsHighAdded: 0,
    message: `Added ${msgText} facings to ${foundItem.name}`,
  });

  toast.success(`Added facings to ${foundItem.name}`);
  return true;
}

/**
 * Rotates the entire facing block for a placed product by swapping
 * facings_wide and facings_high (does NOT rotate the unit/product dimensions).
 *
 * This preserves empty space when the product footprint shrinks and consumes
 * adjacent empty space (to the right) when the footprint grows. If there's
 * not enough empty space, neighbors will shift right and the shelf may overflow.
 */
const consumeEmptyToRightPartially = (destShelf, startIdx, need) => {
  let remaining = need;
  let cursor = startIdx;
  while (cursor < destShelf.length && remaining > 0) {
    const cell = destShelf[cursor];
    if (cell?.isEmpty) {
      const width = cell.width || 0;
      if (width <= remaining) {
        remaining -= width;
        destShelf.splice(cursor, 1);
        continue;
      }
      const newWidth = width - remaining;
      destShelf[cursor] = { ...cell, width: newWidth, linear: newWidth };
      remaining = 0;
      break;
    }
    cursor += 1;
  }
  return remaining;
};

const addOrMergeEmptyAfter = (destShelf, itemIdx, width, shelfIdx, subShelfIdx) => {
  if (width <= 0) return;
  const next = destShelf[itemIdx + 1];
  if (next?.isEmpty) {
    const newWidth = (next.width || 0) + width;
    destShelf[itemIdx + 1] = { ...next, width: newWidth, linear: newWidth };
    return;
  }
  destShelf.splice(itemIdx + 1, 0, createEmptySlot(shelfIdx, subShelfIdx, width));
};

const getBaseUnitDimsPx = (item) => {
  const explicitW = item?.baseUnitWidthPx;
  const explicitH = item?.baseUnitHeightPx;
  if (typeof explicitW === "number" && typeof explicitH === "number") {
    return { baseW: explicitW, baseH: explicitH };
  }

  // Fallback: infer base dims from current dims + rotation state
  const w = item?.width || 0;
  const h = item?.height || 0;
  if (item?.isRotated90) {
    return { baseW: h, baseH: w };
  }
  return { baseW: w, baseH: h };
};

const getBaseActualDims = (item) => {
  const explicitW = item?.baseActualWidth;
  const explicitH = item?.baseActualHeight;
  if (typeof explicitW === "number" && typeof explicitH === "number") {
    return { baseActualW: explicitW, baseActualH: explicitH };
  }

  const aw = item?.actualWidth;
  const ah = item?.actualHeight;
  if (item?.isRotated90) {
    return { baseActualW: ah, baseActualH: aw };
  }
  return { baseActualW: aw, baseActualH: ah };
};

export function changeOrientation({
  itemId,
  shelfLines,
  dispatch,
  SCALE = 3,
}) {
  if (!itemId) return false;
  const newShelfLines = shelfLines.map((shelf) =>
    shelf.map((subShelf) => [...subShelf])
  );

  const itemLocation = findItemInShelfLines(newShelfLines, itemId);
  if (!itemLocation) {
    toast.error("Product not found");
    return false;
  }

  const { foundItem, bayIdx, shelfIdx, itemIdx } = itemLocation;
  if (!foundItem || foundItem.isEmpty) {
    toast.error("Product not found");
    return false;
  }

  // Save previous state for Undo
  pushLayoutHistory(dispatch, shelfLines);

  // Track old state in "removed" so backend can replace old representation with new one
  dispatch(
    markProductAsOrientationChangedWithPosition({
      productId: foundItem.id,
      originalProductId: foundItem.product_id,
      bay: bayIdx + 1,
      shelf: shelfIdx + 1,
      position: foundItem.xPosition,
      linear: foundItem.linear,
      facings_wide: foundItem.facings_wide,
      facings_high: foundItem.facings_high,
      actualWidth: foundItem.actualWidth,
      actualHeight: foundItem.actualHeight,
      depth: foundItem.depth,
      product: {
        id: foundItem.product_id,
        name: foundItem.name,
        tpnb: foundItem.tpnb,
        price: foundItem.price,
        image_url: foundItem.image_url,
      },
    })
  );

  const currentFacingsWide = foundItem.facings_wide || 1;
  const currentFacingsHigh = foundItem.facings_high || 1;
  const newFacingsWide = currentFacingsHigh;
  const newFacingsHigh = currentFacingsWide;

  // Rotate the unit footprint based on stable "base unit" dimensions so repeated toggles
  // never accumulate numerical drift.
  const oldUnitWidth = foundItem.width || 0;
  const { baseW, baseH } = getBaseUnitDimsPx(foundItem);
  const { baseActualW, baseActualH } = getBaseActualDims(foundItem);

  const nextRotated = !foundItem.isRotated90;
  const newUnitWidth = nextRotated ? baseH : baseW;
  const newUnitHeight = nextRotated ? baseW : baseH;

  const oldRequiredWidth = oldUnitWidth * currentFacingsWide;
  const newRequiredWidth = newUnitWidth * newFacingsWide;
  const delta = newRequiredWidth - oldRequiredWidth;

  const updatedItem = {
    ...foundItem,
    facings_wide: newFacingsWide,
    facings_high: newFacingsHigh,
    total_facings: newFacingsWide * newFacingsHigh,
    width: newUnitWidth,
    height: newUnitHeight,
    baseUnitWidthPx: baseW,
    baseUnitHeightPx: baseH,
    baseActualWidth: baseActualW,
    baseActualHeight: baseActualH,
    actualWidth: nextRotated ? baseActualH : baseActualW,
    actualHeight: nextRotated ? baseActualW : baseActualH,
    // Used for local visual rendering (rotate the image instead of "morphing" it)
    isRotated90: nextRotated,
    isOrientationChanged: true,
    // linear will be normalized during recalculation
  };
  newShelfLines[bayIdx][shelfIdx][itemIdx] = updatedItem;

  const destShelf = newShelfLines[bayIdx][shelfIdx];

  if (delta < 0) {
    // Product got narrower: preserve gap by adding empty space immediately after it
    addOrMergeEmptyAfter(
      destShelf,
      itemIdx,
      Math.abs(delta),
      bayIdx,
      shelfIdx
    );
  } else if (delta > 0) {
    // Product got wider: consume empty space to the right first (keeps xPosition stable)
    consumeEmptyToRightPartially(destShelf, itemIdx + 1, delta);
  }

  // Normalize xPositions and mark any shifted products as repositioned
  recalculateShelfLayoutAndTrackRepositions({
    destShelf,
    shelfIdx: bayIdx,
    subShelfIdx: shelfIdx,
    SCALE,
    dispatch,
  });

  // Recompute violations and corrected bay widths
  const state = dispatch((_, getState) => getState());
  const bays = state.planogramVisualizerData?.bays || [];
  const previousViolations = state.planogramVisualizerData?.violations || [];
  const {
    shelfLines: shelfLinesWithViolations,
    violations,
    bays: baysWithFix,
  } = checkViolationsAndMark(newShelfLines, bays);

  checkAndNotifyNewViolations(previousViolations, violations);

  dispatch(setShelfLines(shelfLinesWithViolations));
  dispatch(setBays(baysWithFix));
  dispatch(setViolations(violations));

  logLocalActivity(dispatch, {
    type: "PRODUCT_ORIENTATION_CHANGED",
    productId: foundItem.product_id,
    productName: foundItem.name,
    bay: bayIdx + 1,
    shelf: shelfIdx + 1,
    message: `Changed orientation (facings) for ${foundItem.name} to ${newFacingsWide}x${newFacingsHigh}`,
  });

  toast.success(
    `Changed orientation: ${newFacingsWide}x${newFacingsHigh} facings`
  );
  return true;
}

/**
 * Removes all facings of a product from the shelf
 * @param {Object} params
 * @param {string} params.itemId - The unique item ID in shelfLines
 * @param {Array} params.shelfLines - Current shelf lines
 * @param {Function} params.dispatch - Redux dispatch
 */
export function removeAllFacings({ itemId, shelfLines, dispatch }) {
  if (!itemId) return false;

  const newShelfLines = shelfLines.map((shelf) =>
    shelf.map((subShelf) => [...subShelf])
  );

  let foundItem = null;
  let bayIdx = -1;
  let shelfIdx = -1;
  let itemIdx = -1;

  // Find the item
  for (let b = 0; b < newShelfLines.length; b++) {
    for (let s = 0; s < newShelfLines[b].length; s++) {
      const idx = newShelfLines[b][s].findIndex((item) => item.id === itemId);
      if (idx !== -1) {
        foundItem = newShelfLines[b][s][idx];
        bayIdx = b;
        shelfIdx = s;
        itemIdx = idx;
        break;
      }
    }
    if (foundItem) break;
  }

  if (!foundItem || foundItem.isEmpty) {
    toast.error("Product not found");
    return false;
  }

  // Save previous state for Undo
  pushLayoutHistory(dispatch, shelfLines);

  const removedTotalWidth = foundItem.width * (foundItem.facings_wide || 1);
  const emptySpaces = createEmptySpaces(removedTotalWidth, bayIdx, shelfIdx);

  // Remove the item and replace with empty spaces
  newShelfLines[bayIdx][shelfIdx].splice(itemIdx, 1, ...emptySpaces);

  const productId = foundItem.product_id;
  const uniqueItemId = foundItem.id;

  dispatch(markProductAsRemoved(productId));
  dispatch(
    markProductAsRemovedWithPosition({
      productId: uniqueItemId,
      originalProductId: productId,
      bay: bayIdx + 1,
      shelf: shelfIdx + 1,
      position: foundItem.xPosition,
      linear: foundItem.linear,
      facings_wide: foundItem.facings_wide,
      facings_high: foundItem.facings_high,
      actualWidth: foundItem.actualWidth,
      actualHeight: foundItem.actualHeight,
      depth: foundItem.depth,
      product: {
        id: foundItem.product_id,
        name: foundItem.name,
        tpnb: foundItem.tpnb,
        price: foundItem.price,
        image_url: foundItem.image_url,
      },
    })
  );

  // Recompute violations
  const state = dispatch((_, getState) => getState());
  const bays = state.planogramVisualizerData?.bays || [];
  const previousViolations = state.planogramVisualizerData?.violations || [];
  const {
    shelfLines: shelfLinesWithViolations,
    violations,
    bays: baysWithFix,
  } = checkViolationsAndMark(newShelfLines, bays);

  checkAndNotifyNewViolations(previousViolations, violations);

  dispatch(setShelfLines(shelfLinesWithViolations));
  dispatch(setBays(baysWithFix));
  dispatch(setViolations(violations));

  logLocalActivity(dispatch, {
    type: "PRODUCT_REMOVED",
    productId: foundItem.product_id,
    productName: foundItem.name,
    bay: bayIdx + 1,
    shelf: shelfIdx + 1,
    message: `Removed ${foundItem.name} from Bay ${bayIdx + 1}, Shelf ${shelfIdx + 1}`,
  });

  return true;
}

// Main: generatePayload
export function generatePayload({ shelfLines, SHELVES, SCALE }) {
  const payload = {
    shelves: shelfLines.map((shelfLine, shelfIdx) => ({
      shelfId: `shelf-${shelfIdx + 1}`,
      name: SHELVES[shelfIdx].name || `Shelf ${shelfIdx + 1}`,
      subShelves: shelfLine.map((subShelf, subShelfIdx) => {
        const items = subShelf.reduce((acc, item, index) => {
          if (!item.isEmpty) {
            let xPosition = 0;
            for (let i = 0; i < index; i++) {
              xPosition += subShelf[i].width;
            }
            const originalX = xPosition / SCALE;
            const subShelfOffset =
              subShelfIdx *
              (SHELVES[shelfIdx].subShelves[subShelfIdx].width / SCALE);
            acc.push({
              id: item.id.split("_")[0],
              name: item.name,
              position: {
                x: originalX + subShelfOffset,
                y: 0,
                width: (item.width * 10) / SCALE,
                height: (item.height * 10) / SCALE,
              },
              metadata: {
                brand: item.brand,
                price: item.price,
                description: item.description,
              },
            });
          }
          return acc;
        }, []);
        return {
          subShelfId: `subshelf-${shelfIdx + 1}-${subShelfIdx + 1}`,
          width: SHELVES[shelfIdx].subShelves[subShelfIdx].width / SCALE,
          height: SHELVES[shelfIdx].subShelves[subShelfIdx].height / SCALE,
          items,
        };
      }),
    })),
  };
  console.log("Planogram Payload:", JSON.stringify(payload, null, 2));
  return payload;
}
