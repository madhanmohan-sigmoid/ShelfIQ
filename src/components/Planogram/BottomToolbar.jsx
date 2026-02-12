import React, { useMemo } from "react";
import {
  Box,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Chip,
  Tooltip,
  Switch,
} from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit,
  Maximize2,
  History,
  CheckSquare,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTagMapFilters,
  setTagMapFilters,
  selectPlanogramProducts,
} from "../../redux/reducers/planogramVisualizerSlice";
import {
  selectMasterProductBrands,
  selectMasterProductSubCategories,
} from "../../redux/reducers/dataTemplateSlice";
import { selectCategoryAccessType } from "../../redux/reducers/regionRetailerSlice";
import toast from "react-hot-toast";
import {
  generateBrandColors,
  generateSubCategoryColors,
  getUniqueBrandsAndSubCategories,
} from "../../utils/tagMapUtils";
import PropTypes from "prop-types";

const SELECT_ALL_LABEL = "Select All";

const getZoomPercentageLabel = (zoomValue) => {
  const z = typeof zoomValue === "number" ? zoomValue : 1;
  const normalized = Math.abs(z - 1) < 0.05 ? 1 : z;
  return `${Math.round(normalized * 100)}%`;
};

const getEditCursorStyle = (isEditDisabled, onEdit) => {
  if (isEditDisabled) return "not-allowed";
  if (onEdit) return "pointer";
  return "default";
};

const renderTagMapInput = (params, isBrand) => (
  <TextField
    {...params}
    label={isBrand ? "Select Brand" : "Select Subcategory"}
    size="small"
    slotProps={{
      ...params.slotProps,
      inputLabel: {
        ...params.slotProps?.inputLabel,
        sx: {
          fontSize: "0.875rem",
          "&.MuiInputLabel-shrink": {
            backgroundColor: "white",
            px: 0.5,
          },
        },
      },
    }}
  />
);

const renderTagMapTags = (selected) => {
  if (!selected || selected.length === 0) return null;
  return (
    <Chip
      label={`${selected.length} selected`}
      size="small"
      sx={{
        fontSize: "0.75rem",
        height: 22,
        backgroundColor: "#f5f5f5",
        color: "#333",
        fontWeight: 600,
        border: "1px solid #d0d0d0",
      }}
    />
  );
};

const renderTagMapOption = (props, option, optionsData) => {
  const isSelectAll = option === SELECT_ALL_LABEL;
  const allSelected = optionsData.value.length === optionsData.all.length;

  if (isSelectAll) {
    return (
      <li
        {...props}
        style={{
          fontWeight: 600,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        {allSelected ? "Deselect All" : "Select All"}
      </li>
    );
  }

  const isSelected = optionsData.value.includes(option);
  return (
    <li
      {...props}
      style={{
        backgroundColor: isSelected ? "#f5f5f5" : "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: optionsData.colors[option],
            border: "1px solid #ddd",
            flexShrink: 0,
          }}
        />
        <Box component="span" sx={{ fontSize: "0.875rem" }}>
          {option}
        </Box>
      </Box>
    </li>
  );
};

const ViewToggleSection = ({
  onFullscreen,
  onEdit,
  isFullscreen,
  isEditDisabled,
  isEditDisabledByAccess,
  lightColor,
  darkColor,
}) => {
  const getEditTooltipTitle = () => {
    if (isEditDisabledByAccess) {
      return "You do not have permission to edit planograms for this category. Only contributors can edit planograms.";
    }
    if (isEditDisabled) {
      return 'This planogram is published and cannot be edited. To make changes, please clone the planogram from the "My Planogram" section first.';
    }
    return "Edit Planogram";
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: lightColor,
        borderRadius: 2,
        overflow: "hidden",
        height: 36,
      }}
    >
      <Tooltip title="Fullscreen" arrow>
        <Box
          onClick={onFullscreen}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
            cursor: onFullscreen ? "pointer" : "default",
            fontWeight: isFullscreen ? 700 : 500,
            color: "#000",
            backgroundColor: isFullscreen ? darkColor : "transparent",
            transition: "all 0.2s ease",
            "&:hover": { opacity: onFullscreen ? 0.9 : 1 },
            userSelect: "none",
          }}
        >
          <Maximize2 size={18} color="#000" />
        </Box>
      </Tooltip>
      <Tooltip title={getEditTooltipTitle()} arrow>
        <Box
          onClick={isEditDisabled && !isEditDisabledByAccess ? undefined : onEdit}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
            cursor: getEditCursorStyle(isEditDisabled, onEdit),
            fontWeight: isFullscreen ? 500 : 700,
            color: "#000",
            backgroundColor: isFullscreen ? "transparent" : darkColor,
            transition: "all 0.2s ease",
            "&:hover": { opacity: isEditDisabled ? 1 : 0.9 },
            userSelect: "none",
            opacity: isEditDisabled ? 0.5 : 1,
          }}
        >
          <Edit size={18} color="#000" />
        </Box>
      </Tooltip>
    </Box>
  );
};

