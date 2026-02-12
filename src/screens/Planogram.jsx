/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import ItemWithTooltip from "../components/Planogram/ItemWithTooltip";
import RightSideBar from "../components/Planogram/RightSideBar";
import FullscreenView from "../components/Planogram/FullscreenView";
import PlanogramChecksDrawer from "../components/Planogram/PlanogramChecksDrawer";
import { buildShelvesFromApi } from "../utils/planogramShelfBuilder";
import FilterPanel from "../components/Planogram/FilterPanel";
import FilterModalWrapper from "../components/Modals/FilterModalWrapper";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectProductMap } from "../redux/reducers/productDataSlice";
import {
  getFilteredProducts,
  getUniqueOptions,
  getBrandCounts,
  getSubCategoryCounts,
  filteredProducts as getFilteredProductsAll,
} from "../utils/filterUtils";
import {
  generateBrandColors,
  generateSubCategoryColors,
  applyBrandColorsToProducts,
  applySubCategoryColorsToProducts,
  filterProductsByTagMap,
  getTagMapDimmedProductIds,
  filterTagMapSelectionsToAvailable,
} from "../utils/tagMapUtils";
import {
  selectBays,
  selectIsFullScreen,
  selectPlanogramProducts,
  selectPlanogramId,
  selectScale,
  selectShelfLines,
  setBays,
  setIsFullScreen,
  setPlanogramId,
  setPlanogramProducts,
  setShelfLines,
  setCurrentViolations,
  selectIsSchematicView,
  selectTagMapFilters,
  setRuleManager,
  selectPlanogramFilters,
  setPlanogramDetails,
  setPlanogramFilters,
  setTagMapFilters,
  selectCurrentViolations,
} from "../redux/reducers/planogramVisualizerSlice";
import {
  selectSelectedRegion,
  selectSelectedRetailer,
  selectSelectedCategory as selectCategory,
} from "../redux/reducers/regionRetailerSlice";
import {
  selectMasterProductBrands,
  selectMasterProductSubCategories,
} from "../redux/reducers/dataTemplateSlice";
import SchematicView from "../components/SchematicView";
import PlanogramBar from "../components/Planogram/PlanogramBar";
import { getAllPlanograms, checkViolations } from "../api/api";
import {
  buildFullLayoutSnapshot,
  buildPlanogramProductsSnapshot,
} from "../utils/savePlanogramUtils";

const EMPTY_SPACE_WIDTH = 5;
const VIOLATION_PRODUCT_ID_KEYS = [
  "product_id_list",
  "product_id_list_shelf_1",
  "product_id_list_shelf_2",
];

const parseDelimitedIds = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const extractViolationProductIds = (currentViolations) => {
  const violations = currentViolations?.violations || [];
  const ids = new Set();
  violations.forEach((violation) => {
    const extras = violation?.extras || {};
    VIOLATION_PRODUCT_ID_KEYS.forEach((key) => {
      parseDelimitedIds(extras[key]).forEach((id) => ids.add(id));
    });
  });
  return Array.from(ids);
};

const isProductOnSubShelf = (product, shelfIdx, subShelfIdx) =>
  Number(product.bay) - 1 === shelfIdx &&
  Number(product.shelf) - 1 === subShelfIdx;

const getProductsForSubShelf = (planogramProducts, shelfIdx, subShelfIdx) => {
  const products = [];

  for (const product of planogramProducts) {
    if (isProductOnSubShelf(product, shelfIdx, subShelfIdx)) {
      products.push({ ...product });
    }
  }

  products.sort((a, b) => a.position - b.position);
  return products;
};

const addEmptyBlocksUntil = ({
  shelfLine,
  cursor,
  targetPosition,
  shelfIdx,
  subShelfIdx,
  scale,
}) => {
  let updatedCursor = cursor;

  while (updatedCursor < targetPosition) {
    const blockWidth = Math.min(
      EMPTY_SPACE_WIDTH,
      targetPosition - updatedCursor
    );

    shelfLine.push({
      id: `empty-${shelfIdx}-${subShelfIdx}-${updatedCursor}`,
      width: blockWidth,
      linear: blockWidth,
      height: 0,
      bgColor: "#f0f0f0",
      isEmpty: true,
      xPosition: updatedCursor / scale,
    });

    updatedCursor += blockWidth;
  }

  return updatedCursor;
};

