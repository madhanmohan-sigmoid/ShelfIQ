import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  Menu,
  Popper,
  Paper,
  ClickAwayListener,
  Tooltip as MuiTooltip,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  GridOn as GridOnIcon,
  TableRows,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import InfoTooltip from "./InfoToolTip";
import { useDispatch, useSelector } from "react-redux";
import { selectProductMap } from "../../redux/reducers/productDataSlice";
import { selectCategoryAccessType } from "../../redux/reducers/regionRetailerSlice";
import {
  resetVersionChange,
  selectIsFullScreen,
  selectScale,
  setBays,
  setShelfLines,
  setPlanogramDetails,
  setPlanogramId,
  setPlanogramProducts,
  setRuleManager,
  selectPlanogramFilters,
  selectIsSchematicView,
  setIsSchematicView,
  setPlanogramFilters,
  // savePlanogramState,
  selectShelfLines,
  selectRemovedProductIds,
  selectRemovedProductsWithPosition,
  selectRepositionedProductsWithPosition,
  selectOrientationChangedProductsWithPosition,
  // selectPlanogramProducts,
  selectBays,
  selectZoomState,
  selectHasUnsavedChanges,
  setInitialLayoutSnapshot,
  setHasUnsavedChanges,
  clearAllRemovedProducts,
  clearAllRepositionedProducts,
  clearAllOrientationChangedProducts,
  clearHistory,
} from "../../redux/reducers/planogramVisualizerSlice";
import { buildShelvesFromApi } from "../../utils/planogramShelfBuilder";
import RuleManagerModal from "../Modals/RulesManagerModal";
import DuplicateSuccessModal from "../Modals/DuplicateSuccessModal";
import SaveConfirmationModal from "../Modals/SaveConfirmationModal";
import SubmitConfirmationModal from "../Modals/SubmitConfirmationModal";
import { IoFilter } from "react-icons/io5";
import { LiaBroomSolid } from "react-icons/lia";
import { VscEye } from "react-icons/vsc";
import { AiOutlineClose } from "react-icons/ai";
import { MdFilterListOff } from "react-icons/md";

import { Download, Copy, FileText, Save, Plus } from "lucide-react";
import {
  exportPlanogramSchematic,
  duplicatePlanogram,
  saveOrPublishPlanogram,
} from "../../api/api";
import {
  generateSavePayload,
  generateSaveSummary,
  buildFullLayoutSnapshot,
} from "../../utils/savePlanogramUtils";
import toast from "react-hot-toast";

const FILTER_KEYS_TO_CHECK = [
  "brands",
  "subCategories",
  "intensities",
  "platforms",
];

const FILTER_KEY_MAP = {
  brands: "Brand",
  subCategories: "Sub Category",
  intensities: "Intensity",
  platforms: "Platform",
  benchmarks: "Benchmark",
  npds: "NPD",
  promoItems: "Promo Item",
};

const clearShelfLinesChangeFlags = (shelfLines) => {
  if (!Array.isArray(shelfLines)) return [];
  return shelfLines.map((bay) =>
    (bay || []).map((shelf) =>
      (shelf || []).map((item) => {
        if (!item || item.isEmpty) return item;
        const next = { ...item };
        delete next.isNewlyAdded;
        delete next.isRepositioned;
        delete next.isOrientationChanged;
        return next;
      })
    )
  );
};

const createResetFilterState = () => ({
  brands: [],
  subCategories: [],
  priceRange: [],
  npds: [],
  intensities: [],
  benchmarks: [],
  promoItems: [],
  platforms: [],
});

