import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ComparePlanogramBar from "../components/Planogram/ComparePlanogramBar";
import ComparePane from "../components/Planogram/ComparePane";
import CompareFilterPanel from "../components/Planogram/CompareFilterPanel";
import FilterModalWrapper from "../components/Modals/FilterModalWrapper";
import planogramVisualizerReducer from "../redux/reducers/planogramVisualizerSlice";
import { selectProductMap } from "../redux/reducers/productDataSlice";
import {
  getBrandCounts,
  getSubCategoryCounts,
  getUniqueOptions,
  getFilteredProducts,
} from "../utils/filterUtils";
import { compareTwoPlanograms } from "../api/api";

function useQueryPairs() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const left = params.get("left");
  const right = params.get("right");
  return { left, right };
}

export default function Compare() {
  const { left, right } = useQueryPairs();
  const navigate = useNavigate();
  const masterProductMap = useSelector(selectProductMap);

  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState("kpi");

  // Shared scroll sync toggle
  const [syncScrollEnabled, setSyncScrollEnabled] = useState(false);

  // Refs for planogram scroll containers (left/right panes)
  const leftPlanogramScrollRef = React.useRef(null);
  const rightPlanogramScrollRef = React.useRef(null);

  // Refs for schematic AG Grid APIs (left/right panes) and their scrollable viewports
  const leftSchematicApiRef = React.useRef(null);
  const rightSchematicApiRef = React.useRef(null);
  const leftSchematicViewportRef = React.useRef(null);
  const rightSchematicViewportRef = React.useRef(null);
  const schematicSyncingRef = React.useRef(false);

  // Shared filter state for both panes (actual applied filters)
  const [sharedFilters, setSharedFilters] = useState({
    brands: [],
    subCategories: [],
    priceRange: [],
    npds: [],
    intensities: [],
    benchmarks: [],
    promoItems: [],
    platforms: [],
  });

  // Modal-only filter state (changes immediately, applied on "Apply" click)
  const [modalFilters, setModalFilters] = useState({
    brands: [],
    subCategories: [],
    priceRange: [],
    npds: [],
    intensities: [],
    benchmarks: [],
    promoItems: [],
    platforms: [],
  });

  // Track products from both panes for computing filter counts
  const [leftProducts, setLeftProducts] = useState([]);
  const [rightProducts, setRightProducts] = useState([]);

  // Track selected versions in each pane to prevent selecting same version
  const [leftPlanogramId, setLeftPlanogramId] = useState(left);
  const [rightPlanogramId, setRightPlanogramId] = useState(right);

  // Track version metadata for comparison
  const [leftVersion, setLeftVersion] = useState(null);
  const [rightVersion, setRightVersion] = useState(null);

  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Create isolated Redux stores per-pane; only re-create when respective planogramId changes
  const leftStore = React.useMemo(
    () =>
      configureStore({
        reducer: { planogramVisualizerData: planogramVisualizerReducer },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leftPlanogramId]
  );
  const rightStore = React.useMemo(
    () =>
      configureStore({
        reducer: { planogramVisualizerData: planogramVisualizerReducer },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rightPlanogramId]
  );

  // Combine products from both panes
  const combinedProducts = useMemo(() => {
    return [...leftProducts, ...rightProducts];
  }, [leftProducts, rightProducts]);

  const modalOptions = useMemo(() => {
    if (!combinedProducts.length) {
      return {
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
        allPlatforms: [],
        allNpds: [0, 1],
        allBenchmarks: [0, 1],
        allPromoItems: [0, 1],
      };
    }

    const allSubCategories = getUniqueOptions(
      combinedProducts,
      "subCategory_name"
    );
    const allBrands = getUniqueOptions(combinedProducts, "brand_name");
    const allPriceTiers = getUniqueOptions(combinedProducts, "price");
    const allIntensities = getUniqueOptions(combinedProducts, "INTENSITY");
    const allPlatforms = getUniqueOptions(combinedProducts, "PLATFORM");
    const allNpds = getUniqueOptions(combinedProducts, "NPD");
    const allBenchmarks = getUniqueOptions(combinedProducts, "BENCHMARK");
    const allPromoItems = getUniqueOptions(combinedProducts, "PROMOITEM");

    const subCategories = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "subCategories"),
      "subCategory_name"
    );
    const brands = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "brands"),
      "brand_name"
    );
    const priceTiers = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "priceRange"),
      "price"
    );
    const intensities = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "intensity"),
      "INTENSITY"
    );
    const platforms = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "platform"),
      "PLATFORM"
    );
    const npds = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "npd"),
      "NPD"
    );
    const benchmarks = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "benchmark"),
      "BENCHMARK"
    );
    const promoItems = getUniqueOptions(
      getFilteredProducts(combinedProducts, modalFilters, "promoItem"),
      "PROMOITEM"
    );

    return {
      subCategories,
      brands,
      priceTiers,
      intensities,
      platforms,
      npds: npds.length ? npds : [0, 1],
      benchmarks: benchmarks.length ? benchmarks : [0, 1],
      promoItems: promoItems.length ? promoItems : [0, 1],
      allSubCategories,
      allBrands,
      allPriceTiers,
      allIntensities,
      allPlatforms,
      allNpds: allNpds.length ? allNpds : [0, 1],
      allBenchmarks: allBenchmarks.length ? allBenchmarks : [0, 1],
      allPromoItems: allPromoItems.length ? allPromoItems : [0, 1],
    };
  }, [combinedProducts, modalFilters]);

  // Compute combined counts for filter badges
  const brandCounts = useMemo(
    () => getBrandCounts(combinedProducts, sharedFilters),
    [combinedProducts, sharedFilters]
  );

  const subCategoryCounts = useMemo(
    () => getSubCategoryCounts(combinedProducts, sharedFilters),
    [combinedProducts, sharedFilters]
  );

  // Compute active filters count for badge
  const activeFilters = useMemo(() => {
    const filterKeysToCheck = [
      "brands",
      "subCategories",
      "intensities",
      "platforms",
    ];
    return filterKeysToCheck.flatMap((key) => {
      const value = sharedFilters[key];
      if (Array.isArray(value) && value.length > 0) {
        return value.map((v) => ({ key, label: v }));
      }
      return [];
    });
  }, [sharedFilters]);

  const activeFiltersCount = activeFilters.length;

  // Compare products between versions to identify added/removed items
  const productComparison = useMemo(() => {
    if (
      !leftProducts.length ||
      !rightProducts.length ||
      leftVersion === null ||
      rightVersion === null
    ) {
      return {
        leftOutlines: { green: [], red: [] },
        rightOutlines: { green: [], red: [] },
      };
    }
    const isLeftNewer = leftVersion > rightVersion;
    const leftProductIds = new Set(leftProducts.map((p) => p.product_id));
    const rightProductIds = new Set(rightProducts.map((p) => p.product_id));
    const addedProductIds = isLeftNewer
      ? Array.from(leftProductIds).filter((id) => !rightProductIds.has(id))
      : Array.from(rightProductIds).filter((id) => !leftProductIds.has(id));
    const removedProductIds = isLeftNewer
      ? Array.from(rightProductIds).filter((id) => !leftProductIds.has(id))
      : Array.from(leftProductIds).filter((id) => !rightProductIds.has(id));
    return {
      leftOutlines: {
        green: isLeftNewer ? addedProductIds : [],
        red: isLeftNewer ? [] : removedProductIds,
      },
      rightOutlines: {
        green: isLeftNewer ? [] : addedProductIds,
        red: isLeftNewer ? removedProductIds : [],
      },
    };
  }, [leftProducts, rightProducts, leftVersion, rightVersion]);

  const handleToggleView = useCallback((nextView) => {
    setView(nextView);
  }, []);

  const handleToggleSyncScroll = useCallback(() => {
    setSyncScrollEnabled((prev) => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    globalThis.dispatchEvent(new Event("compare-download"));
  }, []);

  const handleOpenFilters = useCallback(() => {
    // Sync modal filters with current applied filters when opening
    setModalFilters(sharedFilters);
    setFilterOpen(true);
  }, [sharedFilters]);

  const handleApplyFilters = useCallback(() => {
    // Apply modal filters to shared filters
    setSharedFilters(modalFilters);
    setFilterOpen(false);
  }, [modalFilters]);

  const handleResetFilters = useCallback(() => {
    const resetState = {
      brands: [],
      subCategories: [],
      priceRange: [],
      npds: [],
      intensities: [],
      benchmarks: [],
      promoItems: [],
      platforms: [],
    };
    setModalFilters(resetState);
    setSharedFilters(resetState);
  }, []);

  // Callback for panes to update their products (for filter counts)
  const handleProductsUpdate = useCallback((paneId, products) => {
    if (paneId === "left") {
      setLeftProducts(products);
    } else if (paneId === "right") {
      setRightProducts(products);
    }
  }, []);

  // Callback for panes to update their selected planogram ID
  const handlePlanogramIdChange = useCallback((paneId, planogramId) => {
    if (paneId === "left") {
      setLeftPlanogramId(planogramId);
    } else if (paneId === "right") {
      setRightPlanogramId(planogramId);
    }
  }, []);

  // Callback for panes to update their version metadata
  const handleMetadataUpdate = useCallback((paneId, metadata) => {
    if (paneId === "left") {
      setLeftVersion(metadata.version);
    } else if (paneId === "right") {
      setRightVersion(metadata.version);
    }
  }, []);

  // Callbacks for panes to register their planogram scroll containers
  const handlePlanogramScrollContainerReady = useCallback((paneId, el) => {
    if (paneId === "left") {
      leftPlanogramScrollRef.current = el;
    } else if (paneId === "right") {
      rightPlanogramScrollRef.current = el;
    }
  }, []);

  // Callbacks for panes to register their schematic grid APIs
  const handleSchematicGridReady = useCallback((paneId, api) => {
    if (paneId === "left") {
      leftSchematicApiRef.current = api;
    } else if (paneId === "right") {
      rightSchematicApiRef.current = api;
    }
  }, []);

  // Callbacks for panes to register their schematic scrollable viewport elements
  const handleSchematicViewportReady = useCallback((paneId, el) => {
    if (paneId === "left") {
      leftSchematicViewportRef.current = el;
    } else if (paneId === "right") {
      rightSchematicViewportRef.current = el;
    }
  }, []);

  // Sync horizontal scroll between left/right planogram containers
  useEffect(() => {
    if (!syncScrollEnabled || view !== "planogram") return;

    const leftEl = leftPlanogramScrollRef.current;
    const rightEl = rightPlanogramScrollRef.current;
    if (!leftEl || !rightEl) return;

    let isSyncing = false;

    const sync = (source, target) => {
      if (!target) return;
      if (isSyncing) return;
      isSyncing = true;
      target.scrollLeft = source.scrollLeft;
      // avoid tight loop by deferring reset
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const onLeftScroll = () => sync(leftEl, rightEl);
    const onRightScroll = () => sync(rightEl, leftEl);

    leftEl.addEventListener("scroll", onLeftScroll);
    rightEl.addEventListener("scroll", onRightScroll);

    return () => {
      leftEl.removeEventListener("scroll", onLeftScroll);
      rightEl.removeEventListener("scroll", onRightScroll);
    };
  }, [syncScrollEnabled, view]);

  // Handler invoked from each schematic grid's onBodyScroll callback.
  // Uses the cached viewport elements to sync horizontal scrollLeft.
  const handleSchematicBodyScroll = useCallback(
    (paneId, event) => {
      if (!syncScrollEnabled || view !== "schematic") return;
      if (event?.direction !== "horizontal") return;

      const isLeft = paneId === "left";
      const sourceViewport = isLeft
        ? leftSchematicViewportRef.current
        : rightSchematicViewportRef.current;
      const targetViewport = isLeft
        ? rightSchematicViewportRef.current
        : leftSchematicViewportRef.current;

      if (!sourceViewport || !targetViewport) return;

      if (schematicSyncingRef.current) return;
      schematicSyncingRef.current = true;
      targetViewport.scrollLeft = sourceViewport.scrollLeft;
      requestAnimationFrame(() => {
        schematicSyncingRef.current = false;
      });
    },
    [syncScrollEnabled, view]
  );

  // Redirect effect - after all hooks
  useEffect(() => {
    if (!left || !right) {
      navigate("/dashboard");
    }
  }, [left, right, navigate]);

  // Call comparison API whenever left or right planogram IDs change
  useEffect(() => {
    if (leftPlanogramId && rightPlanogramId) {
      // Reset data immediately to show skeleton while loading
      setComparisonData(null);
      setComparisonLoading(true);
      compareTwoPlanograms(leftPlanogramId, rightPlanogramId)
        .then((res) => {
          const arr = res?.data?.data?.comparison || [];
          const byId = Object.fromEntries(arr.map((x) => [x.planogram_id, x]));
          setComparisonData({ byId });
        })
        .catch((err) => {
          setComparisonData(null);
          console.log("ERR", err);
        })
        .finally(() => {
          setComparisonLoading(false);
        });
    } else {
      setComparisonData(null);
      setComparisonLoading(false);
    }
  }, [leftPlanogramId, rightPlanogramId]);

  if (!left || !right) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 70px)",
        width: "100%",
      }}
    >
      <ComparePlanogramBar
        view={view}
        onToggleView={handleToggleView}
        onFilterClick={handleOpenFilters}
        onDownload={handleDownload}
        activeFiltersCount={activeFiltersCount}
        syncScrollEnabled={syncScrollEnabled}
        onToggleSyncScroll={handleToggleSyncScroll}
      />

      {/* Filter Modal unchanged */}
      <FilterModalWrapper
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        themeColor="#FFB000"
      >
        <CompareFilterPanel
          filters={modalFilters}
          setFilters={setModalFilters}
          options={modalOptions}
          brandCounts={brandCounts}
          subCategoryCounts={subCategoryCounts}
        />
      </FilterModalWrapper>

      {/* Always render ComparePane left and right, let pane handle what to show for 'view' prop */}
      <Box sx={{ px: 6, height: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            gap: 0,
            height: "100%",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            border: "2px solid #FFB000",
            borderRadius: 4,
          }}
        >
          <Box
            sx={{
              width: "calc(50vw - 48px)",
              maxWidth: "calc(50vw - 48px)",
              minWidth: 0,
              borderRight: "1px solid #FFB000",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Provider store={leftStore}>
              <ComparePane
                paneId="left"
                planogramId={leftPlanogramId}
                masterProductMap={masterProductMap}
                view={view}
                sharedFilters={sharedFilters}
                onProductsUpdate={handleProductsUpdate}
                onPlanogramIdChange={handlePlanogramIdChange}
                onMetadataUpdate={handleMetadataUpdate}
                otherPanePlanogramId={rightPlanogramId}
                comparisonData={comparisonData}
                comparisonLoading={comparisonLoading}
                onPlanogramScrollContainerReady={handlePlanogramScrollContainerReady}
                onSchematicGridReady={handleSchematicGridReady}
                onSchematicBodyScroll={handleSchematicBodyScroll}
                onSchematicViewportReady={handleSchematicViewportReady}
                coloredProducts={[
                  ...productComparison.leftOutlines.green.map((pid) => ({
                    product_id: pid,
                    brandColor: "#73C6BA",
                  })),
                  ...productComparison.leftOutlines.red.map((pid) => ({
                    product_id: pid,
                    brandColor: "#CA1432",
                  })),
                ]}
              />
            </Provider>
          </Box>
          <Box
            sx={{
              width: "calc(50vw - 48px)",
              maxWidth: "calc(50vw - 48px)",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Provider store={rightStore}>
              <ComparePane
                paneId="right"
                planogramId={rightPlanogramId}
                masterProductMap={masterProductMap}
                view={view}
                sharedFilters={sharedFilters}
                onProductsUpdate={handleProductsUpdate}
                onPlanogramIdChange={handlePlanogramIdChange}
                onMetadataUpdate={handleMetadataUpdate}
                otherPanePlanogramId={leftPlanogramId}
                comparisonData={comparisonData}
                comparisonLoading={comparisonLoading}
                onPlanogramScrollContainerReady={handlePlanogramScrollContainerReady}
                onSchematicGridReady={handleSchematicGridReady}
                onSchematicBodyScroll={handleSchematicBodyScroll}
                onSchematicViewportReady={handleSchematicViewportReady}
                coloredProducts={[
                  ...productComparison.rightOutlines.green.map((pid) => ({
                    product_id: pid,
                    brandColor: "#73C6BA",
                  })),
                  ...productComparison.rightOutlines.red.map((pid) => ({
                    product_id: pid,
                    brandColor: "#CA1432",
                  })),
                ]}
              />
            </Provider>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
