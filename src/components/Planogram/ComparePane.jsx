import React, { useEffect, useMemo, useState } from "react";
import KPIReport from "./KPIReport";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getAllPlanograms, exportPlanogramSchematic } from "../../api/api";
import { buildShelvesFromApi } from "../../utils/planogramShelfBuilder";
import PlanogramCompareGrid from "./PlanogramCompareGrid";
import SchematicView from "../SchematicView";
import ItemWithTooltip from "./ItemWithTooltip";
import ComparePaneHeader from "./ComparePaneHeader";
import {
  setBays,
  setPlanogramId,
  setPlanogramProducts,
  setShelfLines,
  selectPlanogramProducts,
  selectShelfLines,
  selectBays,
  setZoomState,
  setPlanogramDetails,
  selectPlanogramId,
} from "../../redux/reducers/planogramVisualizerSlice";
import { filteredProducts as getFilteredProductsAll } from "../../utils/filterUtils";

const COMPARE_SCALE = 3;

// Helper function to get products for a specific shelf
const getProductsForShelf = (products, shelfIdx, subShelfIdx) => {
  return products
    .filter(
      (p) =>
        Number(p.bay) - 1 === shelfIdx && Number(p.shelf) - 1 === subShelfIdx
    )
    .sort((a, b) => a.position - b.position);
};

// Helper function to create a product line item
const createProductLineItem = ({
  product,
  shelfIdx,
  subShelfIdx,
  cursor,
  unitWidth,
  height,
  SCALE_CONST,
  details,
}) => {
  return {
    ...details,
    id: `${product.product_id}_${shelfIdx}_${subShelfIdx}_${product.position}`,
    width: unitWidth,
    height,
    actualHeight: height / SCALE_CONST,
    actualWidth: unitWidth / SCALE_CONST,
    depth: details.depth,
    isEmpty: false,
    product_id: product.product_id,
    brand: details.brand_name,
    name: details.name,
    description: `${details.subCategory_name} - ${details.name}`,
    price: details.price || 0,
    image_url: details.image_url,
    tpnb: details?.tpnb,
    gtin: details?.global_trade_item_number,
    dimensionUom: details?.dimensionUom,
    facings_wide: product.facings_wide,
    facings_high: product.facings_high,
    total_facings: product.total_facings,
    orientation: product.orientation,
    linear: (product.facings_wide || 1) * unitWidth,
    xPosition: cursor / SCALE_CONST,
  };
};

// Helper function to create an empty line item
const createEmptyLineItem = (
  shelfIdx,
  subShelfIdx,
  cursor,
  width,
  SCALE_CONST,
  suffix = ""
) => {
  return {
    id: `empty-${shelfIdx}-${subShelfIdx}-${cursor}${suffix}`,
    width,
    linear: width,
    height: 0,
    bgColor: "#f0f0f0",
    isEmpty: true,
    xPosition: cursor / SCALE_CONST,
  };
};

// Helper function to process products into line items
const processProductsIntoLine = (
  productsForShelf,
  shelfIdx,
  subShelfIdx,
  shelfWidth
) => {
  const SCALE_CONST = COMPARE_SCALE;
  const line = [];
  let cursor = 0;

  for (const product of productsForShelf) {
    const details = product.product_details || {};
    const rawWidth = details.width ?? 50;
    const rawHeight = details.height ?? 50;
    const unitWidth = (rawWidth / 10) * SCALE_CONST;
    const height = (rawHeight / 10) * SCALE_CONST;
    const scaledPosition = Math.min(
      (product.position * SCALE_CONST) % shelfWidth,
      shelfWidth
    );

    if (scaledPosition > cursor) {
      const gap = scaledPosition - cursor;
      line.push(
        createEmptyLineItem(shelfIdx, subShelfIdx, cursor, gap, SCALE_CONST)
      );
      cursor = scaledPosition;
    }

    line.push(
      createProductLineItem({
        product,
        shelfIdx,
        subShelfIdx,
        cursor,
        unitWidth,
        height,
        SCALE_CONST,
        details,
      })
    );
    cursor += (product.facings_wide || 1) * unitWidth;
  }

  while (cursor < shelfWidth) {
    const blockWidth = Math.min(5, shelfWidth - cursor);
    line.push(
      createEmptyLineItem(
        shelfIdx,
        subShelfIdx,
        cursor,
        blockWidth,
        SCALE_CONST,
        "-end"
      )
    );
    cursor += blockWidth;
  }

  return line;
};