ViewToggleSection.propTypes = {
  onFullscreen: PropTypes.func,
  onEdit: PropTypes.func,
  isFullscreen: PropTypes.bool,
  isEditDisabled: PropTypes.bool,
  isEditDisabledByAccess: PropTypes.bool,
  lightColor: PropTypes.string,
  darkColor: PropTypes.string,
};

const ZoomControlsSection = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLabel,
  lightColor,
  darkColor,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      backgroundColor: lightColor,
      borderRadius: 2,
      overflow: "hidden",
      height: 36,
      px: 1,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip title="Zoom out" arrow>
        <IconButton
          size="small"
          onClick={onZoomOut}
          sx={{
            p: 0.75,
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <ZoomOut size={20} color="#666" strokeWidth={2} />
        </IconButton>
      </Tooltip>
      <Box
        sx={{
          px: 1.5,
          fontWeight: 700,
          fontSize: "0.875rem",
          color: "#000",
        }}
      >
        {zoomLabel}
      </Box>
      <Tooltip title="Zoom in" arrow>
        <IconButton
          size="small"
          onClick={onZoomIn}
          sx={{
            p: 0.75,
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <ZoomIn size={20} color="#666" strokeWidth={2} />
        </IconButton>
      </Tooltip>
    </Box>
    <Box sx={{ width: "1px", height: 24, bgcolor: darkColor }} />
    <Tooltip title="Reset zoom" arrow>
      <IconButton
        size="small"
        onClick={onReset}
        sx={{
          p: 0.75,
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        }}
      >
        <RotateCcw size={20} color="#666" strokeWidth={2} />
      </IconButton>
    </Tooltip>
  </Box>
);

ZoomControlsSection.propTypes = {
  onZoomIn: PropTypes.func,
  onZoomOut: PropTypes.func,
  onReset: PropTypes.func,
  zoomLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lightColor: PropTypes.string,
  darkColor: PropTypes.string,
};

const LabelTagToggleSection = ({
  showProductNameTag,
  setShowProductNameTag,
  tagMapFilters,
  handleTypeChange,
  darkColor,
  lightColor,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "stretch",
      backgroundColor: lightColor,
      borderRadius: 2,
      overflow: "hidden",
      height: 36,
    }}
  >
    <Box
      onClick={() => setShowProductNameTag(true)}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2.5,
        cursor: "pointer",
        fontWeight: showProductNameTag ? 700 : 500,
        fontSize: "0.875rem",
        color: "#000",
        backgroundColor: showProductNameTag ? darkColor : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          opacity: 0.9,
        },
        userSelect: "none",
      }}
    >
      Labels
    </Box>
    <Box
      onClick={() => {
        setShowProductNameTag(false);
        if (tagMapFilters?.selectedType !== "brand") handleTypeChange("brand");
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2.5,
        cursor: "pointer",
        fontWeight: showProductNameTag ? 500 : 700,
        fontSize: "0.875rem",
        color: "#000",
        backgroundColor: showProductNameTag ? "transparent" : darkColor,
        transition: "all 0.2s ease",
        "&:hover": {
          opacity: 0.9,
        },
        userSelect: "none",
      }}
    >
      Tag Map
    </Box>
  </Box>
);

LabelTagToggleSection.propTypes = {
  showProductNameTag: PropTypes.bool,
  setShowProductNameTag: PropTypes.func,
  tagMapFilters: PropTypes.shape({
    selectedType: PropTypes.string,
  }),
  handleTypeChange: PropTypes.func,
  darkColor: PropTypes.string,
  lightColor: PropTypes.string,
};

