import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Box,
  TextField,
  Autocomplete,
  Checkbox,
  Chip,
  Typography,
  Slider,
  Tooltip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedBrand,
  setSelectedCategory,
  setSelectedBenchmark,
  setSelectedIntensity,
  setSelectedNpd,
  setSelectedPlatform,
  setSelectedPromoItem,
  selectFilters,
  selectAllProducts,
  resetFilters,
  setPriceRange,
} from "../../redux/reducers/productDataSlice";
import { IoFilter } from "react-icons/io5";
import { LiaBroomSolid } from "react-icons/lia";
import { FaCheckCircle } from "react-icons/fa";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const FilterModal = ({ open, onClose, filterElements, filterPriceRange }) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const products = useSelector(selectAllProducts);

  // Local state object instead of multiple useStates
  const [localFilters, setLocalFilters] = useState({});
  const [localPriceRange, setLocalPriceRange] = useState([
    filterPriceRange.min,
    filterPriceRange.max,
  ]);

  // Config for filters (makes it modular)
  const filterConfig = [
    {
      key: "selectedBrand",
      placeholder: "Brands",
      options: filterElements.brands || [],
      setter: setSelectedBrand,
    },
    {
      key: "selectedCategory",
      placeholder: "Sub Categories",
      options: filterElements.subCategories || [],
      setter: setSelectedCategory,
    },
    {
      key: "selectedIntensity",
      placeholder: "Intensities",
      options: filterElements.intensities || [],
      setter: setSelectedIntensity,
    },
    {
      key: "selectedPlatform",
      placeholder: "Platforms",
      options: filterElements.platforms || [],
      setter: setSelectedPlatform,
    },
    {
      key: "selectedNpd",
      placeholder: "NPDs",
      options: filterElements.npds || [],
      setter: setSelectedNpd,
    },
    {
      key: "selectedBenchmark",
      placeholder: "Benchmarks",
      options: filterElements.benchmarks || [],
      setter: setSelectedBenchmark,
    },
    {
      key: "selectedPromoItem",
      placeholder: "Promo Items",
      options: filterElements.promoItems || [],
      setter: setSelectedPromoItem,
    },
  ];

  // Map filter keys to flattened product fields
  const keyToField = {
    selectedBrand: "brand_name",
    selectedCategory: "subCategory_name",
    selectedIntensity: "INTENSITY",
    selectedPlatform: "PLATFORM",
    selectedNpd: "NPD",
    selectedBenchmark: "BENCHMARK",
    selectedPromoItem: "PROMOITEM",
  };

  useEffect(() => {
    if (open) {
      // Sync redux filters when modal opens
      setLocalFilters(filters);
      setLocalPriceRange([filters.priceRange.min, filters.priceRange.max]);
    }
  }, [open, filters]);

  const handlePriceChange = (event, newValue) => {
    setLocalPriceRange(newValue);
  };

  const handleChange = (key, val) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleApply = () => {
    filterConfig.forEach(({ key, setter }) => {
      dispatch(setter(localFilters[key] || []));
    });
    dispatch(
      setPriceRange({ min: localPriceRange[0], max: localPriceRange[1] })
    );

    onClose();
  };

  const handleReset = () => {
    const cleared = {};
    filterConfig.forEach(({ key }) => {
      cleared[key] = [];
    });
    setLocalFilters(cleared);
    dispatch(resetFilters());
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          maxWidth: "90vw",
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 6,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between  border-b px-8 py-4">
          <div className="flex items-center gap-x-3 text-sm font-semibold text-[#FF6B6B]">
            <IoFilter size={20} />
            <p>All Filters</p>
          </div>
          <button onClick={onClose} aria-label="Close filters modal">
            <Close sx={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {filterConfig.map(({ key, placeholder, options }) => {
              const baseOptions = Array.isArray(options) ? options : [];
              const hasOptions = baseOptions.length > 0;
              const SELECT_ALL = "Select All";
              const selectAllEnabled = baseOptions.length > 2;

              // Compute enabled options for this key based on other current selections and price range
              const fieldForKey = keyToField[key];
              const otherKeys = filterConfig
                .map((c) => c.key)
                .filter((k) => k !== key);

              const enabledCountMap = new Map();
              if (Array.isArray(products) && products.length > 0) {
                products.forEach((p) => {
                  // Price filter
                  const priceVal = p?.price;
                  const withinPrice =
                    typeof priceVal === "number"
                      ? priceVal >= localPriceRange[0] &&
                        priceVal <= localPriceRange[1]
                      : true;
                  if (!withinPrice) return;

                  // Other filters
                  for (const ok of otherKeys) {
                    const selectedVals = Array.isArray(localFilters[ok])
                      ? localFilters[ok]
                      : [];
                    if (selectedVals.length === 0) continue;
                    const field = keyToField[ok];
                    const pv = p?.[field];
                    if (!selectedVals.includes(pv)) return; // fails other filter
                  }

                  const valueForKey = p?.[fieldForKey];
                  if (valueForKey === undefined || valueForKey === null) return;
                  enabledCountMap.set(
                    valueForKey,
                    (enabledCountMap.get(valueForKey) || 0) + 1
                  );
                });
              }

              const enabledSet = new Set(Array.from(enabledCountMap.keys()));
              const enabledOptions = baseOptions.filter((v) =>
                enabledSet.has(v)
              );
              const hasEnabled = enabledOptions.length > 0;

              let displayOptions = baseOptions;
              if (hasOptions && selectAllEnabled && hasEnabled) {
                // First, filter and order enabled options, then disabled
                const disabledOptions = baseOptions.filter((v) => !enabledSet.has(v));
                displayOptions = [SELECT_ALL]
                  .concat(enabledOptions)
                  .concat(disabledOptions);
              } else if (hasOptions) {
                // Even if select all is not enabled, enabled options at the top
                const disabledOptions = baseOptions.filter((v) => !enabledSet.has(v));
                displayOptions = [...enabledOptions, ...disabledOptions];
              }

              const currentValues = Array.isArray(localFilters[key])
                ? localFilters[key]
                : [];
              const currentEnabledCount = currentValues.filter((v) =>
                enabledSet.has(v)
              ).length;
              const allSelected =
                selectAllEnabled &&
                hasEnabled &&
                currentEnabledCount === enabledOptions.length;
              const partiallySelected =
                selectAllEnabled && currentEnabledCount > 0 && !allSelected;

              return (
                <Autocomplete
                  key={key}
                  multiple
                  options={displayOptions}
                  disableCloseOnSelect
                  value={currentValues}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionLabel={(option) => option.toString()}
                  onChange={(event, newValue, reason, details) => {
                    const normalizedNewValue = Array.isArray(newValue)
                      ? newValue
                      : [];
                    const changedOption = details?.option;
                    if (selectAllEnabled && changedOption === SELECT_ALL) {
                      if (allSelected) {
                        handleChange(key, []);
                      } else {
                        handleChange(key, enabledOptions.slice());
                      }
                      return;
                    }
                    const cleaned = normalizedNewValue
                      .filter((v) => v !== SELECT_ALL)
                      .filter((v) => enabledSet.has(v));
                    handleChange(key, cleaned);
                  }}
                  getOptionDisabled={(option) => {
                    if (option === SELECT_ALL)
                      return selectAllEnabled && !hasEnabled;
                    return selectAllEnabled && !enabledSet.has(option);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={placeholder}
                      size="small"
                    />
                  )}
                  renderOption={(props, option, { selected }) => {
                    const isSelectAll =
                      selectAllEnabled && option === SELECT_ALL;
                    const isDisabled =
                      !isSelectAll &&
                      selectAllEnabled &&
                      !enabledSet.has(option);
                    const checked = isSelectAll ? allSelected : selected;
                    const indeterminate = isSelectAll
                      ? partiallySelected
                      : false;
                    return (
                      <li {...props}>
                        <Tooltip
                          title={
                            isDisabled
                              ? "No matches with current selections"
                              : ""
                          }
                          disableHoverListener={!isDisabled}
                          placement="right"
                        >
                          <span className="flex items-center">
                            <Checkbox
                              icon={icon}
                              checkedIcon={checkedIcon}
                              indeterminate={indeterminate}
                              checked={checked}
                              disabled={isDisabled}
                            />
                            {option}
                          </span>
                        </Tooltip>
                      </li>
                    );
                  }}
                  renderTags={(selected, getTagProps) => {
                    const visible = (selected || []).filter(
                      (item) => item !== SELECT_ALL
                    );
                    if (!visible || visible.length === 0) return null;

                    const maxVisible = 1; // Only first item displayed fully
                    const first = visible[0];
                    const restCount = visible.length - maxVisible;

                    return (
                      <>
                        <Chip
                          label={
                            first.length > 6 ? `${first.slice(0, 6)}...` : first
                          }
                          size="small"
                          {...getTagProps({ index: 0 })}
                          sx={{
                            fontSize: "0.8rem",
                            background: "#e3f2fd",
                            color: "#1565c0",
                          }}
                        />
                        {restCount > 0 && (
                          <Chip
                            label={`+${restCount}`}
                            size="small"
                            sx={{
                              fontSize: "0.8rem",
                              background: "#e3f2fd",
                              color: "#1565c0",
                            }}
                          />
                        )}
                      </>
                    );
                  }}
                />
              );
            })}
            <div className="mb-4">
              <Typography variant="body2" gutterBottom>
                Price Range
              </Typography>
              <div className="flex items-center gap-x-5 px-1">
                <p className="w-10 text-right">{filterPriceRange.min}</p>
                <Slider
                  value={localPriceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={filterPriceRange.min}
                  max={filterPriceRange.max}
                  sx={{
                    color: "#FF6B6B",
                    "& .MuiSlider-track": {
                      backgroundColor: "#FF6B6B",
                    },
                    "& .MuiSlider-rail": {
                      backgroundColor: "#b0b0b0",
                    },
                    "& .MuiSlider-thumb": {
                      width: 12,
                      height: 12,
                      borderColor: "#FF6B6B",
                    },
                  }}
                />

                <p className="w-10 text-left">{filterPriceRange.max}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex w-full justify-between text-sm font-semibold border-t">
          <button
            onClick={handleReset}
            className="w-[50%] p-4 flex items-center justify-center gap-x-3 border-r hover:bg-[#f0f0f0]"
          >
            <LiaBroomSolid size={20} />
            <p>Reset All Filters</p>
          </button>
          <button
            onClick={handleApply}
            className="w-[50%] p-4 flex items-center justify-center gap-x-3 hover:bg-[#f0f0f0]"
          >
            <p>Apply</p>
            <FaCheckCircle size={16} />
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default FilterModal;

FilterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filterElements: PropTypes.shape({
    brands: PropTypes.arrayOf(PropTypes.string),
    subCategories: PropTypes.arrayOf(PropTypes.string),
    intensities: PropTypes.arrayOf(PropTypes.string),
    platforms: PropTypes.arrayOf(PropTypes.string),
    npds: PropTypes.arrayOf(PropTypes.string),
    benchmarks: PropTypes.arrayOf(PropTypes.string),
    promoItems: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  filterPriceRange: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
};
