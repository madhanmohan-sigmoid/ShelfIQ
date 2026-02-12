import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Tooltip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";
import { Maximize2, RotateCcw } from "lucide-react";
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
import {
  generateBrandColors,
  generateSubCategoryColors,
  getUniqueBrandsAndSubCategories,
} from "../../utils/tagMapUtils";

const ZoomControls = ({
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onReset,
  isOrangeTheme = false,
  showProductNameTag = true,
  setShowProductNameTag = () => {},
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
      })
    );
  };

  const handleBrandSelectChange = (_, newValue) => {
    const SELECT_ALL = "Select All";
    const allOptions = brands;
    if (newValue.includes(SELECT_ALL)) {
      const current = tagMapFilters?.selectedBrands || [];
      const allSelectedNow = current.length === allOptions.length;
      const next = allSelectedNow ? [] : allOptions.slice();
      dispatch(setTagMapFilters({ selectedBrands: next }));
      return;
    }
    dispatch(setTagMapFilters({ selectedBrands: newValue }));
  };

  const handleSubCategorySelectChange = (_, newValue) => {
    const SELECT_ALL = "Select All";
    const allOptions = subCategories;
    if (newValue.includes(SELECT_ALL)) {
      const current = tagMapFilters?.selectedSubCategories || [];
      const allSelectedNow = current.length === allOptions.length;
      const next = allSelectedNow ? [] : allOptions.slice();
      dispatch(setTagMapFilters({ selectedSubCategories: next }));
      return;
    }
    dispatch(setTagMapFilters({ selectedSubCategories: newValue }));
  };

  const isTagMap = !showProductNameTag;
  const lightColor = isOrangeTheme ? "#FFDDCA" : "#FFEBBF";
  const darkColor = isOrangeTheme ? "#FF782C" : "#FFB000";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Box
        component={Paper}
        elevation={3}
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
        {/* Section 1: Zoom controls + Fullscreen */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: lightColor,
          }}
        >
          <Tooltip title="Zoom out" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onZoomOut();
              }}
              sx={{
                p: 0.75,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <ZoomOutIcon sx={{ fontSize: 20, color: "#666" }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: "1px", height: 24, bgcolor: darkColor }} />

          <Tooltip title="Reset zoom" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReset();
              }}
              sx={{
                p: 0.75,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <RotateCcw size={20} color="#666" strokeWidth={2} />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: "1px", height: 24, bgcolor: darkColor }} />

          <Tooltip title="Zoom in" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onZoomIn();
              }}
              sx={{
                p: 0.75,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <ZoomInIcon sx={{ fontSize: 20, color: "#666" }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: "1px", height: 24, bgcolor: darkColor }} />

          <Tooltip title="Fullscreen" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFullscreen();
              }}
              sx={{
                p: 0.75,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <Maximize2 size={20} color="#666" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main divider */}
        <Box sx={{ width: "1px", height: 36, bgcolor: "#e0e0e0" }} />

        {/* Section 2: Labels / Tag Map toggle */}
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
              "&:hover": { opacity: 0.9 },
              userSelect: "none",
            }}
          >
            Labels
          </Box>
          <Box
            onClick={() => {
              setShowProductNameTag(false);
              if ((tagMapFilters?.selectedType || "brand") !== "brand")
                handleTypeChange("brand");
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2.5,
              cursor: "pointer",
              fontWeight: !showProductNameTag ? 700 : 500,
              fontSize: "0.875rem",
              color: "#000",
              backgroundColor: !showProductNameTag ? darkColor : "transparent",
              transition: "all 0.2s ease",
              "&:hover": { opacity: 0.9 },
              userSelect: "none",
            }}
          >
            Tag Map
          </Box>
        </Box>

        {/* Section 3: Tag Map selects */}
        {isTagMap && (
          <>
            <Box sx={{ width: "1px", height: 36, bgcolor: "#e0e0e0" }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                animation: "slideIn 0.3s ease-out",
                "@keyframes slideIn": {
                  from: { opacity: 0, transform: "translateX(-10px)" },
                  to: { opacity: 1, transform: "translateX(0)" },
                },
              }}
            >
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={tagMapFilters?.selectedType || "brand"}
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

              {(() => {
                const isBrand =
                  (tagMapFilters?.selectedType || "brand") === "brand";
                const all = isBrand ? brands : subCategories;
                const displayOptions =
                  all.length > 2 ? ["Select All", ...all] : all;
                const value = isBrand
                  ? tagMapFilters?.selectedBrands || []
                  : tagMapFilters?.selectedSubCategories || [];

                return (
                  <Autocomplete
                    multiple
                    size="small"
                    disableCloseOnSelect
                    options={displayOptions}
                    value={value}
                    onChange={
                      isBrand
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
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={isBrand ? "Select Brand" : "Select Subcategory"}
                        size="small"
                        InputLabelProps={{
                          ...params.InputLabelProps,
                          sx: {
                            fontSize: "0.875rem",
                            "&.MuiInputLabel-shrink": {
                              backgroundColor: "white",
                              px: 0.5,
                            },
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const SELECT_ALL = "Select All";
                      const isSelectAll = option === SELECT_ALL;
                      const colors = isBrand ? brandColors : subCategoryColors;
                      const currentSelected = value;
                      const allSelected = currentSelected.length === all.length;

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

                      const isSelected = currentSelected.includes(option);
                      return (
                        <li
                          {...props}
                          style={{
                            backgroundColor: isSelected
                              ? "#f5f5f5"
                              : "transparent",
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
                                backgroundColor: colors[option],
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
                    }}
                    renderTags={(selected) => {
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
                    }}
                  />
                );
              })()}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ZoomControls);

import PropTypes from "prop-types";

ZoomControls.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onFullscreen: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isOrangeTheme: PropTypes.bool,
  showProductNameTag: PropTypes.bool,
  setShowProductNameTag: PropTypes.func,
};