const UndoSection = ({ canUndo, onUndo, lightColor, darkColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "stretch",
      backgroundColor: lightColor,
      borderRadius: 2,
      overflow: "hidden",
      height: 36,
    }}
  >
    <Tooltip title={canUndo ? "Undo last change" : "Nothing to undo"} arrow>
      <Box
        onClick={canUndo ? onUndo : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2.5,
          gap: 1,
          width: "100%",
          cursor: canUndo ? "pointer" : "not-allowed",
          color: "#000",
          backgroundColor: canUndo ? darkColor : "transparent",
          transition: "all 0.2s ease",
          "&:hover": canUndo
            ? {
                opacity: 0.9,
                backgroundColor: darkColor,
              }
            : {},
          userSelect: "none",
          opacity: canUndo ? 1 : 0.5,
          fontWeight: canUndo ? 700 : 500,
        }}
      >
        <RotateCcw size={18} color="#000" />
        <Box
          component="span"
          sx={{
            fontSize: "0.875rem",
            fontWeight: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Undo
        </Box>
      </Box>
    </Tooltip>
  </Box>
);

UndoSection.propTypes = {
  canUndo: PropTypes.bool,
  onUndo: PropTypes.func,
  lightColor: PropTypes.string,
  darkColor: PropTypes.string,
};

const ActivitiesSection = ({ onClick, lightColor, darkColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "stretch",
      backgroundColor: lightColor,
      borderRadius: 2,
      overflow: "hidden",
      height: 36,
    }}
  >
    <Tooltip title="View recent activity" arrow>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2.5,
          gap: 1,
          width: "100%",
          cursor: onClick ? "pointer" : "default",
          color: "#000",
          backgroundColor: darkColor,
          transition: "all 0.2s ease",
          "&:hover": onClick
            ? { opacity: 0.9, backgroundColor: darkColor }
            : {},
          userSelect: "none",
          fontWeight: 600,
        }}
      >
        <History size={18} color="#000" />
        <Box
          component="span"
          sx={{
            fontSize: "0.875rem",
            fontWeight: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Activity
        </Box>
      </Box>
    </Tooltip>
  </Box>
);

ActivitiesSection.propTypes = {
  onClick: PropTypes.func,
  lightColor: PropTypes.string,
  darkColor: PropTypes.string,
};

const ChecksSection = ({ onClick, lightColor, darkColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "stretch",
      backgroundColor: lightColor,
      borderRadius: 2,
      overflow: "hidden",
      height: 36,
    }}
  >
    <Tooltip title="View violation checks" arrow>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2.5,
          gap: 1,
          width: "100%",
          cursor: onClick ? "pointer" : "default",
          color: "#000",
          backgroundColor: darkColor,
          transition: "all 0.2s ease",
          "&:hover": onClick
            ? { opacity: 0.9, backgroundColor: darkColor }
            : {},
          userSelect: "none",
          fontWeight: 600,
        }}
      >
        <CheckSquare size={18} color="#000" />
        <Box
          component="span"
          sx={{
            fontSize: "0.875rem",
            fontWeight: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          Checks
        </Box>
      </Box>
    </Tooltip>
  </Box>
);

ChecksSection.propTypes = {
  onClick: PropTypes.func,
  lightColor: PropTypes.string,
  darkColor: PropTypes.string,
};

const TagMapSelectors = ({
  optionsData,
  handleTypeChange,
  handleBrandSelectChange,
  handleSubCategorySelectChange,
}) => (
  <>
    <Box sx={{ width: "1px", height: 36, bgcolor: "#e0e0e0" }} />

    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        animation: "slideIn 0.3s ease-out",
        "@keyframes slideIn": {
          from: {
            opacity: 0,
            transform: "translateX(-10px)",
          },
          to: {
            opacity: 1,
            transform: "translateX(0)",
          },
        },
      }}
    >
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={optionsData.selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          sx={{
            height: 36,
            "& .MuiSelect-select": {
              fontSize: "0.875rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d0d0d0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#a0a0a0",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#666",
              borderWidth: "1px",
            },
          }}
        >
          <MenuItem value="brand">Brand</MenuItem>
          <MenuItem value="subcategory">Subcategory</MenuItem>
        </Select>
      </FormControl>

      <Autocomplete
        multiple
        size="small"
        disableCloseOnSelect
        options={optionsData.displayOptions}
        value={optionsData.value}
        onChange={
          optionsData.isBrand
            ? handleBrandSelectChange
            : handleSubCategorySelectChange
        }
        sx={{
          minWidth: 280,
          "& .MuiOutlinedInput-root": {
            minHeight: 36,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#d0d0d0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#a0a0a0",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#666",
              borderWidth: "1px",
            },
          },
        }}
        getOptionLabel={(option) => option.toString()}
        renderInput={(params) => renderTagMapInput(params, optionsData.isBrand)}
        renderOption={(props, option) =>
          renderTagMapOption(props, option, optionsData)
        }
        renderTags={(selected) => [
          selected.length > 0 && renderTagMapTags(selected),
        ]}
      />
    </Box>
  </>
);

