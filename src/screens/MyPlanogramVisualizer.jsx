/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Typography, Button, Box } from "@mui/material";
import PlanogramGrid from "../components/Planogram/PlanogramGrid";
import ItemWithTooltip from "../components/Planogram/ItemWithTooltip";
import RightSideBar from "../components/Planogram/RightSideBar";
import FullscreenView from "../components/Planogram/FullscreenView";
import { buildShelvesFromApi } from "../utils/planogramShelfBuilder";
import FilterPanel from "../components/Planogram/FilterPanel";
import FilterModalWrapper from "../components/Modals/FilterModalWrapper";
import BottomToolbar from "../components/Planogram/BottomToolbar";
import LeftSideBar from "../components/Planogram/LeftSideBar";
import {
  onDragEnd as onDragEndUtil,
  placeProductAtPosition,
} from "../utils/planogramFunctions";
import { useLocation, useParams } from "react-router-dom";
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
import { checkViolationsAndMark } from "../utils/planogramOverflowUtils";
import {
  selectBays,
  selectIsFullScreen,
  selectLeftSidebarCollapsed,
  selectPlanogramProducts,
  selectRightSidebarCollapsed,
  selectScale,
  selectShelfLines,
  selectZoomState,
  setBays,
  setIsFullScreen,
  setPlanogramId,
  setPlanogramProducts,
  setShelfLines,
  setZoomState,
  selectIsSchematicView,
  selectTagMapFilters,
  setRuleManager,
  selectPendingPlacement,
  setCompatiblePositions,
  clearPendingPlacement,
  selectPlanogramFilters,
  setPlanogramDetails,
  setPlanogramFilters,
  resetPlanogramVisualizerData,
  setViolations,
  setCurrentViolations,
  selectInitialLayoutSnapshot,
  setInitialLayoutSnapshot,
  setHasUnsavedChanges,
  selectCanUndo,
  undoLastChange,
  selectActivities,
  selectPlanogramDetails,
  addActivity,
  setTagMapFilters,
  setProductKPIsByTpnb,
  selectProductKPIsByTpnb,
  selectPlanogramId,
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
import { checkViolations, getMyPlanograms } from "../api/api";
import toast from "react-hot-toast";
import PlanogramKPIs from "../components/Planogram/PlanogramKPIs";
import PlanogramActivityDrawer from "../components/Planogram/PlanogramActivityDrawer";
import PlanogramChecksDrawer from "../components/Planogram/PlanogramChecksDrawer";
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

    // Debug: Log product_kpis to verify it exists
    if (product.product_kpis) {
      console.log('createShelfLineItems - Found product_kpis for product:', product.product_id, product.product_kpis);
    } else {
      console.log('createShelfLineItems - NO product_kpis for product:', product.product_id, 'Product keys:', Object.keys(product));
    }

    shelfLine.push({
      ...product_details,
      id: `${product.product_id}_${shelfIdx}_${subShelfIdx}_${position}`,
      width: unitWidth,
      height,
      // Preserve the "native" (unrotated) unit size for clean image rotation rendering.
      // These are per-unit dimensions in px (with zoom applied).
      baseUnitWidthPx: unitWidth,
      baseUnitHeightPx: height,
      baseActualWidth: unitWidth / scale,
      baseActualHeight: height / scale,
      actualHeight: height / scale,
      actualWidth: unitWidth / scale,
      depth: product_details.depth,
      isEmpty: false,
      product_id: product.product_id,
      brand: product_details.brand_name,
      name: product_details.name,
      description: `${product_details.subCategory_name} - ${product_details.name}`,
      price: product_details.price || 0,
      image_url: product_details.image_url,
      tpnb: product_details?.tpnb,
      gtin: product_details?.global_trade_item_number,
      dimensionUom: product_details?.dimensionUom,
      facings_wide: product.facings_wide,
      facings_high: product.facings_high,
      total_facings: product.total_facings,
      orientation: product.orientation,
      linear: facings_wide * unitWidth,
      xPosition: cursor / scale,
      // Copy product_kpis from the product so it's available when item is selected
      product_kpis: product.product_kpis,
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

const getShelfHeight = (bays, bayIdx, shelfIdx) =>
  bays[bayIdx]?.subShelves?.[shelfIdx]?.height ?? Infinity;

const collectPositionsInShelf = ({
  shelf,
  bayIdx,
  shelfIdx,
  bays,
  requiredWidth,
  requiredHeight,
}) => {
  const matches = [];
  let consecutiveEmptyWidth = 0;
  let startItemIdx = null;

  for (let itemIdx = 0; itemIdx < shelf.length; itemIdx++) {
    const item = shelf[itemIdx];
    if (!item) continue;
    if (!item.isEmpty) {
      consecutiveEmptyWidth = 0;
      startItemIdx = null;
      continue;
    }

    if (startItemIdx === null) startItemIdx = itemIdx;
    consecutiveEmptyWidth += item.width;

    if (consecutiveEmptyWidth < requiredWidth) continue;

    const shelfHeight = getShelfHeight(bays, bayIdx, shelfIdx);
    if (requiredHeight <= shelfHeight) {
      matches.push({
        bayIdx,
        shelfIdx,
        startItemIdx,
        endItemIdx: itemIdx,
        availableWidth: consecutiveEmptyWidth,
      });
    }

    consecutiveEmptyWidth = 0;
    startItemIdx = null;
  }

  return matches;
};

const collectPositionsInBay = ({
  bay,
  bayIdx,
  bays,
  requiredWidth,
  requiredHeight,
}) => {
  return bay.reduce((matches, shelf, shelfIdx) => {
    if (!Array.isArray(shelf)) return matches;

    return matches.concat(
      collectPositionsInShelf({
        shelf,
        bayIdx,
        shelfIdx,
        bays,
        requiredWidth,
        requiredHeight,
      })
    );
  }, []);
};

const findCompatiblePositions = ({
  shelfLines,
  bays,
  requiredWidth,
  requiredHeight,
}) => {
  if (!Array.isArray(shelfLines)) return [];

  return shelfLines.reduce((compatible, bay, bayIdx) => {
    if (!Array.isArray(bay)) return compatible;

    return compatible.concat(
      collectPositionsInBay({
        bay,
        bayIdx,
        bays,
        requiredWidth,
        requiredHeight,
      })
    );
  }, []);
};

function AppContent() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const location = useLocation();
  const [rowData, setRowData] = useState();
  const [filterOpen, setFilterOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [checksOpen, setChecksOpen] = useState(false);
  const [checksLoading, setChecksLoading] = useState(false);
  const [hasChecksBeenRun, setHasChecksBeenRun] = useState(false);
  const [checksError, setChecksError] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Reset planogram visualizer state when component mounts
  useEffect(() => {
    dispatch(resetPlanogramVisualizerData());
  }, [dispatch]);

  useEffect(() => {
    if (location?.state?.fromDuplicateModal) {
      dispatch(setIsFullScreen(false));
    }
  }, [dispatch, location]);
  const planogramFilters = useSelector(selectPlanogramFilters);
  const filters = planogramFilters;
  // Local state for modal filters
  const [modalFilters, setModalFilters] = useState(filters);
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
    allPriceTiers: [],
    allIntensities: [],
    allNpds: [],
    allBenchmarks: [],
    allPromoItems: [],
    allPlatforms: [],
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
  const leftCollapsed = useSelector(selectLeftSidebarCollapsed);
  const rightCollapsed = useSelector(selectRightSidebarCollapsed);
  const isFullscreen = useSelector(selectIsFullScreen);
  const zoomState = useSelector(selectZoomState);

  // Context data for ContextSection
  const selectedRegion = useSelector(selectSelectedRegion);
  const selectedRetailer = useSelector(selectSelectedRetailer);
  const category = useSelector(selectCategory);
  const isSchematicView = useSelector(selectIsSchematicView);
  const [showProductNameTag, setShowProductNameTag] = useState(true);
  const tagMapFilters = useSelector(selectTagMapFilters);
  const pendingPlacement = useSelector(selectPendingPlacement);
  const initialLayoutSnapshot = useSelector(selectInitialLayoutSnapshot);
  const canUndo = useSelector(selectCanUndo);
  const activities = useSelector(selectActivities);
  const planogramDetails = useSelector(selectPlanogramDetails);
  const user = useSelector((state) => state.auth.user);
  const planogramId = useSelector(selectPlanogramId);
  const productKPIsByTpnb = useSelector(selectProductKPIsByTpnb);
  const currentViolations = useSelector(selectCurrentViolations);
  const lastChecksSnapshotRef = useRef(null);

  const masterProductMap = useSelector(selectProductMap);
  // const product = useSelector(selectAllProducts)
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
        productKPIsByTpnb,
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
        if (!user?.email) {
          console.warn("User email not available for getMyPlanograms");
          return;
        }
        const res = await getMyPlanograms(user.email);
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
          status: item.status || "draft", // Default to draft if status is not provided
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
          status: item.status || "cloned",
          shortDesc: item?.short_desc,
        }));
        setClusterMap(Clustertransformed);
      } catch (err) {
        console.error("Error fetching planograms:", err);
      }
    };

    fetchPlanograms();
  }, [id, user?.email]);

  // Ensure first activity is PLANOGRAM_CREATED for this planogram (local-only)
  useEffect(() => {
    if (!planogramDetails) return;
    if (activities && activities.length > 0) return;
    const createdDate = planogramDetails.dateCreated;
    const createdTs = createdDate ? Date.parse(createdDate) || Date.now() : Date.now();
    const createdLabel = createdDate
      ? new Date(createdDate).toLocaleDateString()
      : new Date(createdTs).toLocaleDateString();

    dispatch(
      addActivity({
        type: "PLANOGRAM_CREATED",
        planogramId: planogramDetails.planogramId,
        timestamp: createdTs,
        message: `Planogram created on ${createdLabel}`,
      })
    );
  }, [planogramDetails, activities, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      const { dynamicShelves, products, ruleManager, productKPIsByTpnb } =
        await buildShelvesFromApi(SCALE, id, masterProductMap);
      dispatch(setBays(dynamicShelves));
      dispatch(setRuleManager(ruleManager));
      dispatch(setPlanogramProducts(products));
      dispatch(setProductKPIsByTpnb(productKPIsByTpnb));
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
      setModalOptions((prev) => ({
        ...prev,
        subCategories,
        brands,
        priceTiers,
        allSubCategories: subCategories,
        allBrands: brands,
        allPriceTiers: priceTiers,
      }));
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

    const {
      shelfLines: shelfLinesWithViolations,
      violations,
      bays: baysWithFix,
    } = checkViolationsAndMark(newShelfLines, bays);
    dispatch(setShelfLines(shelfLinesWithViolations));
    dispatch(setBays(baysWithFix));
    // Optionally: dispatch(setViolations(violations));
    dispatch(setViolations(violations));
    // Capture baseline layout snapshot after initial shelfLines/bays build
    try {
      const snapshot = buildFullLayoutSnapshot({
        shelfLines: shelfLinesWithViolations,
        bays: baysWithFix,
        SCALE,
      });
      dispatch(setInitialLayoutSnapshot(snapshot));
      dispatch(setHasUnsavedChanges(false));
    } catch (e) {
      console.error("Failed to build initial layout snapshot:", e);
    }
  }, [planogramProducts, id]);

  // Track whether there are unsaved physical layout changes vs the baseline
  useEffect(() => {
    if (!initialLayoutSnapshot) return;
    if (!bays.length || !shelfLines.length) return;

    try {
      const currentSnapshot = buildFullLayoutSnapshot({
        shelfLines,
        bays,
        SCALE,
      });
      if (currentSnapshot === initialLayoutSnapshot) {
        dispatch(setHasUnsavedChanges(false));
      } else {
        dispatch(setHasUnsavedChanges(true));
      }
    } catch (e) {
      console.error("Failed to compute layout snapshot for dirty check:", e);
    }
  }, [bays, shelfLines, SCALE, initialLayoutSnapshot, dispatch]);

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
    productKPIsByTpnb,
  ]);

  // Add effect to populate filter options dynamically based on current filters
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
  }, [planogramProducts, filters]);

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

  // Calculate compatible positions for pending placement
  useEffect(() => {
    if (
      !pendingPlacement.active ||
      !pendingPlacement.product ||
      !shelfLines.length ||
      !bays.length
    ) {
      return;
    }

    try {
      const { product, facingsWide, facingsHigh } = pendingPlacement;

      // Validate product dimensions
      if (!product.width || !product.height) {
        toast.error("Invalid product dimensions");
        dispatch(clearPendingPlacement());
        return;
      }

      // Calculate required space
      const scaledWidth = (product.width / 10) * SCALE;
      const scaledHeight = (product.height / 10) * SCALE;
      const requiredWidth = scaledWidth * facingsWide;
      const requiredHeight = scaledHeight * facingsHigh;

      const compatible = findCompatiblePositions({
        shelfLines,
        bays,
        requiredWidth,
        requiredHeight,
      });

      console.log(
        `Found ${compatible.length} compatible positions for ${facingsWide}x${facingsHigh}`
      );
      dispatch(setCompatiblePositions(compatible));

      if (compatible.length === 0) {
        toast.error(
          `No shelf can fit ${product.name} with ${facingsWide}x${facingsHigh} facings. Try reducing the number of facings.`,
          { duration: 4000 }
        );
        dispatch(clearPendingPlacement());
      } else {
        toast.success(
          `${compatible.length} position${
            compatible.length > 1 ? "s" : ""
          } available. Click a highlighted shelf to place.`,
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error("Error calculating compatible positions:", error);
      toast.error("Failed to calculate positions. Please try again.");
      dispatch(clearPendingPlacement());
    }
  }, [
    pendingPlacement.active,
    pendingPlacement.product,
    pendingPlacement.facingsWide,
    pendingPlacement.facingsHigh,
    shelfLines,
    bays,
    SCALE,
    dispatch,
  ]);

  // Handle shelf click for pending placement
  const handleShelfClick = (bayIdx, shelfIdx, startItemIdx) => {
    if (!pendingPlacement.active || !pendingPlacement.product) return;

    try {
      // Place the product with the configured facings
      const success = placeProductAtPosition({
        bayIdx,
        shelfIdx,
        startItemIdx,
        product: pendingPlacement.product,
        facingsWide: pendingPlacement.facingsWide,
        facingsHigh: pendingPlacement.facingsHigh,
        shelfLines,
        dispatch,
        SCALE,
      });

      if (success) {
        // Clear pending placement mode
        dispatch(clearPendingPlacement());
      }
    } catch (error) {
      console.error("Error in handleShelfClick:", error);
      toast.error("Placement failed. Please try again.");
      dispatch(clearPendingPlacement());
    }
  };

  // ESC key to cancel pending placement
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && pendingPlacement.active) {
        dispatch(clearPendingPlacement());
        toast.error("Placement cancelled");
      }
    };

    const listenerTarget =
      typeof globalThis !== "undefined" && globalThis.addEventListener
        ? globalThis
        : undefined;

    listenerTarget?.addEventListener("keydown", handleEscape);
    return () => listenerTarget?.removeEventListener("keydown", handleEscape);
  }, [pendingPlacement.active, dispatch]);

  // Refactored onDragEnd
  const onDragEnd = (result) => {
    onDragEndUtil({
      result,
      shelfLines,
      setShelfLines,
      dispatch,
      SCALE,
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;
    dispatch(undoLastChange());
    dispatch(
      addActivity({
        type: "UNDO",
        timestamp: Date.now(),
        message: "Undid last change",
      })
    );
  };

  return (
    <Box
      sx={{
        fontFamily:
          'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
        themeColor="#FF782C"
      >
        <FilterPanel
          filters={modalFilters}
          setFilters={setFilters}
          options={modalOptions}
          onReset={resetFilters}
          brandCounts={brandCounts}
          subCategoryCounts={subCategoryCounts}
          allProducts={planogramProducts || []}
          isOrangeTheme={true}
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
        isMyPlanogram={true}
        status={rowData?.status || "cloned"}
        autoSaveEnabled={autoSaveEnabled}
      />

      {isSchematicView ? (
        <SchematicView isOrangeTheme={true} />
      ) : (
        <Box
          sx={{
            display: "flex",
            height: "calc(100vh - 126px)",
            width: "100%",
            gap: 2,
          }}
        >
          {isFullscreen ? (
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
                  isOrangeTheme={true}
                />
              }
              bays={rowData?.bays}
              showProductNameTag={showProductNameTag}
              setShowProductNameTag={setShowProductNameTag}
              coloredProducts={coloredProducts}
              pendingPlacement={pendingPlacement}
              isOrangeTheme={true}
              planogramStatus={rowData?.status}
            />
          ) : (
            <Box sx={{ flex: 1, display: "flex" }}>
              <DragDropContext onDragEnd={onDragEnd}>
                {/* Left Sidebar - Products */}
                <LeftSideBar />

                {/* Center - Planogram Grid */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: "#f8f9fa",
                    p: 2.5,
                    overflowY: "auto",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {/* Pending Placement Banner */}
                  {pendingPlacement.active && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        bgcolor: "#dcfce7",
                        border: "2px solid #22c55e",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#166534",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        Click on a highlighted shelf to place &ldquo;
                        {pendingPlacement.product?.name}&rdquo; (
                        {pendingPlacement.facingsWide}x
                        {pendingPlacement.facingsHigh} facings)
                        <span style={{ fontWeight: 400 }}>
                          {pendingPlacement.compatiblePositions?.length || 0}{" "}
                          positions available
                        </span>
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => dispatch(clearPendingPlacement())}
                        sx={{
                          color: "#166534",
                          "&:hover": { bgcolor: "#bbf7d0" },
                        }}
                      >
                        Cancel (ESC)
                      </Button>
                    </Box>
                  )}

                  <PlanogramGrid
                    shelves={bays}
                    shelfLines={shelfLines}
                    ItemWithTooltip={ItemWithTooltip}
                    setSelectedProduct={() => {}}
                    isViewOnly={isFullscreen}
                    dimmedProductIds={allDimmedProductIds}
                    violationProductIds={violationProductIds}
                    zoomState={zoomState}
                    rightCollapsed={rightCollapsed}
                    leftCollapsed={leftCollapsed}
                    productInventorySelectectProduct={null}
                    showProductNameTag={showProductNameTag}
                    coloredProducts={coloredProducts}
                    pendingPlacement={pendingPlacement}
                    onShelfClickForPlacement={handleShelfClick}
                  />

                  {/* Zoom Controls - Inside the grid container */}
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <BottomToolbar
                      onZoomIn={() =>
                        dispatch(
                          setZoomState({
                            oldValue: zoomState.newValue,
                            newValue: Math.min(zoomState.newValue + 0.1, 3),
                          })
                        )
                      }
                      onZoomOut={() =>
                        dispatch(
                          setZoomState({
                            oldValue: zoomState.newValue,
                            newValue: Math.max(zoomState.newValue - 0.1, 0.3),
                          })
                        )
                      }
                      onReset={() =>
                        dispatch(
                          setZoomState({
                            oldValue: zoomState.newValue,
                            newValue: 1,
                          })
                        )
                      }
                      zoomValue={zoomState.newValue}
                      onFullscreen={() => dispatch(setIsFullScreen(true))}
                      onEdit={() => {
                        /* already in edit; no-op */
                      }}
                      isFullscreen={false}
                      isOrangeTheme={true}
                      showProductNameTag={showProductNameTag}
                      setShowProductNameTag={setShowProductNameTag}
                      planogramStatus={rowData?.status}
                      canUndo={canUndo}
                      onUndo={handleUndo}
                      onToggleActivities={() => setActivitiesOpen(true)}
                      onToggleChecks={() => runChecks({ openDrawer: true })}
                      autoSaveEnabled={autoSaveEnabled}
                      onToggleAutoSave={() =>
                        setAutoSaveEnabled((prev) => !prev)
                      }
                    />
                  </Box>
                  {/* KPI Box */}
                  <PlanogramKPIs
                    leftCollapsed={leftCollapsed}
                    rightCollapsed={rightCollapsed}
                  />
                </Box>
              </DragDropContext>
            </Box>
          )}

          {/* Right Sidebar - Product Details */}
          <RightSideBar />
        </Box>
      )}
      <PlanogramActivityDrawer
        open={activitiesOpen}
        onClose={() => setActivitiesOpen(false)}
        activities={activities}
        planogramId={planogramDetails?.planogramId || rowData?.planogramId}
        versionLabel={planogramDetails?.version || rowData?.version}
      />
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

const MyPlanogramVisualizer = () => {
  return <AppContent />;
};

export default MyPlanogramVisualizer;
