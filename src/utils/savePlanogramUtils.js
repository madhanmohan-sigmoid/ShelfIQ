/**
 * Utility functions for generating save payload for planogram changes
 */

/**
 * Groups products by bay and shelf for the save payload structure
 * @param {Array} products - Array of products to group
 * @param {Array} bays - Array of bay objects with dimensions
 * @returns {Array} Array of bay objects with shelf details
 */
function groupProductsByBay(products, bays) {
  const bayMap = {};

  products.forEach((product) => {
    const bayNumber = product.bay;
    if (!bayMap[bayNumber]) {
      bayMap[bayNumber] = {
        number: bayNumber,
        width: bays[bayNumber - 1]?.width * 10 || 1330, // Convert to mm
        height: bays[bayNumber - 1]?.height * 10 || 1800,
        shelf_details_list: [],
      };
    }

    const shelfNumber = product.shelf;
    let shelf = bayMap[bayNumber].shelf_details_list.find(
      (s) => s.number === shelfNumber
    );
    if (!shelf) {
      shelf = {
        number: shelfNumber,
        width:
          bays[bayNumber - 1]?.subShelves[shelfNumber - 1]?.width * 10 || 1330,
        height:
          bays[bayNumber - 1]?.subShelves[shelfNumber - 1]?.height * 10 ||
          296.67,
        depth: 1330,
        product_info_list: [],
      };
      bayMap[bayNumber].shelf_details_list.push(shelf);
    }

    shelf.product_info_list.push({
      product_id: product.product_id,
      product_orientation_id: product.product_orientation_id || 1,
      position: product.position,
      linear_value: product.linear_value,
      facing_wide: product.facing_wide,
      facing_high: product.facing_high,
      facing_depth: product.facing_depth || 0,
      in_tray: product.in_tray || false,
      tray_width: product.tray_width,
      tray_height: product.tray_height,
      tray_depth: product.tray_depth || 0,
    });
  });

  return Object.values(bayMap);
}

/**
 * Returns a function that converts shelf offsets (in px with zoom applied)
 * to millimeters for a given bay/shelf combination.
 */
const createSubShelfOffsetCalculator = ({ bays, SCALE, zoom }) => {
  return (bayIdx, shelfIdx) => {
    if (!Array.isArray(bays) || !bays?.[bayIdx]?.subShelves) return 0;
    const subShelves = bays[bayIdx].subShelves;
    let accumulatedWidth = 0;
    for (let i = 0; i < shelfIdx; i++) {
      accumulatedWidth += subShelves[i]?.width || 0;
    }
    return (accumulatedWidth / (SCALE * zoom)) * 10;
  };
};

/**
 * Generates the save payload for planogram changes
 * @param {Object} params - Parameters object
 * @param {string} params.planogramId - Planogram ID
 * @param {Array} params.shelfLines - Current shelf lines state
 * @param {Array} params.bays - Bay configuration
 * @param {Array} params.planogramProducts - Original planogram products
 * @param {Array} params.removedProductIds - Array of removed product IDs
 * @param {number} params.SCALE - Scale factor (typically 3)
 * @param {Object} params.zoomState - Current zoom state
 * @param {string} params.status - Status ("draft" or "published")
 * @param {string} params.email - User email address
 * @returns {Object} Save payload in the required format
 *
 * Note: Linear value conversion:
 * - For added products: item.linear is in pixels, convert to mm: (item.linear / SCALE) * 10
 * - For removed products: originalProduct.linear is already in mm from API
 *
 * Note: Product categorization:
 * - added_products: Contains both newly added products AND repositioned existing products (with new positions)
 * - removed_products: Contains products removed to inventory AND repositioned products (with original positions)
 */
