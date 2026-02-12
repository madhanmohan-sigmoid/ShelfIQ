import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

import {
  Modal,
  Box,
  IconButton,
  Button,
  Autocomplete,
  TextField,
  Checkbox,
  Chip,
} from "@mui/material";

import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Close } from "@mui/icons-material";
import { getFilteredProducts, getUniqueOptions } from "../../utils/filterUtils";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const SELECT_ALL = "Select All";

// Default empty options - actual options come from planogramProducts or attributeOptions
const DEFAULT_ATTRIBUTE_OPTIONS = {
  brands: [],
  subCategories: [],
  intensities: [],
  benchmarks: [0, 1], // Benchmarks are always Yes/No (0/1)
  platforms: [],
  needState: [],
  bay: [],
  shelf: [],
};

const ATTRIBUTES = [
  { key: "brands", label: "Brands" },
  { key: "subCategories", label: "Sub Categories" },
  { key: "intensities", label: "Intensities" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "platforms", label: "Platforms" },
  { key: "needState", label: "Need State" },
  { key: "bay", label: "Bay" },
  { key: "shelf", label: "Shelf" },
];

const getAttributeOptions = (attributeKey, responsiveOptions, attributeOptions) => {
  const options =
    responsiveOptions[attributeKey] ||
    (Array.isArray(attributeOptions[attributeKey]) &&
    attributeOptions[attributeKey].length > 0
      ? attributeOptions[attributeKey]
      : DEFAULT_ATTRIBUTE_OPTIONS[attributeKey] || []);

  const allOptionsKey = `all${attributeKey
    .charAt(0)
    .toUpperCase()}${attributeKey.slice(1)}`;
  const allOptions =
    responsiveOptions[allOptionsKey] ||
    attributeOptions[allOptionsKey] ||
    options;

  return {
    options,
    allOptions,
    enabledSet: new Set(options),
    allOptionsSet: new Set(allOptions),
  };
};

const sortOptionsByEnabled = (allOptions, enabledSet, sortMode = "alpha") => {
  const base = Array.from(new Set(allOptions));
  return base.sort((a, b) => {
    const aEnabled = enabledSet.has(a);
    const bEnabled = enabledSet.has(b);
    if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
    if (sortMode === "numeric") {
      return Number(a || 0) - Number(b || 0);
    }
    return (a || "").toString().localeCompare((b || "").toString());
  });
};

const filterDisabledOptions = (options, hideDisabledOptions, enabledSet) => {
  if (!hideDisabledOptions) return options;
  return options.filter((opt) => enabledSet.has(opt));
};