const addTrailingEmptyBlocks = ({
  shelfLine,
  cursor,
  shelfWidth,
  shelfIdx,
  subShelfIdx,
  scale,
}) => {
  let updatedCursor = cursor;

  while (updatedCursor < shelfWidth) {
    const blockWidth = Math.min(
      EMPTY_SPACE_WIDTH,
      shelfWidth - updatedCursor
    );

    shelfLine.push({
      id: `empty-${shelfIdx}-${subShelfIdx}-${updatedCursor}-end`,
      width: blockWidth,
      linear: blockWidth,
      height: 0,
      bgColor: "#f0f0f0",
      isEmpty: true,
      xPosition: updatedCursor / scale,
    });

    updatedCursor += blockWidth;
  }
};

const createShelfLineItems = ({
  products,
  shelfIdx,
  subShelfIdx,
  shelfWidth,
  scale,
}) => {
  const shelfLine = [];
  let cursor = 0;

  for (const product of products) {
    const { product_details, position, facings_wide = 1 } = product;

    const rawWidth = product_details?.width ?? 50;
    const rawHeight = product_details?.height ?? 50;

    const unitWidth = (rawWidth / 10) * scale;
    const height = (rawHeight / 10) * scale;

    const scaledPosition = Math.min((position * scale) % shelfWidth, shelfWidth);

    if (scaledPosition > cursor) {
      cursor = addEmptyBlocksUntil({
        shelfLine,
        cursor,
        targetPosition: scaledPosition,
        shelfIdx,
        subShelfIdx,
        scale,
      });
    }

    shelfLine.push({
      ...product_details,
      id: `${product.product_id}_0`,
      width: unitWidth,
      height,
      actualHeight: height / scale,
      actualWidth: unitWidth / scale,
      depth: product_details?.depth,
      isEmpty: false,
      product_id: product.product_id,
      brand: product_details?.brand_name,
      name: product_details?.name,
      description: `${product_details?.subCategory_name} - ${product_details?.name}`,
      price: product_details?.price || 0,
      image_url: product_details?.image_url,
      tpnb: product_details?.tpnb,
      gtin: product_details?.global_trade_item_number,
      dimensionUom: product_details?.dimensionUom,
      facings_wide: product.facings_wide,
      facings_high: product.facings_high,
      total_facings: product.total_facings,
      orientation: product.orientation,
      linear: facings_wide * unitWidth,
      xPosition: cursor / scale,
    });

    cursor += facings_wide * unitWidth;
  }

  addTrailingEmptyBlocks({
    shelfLine,
    cursor,
    shelfWidth,
    shelfIdx,
    subShelfIdx,
    scale,
  });

  return shelfLine;
};

