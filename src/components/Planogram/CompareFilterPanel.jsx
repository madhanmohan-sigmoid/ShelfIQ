import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import {
  Box,
  Checkbox,
  TextField,
  Autocomplete,
  Typography,
  Slider,
  Chip,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const SELECT_ALL = "Select All";

const capitalizeKey = (key = "") => key.charAt(0).toUpperCase() + key.slice(1);

const getRawOptionsList = (fieldKey, optionSource) => {
  const allKey = `all${capitalizeKey(fieldKey)}`;
  if (Array.isArray(optionSource[allKey])) return optionSource[allKey];
  return optionSource[fieldKey] || [];
};

const getEnabledValuesForField = (fieldKey, optionSource) => {
  return optionSource[fieldKey] || [];
};

const renderCompactTags = (selected = [], getTagProps = () => ({})) => {
  const visible = selected.filter((value) => value && value !== SELECT_ALL);
  if (visible.length === 0) return null;

  const [firstValue, ...rest] = visible;
  const label =
    typeof firstValue === "string" || typeof firstValue === "number"
      ? String(firstValue)
      : "";
  const truncatedLabel = label.length > 10 ? `${label.slice(0, 10)}…` : label;

  return (
    <>
      <Chip
        label={truncatedLabel}
        size="small"
        {...getTagProps({ index: 0 })}
        sx={{
          fontSize: "0.75rem",
          background: "#e3f2fd",
          color: "#1565c0",
          height: 22,
          maxWidth: "90%",
        }}
      />
      {rest.length > 0 && (
        <Chip
          label={`+${rest.length}`}
          size="small"
          sx={{
            fontSize: "0.75rem",
            background: "#e3f2fd",
            color: "#1565c0",
            height: 22,
          }}
        />
      )}
    </>
  );
};

const CompareFilterPanel = ({
  filters = {},
  setFilters,
  options = {
    subCategories: [],
    brands: [],
    priceTiers: [],
    npds: [0, 1],
    intensities: [],
    benchmarks: [0, 1],
    promoItems: [0, 1],
    platforms: [],
  },
  brandCounts = {},
  subCategoryCounts = {},
}) => {
  const {
    priceTiers: enabledPriceTiers = [],
    allPriceTiers = [],
  } = options;

  const priceValues = React.useMemo(() => {
    const source =
      Array.isArray(allPriceTiers) && allPriceTiers.length > 0
        ? allPriceTiers
        : enabledPriceTiers;

    if (!source || !Array.isArray(source) || source.length === 0) {
      return [0, 1000];
    }

    const validPrices = source
      .filter(
        (price) =>
          typeof price === "number" && !Number.isNaN(price) && price >= 0
      )
      .sort((a, b) => a - b);

    return validPrices.length > 0 ? validPrices : [0, 1000];
  }, [enabledPriceTiers, allPriceTiers]);

  const minPrice = priceValues[0];
  const maxPrice = priceValues[priceValues.length - 1];

  // Local state for immediate UI feedback (no debouncing needed for compare)
  const [localFilters, setLocalFilters] = useState(() => ({
    ...filters,
    priceRange:
      filters.priceRange &&
      Array.isArray(filters.priceRange) &&
      filters.priceRange.length === 2
        ? filters.priceRange
        : [minPrice, maxPrice],
  }));

  // Sync external filters when they change
  useEffect(() => {
    setLocalFilters((prev) => ({
      ...prev,
      ...filters,
      priceRange:
        filters.priceRange &&
        Array.isArray(filters.priceRange) &&
        filters.priceRange.length === 2
          ? filters.priceRange
          : [minPrice, maxPrice],
    }));
  }, [filters, minPrice, maxPrice]);

  // Handle string-based multi-select - immediate update to parent
  const handleChange = (field) => (_, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    // Immediate update to parent (no debounce for compare)
    setFilters(newFilters);
  };

  // Handler for string filter onChange
  const createStringFilterOnChange = (key, enabledValues, enabledSet, allEnabledSelected) => {
    return (event, newValue, reason, details) => {
      if (details?.option === SELECT_ALL) {
        const nextValues = allEnabledSelected ? [] : enabledValues.slice();
        const newFilters = { ...localFilters, [key]: nextValues };
        setLocalFilters(newFilters);
        setFilters(newFilters);
        return;
      }

      const cleaned = (newValue || [])
        .filter((val) => val !== SELECT_ALL)
        .filter((val) => enabledSet.has(val));
      const newFilters = { ...localFilters, [key]: cleaned };
      setLocalFilters(newFilters);
      setFilters(newFilters);
    };
  };

  // Handler for string filter filterOptions
  const createStringFilterOptions = () => {
    return (opts, { inputValue }) =>
      opts.filter(
        (o) =>
          o === SELECT_ALL ||
          o.toLowerCase().includes(inputValue.toLowerCase())
      );
  };

  // Handler for string filter renderOption
  const createStringFilterRenderOption = (
    counts,
    enabledSet,
    enabledValues,
    allEnabledSelected,
    partiallySelected
  ) => {
    const renderOption = (props, option, { selected }) => {
      const isSelectAll = option === SELECT_ALL;
      const labelText =
        counts && !isSelectAll
          ? `${option} (${counts[option] || 0})`
          : option;

      return (
        <li {...props}>
          <Box
            component="span"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              indeterminate={isSelectAll ? partiallySelected : false}
              checked={isSelectAll ? allEnabledSelected : selected}
              disabled={
                isSelectAll
                  ? enabledValues.length === 0
                  : !enabledSet.has(option)
              }
              sx={{ mr: 1 }}
            />
            {labelText}
          </Box>
        </li>
      );
    };
    renderOption.displayName = "StringFilterRenderOption";
    return renderOption;
  };

  // Handle price range - immediate update
  const handlePriceChange = (_, val) => {
    if (Array.isArray(val) && val.length === 2) {
      const newFilters = { ...localFilters, priceRange: [val[0], val[1]] };
      setLocalFilters(newFilters);
      // Immediate update to parent
      setFilters(newFilters);
    }
  };

  // Define filter metadata
  const gridFilters = [
    { key: "brands", label: "Brands", type: "string", counts: brandCounts },
    {
      key: "subCategories",
      label: "Sub-Categories",
      type: "string",
      counts: subCategoryCounts,
    },
    { key: "npds", label: "NPDs", type: "flag" },
    { key: "intensities", label: "Intensities", type: "string" },
    { key: "benchmarks", label: "Benchmarks", type: "flag" },
    { key: "promoItems", label: "Promo Items", type: "flag" },
    { key: "platforms", label: "Platforms", type: "string" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {gridFilters.map(({ key, label, type, counts }) => (
        <div key={key} className="w-full min-w-[200px]">
          {/* String-based filters */}
          {type === "string" &&
            (() => {
              const rawList = getRawOptionsList(key, options);
              const enabledValues = getEnabledValuesForField(key, options);
              const enabledSet = new Set(enabledValues);
              const sorted = Array.from(new Set(rawList)).sort((a, b) => {
                const aEnabled = enabledSet.has(a);
                const bEnabled = enabledSet.has(b);
                if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
                return (a || "").toString().localeCompare((b || "").toString());
              });
              const optionList =
                sorted.length > 0 ? [SELECT_ALL, ...sorted] : sorted;
              const currentValues = localFilters[key] || [];
              const enabledSelectedCount = enabledValues.filter((val) =>
                currentValues.includes(val)
              ).length;
              const allEnabledSelected =
                enabledValues.length > 0 &&
                enabledSelectedCount === enabledValues.length;
              const partiallySelected =
                enabledSelectedCount > 0 && !allEnabledSelected;

              return (
                <Autocomplete
                  multiple
                  limitTags={1}
                  getLimitTagsText={(more) => `+${more}`}
                  disableCloseOnSelect
                  options={optionList}
                  value={currentValues}
                  isOptionEqualToValue={(option, value) => option === value}
                  getOptionDisabled={(option) => {
                    if (option === SELECT_ALL)
                      return enabledValues.length === 0;
                    return !enabledSet.has(option);
                  }}
                  onChange={createStringFilterOnChange(
                    key,
                    enabledValues,
                    enabledSet,
                    allEnabledSelected
                  )}
                  renderTags={renderCompactTags}
                  renderOption={createStringFilterRenderOption(
                    counts,
                    enabledSet,
                    enabledValues,
                    allEnabledSelected,
                    partiallySelected
                  )}
                  filterOptions={createStringFilterOptions()}
                  renderInput={(params) => (
                    <TextField {...params} placeholder={label} size="small" />
                  )}
                  sx={{ width: "100%" }}
                />
              );
            })()}

          {type === "flag" && (
            <Autocomplete
              multiple
              limitTags={1}
              disableCloseOnSelect
              options={[0, 1]}
              value={localFilters[key] || []}
              onChange={handleChange(key)}
              renderTags={renderCompactTags}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option === 1 ? "Yes" : "No"}
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} placeholder={label} size="small" />
              )}
              sx={{ width: "100%" }}
            />
          )}
        </div>
      ))}

      {/* Price Range */}
      <div className="mb-4">
        <Typography variant="body2" gutterBottom>
          Price Range
        </Typography>
        {minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice < maxPrice ? (
          <div className="flex items-center gap-x-5 px-1">
            <p className="w-10 text-right">{minPrice}</p>
            <Slider
              value={localFilters.priceRange || [minPrice, maxPrice]}
              onChange={handlePriceChange}
              min={minPrice}
              max={maxPrice}
              step={1}
              valueLabelDisplay="auto"
              sx={{
                color: "#FFB000",
                "& .MuiSlider-track": {
                  backgroundColor: "#FFB000",
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "#b0b0b0",
                },
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  borderColor: "#FFB000",
                },
              }}
            />
            <p className="w-10 text-left">{maxPrice}</p>
          </div>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            No valid price data available
          </Typography>
        )}
      </div>
    </div>
  );
};