const AttributeField = ({
  attr,
  responsiveOptions,
  attributeOptions,
  selectedAttributes,
  hideDisabledOptions,
  handleMultiSelectChange,
  renderCompactTags,
  createRenderOption,
  setSelectedAttributes,
}) => {
  const { options, allOptions, enabledSet, allOptionsSet } = getAttributeOptions(
    attr.key,
    responsiveOptions,
    attributeOptions
  );
  const currentValues = selectedAttributes[attr.key] || [];
  const isMultiSelectField = attr.key === "brands" || attr.key === "subCategories";

  const normalizeSelections = (values) => {
    const cleaned = (values || [])
      .map((val) =>
        attr.key === "bay" || attr.key === "shelf" ? String(val) : val
      )
      .filter((val) => enabledSet.has(val) || currentValues.includes(val));
    return cleaned;
  };

  if (isMultiSelectField) {
    let sortedOptions = sortOptionsByEnabled(allOptions, enabledSet, "alpha");
    sortedOptions = filterDisabledOptions(
      sortedOptions,
      hideDisabledOptions,
      enabledSet
    );
    const optionList =
      sortedOptions.length > 0 ? [SELECT_ALL, ...sortedOptions] : sortedOptions;

    return (
      <Autocomplete
        key={attr.key}
        multiple
        limitTags={1}
        getLimitTagsText={(more) => `+${more}`}
        disableCloseOnSelect
        options={optionList}
        value={currentValues}
        isOptionEqualToValue={(option, value) => option === value}
        getOptionDisabled={(option) => {
          if (option === SELECT_ALL) return options.length === 0;
          return allOptionsSet.has(option) && !enabledSet.has(option);
        }}
        onChange={(event, newValue, reason, details) =>
          handleMultiSelectChange(attr.key, newValue, reason, details)
        }
        renderTags={(value, getTagProps) =>
          renderCompactTags(value, getTagProps, false)
        }
        renderOption={createRenderOption(attr.key)}
        filterOptions={(opts, { inputValue }) =>
          opts.filter(
            (o) =>
              o === SELECT_ALL ||
              o
                .toString()
                .toLowerCase()
                .includes(inputValue.toLowerCase())
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={attr.label}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        sx={{ width: "100%" }}
      />
    );
  }

  if (attr.key === "benchmarks") {
    const benchmarkOptions = [0, 1];
    return (
      <Autocomplete
        key={attr.key}
        multiple
        limitTags={1}
        getLimitTagsText={(more) => `+${more}`}
        disableCloseOnSelect
        options={benchmarkOptions}
        getOptionLabel={(option) => (option === 1 ? "Yes" : "No")}
        value={currentValues}
        isOptionEqualToValue={(option, value) => option === value}
        onChange={(event, newValue) => {
          setSelectedAttributes((prev) => ({
            ...prev,
            [attr.key]: newValue || [],
          }));
        }}
        renderTags={(value, getTagProps) =>
          renderCompactTags(value, getTagProps, true)
        }
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option === 1 ? "Yes" : "No"}
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={attr.label}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        sx={{ width: "100%" }}
      />
    );
  }

  if (attr.key === "intensities" || attr.key === "platforms") {
    let sortedOptions = sortOptionsByEnabled(allOptions, enabledSet, "alpha");
    sortedOptions = filterDisabledOptions(
      sortedOptions,
      hideDisabledOptions,
      enabledSet
    );
    const responsiveOptionList =
      sortedOptions.length > 0 ? sortedOptions : options;

    return (
      <Autocomplete
        key={attr.key}
        multiple
        limitTags={1}
        getLimitTagsText={(more) => `+${more}`}
        disableCloseOnSelect
        options={responsiveOptionList}
        value={currentValues}
        isOptionEqualToValue={(option, value) => option === value}
        getOptionDisabled={(option) => {
          return allOptionsSet.has(option) && !enabledSet.has(option);
        }}
        onChange={(event, newValue) => {
          const cleaned = normalizeSelections(newValue);
          setSelectedAttributes((prev) => ({
            ...prev,
            [attr.key]: cleaned,
          }));
        }}
        renderTags={(value, getTagProps) =>
          renderCompactTags(value, getTagProps, false)
        }
        renderOption={(props, option, { selected }) => {
          const isDisabled =
            !enabledSet.has(option) && allOptionsSet.has(option);
          return (
            <li {...props}>
              <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  checked={selected}
                  disabled={isDisabled}
                  sx={{
                    mr: 1,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                />
                <span style={{ opacity: isDisabled ? 0.5 : 1 }}>{option}</span>
              </Box>
            </li>
          );
        }}
        filterOptions={(opts, { inputValue }) =>
          opts.filter((o) =>
            o.toString().toLowerCase().includes(inputValue.toLowerCase())
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={attr.label}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        sx={{ width: "100%" }}
      />
    );
  }

  if (attr.key === "bay" || attr.key === "shelf") {
    let sortedOptions = sortOptionsByEnabled(allOptions, enabledSet, "numeric");
    sortedOptions = filterDisabledOptions(
      sortedOptions,
      hideDisabledOptions,
      enabledSet
    );

    return (
      <Autocomplete
        key={attr.key}
        multiple
        limitTags={1}
        getLimitTagsText={(more) => `+${more}`}
        disableCloseOnSelect
        options={sortedOptions}
        value={currentValues}
        isOptionEqualToValue={(option, value) => option === value}
        getOptionDisabled={(option) => {
          return allOptionsSet.has(option) && !enabledSet.has(option);
        }}
        onChange={(event, newValue) => {
          const cleaned = normalizeSelections(newValue);
          setSelectedAttributes((prev) => ({
            ...prev,
            [attr.key]: cleaned,
          }));
        }}
        renderTags={(value, getTagProps) =>
          renderCompactTags(value, getTagProps, false)
        }
        renderOption={(props, option, { selected }) => {
          const isDisabled =
            !enabledSet.has(option) && allOptionsSet.has(option);
          return (
            <li {...props}>
              <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  checked={selected}
                  disabled={isDisabled}
                  sx={{
                    mr: 1,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                />
                <span style={{ opacity: isDisabled ? 0.5 : 1 }}>{option}</span>
              </Box>
            </li>
          );
        }}
        filterOptions={(opts, { inputValue }) =>
          opts.filter((o) =>
            o.toString().toLowerCase().includes(inputValue.toLowerCase())
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={attr.label}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        sx={{ width: "100%" }}
      />
    );
  }

  if (attr.key === "needState") {
    const singleValue = currentValues.length > 0 ? currentValues[0] : null;
    return (
      <Autocomplete
        key={attr.key}
        options={options}
        value={singleValue}
        disabled={true}
        onChange={(event, newValue) => {
          setSelectedAttributes((prev) => ({
            ...prev,
            [attr.key]: newValue ? [newValue] : [],
          }));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={attr.label}
            size="small"
            disabled={true}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        sx={{ width: "100%" }}
      />
    );
  }

  const singleValue = currentValues.length > 0 ? currentValues[0] : null;
  return (
    <Autocomplete
      key={attr.key}
      options={options}
      value={singleValue}
      onChange={(event, newValue) => {
        setSelectedAttributes((prev) => ({
          ...prev,
          [attr.key]: newValue ? [newValue] : [],
        }));
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={attr.label}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      )}
      sx={{ width: "100%" }}
    />
  );
};

AttributeField.propTypes = {
  attr: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  responsiveOptions: PropTypes.object.isRequired,
  attributeOptions: PropTypes.object.isRequired,
  selectedAttributes: PropTypes.object.isRequired,
  hideDisabledOptions: PropTypes.bool.isRequired,
  handleMultiSelectChange: PropTypes.func.isRequired,
  renderCompactTags: PropTypes.func.isRequired,
  createRenderOption: PropTypes.func.isRequired,
  setSelectedAttributes: PropTypes.func.isRequired,
};

const AddProductGroupModal = ({
  open = false,
  onClose,
  onSubmit,
  attributeOptions = {},
  initialValues = null,
  editingIndex = null,
  planogramProducts = [],
  hideDisabledOptions = false,
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState(
    ATTRIBUTES.reduce((acc, attr) => {
      acc[attr.key] = []; // Array for multi-select
      return acc;
    }, {})
  );

  // Convert selectedAttributes to filter format for responsive filtering
  const currentFilters = useMemo(() => {
    return {
      brands: selectedAttributes.brands || [],
      subCategories: selectedAttributes.subCategories || [],
      intensities: selectedAttributes.intensities || [],
      benchmarks: selectedAttributes.benchmarks || [],
      platforms: selectedAttributes.platforms || [],
      bays: selectedAttributes.bay || [],
      shelves: selectedAttributes.shelf || [],
      priceRange: [],
      npds: [],
      promoItems: [],
    };
  }, [selectedAttributes]);

  // Helper function to get Step1 filter values
  const step1Filters = useMemo(() => {
    const step1Brands =
      attributeOptions.brands &&
      Array.isArray(attributeOptions.brands) &&
      attributeOptions.brands.length > 0
        ? attributeOptions.brands
        : null;
    const step1SubCategories =
      attributeOptions.subCategories &&
      Array.isArray(attributeOptions.subCategories) &&
      attributeOptions.subCategories.length > 0
        ? attributeOptions.subCategories
        : null;
    return { step1Brands, step1SubCategories };
  }, [attributeOptions]);

  // Helper function to filter products based on Step1 selections
  const filterBaseProducts = (products, step1Brands, step1SubCategories) => {
    if (!step1Brands && !step1SubCategories) {
      return products;
    }
    return products.filter((product) => {
      const productBrand = product.product_details?.["brand_name"];
      const productSubCategory = product.product_details?.["subCategory_name"];
      const brandMatch =
        !step1Brands || step1Brands.length === 0 || step1Brands.includes(productBrand);
      const subCategoryMatch =
        !step1SubCategories ||
        step1SubCategories.length === 0 ||
        step1SubCategories.includes(productSubCategory);
      return brandMatch && subCategoryMatch;
    });
  };

  // Helper function to extract unique bay/shelf values (as strings for MUI Autocomplete)
  const extractBayShelfValues = (products) => {
    const bays = Array.from(
      new Set(products.map((p) => p.bay).filter((b) => b != null && b !== undefined))
    )
      .map(String) // Convert to string for MUI Autocomplete
      .sort((a, b) => Number(a) - Number(b)); // Numeric sort but keep as strings
    const shelves = Array.from(
      new Set(products.map((p) => p.shelf).filter((s) => s != null && s !== undefined))
    )
      .map(String) // Convert to string for MUI Autocomplete
      .sort((a, b) => Number(a) - Number(b)); // Numeric sort but keep as strings
    return { bays, shelves };
  };

  // Calculate responsive options based on selected attributes
  const responsiveOptions = useMemo(() => {
    if (!planogramProducts || planogramProducts.length === 0) {
      return {
        brands: attributeOptions.allBrands || attributeOptions.brands || [],
        subCategories:
          attributeOptions.allSubCategories ||
          attributeOptions.subCategories ||
          [],
        intensities: attributeOptions.intensities || [],
        benchmarks: attributeOptions.benchmarks || [],
        platforms: attributeOptions.platforms || [],
        bay: [],
        shelf: [],
      };
    }

    const { step1Brands, step1SubCategories } = step1Filters;
    const baseProducts = filterBaseProducts(
      planogramProducts,
      step1Brands,
      step1SubCategories
    );

    // Get all available options (from filtered base products)
    const allBrands =
      attributeOptions.allBrands ||
      (step1Brands && step1Brands.length > 0
        ? step1Brands
        : getUniqueOptions(baseProducts, "brand_name")) ||
      [];
    const allSubCategories =
      attributeOptions.allSubCategories ||
      (step1SubCategories && step1SubCategories.length > 0
        ? step1SubCategories
        : getUniqueOptions(baseProducts, "subCategory_name")) ||
      [];
    const allIntensities =
      attributeOptions.allIntensities ||
      getUniqueOptions(baseProducts, "INTENSITY") ||
      [];
    const allPlatforms =
      attributeOptions.allPlatforms ||
      getUniqueOptions(baseProducts, "PLATFORM") ||
      [];

    const { bays: allBays, shelves: allShelves } = extractBayShelfValues(baseProducts);

    // Calculate enabled options based on filtered products (responsive to current selections)
    const enabledBrands = getUniqueOptions(
      getFilteredProducts(baseProducts, currentFilters, "brands"),
      "brand_name"
    );
    const enabledSubCategories = getUniqueOptions(
      getFilteredProducts(baseProducts, currentFilters, "subCategories"),
      "subCategory_name"
    );
    const enabledIntensities = getUniqueOptions(
      getFilteredProducts(baseProducts, currentFilters, "intensities"),
      "INTENSITY"
    );
    const enabledPlatforms = getUniqueOptions(
      getFilteredProducts(baseProducts, currentFilters, "platforms"),
      "PLATFORM"
    );

    // Filter products based on current selections (excluding bay/shelf) to get enabled bays/shelves
    const filteredForBayShelf = getFilteredProducts(baseProducts, {
      ...currentFilters,
      bays: [],
      shelves: [],
    });
    const { bays: enabledBays, shelves: enabledShelves } =
      extractBayShelfValues(filteredForBayShelf);

    return {
      brands: enabledBrands.length > 0 ? enabledBrands : allBrands,
      subCategories:
        enabledSubCategories.length > 0
          ? enabledSubCategories
          : allSubCategories,
      intensities:
        enabledIntensities.length > 0 ? enabledIntensities : allIntensities,
      benchmarks: attributeOptions.benchmarks || [0, 1], // Keep benchmarks as is for now
      platforms: enabledPlatforms.length > 0 ? enabledPlatforms : allPlatforms,
      bay: enabledBays.length > 0 ? enabledBays : allBays,
      shelf: enabledShelves.length > 0 ? enabledShelves : allShelves,
      allBrands,
      allSubCategories,
      allIntensities,
      allPlatforms,
      allBays,
      allShelves,
    };
  }, [planogramProducts, currentFilters, attributeOptions, step1Filters]);

  // Load initial values when editing
  useEffect(() => {
    if (open && initialValues) {
      // Ensure array values
      const convertedValues = {};
      Object.keys(initialValues).forEach((key) => {
        const value = initialValues[key];
        // Ensure it's always an array
        if (Array.isArray(value)) {
          convertedValues[key] = value;
        } else if (value) {
          convertedValues[key] = [value];
        } else {
          convertedValues[key] = [];
        }
      });
      setSelectedAttributes(convertedValues);
    } else if (!open) {
      setSelectedAttributes(
        ATTRIBUTES.reduce((acc, attr) => {
          acc[attr.key] = [];
          return acc;
        }, {})
      );
    }
  }, [open, initialValues]);

  const handleMultiSelectChange = (attributeKey, newValue, reason, details) => {
    // Use responsive options if available, otherwise fallback to attributeOptions or defaults
    const options =
      responsiveOptions[attributeKey] ||
      (Array.isArray(attributeOptions[attributeKey]) &&
      attributeOptions[attributeKey].length > 0
        ? attributeOptions[attributeKey]
        : DEFAULT_ATTRIBUTE_OPTIONS[attributeKey] || []);

    const enabledValues = options;
    const enabledSet = new Set(enabledValues);
    const allEnabledSelected =
      enabledValues.length > 0 &&
      (selectedAttributes[attributeKey] || []).length === enabledValues.length;

    if (details?.option === SELECT_ALL) {
      setSelectedAttributes((prev) => ({
        ...prev,
        [attributeKey]: allEnabledSelected ? [] : enabledValues.slice(),
      }));
      return;
    }

    // Filter out SELECT_ALL sentinel and ensure only valid options
    const cleaned = (newValue || [])
      .filter((val) => val !== SELECT_ALL)
      .filter((val) => enabledSet.has(val));

    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeKey]: cleaned,
    }));
  };

  const handleSubmit = () => {
    // Values are already in array format
    const arrayFormat = {};
    Object.keys(selectedAttributes).forEach((key) => {
      const value = selectedAttributes[key];
      if (Array.isArray(value)) {
        arrayFormat[key] = value;
      } else if (value) {
        arrayFormat[key] = [value];
      } else {
        arrayFormat[key] = [];
      }
    });

    const hasSelection = Object.values(arrayFormat).some(
      (value) => Array.isArray(value) && value.length > 0
    );

    if (!hasSelection) {
      if (typeof onClose === "function") {
        onClose();
      }
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit(arrayFormat);
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  // Render compact tags for multi-select
  const renderCompactTags = (
    selected = [],
    getTagProps = () => ({}),
    isBenchmark = false
  ) => {
    const visible = selected.filter(
      (value) => value !== null && value !== undefined && value !== SELECT_ALL
    );
    if (visible.length === 0) return null;

    const [firstValue, ...rest] = visible;
    // For benchmarks, convert 0/1 to "No"/"Yes"
    let label = "";
    if (isBenchmark) {
      if (firstValue === 1) {
        label = "Yes";
      } else if (firstValue === 0) {
        label = "No";
      } else {
        label = String(firstValue);
      }
    } else {
      label =
        typeof firstValue === "string" || typeof firstValue === "number"
          ? String(firstValue)
          : "";
    }
    const truncatedLabel = label.length > 15 ? `${label.slice(0, 15)}…` : label;

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

  // Create render option function for brands and subcategories (with Select All)
  const createRenderOption = (attributeKey) => {
    // Use responsive options if available
    const options =
      responsiveOptions[attributeKey] ||
      (Array.isArray(attributeOptions[attributeKey]) &&
      attributeOptions[attributeKey].length > 0
        ? attributeOptions[attributeKey]
        : DEFAULT_ATTRIBUTE_OPTIONS[attributeKey] || []);

    // Get all options for this field (for determining disabled state)
    const allOptions =
      responsiveOptions[
        `all${attributeKey.charAt(0).toUpperCase()}${attributeKey.slice(1)}`
      ] ||
      attributeOptions[
        `all${attributeKey.charAt(0).toUpperCase()}${attributeKey.slice(1)}`
      ] ||
      options;

    const enabledValues = options;
    const enabledSet = new Set(enabledValues);
    const allOptionsSet = new Set(allOptions);
    const currentValues = selectedAttributes[attributeKey] || [];
    const enabledSelectedCount = enabledValues.filter((val) =>
      currentValues.includes(val)
    ).length;
    const allEnabledSelected =
      enabledValues.length > 0 && enabledSelectedCount === enabledValues.length;
    const partiallySelected = enabledSelectedCount > 0 && !allEnabledSelected;

    const renderOption = (props, option, { selected }) => {
      const isSelectAll = option === SELECT_ALL;
      const isDisabled =
        !isSelectAll && !enabledSet.has(option) && allOptionsSet.has(option);

      return (
        <li {...props}>
          <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              indeterminate={isSelectAll ? partiallySelected : false}
              checked={isSelectAll ? allEnabledSelected : selected}
              disabled={isSelectAll ? enabledValues.length === 0 : isDisabled}
              sx={{
                mr: 1,
                opacity: isDisabled ? 0.5 : 1,
              }}
            />
            <span style={{ opacity: isDisabled ? 0.5 : 1 }}>{option}</span>
          </Box>
        </li>
      );
    };

    renderOption.displayName = `RenderOption_${attributeKey}`;
    return renderOption;
  };

  // Ensure open is always a boolean and onClose is a function
  const isOpen = Boolean(open);
  const safeOnClose = typeof onClose === "function" ? onClose : () => {};

  // Don't render if critical props are missing
  if (typeof onClose !== "function") {
    return null;
  }

  // Check if we're in edit mode (positive condition)
  const isEditMode = typeof editingIndex === 'number' && editingIndex >= 0;

  return (
    <Modal open={isOpen} onClose={safeOnClose}>
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
        <div className="flex items-center justify-between border-b px-6 py-4">
          <p className="text-sm font-semibold text-[#FF9800]">
            {isEditMode ? "Edit Product Group" : "Add Product Group"}
          </p>

          <IconButton size="small" onClick={onClose}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <h3 className="text-sm font-semibold mb-4">Attributes</h3>

          <div className="grid grid-cols-2 gap-4">
            {ATTRIBUTES.map((attr) => (
              <AttributeField
                key={attr.key}
                attr={attr}
                responsiveOptions={responsiveOptions}
                attributeOptions={attributeOptions}
                selectedAttributes={selectedAttributes}
                hideDisabledOptions={hideDisabledOptions}
                handleMultiSelectChange={handleMultiSelectChange}
                renderCompactTags={renderCompactTags}
                createRenderOption={createRenderOption}
                setSelectedAttributes={setSelectedAttributes}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t p-4">
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: "#FFD473",
              color: "#000",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 4,
              py: 1,
              borderRadius: "50px",
              textTransform: "none",
            }}
          >
            {isEditMode ? "Update" : "Add"}
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

AddProductGroupModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  attributeOptions: PropTypes.object,
  initialValues: PropTypes.object,
  editingIndex: PropTypes.number,
  planogramProducts: PropTypes.array,
  hideDisabledOptions: PropTypes.bool,
};

export default AddProductGroupModal;