export function generateSavePayload({
  planogramId,
  shelfLines,
  bays,
  removedProductsWithPosition,
  repositionedProductsWithPosition,
  orientationChangedProductsWithPosition = [],
  SCALE,
  zoomState,
  status = "published",
  email = "",
}) {
  const zoom = Math.max(zoomState?.newValue || 1, 0.0001);

  const subShelfOffsetMm = createSubShelfOffsetCalculator({
    bays,
    SCALE,
    zoom,
  });

  const xPosToMm = (xPosition) => {
    return (xPosition / zoom) * 10;
  };

  const linearToMm = (linearPxWithZoom) => {
    return (linearPxWithZoom / (SCALE * zoom)) * 10;
  };

  const addedProducts = [];
  const removedProducts = [];

  // Process shelfLines to find ONLY changed products (newly added OR repositioned)
  shelfLines.forEach((bay, bayIdx) => {
    bay.forEach((shelf, shelfIdx) => {
      shelf.forEach((item) => {
        if (
          !item.isEmpty &&
          (item.isNewlyAdded || item.isRepositioned || item.isOrientationChanged)
        ) {
          const actionType = item.isNewlyAdded ? "newly added" : "repositioned";
          console.log(
            `${actionType} product ${item.name}: linear=${
              item.linear
            }, SCALE=${SCALE}, zoom=${zoom}, converted=${linearToMm(
              item.linear
            )}`
          );
          const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
          const perShelfMm = xPosToMm(item.xPosition || 0);

          addedProducts.push({
            bay: bayIdx + 1,
            shelf: shelfIdx + 1,
            product_id: item.product_id,
            product_orientation_id:
              item.product_orientation_id || item.orientation_id || 1,
            position: baseMm + perShelfMm,
            linear_value: linearToMm(item.linear),
            facing_wide: item.facings_wide || 1,
            facing_high: item.facings_high || 1,
            facing_depth: 0,
            in_tray: false,
            tray_width: item.actualWidth * 10,
            tray_height: item.actualHeight * 10,
            tray_depth: item.depth || 0,
          });
        }
      });
    });
  });

  // Process removed products with position data (products moved to inventory)
  console.log(
    `Processing ${removedProductsWithPosition.length} removed products with position data:`,
    removedProductsWithPosition
  );
  removedProductsWithPosition.forEach((removedProduct) => {
    console.log(
      `Found removed product: ${removedProduct.product.name} (ID: ${removedProduct.originalProductId})`
    );
    const bayIdx = (removedProduct.bay || 1) - 1;
    const shelfIdx = (removedProduct.shelf || 1) - 1;
    const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
    const perShelfMm = xPosToMm(removedProduct.position || 0);
    removedProducts.push({
      bay: removedProduct.bay,
      shelf: removedProduct.shelf,
      product_id: removedProduct.originalProductId, // Use original product ID for save
      product_orientation_id:
        removedProduct.product_orientation_id ||
        removedProduct.orientation_id ||
        1,
      position: baseMm + perShelfMm,
      linear_value: linearToMm(removedProduct.linear),
      facing_wide: removedProduct.facings_wide,
      facing_high: removedProduct.facings_high,
      facing_depth: 0,
      in_tray: false,
      tray_width: removedProduct.actualWidth * 10,
      tray_height: removedProduct.actualHeight * 10,
      tray_depth: removedProduct.depth || 0,
    });
  });

  // Process repositioned products with original position data (products moved from one position to another)
  console.log(
    `Processing ${repositionedProductsWithPosition.length} repositioned products with original position data:`,
    repositionedProductsWithPosition
  );
  repositionedProductsWithPosition.forEach((repositionedProduct) => {
    console.log(
      `Found repositioned product: ${repositionedProduct.product.name} (ID: ${repositionedProduct.originalProductId})`
    );
    const bayIdx = (repositionedProduct.bay || 1) - 1;
    const shelfIdx = (repositionedProduct.shelf || 1) - 1;
    const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
    const perShelfMm = xPosToMm(repositionedProduct.position || 0);
    removedProducts.push({
      bay: repositionedProduct.bay,
      shelf: repositionedProduct.shelf,
      product_id: repositionedProduct.originalProductId, // Use original product ID for save
      product_orientation_id:
        repositionedProduct.product_orientation_id ||
        repositionedProduct.orientation_id ||
        1,
      position: baseMm + perShelfMm,
      linear_value: linearToMm(repositionedProduct.linear),
      facing_wide: repositionedProduct.facings_wide,
      facing_high: repositionedProduct.facings_high,
      facing_depth: 0,
      in_tray: false,
      tray_width: repositionedProduct.actualWidth * 10,
      tray_height: repositionedProduct.actualHeight * 10,
      tray_depth: repositionedProduct.depth || 0,
    });
  });

  // Process orientation-changed products with original state data (same position, different facings)
  if (Array.isArray(orientationChangedProductsWithPosition)) {
    orientationChangedProductsWithPosition.forEach((changedProduct) => {
      const bayIdx = (changedProduct.bay || 1) - 1;
      const shelfIdx = (changedProduct.shelf || 1) - 1;
      const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
      const perShelfMm = xPosToMm(changedProduct.position || 0);
      removedProducts.push({
        bay: changedProduct.bay,
        shelf: changedProduct.shelf,
        product_id: changedProduct.originalProductId,
        product_orientation_id:
          changedProduct.product_orientation_id ||
          changedProduct.orientation_id ||
          1,
        position: baseMm + perShelfMm,
        linear_value: linearToMm(changedProduct.linear),
        facing_wide: changedProduct.facings_wide,
        facing_high: changedProduct.facings_high,
        facing_depth: 0,
        in_tray: false,
        tray_width: changedProduct.actualWidth * 10,
        tray_height: changedProduct.actualHeight * 10,
        tray_depth: changedProduct.depth || 0,
      });
    });
  }

  // REMOVED: Fallback logic that was causing wrong bay/shelf to be removed
  // The removedProductsWithPosition already contains all the precise removal data needed
  // The removedProductIds array is only used for UI display in ProductInventory

  return {
    planogram_id: planogramId,
    status: status,
    email: email,
    products_added: groupProductsByBay(addedProducts, bays),
    products_removed: groupProductsByBay(removedProducts, bays),
  };
}