// Helper function to build line for a subShelf
const buildSubShelfLine = (
  subShelf,
  subShelfIdx,
  shelfIdx,
  products
) => {
  const productsForShelf = getProductsForShelf(products, shelfIdx, subShelfIdx);
  const shelfWidth = subShelf.width;
  return processProductsIntoLine(
    productsForShelf,
    shelfIdx,
    subShelfIdx,
    shelfWidth
  );
};

export default function ComparePane({
  paneId,
  planogramId: initialPlanogramId,
  masterProductMap,
  view = "kpi",
  sharedFilters,
  onProductsUpdate,
  onPlanogramIdChange,
  onMetadataUpdate,
  otherPanePlanogramId,
  outlinedProducts,
  coloredProducts,
  comparisonData,
  comparisonLoading = false,
  onPlanogramScrollContainerReady,
  onSchematicGridReady,
  onSchematicBodyScroll,
  onSchematicViewportReady,
}) {
  const dispatch = useDispatch();
  const planogramProducts = useSelector(selectPlanogramProducts);
  const bays = useSelector(selectBays);
  const shelfLines = useSelector(selectShelfLines);
  const selectedPlanogramId = useSelector(selectPlanogramId);

  // Local state for current planogram ID (can change via version selection)
  const [currentPlanogramId, setCurrentPlanogramId] =
    useState(initialPlanogramId);
  const [showProductNameTag] = useState(true);

  // Use shared filters from parent
  const filters = sharedFilters;

  // Derived data for filters
  const filteredProducts = useMemo(
    () => getFilteredProductsAll(planogramProducts, filters),
    [planogramProducts, filters]
  );

  // Compute dimmed product IDs (products NOT in filtered set)
  const filteredProductIds = useMemo(
    () => new Set(filteredProducts.map((p) => p.product_id)),
    [filteredProducts]
  );

  const dimmedProductIds = useMemo(() => {
    if (!shelfLines || shelfLines.length === 0) return [];
    // Flatten shelfLines and dim items not in filteredProductIds
    return shelfLines
      .flat(2)
      .filter(
        (item) =>
          !item.isEmpty &&
          item.id &&
          item.product_id &&
          !filteredProductIds.has(item.product_id)
      )
      .map((item) => item.id);
  }, [shelfLines, filteredProductIds]);

  // Handle version change
  const handleVersionChange = (newPlanogramId) => {
    setCurrentPlanogramId(newPlanogramId);
    if (onPlanogramIdChange) {
      onPlanogramIdChange(paneId, newPlanogramId);
    }
  };

  // Load planogram data
  useEffect(() => {
    const load = async () => {
      const { dynamicShelves, products } = await buildShelvesFromApi(
        COMPARE_SCALE,
        currentPlanogramId,
        masterProductMap || {}
      );
      dispatch(setPlanogramId(currentPlanogramId));
      dispatch(setBays(dynamicShelves));
      dispatch(setPlanogramProducts(products));
      dispatch(setZoomState({ oldValue: 1, newValue: 1 }));

      // Notify parent of this pane's products (for filter counts)
      if (onProductsUpdate) {
        onProductsUpdate(paneId, products);
      }

      // Set planogram details meta for export
      try {
        const res = await getAllPlanograms();
        const apiData = res.data.data;
        const row = apiData.records.find((r) => r.id === currentPlanogramId);
        if (row) {
          const meta = {
            planogramId: row.planogramId,
            id: row.id,
            projectName: `Planogram ${row.id.slice(0, 4)}`,
            dateCreated: row.createdDate,
            dateModified: row.lastModifiedDate,
            category: row.productCategoryInfo?.name || "N/A",
            clusterId: row.clusterInfo?.id,
            clusterName: row.clusterInfo?.name || "N/A",
            version: row.versionId || 0,
            rangeReviewName: row.rangeReviewInfo?.name || "N/A",
            bays: row.numberOfBays,
            shelvesCount: row.numberOfShelves,
          };
          dispatch(setPlanogramDetails(meta));

          // Send version metadata to parent for comparison
          if (onMetadataUpdate) {
            onMetadataUpdate(paneId, { version: meta.version });
          }
        }
      } catch (error) {
        console.error("Failed to load planogram details:", error);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlanogramId, masterProductMap]);

  // Rebuild shelf lines when products/bays load
  useEffect(() => {
    if (!bays.length || !planogramProducts.length) return;

    const newShelfLines = bays.map((shelf, shelfIdx) =>
      shelf.subShelves.map((subShelf, subShelfIdx) =>
        buildSubShelfLine(
          subShelf,
          subShelfIdx,
          shelfIdx,
          planogramProducts
        )
      )
    );
    dispatch(setShelfLines(newShelfLines));
  }, [planogramProducts, bays, dispatch]);

  // Handle download event
  useEffect(() => {
    const doDownload = async () => {
      try {
        const payload = {
          planogram_info: {},
          planogram_schematic_data: filteredProducts,
          filters: {
            selectedCategory: filters.subCategories,
            selectedBrand: filters.brands,
            priceRange: {
              min: filters.priceRange?.[0],
              max: filters.priceRange?.[1],
            },
          },
        };
        await exportPlanogramSchematic(selectedPlanogramId, payload);
      } catch (error) {
        console.error("Export failed:", error);
      }
    };

    globalThis.addEventListener("compare-download", doDownload);
    return () => {
      globalThis.removeEventListener("compare-download", doDownload);
    };
  }, [filteredProducts, filters, selectedPlanogramId]);

  // Extract comparison data for this pane by matching current planogram id
  const paneComparisonData = React.useMemo(() => {
    if (!comparisonData?.byId) return null;
    return comparisonData.byId[currentPlanogramId] || null;
  }, [comparisonData, currentPlanogramId]);

  console.log("ComparePane", paneId, paneComparisonData);

  // For planogram and schematic views, use old content
  let planogramContent;
  if (view === "schematic") {
    planogramContent = (
      <div className="w-full px-4">
        <SchematicView
          overrideFilters={filters}
          isCompare={true}
          coloredProducts={coloredProducts}
          onGridReadyExternal={(api) =>
            onSchematicGridReady?.(paneId, api)
          }
          onBodyScrollExternal={(event) =>
            onSchematicBodyScroll?.(paneId, event)
          }
          onViewportReadyExternal={(viewportEl) =>
            onSchematicViewportReady?.(paneId, viewportEl)
          }
        />
      </div>
    );
  } else if (view === "kpi") {
    planogramContent = (
      <Box sx={{ p: 2.5 }}>
        <KPIReport
          heading="PLANOGRAM REPORT"
          comparisonData={paneComparisonData}
          loading={comparisonLoading}
        />
      </Box>
    );
  } else {
    planogramContent = (
      <Box
        sx={{
          flex: 1,
          bgcolor: "#f8f9fa",
          p: 2,
          overflow: "auto",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          width: "100%",
        }}
      >
        <PlanogramCompareGrid
          ItemWithTooltip={ItemWithTooltip}
          showProductNameTag={showProductNameTag}
          coloredProducts={coloredProducts || []}
          dimmedProductIds={dimmedProductIds}
          onContainerReady={(el) =>
            onPlanogramScrollContainerReady?.(paneId, el)
          }
          outlinedProducts={outlinedProducts}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ComparePaneHeader
        planogramId={currentPlanogramId}
        onVersionChange={handleVersionChange}
        paneId={paneId}
        otherPanePlanogramId={otherPanePlanogramId}
      />
      {planogramContent}
    </Box>
  );
}

import PropTypes from "prop-types";

ComparePane.propTypes = {
  paneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  planogramId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  masterProductMap: PropTypes.object,
  view: PropTypes.oneOf(["kpi", "planogram", "schematic"]),
  sharedFilters: PropTypes.object,
  onProductsUpdate: PropTypes.func,
  onPlanogramIdChange: PropTypes.func,
  onMetadataUpdate: PropTypes.func,
  otherPanePlanogramId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  outlinedProducts: PropTypes.array,
  coloredProducts: PropTypes.array,
  comparisonData: PropTypes.object,
  comparisonLoading: PropTypes.bool,
  onPlanogramScrollContainerReady: PropTypes.func,
  onSchematicGridReady: PropTypes.func,
  onSchematicBodyScroll: PropTypes.func,
  onSchematicViewportReady: PropTypes.func,
};