CompareFilterPanel.displayName = "CompareFilterPanel";

const MemoizedCompareFilterPanel = React.memo(CompareFilterPanel);
MemoizedCompareFilterPanel.displayName = "CompareFilterPanel";

export default MemoizedCompareFilterPanel;

CompareFilterPanel.propTypes = {
  filters: PropTypes.object,
  setFilters: PropTypes.func.isRequired,
  options: PropTypes.shape({
    subCategories: PropTypes.arrayOf(PropTypes.string),
    brands: PropTypes.arrayOf(PropTypes.string),
    priceTiers: PropTypes.arrayOf(PropTypes.number),
    npds: PropTypes.arrayOf(PropTypes.number),
    intensities: PropTypes.arrayOf(PropTypes.string),
    benchmarks: PropTypes.arrayOf(PropTypes.number),
    promoItems: PropTypes.arrayOf(PropTypes.number),
    platforms: PropTypes.arrayOf(PropTypes.string),
    allSubCategories: PropTypes.arrayOf(PropTypes.string),
    allBrands: PropTypes.arrayOf(PropTypes.string),
    allPriceTiers: PropTypes.arrayOf(PropTypes.number),
    allIntensities: PropTypes.arrayOf(PropTypes.string),
    allPlatforms: PropTypes.arrayOf(PropTypes.string),
    allNpds: PropTypes.arrayOf(PropTypes.number),
    allBenchmarks: PropTypes.arrayOf(PropTypes.number),
    allPromoItems: PropTypes.arrayOf(PropTypes.number),
  }),
  brandCounts: PropTypes.object,
  subCategoryCounts: PropTypes.object,
};