/**
 * Builds a normalized snapshot of the full physical layout.
 * The snapshot is zoom-independent and suitable for equality comparison.
 *
 * @param {Object} params
 * @param {Array} params.shelfLines - Current shelf lines state
 * @param {Array} params.bays - Bay configuration
 * @param {number} params.SCALE - Scale factor
 * @param {Object} params.zoomState - Current zoom state
 * @returns {string} Stable JSON string representing the physical layout
 */
export function buildFullLayoutSnapshot({
  shelfLines,
  bays,
  SCALE,
  zoomState,
}) {
  if (!Array.isArray(shelfLines) || !Array.isArray(bays)) {
    return "";
  }

  const zoom = Math.max(zoomState?.newValue || 1, 0.0001);

  const subShelfOffsetMm = createSubShelfOffsetCalculator({
    bays,
    SCALE,
    zoom,
  });

  const xPosToMm = (xPosition) => {
    return (xPosition / zoom) * 10;
  };

  const linearToMm = (linearPxWithZoom) => {
    return (linearPxWithZoom / (SCALE * zoom)) * 10;
  };

  const snapshotEntries = [];

  shelfLines.forEach((bay, bayIdx) => {
    if (!Array.isArray(bay)) return;
    bay.forEach((shelf, shelfIdx) => {
      if (!Array.isArray(shelf)) return;
      shelf.forEach((item) => {
        if (!item || item.isEmpty) return;

        const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
        const perShelfMm = xPosToMm(item.xPosition || 0);

        snapshotEntries.push({
          bay: bayIdx + 1,
          shelf: shelfIdx + 1,
          product_id: item.product_id,
          product_orientation_id:
            item.product_orientation_id || item.orientation_id || 1,
          position: baseMm + perShelfMm,
          linear_value: linearToMm(item.linear || 0),
          facing_wide: item.facings_wide || 1,
          facing_high: item.facings_high || 1,
        });
      });
    });
  });

  snapshotEntries.sort((a, b) => {
    if (a.bay !== b.bay) return a.bay - b.bay;
    if (a.shelf !== b.shelf) return a.shelf - b.shelf;
    if (a.product_id !== b.product_id)
      return (a.product_id || 0) - (b.product_id || 0);
    if (a.position !== b.position) return a.position - b.position;
    if (a.facing_wide !== b.facing_wide) return a.facing_wide - b.facing_wide;
    if (a.facing_high !== b.facing_high) return a.facing_high - b.facing_high;
    return 0;
  });

  try {
    return JSON.stringify(snapshotEntries);
  } catch {
    // Fallback to empty string on unexpected serialization errors
    return "";
  }
}

const buildFallbackProductDetails = (item) => {
  if (!item) return null;
  return {
    id: item.product_id,
    product_id: item.tpnb,
    global_trade_item_number: item.gtin || item.global_trade_item_number,
    name: item.name,
    tpnb: item.tpnb,
    price: item.price,
    image_url: item.image_url,
    width: item.width,
    height: item.height,
    depth: item.depth,
    tray_width: item.tray_width,
    tray_height: item.tray_height,
    tray_depth: item.tray_depth,
    INTENSITY: item.INTENSITY,
    PLATFORM: item.PLATFORM,
    BENCHMARK: item.BENCHMARK,
    PROMOITEM: item.PROMOITEM,
    NPD: item.NPD,
    brand_name: item.brand_name || item.brand,
    subCategory_name: item.subCategory_name,
    dimensionUom: item.dimensionUom,
  };
};