const usePlanogramFilterState = (planogramFilters, dispatch) => {
  const activeFilters = useMemo(
    () =>
      FILTER_KEYS_TO_CHECK.flatMap((key) => {
        const value = planogramFilters[key];
        if (Array.isArray(value) && value.length > 0) {
          return value.map((v) => ({ key, label: v }));
        }
        return [];
      }),
    [planogramFilters]
  );

  const hasActiveFilters = activeFilters.length > 0;

  const handleRemoveFilter = useCallback(
    (filterKey, value) => {
      const updatedFilters = {
        ...planogramFilters,
        [filterKey]: (planogramFilters[filterKey] || []).filter(
          (v) => v !== value
        ),
      };
      dispatch(setPlanogramFilters(updatedFilters));
    },
    [dispatch, planogramFilters]
  );

  const handleResetAllFilters = useCallback(() => {
    dispatch(setPlanogramFilters(createResetFilterState()));
  }, [dispatch]);

  return {
    activeFilters,
    hasActiveFilters,
    handleRemoveFilter,
    handleResetAllFilters,
  };
};

const useClusterVersionSelection = ({
  clusterMap,
  rowData,
  setRowData,
  dispatch,
  SCALE,
  masterProductMap,
}) => {
  const clusterVersions = useMemo(
    () => [...(clusterMap || [])].sort((a, b) => a.version - b.version),
    [clusterMap]
  );

  const [selectedPlanogramId, setSelectedPlanogramId] = useState(
    clusterVersions?.[0]?.id || ""
  );

  const helper = useCallback(
    async (planogramId) => {
      const { dynamicShelves, products, ruleManager } =
        await buildShelvesFromApi(SCALE, planogramId, masterProductMap);
      dispatch(setPlanogramId(planogramId));
      dispatch(setBays(dynamicShelves));
      dispatch(setRuleManager(ruleManager));
      dispatch(setPlanogramProducts(products));
    },
    [SCALE, dispatch, masterProductMap]
  );

  useEffect(() => {
    if (clusterVersions.length > 0) {
      const latest = rowData?.id;
      const latestRow = clusterVersions.find((v) => v.id === latest);
      setRowData(latestRow || {});
      dispatch(setPlanogramDetails(latestRow));
      setSelectedPlanogramId(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterVersions]);

  const handleVersionChange = useCallback(
    (e) => {
      dispatch(resetVersionChange());
      const selectedId = e.target.value;
      const selectedRow = clusterVersions.find((v) => v.id === selectedId);
      setRowData(selectedRow || {});
      setSelectedPlanogramId(selectedId);
      helper(selectedId);
      dispatch(setPlanogramDetails(selectedRow));
    },
    [clusterVersions, dispatch, helper, setRowData]
  );

  return { clusterVersions, selectedPlanogramId, handleVersionChange };
};

const useShowAllFiltersPopover = () => {
  const [showAllOpen, setShowAllOpen] = useState(false);
  const showAllAnchorRef = useRef(null);

  const handleToggleShowAll = useCallback(
    () => setShowAllOpen((prev) => !prev),
    []
  );

  const handleCloseShowAll = useCallback((event) => {
    if (showAllAnchorRef.current?.contains(event.target)) {
      return;
    }
    setShowAllOpen(false);
  }, []);

  return {
    showAllOpen,
    showAllAnchorRef,
    handleToggleShowAll,
    handleCloseShowAll,
  };
};

const useDownloadMenu = () => {
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);

  const handleOpenDownloadMenu = useCallback((event) => {
    setDownloadAnchorEl(event.currentTarget);
  }, []);

  const handleCloseDownloadMenu = useCallback(() => {
    setDownloadAnchorEl(null);
  }, []);

  return { downloadAnchorEl, handleOpenDownloadMenu, handleCloseDownloadMenu };
};

const buildExportPayload = (rowData, filteredProducts, planogramFilters) => {
  let exportPlanogramInfo = {};
  if (rowData) {
    exportPlanogramInfo = { ...rowData };
  }
  exportPlanogramInfo.version = 0;

  return {
    planogram_info: exportPlanogramInfo,
    planogram_schematic_data: filteredProducts,
    filters: {
      selectedCategory: planogramFilters.subCategories,
      selectedBrand: planogramFilters.brands,
      priceRange: {
        min: planogramFilters.priceRange?.[0],
        max: planogramFilters.priceRange?.[1],
      },
    },
  };
};

const usePlanogramExportHandler = ({
  rowData,
  filteredProducts,
  planogramFilters,
  selectedPlanogramId,
}) => {
  return useCallback(async () => {
    const toastId = toast.loading("Exporting Schematic");
    const payload = buildExportPayload(
      rowData,
      filteredProducts,
      planogramFilters
    );

    try {
      const response = await exportPlanogramSchematic(
        selectedPlanogramId,
        payload
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `${rowData?.planogramId ?? selectedPlanogramId}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) {
          fileName = match[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success("File Exported Successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.dismiss(toastId);
      toast.error("Export failed");
    }
  }, [filteredProducts, planogramFilters, rowData, selectedPlanogramId]);
};

const usePlanogramActions = ({
  planogramId,
  planogramReference,
  setDuplicatedPlanogramName,
  setDuplicatedId,
  setIsDuplicateSuccessModalOpen,
  shelfLines,
  bays,
  planogramProducts,
  removedProductIds,
  removedProductsWithPosition,
  repositionedProductsWithPosition,
  orientationChangedProductsWithPosition,
  SCALE,
  zoomState,
  violations,
  dispatch,
  hasUnsavedChanges,
  userEmail,
  categoryAccessType,
}) => {
  const handleDuplicateAndEdit = useCallback(async () => {
    // Check access before duplicating
    if (categoryAccessType !== "CONTRIBUTORS") {
      toast.error("You do not have permission to duplicate planograms for this category. Only contributors can duplicate planograms.");
      return;
    }
    
    const toastId = toast.loading("Duplicating planogram...");
    try {
      const response = await duplicatePlanogram(planogramId, userEmail);
      const newId = response?.data?.data?.record?.id;
      const versionNumber = response?.data?.data?.record?.version_no || 1;
      if (newId) {
        toast.dismiss(toastId);
        const basePlanogramId = planogramReference.replace(
          /_[Vv]\d+(?:\.\d+)*$/,
          ""
        );
        const clonedName = `${basePlanogramId}_V${versionNumber}`;
        setDuplicatedPlanogramName(clonedName);
        setDuplicatedId(newId);
        setIsDuplicateSuccessModalOpen(true);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to duplicate planogram: Invalid response");
      }
    } catch (error) {
      console.error("Failed to duplicate planogram:", error);
      toast.dismiss(toastId);
      toast.error("Failed to duplicate planogram");
    }
  }, [
    planogramId,
    planogramReference,
    setDuplicatedId,
    setDuplicatedPlanogramName,
    setIsDuplicateSuccessModalOpen,
    userEmail,
    categoryAccessType,
  ]);

  const buildSavePayload = useCallback(
    (status) =>
      generateSavePayload({
        planogramId,
        shelfLines,
        bays,
        planogramProducts,
        removedProductIds,
        removedProductsWithPosition,
        repositionedProductsWithPosition,
        orientationChangedProductsWithPosition,
        SCALE,
        zoomState: { newValue: 1 },
        status,
        email: userEmail,
      }),
    [
      SCALE,
      bays,
      planogramProducts,
      removedProductIds,
      removedProductsWithPosition,
      repositionedProductsWithPosition,
      orientationChangedProductsWithPosition,
      planogramId,
      shelfLines,
      userEmail,
    ]
  );

  const buildSaveSummary = useCallback(
    () =>
      generateSaveSummary({
        shelfLines,
        removedProductIds,
        planogramProducts,
      }),
    [planogramProducts, removedProductIds, shelfLines]
  );

  const handleSavePlanogram = useCallback(async () => {
    if (!hasUnsavedChanges) {
      toast.error("No changes to save");
      return;
    }
    const toastId = toast.loading("Saving planogram...");
    try {
      const savePayload = buildSavePayload("draft");
      const summary = buildSaveSummary();
      await saveOrPublishPlanogram(savePayload);
      console.log("Saved planogram payload:", savePayload);
      console.log("Save summary:", summary);
      // After successful save, update baseline snapshot and clear change tracking
      const newSnapshot = buildFullLayoutSnapshot({
        shelfLines,
        bays,
        SCALE,
        zoomState: { newValue: 1 },
      });
      dispatch(setInitialLayoutSnapshot(newSnapshot));
      dispatch(setHasUnsavedChanges(false));
      dispatch(clearAllRemovedProducts());
      dispatch(clearAllRepositionedProducts());
      dispatch(clearAllOrientationChangedProducts());
      dispatch(clearHistory());
      dispatch(setShelfLines(clearShelfLinesChangeFlags(shelfLines)));
      toast.dismiss(toastId);
      toast.success("Planogram saved!");
    } catch (error) {
      console.error("Error saving planogram:", error);
      toast.dismiss(toastId);
      toast.error("Failed to save planogram");
    }
  }, [buildSavePayload, buildSaveSummary, hasUnsavedChanges, userEmail]);

  const handleSubmitPlanogram = useCallback(async () => {
    if (!hasUnsavedChanges) {
      toast.error("No changes to submit");
      return;
    }
    const toastId = toast.loading("Publishing planogram...");
    try {
      if (violations && violations.length > 0) {
        toast.dismiss(toastId);
        toast.error("Cannot publish: resolve shelf width violations first.");
        return;
      }

      const savePayload = buildSavePayload("published");
      const summary = buildSaveSummary();
      await saveOrPublishPlanogram(savePayload);
      console.log("Published planogram payload:", savePayload);
      console.log("Publish summary:", summary);
      // After successful publish, update baseline snapshot and clear change tracking
      const newSnapshot = buildFullLayoutSnapshot({
        shelfLines,
        bays,
        SCALE,
        zoomState: { newValue: 1 },
      });
      dispatch(setInitialLayoutSnapshot(newSnapshot));
      dispatch(setHasUnsavedChanges(false));
      dispatch(clearAllRemovedProducts());
      dispatch(clearAllRepositionedProducts());
      dispatch(clearAllOrientationChangedProducts());
      dispatch(clearHistory());
      dispatch(setShelfLines(clearShelfLinesChangeFlags(shelfLines)));
      toast.dismiss(toastId);
      toast.success("Planogram published!");
    } catch (error) {
      console.error("Error publishing planogram:", error);
      toast.dismiss(toastId);
      toast.error("Failed to publish planogram");
    }
  }, [
    buildSavePayload,
    buildSaveSummary,
    violations,
    hasUnsavedChanges,
    bays,
    shelfLines,
    SCALE,
    zoomState,
    dispatch,
  ]);

  return { handleDuplicateAndEdit, handleSavePlanogram, handleSubmitPlanogram };
};

const PlanogramViewToggle = ({
  currentMode,
  isSchematicView,
  isMyPlanogram,
  onSelectPlanogramView,
  onSelectSchematicView,
}) => {
  // Show in view mode, or always for My Planogram (including edit mode)
  if (!currentMode && !isMyPlanogram) return null;

  const planogramClass = isMyPlanogram ? "bg-[#FFDDCA]" : "bg-[#FFEBBF]";
  const planogramColorValue = isMyPlanogram ? "#FF782C" : "#FFB000";
  const isPlanogramSelected = isSchematicView === false;

  return (
    <>
      <div className="flex items-center rounded-full border border-black overflow-hidden w-max">
        <MuiTooltip title="Planogram View" placement="bottom">
          <button
            onClick={onSelectPlanogramView}
            className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
              isPlanogramSelected ? `${planogramClass} rounded-l-full` : ""
            }`}
          >
            <GridOnIcon
              fontSize="small"
              sx={{
                color: isPlanogramSelected ? planogramColorValue : undefined,
              }}
            />
          </button>
        </MuiTooltip>

        <MuiTooltip title="Schematic View" placement="bottom">
          <button
            onClick={onSelectSchematicView}
            className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
              isSchematicView ? `${planogramClass} rounded-r-full` : ""
            }`}
          >
            <TableRows
              fontSize="small"
              sx={{ color: isSchematicView ? planogramColorValue : undefined }}
            />
          </button>
        </MuiTooltip>
      </div>
      <div className="w-[1px] h-5 bg-gray-400"></div>
    </>
  );
};

PlanogramViewToggle.propTypes = {
  currentMode: PropTypes.bool.isRequired,
  isSchematicView: PropTypes.bool.isRequired,
  isMyPlanogram: PropTypes.bool,
  onSelectPlanogramView: PropTypes.func.isRequired,
  onSelectSchematicView: PropTypes.func.isRequired,
};

PlanogramViewToggle.defaultProps = {
  isMyPlanogram: false,
};

const AppliedFiltersPopper = ({
  open,
  anchorRef,
  onClose,
  isMyPlanogram,
  hasActiveFilters,
  planogramFilters,
  onRemoveFilter,
  onResetAllFilters,
}) => (
  <Popper
    open={open}
    anchorEl={anchorRef.current}
    placement="bottom-start"
    sx={{ zIndex: 1400 }}
    modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
  >
    <ClickAwayListener onClickAway={onClose}>
      <Paper
        elevation={8}
        sx={{
          mt: 1,
          borderRadius: "8px",
          overflow: "hidden",
          width: 250,
          maxHeight: 400,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className={`px-4 py-3 border-b border-gray-200 font-semibold text-sm flex items-center gap-x-2 ${
            isMyPlanogram ? "text-[#FF782C]" : "text-[#FFB000]"
          }`}
        >
          <IoFilter size={18} />
          <p>All Filters</p>
        </div>

        {hasActiveFilters === false ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 3 }}>
            No filters applied
          </Typography>
        ) : (
          <>
            <Box sx={{ overflowY: "auto", flexGrow: 1, p: 2 }}>
              {FILTER_KEYS_TO_CHECK.map((key) => {
                const values = planogramFilters[key];
                if (!Array.isArray(values) || values.length === 0) return null;

                return (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{ mb: 1, fontSize: "0.875rem" }}
                    >
                      {FILTER_KEY_MAP[key] || key}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                      {values.map((val, idx) => (
                        <Box
                          key={`${key}-${val}-${idx}`}
                          display="flex"
                          alignItems="center"
                          bgcolor="#f0f0f0"
                          borderRadius="16px"
                          px={1.5}
                          py={0.5}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.813rem" }}
                          >
                            {val}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ ml: 0.5, padding: "2px" }}
                            onClick={() => onRemoveFilter(key, val)}
                          >
                            <AiOutlineClose fontSize={12} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ borderTop: "1px solid #e5e7eb" }}>
              <button
                className="w-full flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] px-4 py-3"
                onClick={onResetAllFilters}
              >
                <LiaBroomSolid size={18} />
                <span>Reset All Filters</span>
              </button>
            </Box>
          </>
        )}
      </Paper>
    </ClickAwayListener>
  </Popper>
);

AppliedFiltersPopper.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorRef: PropTypes.shape({
    current: PropTypes.any,
  }),
  onClose: PropTypes.func.isRequired,
  isMyPlanogram: PropTypes.bool,
  hasActiveFilters: PropTypes.bool.isRequired,
  planogramFilters: PropTypes.object.isRequired,
  onRemoveFilter: PropTypes.func.isRequired,
  onResetAllFilters: PropTypes.func.isRequired,
};

AppliedFiltersPopper.defaultProps = {
  anchorRef: { current: null },
  isMyPlanogram: false,
};

const PlanogramBar = ({
  rowData,
  setRowData,
  // selectedRegion,
  // selectedRetailer,
  // category,
  clusterMap,
  filteredProducts = [],
  planogramProducts = [],
  onFilterClick,
  isMyPlanogram = false,
  status = "draft",
  autoSaveEnabled = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const masterProductMap = useSelector(selectProductMap);
  const SCALE = useSelector(selectScale);
  const currentMode = useSelector(selectIsFullScreen);
  const planogramFilters = useSelector(selectPlanogramFilters);
  const isSchematicView = useSelector(selectIsSchematicView);
  const shelfLines = useSelector(selectShelfLines);
  const removedProductIds = useSelector(selectRemovedProductIds);
  const removedProductsWithPosition = useSelector(
    selectRemovedProductsWithPosition
  );
  const repositionedProductsWithPosition = useSelector(
    selectRepositionedProductsWithPosition
  );
  const orientationChangedProductsWithPosition = useSelector(
    selectOrientationChangedProductsWithPosition
  );
  const bays = useSelector(selectBays);
  const zoomState = useSelector(selectZoomState);
  const violations = useSelector(
    (state) => state.planogramVisualizerData.violations || []
  );
  const hasUnsavedChanges = useSelector(selectHasUnsavedChanges);
  const user = useSelector((state) => state.auth.user);
  const userEmail = user?.email || "";
  const categoryAccessType = useSelector(selectCategoryAccessType);

  let submitTooltipTitle = "No changes to submit";
  const hasViolations = violations && violations.length > 0;
  const isSubmitDisabled = hasViolations || !hasUnsavedChanges;

  if (hasViolations) {
    submitTooltipTitle = "Resolve all rule violations before submitting";
  } else if (hasUnsavedChanges) {
    submitTooltipTitle = "Submit Planogram";
  }

  const { clusterVersions, selectedPlanogramId, handleVersionChange } =
    useClusterVersionSelection({
      clusterMap,
      rowData,
      setRowData,
      dispatch,
      SCALE,
      masterProductMap,
    });

  // Rule Manager Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [rules] = useState([]);

  // Duplicate Success Modal
  const [isDuplicateSuccessModalOpen, setIsDuplicateSuccessModalOpen] =
    useState(false);
  const [duplicatedPlanogramName, setDuplicatedPlanogramName] = useState("");
  const [duplicatedId, setDuplicatedId] = useState("");

  // Confirmation Modals
  const [isSaveConfirmationModalOpen, setIsSaveConfirmationModalOpen] =
    useState(false);
  const [isSubmitConfirmationModalOpen, setIsSubmitConfirmationModalOpen] =
    useState(false);
  const autoSaveTimer = useRef(null);
  const autoSaveInFlight = useRef(false);

  const {
    activeFilters,
    hasActiveFilters,
    handleRemoveFilter,
    handleResetAllFilters,
  } = usePlanogramFilterState(planogramFilters, dispatch);

  const {
    showAllOpen,
    showAllAnchorRef,
    handleToggleShowAll,
    handleCloseShowAll,
  } = useShowAllFiltersPopover();

  const { downloadAnchorEl, handleOpenDownloadMenu, handleCloseDownloadMenu } =
    useDownloadMenu();

  const handleExport = usePlanogramExportHandler({
    rowData,
    filteredProducts,
    planogramFilters,
    selectedPlanogramId,
  });

  const planogramId = rowData?.id;
  const planogramReference = rowData?.planogramId || "";

  const { handleDuplicateAndEdit, handleSavePlanogram, handleSubmitPlanogram } =
    usePlanogramActions({
      planogramId,
      planogramReference,
      setDuplicatedPlanogramName,
      setDuplicatedId,
      setIsDuplicateSuccessModalOpen,
      shelfLines,
      bays,
      planogramProducts,
      removedProductIds,
      removedProductsWithPosition,
      repositionedProductsWithPosition,
      orientationChangedProductsWithPosition,
      SCALE,
      zoomState,
      violations,
      dispatch,
      hasUnsavedChanges,
      userEmail,
      categoryAccessType,
    });

  // Autosave changed layout when enabled and eligible
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (currentMode) return; // respect view mode
    if (status === "published") return;
    if (!hasUnsavedChanges) return;
    if (violations && violations.length > 0) return;
    if (autoSaveInFlight.current) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      autoSaveInFlight.current = true;
      try {
        await handleSavePlanogram();
      } finally {
        autoSaveInFlight.current = false;
      }
    }, 600);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [
    autoSaveEnabled,
    currentMode,
    status,
    hasUnsavedChanges,
    violations,
    handleSavePlanogram,
  ]);

  return (
    <>
      <Box
        sx={{
          px: 6,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FFFFFF",
          // borderBottom: "1px solid #E5E7EB",
          minHeight: "56px",
          zIndex: 40,
          position: "sticky",
          top: "70px",
          fontFamily:
            'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          "& *": {
            fontFamily:
              'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        }}
      >
        {/* Left side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
            {rowData?.clusterName}
          </Typography>

          {clusterVersions.length > 0 && (
            <Select
              value={selectedPlanogramId}
              onChange={handleVersionChange}
              size="small"
              sx={{ minWidth: 200 }}
            >
              {clusterVersions.map((v) => {
                const shortDesc = v?.shortDesc ?? "";
                const versionLabel =
                  v.version === 0 ? "Original" : `${shortDesc} (V${v.version})`;
                return (
                  <MenuItem key={v.id} value={v.id}>
                    {versionLabel}
                  </MenuItem>
                );
              })}
            </Select>
          )}

          {/* View/Edit Mode Pill */}
          {isMyPlanogram && (
            <div className="flex items-center justify-center px-3 py-1 rounded-full bg-gray-200 text-black text-sm font-medium">
              {currentMode ? "View Mode" : "Edit Mode"}
            </div>
          )}

          <InfoTooltip data={rowData} />

          <MuiTooltip title="Planogram Rules" placement="bottom">
            <IconButton
              onClick={() => setIsRuleModalOpen(true)}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(0, 132, 113, 0.08)",
                },
              }}
            >
              <FileText size={20} />
            </IconButton>
          </MuiTooltip>
        </Box>

        {/* Right side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Show All Filters Button */}

          <PlanogramViewToggle
            currentMode={currentMode}
            isSchematicView={isSchematicView}
            isMyPlanogram={isMyPlanogram}
            onSelectPlanogramView={() => dispatch(setIsSchematicView(false))}
            onSelectSchematicView={() => dispatch(setIsSchematicView(true))}
          />

          <button
            className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-full px-3 py-1.5 border border-black"
            ref={showAllAnchorRef}
            onClick={handleToggleShowAll}
          >
            <VscEye size={16} />
            <span>Applied Filters</span>
          </button>

          <AppliedFiltersPopper
            open={showAllOpen}
            anchorRef={showAllAnchorRef}
            onClose={handleCloseShowAll}
            isMyPlanogram={isMyPlanogram}
            hasActiveFilters={hasActiveFilters}
            planogramFilters={planogramFilters}
            onRemoveFilter={handleRemoveFilter}
            onResetAllFilters={handleResetAllFilters}
          />

          {/* Filter button with badge count */}
          <button
            className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1.5 relative"
            onClick={onFilterClick}
          >
            <div className="relative">
              <IoFilter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white bg-red-150 text-[8px] font-bold">
                  {activeFilters.length}
                </span>
              )}
            </div>
            <span>Filter</span>
          </button>
          <div className="w-[1px] h-5 bg-gray-400"></div>
          {/* Reset Filters button */}
          <MuiTooltip title="Reset Filters" placement="bottom">
            <button
              className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1.5"
              onClick={handleResetAllFilters}
            >
              <MdFilterListOff size={18} />
              {/* <span>Reset Filters</span> */}
            </button>
          </MuiTooltip>

          {/* Vertical line */}
          <div className="w-[1px] h-5 bg-gray-400"></div>

          {/* View toggle (planogram/schematic) */}

          {/* Download button */}
          <MuiTooltip title="Download" placement="bottom">
            <button
              onClick={handleOpenDownloadMenu}
              className="flex items-center justify-center  rounded-lg px-3 py-2 transition-colors"
            >
              <Download size={20} />
            </button>
          </MuiTooltip>

          <Menu
            anchorEl={downloadAnchorEl}
            open={Boolean(downloadAnchorEl)}
            onClose={handleCloseDownloadMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { mt: 1 } } }}
          >
            <MenuItem
              onClick={() => {
                handleCloseDownloadMenu();
                handleExport();
              }}
            >
              Schematic (.xlsx)
            </MenuItem>
            <MenuItem disabled>VST Compliant (.xlsx)</MenuItem>
            <MenuItem disabled>JDA Compliant (.PSA)</MenuItem>
          </Menu>

          {/* Save button*/}
          {isMyPlanogram && !currentMode && status !== "published" && (
            <MuiTooltip
              title={
                hasUnsavedChanges ? "Save Planogram" : "No changes to save"
              }
              placement="bottom"
            >
              <button
                onClick={() => setIsSaveConfirmationModalOpen(true)}
                className={`flex items-center justify-center gap-x-2 text-sm font-semibold rounded-full px-3 py-1.5 border border-black ${
                  hasUnsavedChanges
                    ? "hover:bg-[#f0f0f0]"
                    : "opacity-50 cursor-not-allowed"
                }`}
                disabled={!hasUnsavedChanges}
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            </MuiTooltip>
          )}

          {/* Submit button*/}
          {isMyPlanogram && !currentMode && status !== "published" && (
            <MuiTooltip title={submitTooltipTitle} placement="bottom">
              <span>
                <button
                  onClick={() => setIsSubmitConfirmationModalOpen(true)}
                  className={`flex items-center justify-center gap-x-2 text-sm font-semibold bg-[#FF782C] hover:bg-[#e66619] text-white rounded-full px-3 py-1.5 transition-colors ${
                    isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitDisabled}
                >
                  <Plus size={18} />
                  <span>Submit</span>
                </button>
              </span>
            </MuiTooltip>
          )}

          {/* Duplicate & Edit button - only show when not in MyPlanogramVisualizer */}
          {!isMyPlanogram && (
            <MuiTooltip 
              title={
                categoryAccessType !== "CONTRIBUTORS" 
                  ? "You do not have permission to duplicate planograms for this category"
                  : "Duplicate & Edit"
              } 
              placement="bottom"
            >
              <button
                onClick={handleDuplicateAndEdit}
                disabled={categoryAccessType !== "CONTRIBUTORS"}
                className={`flex items-center justify-center gap-x-2 bg-white hover:bg-[#f0f0f0] border-2 border-[#000000] text-[#000000] rounded-lg px-4 py-2 font-semibold text-sm transition-colors ${
                  categoryAccessType !== "CONTRIBUTORS" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Copy size={18} />
                <span>Duplicate & Edit</span>
              </button>
            </MuiTooltip>
          )}
        </Box>
      </Box>

      {isRuleModalOpen && (
        <RuleManagerModal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          rules={rules}
          isOrangeTheme={isMyPlanogram}
        />
      )}
      <DuplicateSuccessModal
        open={isDuplicateSuccessModalOpen}
        onClose={() => setIsDuplicateSuccessModalOpen(false)}
        clonedName={duplicatedPlanogramName}
        duplicatedId={duplicatedId}
      />

      <SaveConfirmationModal
        open={isSaveConfirmationModalOpen}
        onClose={() => setIsSaveConfirmationModalOpen(false)}
        onConfirm={handleSavePlanogram}
        planogramName={rowData?.planogramId || "this planogram"}
        status={status}
      />

      <SubmitConfirmationModal
        open={isSubmitConfirmationModalOpen}
        onClose={() => setIsSubmitConfirmationModalOpen(false)}
        onConfirm={handleSubmitPlanogram}
        planogramName={rowData?.planogramId || "this planogram"}
      />
    </>
  );
};

export default PlanogramBar;

PlanogramBar.propTypes = {
  rowData: PropTypes.object,
  setRowData: PropTypes.func.isRequired,
  clusterMap: PropTypes.array,
  filteredProducts: PropTypes.array,
  planogramProducts: PropTypes.array,
  onFilterClick: PropTypes.func,
  isMyPlanogram: PropTypes.bool,
  status: PropTypes.string,
  autoSaveEnabled: PropTypes.bool,
};