TagMapSelectors.propTypes = {
  optionsData: PropTypes.shape({
    selectedType: PropTypes.oneOf(["brand", "subcategory"]),
    isBrand: PropTypes.bool,
    all: PropTypes.arrayOf(PropTypes.string),
    displayOptions: PropTypes.arrayOf(PropTypes.string),
    value: PropTypes.arrayOf(PropTypes.string),
    colors: PropTypes.object,
  }),
  handleTypeChange: PropTypes.func,
  handleBrandSelectChange: PropTypes.func,
  handleSubCategorySelectChange: PropTypes.func,
};

const BottomToolbar = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomValue = 1,
  showProductNameTag = true,
  setShowProductNameTag = () => {},
  onEdit,
  onFullscreen,
  isFullscreen = false,
  isOrangeTheme = false,
  planogramStatus,
  showViewToggle,
  canUndo,
  onUndo,
  onToggleActivities,
  onToggleChecks,
  autoSaveEnabled = true,
  onToggleAutoSave = () => {},
}) => {
  const dispatch = useDispatch();
  const tagMapFilters = useSelector(selectTagMapFilters);
  const planogramProducts = useSelector(selectPlanogramProducts);
  const masterProductBrands = useSelector(selectMasterProductBrands);
  const masterProductSubCategories = useSelector(
    selectMasterProductSubCategories
  );

  const { brands, subCategories } = useMemo(() => {
    return getUniqueBrandsAndSubCategories(planogramProducts || []);
  }, [planogramProducts]);

  const brandColors = useMemo(
    () => generateBrandColors(brands, masterProductBrands),
    [brands, masterProductBrands]
  );
  const subCategoryColors = useMemo(
    () => generateSubCategoryColors(subCategories, masterProductSubCategories),
    [subCategories, masterProductSubCategories]
  );

  const handleTypeChange = (value) => {
    dispatch(
      setTagMapFilters({
        selectedType: value,
        // Do not clear previous selections here; keep behavior consistent with secondary bar
      })
    );
  };

  const handleBrandSelectChange = (_, newValue) => {
    const allOptions = brands;
    if (newValue.includes(SELECT_ALL_LABEL)) {
      const current = tagMapFilters?.selectedBrands || [];
      const allSelectedNow = current.length === allOptions.length;
      const next = allSelectedNow ? [] : allOptions.slice();
      dispatch(setTagMapFilters({ selectedBrands: next }));
      return;
    }
    dispatch(setTagMapFilters({ selectedBrands: newValue }));
  };

  const handleSubCategorySelectChange = (_, newValue) => {
    const allOptions = subCategories;
    if (newValue.includes(SELECT_ALL_LABEL)) {
      const current = tagMapFilters?.selectedSubCategories || [];
      const allSelectedNow = current.length === allOptions.length;
      const next = allSelectedNow ? [] : allOptions.slice();
      dispatch(setTagMapFilters({ selectedSubCategories: next }));
      return;
    }
    dispatch(setTagMapFilters({ selectedSubCategories: newValue }));
  };

  const getTagMapOptionsData = useMemo(() => {
    const isBrand = (tagMapFilters?.selectedType || "brand") === "brand";
    const all = isBrand ? brands : subCategories;
    const displayOptions = all.length > 2 ? [SELECT_ALL_LABEL, ...all] : all;
    const value = isBrand
      ? tagMapFilters?.selectedBrands || []
      : tagMapFilters?.selectedSubCategories || [];

    return {
      selectedType: isBrand ? "brand" : "subcategory",
      isBrand,
      all,
      displayOptions,
      value,
      colors: isBrand ? brandColors : subCategoryColors,
    };
  }, [
    tagMapFilters?.selectedType,
    tagMapFilters?.selectedBrands,
    tagMapFilters?.selectedSubCategories,
    brands,
    subCategories,
    brandColors,
    subCategoryColors,
  ]);

  const categoryAccessType = useSelector(selectCategoryAccessType);
  const isTagMap = !showProductNameTag;
  const isEditDisabled = planogramStatus === "published";
  const isEditDisabledByAccess = categoryAccessType !== "CONTRIBUTORS";
  const lightColor = isOrangeTheme ? "#FFDDCA" : "#FFEBBF";
  const darkColor = isOrangeTheme ? "#FF782C" : "#FFB000";
  const isEditMode = !isFullscreen;
  const shouldShowActivities = isOrangeTheme && isEditMode && !isEditDisabled && !isEditDisabledByAccess;
  const shouldShowChecks = (shouldShowActivities && onToggleChecks) || (isFullscreen && onToggleChecks);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* Main toolbar container with white background */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          px: 2.5,
          py: 1.5,
          borderRadius: 3,
          backgroundColor: "white",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
        }}
      >
        {(showViewToggle ?? isOrangeTheme) && (
          <ViewToggleSection
            onFullscreen={onFullscreen}
            onEdit={() => {
              if (isEditDisabledByAccess) {
                toast.error("You do not have permission to edit planograms for this category. Only contributors can edit planograms.");
                return;
              }
              onEdit?.();
            }}
            isFullscreen={isFullscreen}
            isEditDisabled={isEditDisabled || isEditDisabledByAccess}
            isEditDisabledByAccess={isEditDisabledByAccess}
            lightColor={lightColor}
            darkColor={darkColor}
          />
        )}

        <UndoSection
          canUndo={canUndo}
          onUndo={onUndo}
          lightColor={lightColor}
          darkColor={darkColor}
        />

        <ZoomControlsSection
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onReset}
          zoomLabel={getZoomPercentageLabel(zoomValue)}
          lightColor={lightColor}
          darkColor={darkColor}
        />

        <LabelTagToggleSection
          showProductNameTag={showProductNameTag}
          setShowProductNameTag={setShowProductNameTag}
          tagMapFilters={tagMapFilters}
          handleTypeChange={handleTypeChange}
          darkColor={darkColor}
          lightColor={lightColor}
        />

        {isTagMap && (
          <TagMapSelectors
            optionsData={getTagMapOptionsData}
            handleTypeChange={handleTypeChange}
            handleBrandSelectChange={handleBrandSelectChange}
            handleSubCategorySelectChange={handleSubCategorySelectChange}
          />
        )}

        {shouldShowActivities && (
          <ActivitiesSection
            onClick={onToggleActivities}
            lightColor={lightColor}
            darkColor={darkColor}
          />
        )}

        {shouldShowChecks && (
          <ChecksSection
            onClick={onToggleChecks}
            lightColor={lightColor}
            darkColor={darkColor}
          />
        )}

        {!isFullscreen && !isEditDisabled && (
          <>
            <Box sx={{ width: "1px", height: 36, bgcolor: "#e0e0e0" }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: lightColor,
                height: 36,
              }}
            >
              <Switch
                size="small"
                checked={autoSaveEnabled}
                onChange={onToggleAutoSave}
                color="warning"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: darkColor,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: darkColor,
                  },
                }}
                inputProps={{ "aria-label": "Toggle autosave" }}
              />
              <Box sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#000" }}>
                Autosave
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default BottomToolbar;

BottomToolbar.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  zoomValue: PropTypes.number,
  showProductNameTag: PropTypes.bool,
  setShowProductNameTag: PropTypes.func,
  onEdit: PropTypes.func,
  onFullscreen: PropTypes.func,
  isFullscreen: PropTypes.bool,
  isOrangeTheme: PropTypes.bool,
  planogramStatus: PropTypes.string,
  showViewToggle: PropTypes.bool,
  canUndo: PropTypes.bool,
  onUndo: PropTypes.func,
  onToggleActivities: PropTypes.func,
  onToggleChecks: PropTypes.func,
  autoSaveEnabled: PropTypes.bool,
  onToggleAutoSave: PropTypes.func,
};