/**
 * Builds a planogramProducts-shaped snapshot from shelfLines.
 * Values are normalized to be zoom-independent (same approach as save payload).
 */
export function buildPlanogramProductsSnapshot({
  shelfLines,
  bays,
  SCALE,
  zoomState,
  productDetailsMap = {},
  productKPIsByTpnb = {},
}) {
  if (!Array.isArray(shelfLines) || !Array.isArray(bays)) {
    return [];
  }

  const zoom = Math.max(zoomState?.newValue || 1, 0.0001);

  const subShelfOffsetMm = createSubShelfOffsetCalculator({
    bays,
    SCALE,
    zoom,
  });

  const xPosToMm = (xPosition) => {
    return (xPosition / zoom) * 10;
  };

  const linearToMm = (linearPxWithZoom) => {
    return (linearPxWithZoom / (SCALE * zoom)) * 10;
  };

  const dimToMm = (dimPx) => {
    return (dimPx / (SCALE * zoom)) * 10;
  };

  const snapshot = [];

  shelfLines.forEach((bay, bayIdx) => {
    if (!Array.isArray(bay)) return;

    bay.forEach((shelf, shelfIdx) => {
      if (!Array.isArray(shelf)) return;

      const subShelf = bays?.[bayIdx]?.subShelves?.[shelfIdx];
      const shelfheight =
        typeof subShelf?.height === "number" ? dimToMm(subShelf.height) : undefined;
      const shelfwidth =
        typeof subShelf?.width === "number" ? dimToMm(subShelf.width) : undefined;

      shelf.forEach((item) => {
        if (!item || item.isEmpty) return;

        const baseMm = subShelfOffsetMm(bayIdx, shelfIdx);
        const perShelfMm = xPosToMm(item.xPosition || 0);
        const productDetails =
          productDetailsMap?.[item.product_id] ||
          item.product_details ||
          buildFallbackProductDetails(item);

        const tpnb = productDetails?.tpnb ?? item.tpnb;
        const productKpis =
          item.product_kpis || (tpnb ? productKPIsByTpnb?.[tpnb] : undefined);

        const baseActualWidth =
          typeof item.actualWidth === "number" ? item.actualWidth / zoom : undefined;
        const baseActualHeight =
          typeof item.actualHeight === "number" ? item.actualHeight / zoom : undefined;

        const traywidth =
          productDetails?.tray_width ??
          productDetails?.trayWidth ??
          (typeof baseActualWidth === "number" ? baseActualWidth * 10 : undefined);
        const trayheight =
          productDetails?.tray_height ??
          productDetails?.trayHeight ??
          (typeof baseActualHeight === "number" ? baseActualHeight * 10 : undefined);
        const traydepth =
          productDetails?.tray_depth ??
          productDetails?.trayDepth ??
          item.depth;

        snapshot.push({
          bay: bayIdx + 1,
          shelf: shelfIdx + 1,
          shelfheight,
          trayheight,
          traywidth,
          traydepth,
          shelfwidth,
          orientation: item.orientation ?? 0,
          position: baseMm + perShelfMm,
          facings_wide: item.facings_wide || 1,
          facings_high: item.facings_high || 1,
          total_facings: (item.facings_wide || 1) * (item.facings_high || 1),
          product_id: item.product_id,
          product_details: productDetails || null,
          linear: linearToMm(item.linear || 0),
          product_kpis: productKpis,
        });
      });
    });
  });

  return snapshot;
}

/**
 * Generates a simplified payload for debugging/logging
 * @param {Object} params - Same as generateSavePayload
 * @returns {Object} Simplified payload with counts
 */
export function generateSaveSummary({ shelfLines, removedProductIds }) {
  let newlyAddedCount = 0;
  let repositionedCount = 0;

  shelfLines.forEach((bay) => {
    bay.forEach((shelf) => {
      shelf.forEach((item) => {
        if (!item.isEmpty && (item.isNewlyAdded || item.isRepositioned)) {
          if (item.isNewlyAdded) {
            newlyAddedCount++;
          } else if (item.isRepositioned) {
            repositionedCount++;
          }
        }
      });
    });
  });

  const totalAddedCount = newlyAddedCount + repositionedCount;

  return {
    newly_added_products_count: newlyAddedCount,
    repositioned_products_count: repositionedCount,
    total_added_products_count: totalAddedCount,
    removed_products_count: removedProductIds.length,
    total_changes: totalAddedCount + removedProductIds.length,
  };
}