function AppContent() {
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");
  const [rowData, setRowData] = useState();
  const [filterOpen, setFilterOpen] = useState(false);
  const planogramFilters = useSelector(selectPlanogramFilters);
  const filters = planogramFilters;

  // Local state for modal filters
  const [modalFilters, setModalFilters] = useState(filters);
  // Local state for modal filter options, calculated using modalFilters
  const [modalOptions, setModalOptions] = useState({
    subCategories: [],
    brands: [],
    priceTiers: [],
    intensities: [],
    platforms: [],
    npds: [0, 1],
    benchmarks: [0, 1],
    promoItems: [0, 1],
    allSubCategories: [],
    allBrands: [],
  });

  const [clusterMap, setClusterMap] = useState([]);

  const setFilters = (newFilters) => {
    setModalFilters(newFilters);
  };

  const resetFilters = () => {
    const resetFilterState = {
      brands: [],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    };
    dispatch(setPlanogramFilters(resetFilterState));
    setModalFilters(resetFilterState);
  };

  // When opening modal, sync modalFilters with global filters
  const handleOpenFilter = () => {
    setModalFilters(filters);
    setFilterOpen(true);
  };
  // On Apply, update Redux/global filters
  const handleApplyFilters = () => {
    dispatch(setPlanogramFilters(modalFilters));
    setFilterOpen(false);
  };

  const bays = useSelector(selectBays);
  const planogramProducts = useSelector(selectPlanogramProducts);
  const shelfLines = useSelector(selectShelfLines);
  const SCALE = useSelector(selectScale);
  const isFullscreen = useSelector(selectIsFullScreen);
  const planogramId = useSelector(selectPlanogramId);
  const currentViolations = useSelector(selectCurrentViolations);
  const lastChecksSnapshotRef = useRef(null);

  // Context data for ContextSection
  const selectedRegion = useSelector(selectSelectedRegion);
  const selectedRetailer = useSelector(selectSelectedRetailer);
  const category = useSelector(selectCategory);
  const isSchematicView = useSelector(selectIsSchematicView);
  const [showProductNameTag, setShowProductNameTag] = useState(true);
  const [checksOpen, setChecksOpen] = useState(false);
  const [checksLoading, setChecksLoading] = useState(false);
  const [hasChecksBeenRun, setHasChecksBeenRun] = useState(false);
  const [checksError, setChecksError] = useState(null);
  const tagMapFilters = useSelector(selectTagMapFilters);
  const masterProductMap = useSelector(selectProductMap);
  const masterProductBrands = useSelector(selectMasterProductBrands);
  const masterProductSubCategories = useSelector(
    selectMasterProductSubCategories
  );

  // Filtered products logic (move this up before any useEffect that uses it)
  const filteredProducts = React.useMemo(
    () => getFilteredProductsAll(planogramProducts, filters),
    [planogramProducts, filters]
  );

  // Compute dynamic counts for each brand and sub-category option
  const brandCounts = React.useMemo(
    () => getBrandCounts(planogramProducts, filters),
    [planogramProducts, filters]
  );
  const subCategoryCounts = React.useMemo(
    () => getSubCategoryCounts(planogramProducts, filters),
    [planogramProducts, filters]
  );

  // Tag Map logic
  const tagMapFilteredProducts = React.useMemo(() => {
    // Always apply tag map filtering when tag map mode is active (showProductNameTag is false)
    if (!showProductNameTag) {
      return filterProductsByTagMap(planogramProducts, tagMapFilters);
    }
    return planogramProducts;
  }, [planogramProducts, tagMapFilters, showProductNameTag]);

  // Generate colors for Tag Map
  const brandColors = React.useMemo(() => {
    if (!showProductNameTag) {
      const brands = [
        ...new Set(
          planogramProducts
            .map((p) => p.product_details?.brand_name)
            .filter(Boolean)
        ),
      ];
      return generateBrandColors(brands, masterProductBrands);
    }
    return {};
  }, [planogramProducts, showProductNameTag, masterProductBrands]);

  const subCategoryColors = React.useMemo(() => {
    if (!showProductNameTag) {
      const subCategories = [
        ...new Set(
          planogramProducts
            .map((p) => p.product_details?.subCategory_name)
            .filter(Boolean)
        ),
      ];
      return generateSubCategoryColors(
        subCategories,
        masterProductSubCategories
      );
    }
    return {};
  }, [planogramProducts, showProductNameTag, masterProductSubCategories]);

  // Apply colors to products based on selected type
  const coloredProducts = React.useMemo(() => {
    if (!showProductNameTag) {
      if (tagMapFilters?.selectedType === "brand") {
        return applyBrandColorsToProducts(
          tagMapFilteredProducts,
          brandColors,
          masterProductBrands,
          tagMapFilters?.selectedBrands || []
        );
      } else if (tagMapFilters?.selectedType === "subcategory") {
        return applySubCategoryColorsToProducts(
          tagMapFilteredProducts,
          subCategoryColors,
          masterProductSubCategories,
          tagMapFilters?.selectedSubCategories || []
        );
      }
    }
    return planogramProducts;
  }, [
    tagMapFilteredProducts,
    brandColors,
    subCategoryColors,
    tagMapFilters?.selectedType,
    tagMapFilters?.selectedBrands,
    tagMapFilters?.selectedSubCategories,
    showProductNameTag,
    planogramProducts,
    masterProductBrands,
    masterProductSubCategories,
  ]);

  // Compute dimmedProductIds: all product item ids in shelfLines that are not in filteredProducts
  // Exclude newly added items from dimming
  const filteredProductIds = React.useMemo(
    () => new Set(filteredProducts.map((p) => p.product_id)),
    [filteredProducts]
  );
  const dimmedProductIds = React.useMemo(() => {
    if (!shelfLines || shelfLines.length === 0) return [];
    // Flatten shelfLines for faster iteration
    return shelfLines
      .flat(2)
      .filter(
        (item) =>
          !item.isEmpty &&
          item.id &&
          item.product_id &&
          !item.isNewlyAdded &&
          !filteredProductIds.has(item.product_id)
      )
      .map((item) => item.id);
  }, [shelfLines, filteredProductIds]);

  // Remove local tagMapDimmedProductIds. Replace with util:
  const tagMapDimmedProductIds = React.useMemo(
    () => getTagMapDimmedProductIds(shelfLines, tagMapFilters, showProductNameTag),
    [shelfLines, tagMapFilters, showProductNameTag]
  );

  // Combine dim lists, no duplication
  const allDimmedProductIds = React.useMemo(() => {
    const set = new Set([...dimmedProductIds, ...tagMapDimmedProductIds]);
    return Array.from(set);
  }, [dimmedProductIds, tagMapDimmedProductIds]);

  const violationProductIds = React.useMemo(
    () => extractViolationProductIds(currentViolations),
    [currentViolations]
  );

  const runChecks = async ({ openDrawer = false } = {}) => {
    if (checksLoading) return;
    if (openDrawer) setChecksOpen(true);

    if (!planogramId || !bays.length || !shelfLines.length) {
      console.warn("Planogram checks skipped: missing layout data.");
      return;
    }

    let layoutSnapshot = "";
    let snapshot = [];

    try {
      layoutSnapshot = buildFullLayoutSnapshot({
        shelfLines,
        bays,
        SCALE,
      });
      snapshot = buildPlanogramProductsSnapshot({
        shelfLines,
        bays,
        SCALE,
        productDetailsMap: masterProductMap,
        productKPIsByTpnb: {},
      });
    } catch (e) {
      console.error("Failed to build checks snapshot:", e);
      return;
    }

    if (!openDrawer && layoutSnapshot === lastChecksSnapshotRef.current) {
      return;
    }

    setHasChecksBeenRun(true);
    setChecksLoading(true);
    setChecksError(null);
    try {
      const response = await checkViolations({
        planogram_instance_id: planogramId,
        snapshot,
      });
      const data = response?.data?.data ?? { violation_count: 0, violations: [] };
      dispatch(setCurrentViolations(data));
      lastChecksSnapshotRef.current = layoutSnapshot;
    } catch (error) {
      console.error("Failed to validate planogram checks:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load violation checks. Please try again.";
      setChecksError(message);
      dispatch(
        setCurrentViolations({ violation_count: 0, violations: [] })
      );
    } finally {
      setChecksLoading(false);
    }
  };

  // Add useEffect to filter tag map selections to only those present in products
  useEffect(() => {
    if (!planogramProducts || planogramProducts.length === 0) return;
    const { filteredBrands, filteredSubCategories } = filterTagMapSelectionsToAvailable(planogramProducts, tagMapFilters);
    if (
      (filteredBrands.length !== (tagMapFilters?.selectedBrands?.length || 0)) ||
      (filteredSubCategories.length !== (tagMapFilters?.selectedSubCategories?.length || 0))
    ) {
      dispatch(
        setTagMapFilters({
          selectedBrands: filteredBrands,
          selectedSubCategories: filteredSubCategories,
        })
      );
    }
  }, [planogramProducts, tagMapFilters, dispatch]);

  useEffect(() => {
    const fetchPlanograms = async () => {
      try {
        const res = await getAllPlanograms();
        const apiData = res.data.data;
        const filteredRecords = apiData.records.filter(
          (item) => item?.id === id
        );
        if (filteredRecords.length === 0) {
          console.warn(`No planogram found for id: ${id}`);
          setRowData(null);
          return;
        }
        const transformed = filteredRecords.map((item) => ({
          planogramId: item.planogramId,
          id: item.id,
          projectName: `Planogram ${item.id.slice(0, 4)}`,
          dateCreated: item.createdDate,
          dateModified: item.lastModifiedDate,
          category: item.productCategoryInfo?.name || "N/A",
          clusterId: item.clusterInfo?.id,
          clusterName: item.clusterInfo?.name || "N/A",
          version: item.versionId || 0,
          rangeReviewName: item.rangeReviewInfo?.name || "N/A",
          bays: item.numberOfBays,
          shelvesCount: item.numberOfShelves,
        }));
        console.log("Transformed planogram for ID:", id, transformed);
        setRowData(transformed[0]);
        dispatch(setPlanogramDetails(transformed[0]));
        // cluster mapping
        const filteredByCluster = apiData.records.filter(
          (item) => item?.clusterInfo?.id === transformed[0]?.clusterId
        );
        const Clustertransformed = filteredByCluster.map((item) => ({
          planogramId: item.planogramId,
          id: item.id,
          projectName: `Planogram ${item.id.slice(0, 4)}`,
          dateCreated: item.createdDate,
          dateModified: item.lastModifiedDate,
          category: item.productCategoryInfo?.name || "N/A",
          clusterId: item.clusterInfo?.id,
          clusterName: item.clusterInfo?.name || "N/A",
          version: item.versionId || 0,
          rangeReviewName: item.rangeReviewInfo?.name || "N/A",
          bays: item.numberOfBays,
          shelvesCount: item.numberOfShelves,
          shortDesc: item?.short_desc,
        }));
        setClusterMap(Clustertransformed);
      } catch (err) {
        console.error("Error fetching planograms:", err);
      }
    };

    fetchPlanograms();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      const { dynamicShelves, products, ruleManager } =
        await buildShelvesFromApi(SCALE, id, masterProductMap);
      dispatch(setBays(dynamicShelves));
      dispatch(setRuleManager(ruleManager));
      dispatch(setPlanogramProducts(products));
      // setApiProducts(products);
      // Reset filters and set options based on loaded products
      resetFilters();
      const subCategories = Array.from(
        new Set(
          products
            .map((p) => p.product_details?.["subCategory_name"])
            .filter(Boolean)
        )
      );
      const brands = Array.from(
        new Set(
          products.map((p) => p.product_details?.["brand_name"]).filter(Boolean)
        )
      );
      const priceTiers = Array.from(
        new Set(
          products.map((p) => p.product_details?.["price"]).filter(Boolean)
        )
      );
      setModalOptions({
        subCategories,
        brands,
        priceTiers,
        allSubCategories: subCategories,
        allBrands: brands,
      });
    };
    fetchData();
    dispatch(setPlanogramId(id));
  }, [id]);

  // Always build shelfLines from the full product list
  useEffect(() => {
    if (bays.length === 0 || planogramProducts.length === 0) return;

    const newShelfLines = bays.map((shelf, shelfIdx) =>
      shelf.subShelves.map((subShelf, subShelfIdx) => {
        const productsForShelf = getProductsForSubShelf(
          planogramProducts,
          shelfIdx,
          subShelfIdx
        );

        return createShelfLineItems({
          products: productsForShelf,
          shelfIdx,
          subShelfIdx,
          shelfWidth: subShelf.width,
          scale: SCALE,
        });
      })
    );

    dispatch(setShelfLines(newShelfLines));
  }, [planogramProducts, id]);

  // Run checks automatically only after a manual run has happened
  useEffect(() => {
    if (!hasChecksBeenRun) return;
    runChecks();
  }, [
    hasChecksBeenRun,
    planogramId,
    bays,
    shelfLines,
    SCALE,
    masterProductMap,
  ]);

  // Add effect to populate filter options dynamically based on current filters
  useEffect(() => {
    if (!planogramProducts || planogramProducts.length === 0) return;

    // Always full set for all* options:
    const allSubCategories = getUniqueOptions(
      planogramProducts,
      "subCategory_name"
    );
    const allBrands = getUniqueOptions(planogramProducts, "brand_name");
    const allPriceTiers = getUniqueOptions(planogramProducts, "price");
    const allIntensities = getUniqueOptions(planogramProducts, "INTENSITY");
    const allNpds = getUniqueOptions(planogramProducts, "NPD");
    const allBenchmarks = getUniqueOptions(planogramProducts, "BENCHMARK");
    const allPromoItems = getUniqueOptions(planogramProducts, "PROMOITEM");
    const allPlatforms = getUniqueOptions(planogramProducts, "PLATFORM");

    // Enabled (filtered)
    const subCategories = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "subCategories"),
      "subCategory_name"
    );
    const brands = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "brands"),
      "brand_name"
    );
    const priceTiers = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "priceRange"),
      "price"
    );
    const intensities = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "intensity"),
      "INTENSITY"
    );
    const npds = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "npd"),
      "NPD"
    );
    const benchmarks = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "benchmark"),
      "BENCHMARK"
    );
    const promoItems = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "promoItem"),
      "PROMOITEM"
    );
    const platforms = getUniqueOptions(
      getFilteredProducts(planogramProducts, filters, "platform"),
      "PLATFORM"
    );

    setModalOptions({
      subCategories,
      brands,
      priceTiers,
      intensities,
      npds,
      benchmarks,
      promoItems,
      platforms,
      allSubCategories,
      allBrands,
      allPriceTiers,
      allIntensities,
      allNpds,
      allBenchmarks,
      allPromoItems,
      allPlatforms,
    });
  }, [planogramProducts, filters, setModalOptions]);

  // --- Responsive OPTIONS calculation using modalFilters ----
  useEffect(() => {
    if (!planogramProducts || planogramProducts.length === 0) return;
    const allSubCategories = getUniqueOptions(
      planogramProducts,
      "subCategory_name"
    );
    const allBrands = getUniqueOptions(planogramProducts, "brand_name");
    const allPriceTiers = getUniqueOptions(planogramProducts, "price");
    const allIntensities = getUniqueOptions(planogramProducts, "INTENSITY");
    const allNpds = getUniqueOptions(planogramProducts, "NPD");
    const allBenchmarks = getUniqueOptions(planogramProducts, "BENCHMARK");
    const allPromoItems = getUniqueOptions(planogramProducts, "PROMOITEM");
    const allPlatforms = getUniqueOptions(planogramProducts, "PLATFORM");

    const subCategories = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "subCategories"),
      "subCategory_name"
    );
    const brands = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "brands"),
      "brand_name"
    );
    const priceTiers = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "priceRange"),
      "price"
    );
    const intensities = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "intensity"),
      "INTENSITY"
    );
    const npds = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "npd"),
      "NPD"
    );
    const benchmarks = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "benchmark"),
      "BENCHMARK"
    );
    const promoItems = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "promoItem"),
      "PROMOITEM"
    );
    const platforms = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "platform"),
      "PLATFORM"
    );

    setModalOptions({
      subCategories,
      brands,
      priceTiers,
      intensities,
      npds,
      benchmarks,
      promoItems,
      platforms,
      allSubCategories,
      allBrands,
      allPriceTiers,
      allIntensities,
      allNpds,
      allBenchmarks,
      allPromoItems,
      allPlatforms,
    });
  }, [planogramProducts, modalFilters]);

  return (
    <Box
      sx={{
        fontFamily: [
          "Kenvue Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ].join(", "),
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* Filter Modal */}
      <FilterModalWrapper
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={resetFilters}
        onApply={handleApplyFilters}
        themeColor="#FFB000"
      >
        <FilterPanel
          filters={modalFilters}
          setFilters={setFilters}
          options={modalOptions}
          onReset={resetFilters}
          brandCounts={brandCounts}
          subCategoryCounts={subCategoryCounts}
          allProducts={planogramProducts || []}
        />
      </FilterModalWrapper>

      {/* Planogram Bar */}
      <PlanogramBar
        rowData={rowData}
        setRowData={setRowData}
        selectedRegion={selectedRegion}
        selectedRetailer={selectedRetailer}
        category={category}
        clusterMap={clusterMap}
        filteredProducts={filteredProducts}
        planogramProducts={planogramProducts}
        onFilterClick={handleOpenFilter}
      />

      {isSchematicView ? (
        <SchematicView />
      ) : (
        <Box
          sx={{
            display: "flex",
            height: "calc(100vh - 200px)",
            width: "100%",
            gap: 2,
          }}
        >
          <FullscreenView
            shelves={bays}
            shelfLines={shelfLines}
            ItemWithTooltip={ItemWithTooltip}
            setSelectedProduct={() => {}}
            onClose={() => dispatch(setIsFullScreen(false))}
            dimmedProductIds={allDimmedProductIds}
            violationProductIds={violationProductIds}
            onToggleChecks={() => runChecks({ openDrawer: true })}
            Filter={
              <FilterPanel
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                options={modalOptions}
                onReset={resetFilters}
                isFullscreen={isFullscreen}
                brandCounts={brandCounts}
                subCategoryCounts={subCategoryCounts}
                allProducts={planogramProducts || []}
              />
            }
            bays={rowData?.bays}
            showProductNameTag={showProductNameTag}
            setShowProductNameTag={setShowProductNameTag}
            coloredProducts={coloredProducts}
          />

          <RightSideBar />
        </Box>
      )}
      <PlanogramChecksDrawer
        open={checksOpen}
        onClose={() => setChecksOpen(false)}
        checks={currentViolations?.violations || []}
        violationCount={currentViolations?.violation_count || 0}
        isLoading={checksLoading}
        errorMessage={checksError}
      />
    </Box>
  );
}

const Planogram = () => {
  return <AppContent />;
};

export default Planogram;
