import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Box,
  IconButton,
  Button,
  TextField,
  Select,
  FormControl,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip,
  Typography,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import { Close, Edit, Add, DeleteOutline } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPlanogramProducts,
  addRule,
} from "../../redux/reducers/planogramVisualizerSlice";
import {
  RULE_CATEGORIES,
  getRuleTypesByCategory,
  getRuleConfig,
  TEXT_FIELD_STYLES,
  SELECT_STYLES,
} from "../../config/ruleModalConfig";
import AddProductGroupModal from "./AddProductGroupModal";
import MerchandisingRuleForm from "../rulesManager/MerchandisingRuleForm";

const ProductGroupsSection = ({
  show,
  ruleProductGroups,
  onAddProductGroup,
  onEditProductGroup,
  onRemoveProductGroup,
  requiredCount,
  isCountValid,
}) => {
  if (!show) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Product Groups</h3>
        {typeof requiredCount === "number" && (
          <span className="text-xs text-gray-600">
            {ruleProductGroups.length}/{requiredCount} selected
          </span>
        )}
      </div>
      {typeof requiredCount === "number" && !isCountValid && (
        <p className="text-xs text-red-600 mb-3">
          Exactly {requiredCount} product groups are required for this rule.
        </p>
      )}

      {ruleProductGroups.length === 0 ? (
        <Button
          variant="contained"
          size="small"
          startIcon={<Add sx={{ fontSize: 16 }} />}
          onClick={onAddProductGroup}
          disabled={typeof requiredCount === "number" && ruleProductGroups.length >= requiredCount}
          sx={{
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 10,
            px: 3,
            py: 1.5,
            textTransform: "none",
            bgcolor: "#FFAE80",
            color: "#000",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#FF9D66",
              boxShadow: "none",
            },
          }}
        >
          Add Product Group
        </Button>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {ruleProductGroups.map((productGroup, index) => {
            // Guard against invalid product groups
            if (!productGroup || typeof productGroup !== "object") {
              return null;
            }

            // Extract arrays directly from productGroup
            let subCategories = [];
            if (Array.isArray(productGroup.subCategories)) {
              subCategories = productGroup.subCategories;
            } else if (productGroup.subcategory) {
              subCategories = [productGroup.subcategory];
            }

            let brands = [];
            if (Array.isArray(productGroup.brands)) {
              brands = productGroup.brands;
            } else if (productGroup.brand) {
              brands = [productGroup.brand];
            }

            // Skip if no display values
            if (subCategories.length === 0 && brands.length === 0) return null;

            // Create a unique key combining index with first values for stability
            const groupKey = `pg-${index}-${subCategories[0] || ""}-${
              brands[0] || ""
            }`;

            // Helper to render chip with multiple values
            const renderMultiValueChip = (values) => {
              if (values.length === 0) return null;

              const [firstValue, ...rest] = values;
              const displayLabel =
                rest.length > 0 ? `${firstValue} +${rest.length}` : firstValue;
              const tooltipText = values.join(", ");

              return (
                <Tooltip title={tooltipText} arrow placement="top">
                  <Chip
                    label={displayLabel}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: 12,
                      fontWeight: 500,
                      bgcolor: "#E0E0E0",
                      color: "#222",
                      borderRadius: 1,
                      "& .MuiChip-label": {
                        px: 1.5,
                      },
                    }}
                  />
                </Tooltip>
              );
            };

            return (
              <Box
                key={groupKey}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={1.5}
                bgcolor="#F9FAFB"
                borderRadius={2}
                border="1px solid #E5E7EB"
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                    color="#222"
                  >
                    PG{index + 1}:
                  </Typography>
                  {subCategories.length > 0 && (
                    <>
                      {renderMultiValueChip(subCategories)}
                      {brands.length > 0 && (
                        <>
                          <Typography fontSize={12} color="#222" mx={0.5}>
                            -
                          </Typography>
                          {renderMultiValueChip(brands)}
                        </>
                      )}
                    </>
                  )}
                  {subCategories.length === 0 && brands.length > 0 && (
                    renderMultiValueChip(brands)
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title="Edit product group" arrow placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onEditProductGroup(index)}
                      sx={{
                        color: "#FF782C",
                        "&:hover": {
                          bgcolor: "#FFF5EE",
                        },
                      }}
                      aria-label={`Edit product group ${index + 1}`}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Remove product group" arrow placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onRemoveProductGroup(index)}
                      sx={{
                        color: "#DC2626",
                        "&:hover": {
                          bgcolor: "#FEF2F2",
                        },
                      }}
                      aria-label={`Remove product group ${index + 1}`}
                    >
                      <DeleteOutline sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}

          {/* Add Product Group button below existing groups */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={onAddProductGroup}
            disabled={typeof requiredCount === "number" && ruleProductGroups.length >= requiredCount}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              px: 3,
              py: 1.5,
              textTransform: "none",
              borderColor: "#FFAE80",
              color: "#FF782C",
              alignSelf: "flex-start",
              "&:hover": {
                borderColor: "#FF782C",
                bgcolor: "#FFF5EE",
              },
            }}
          >
            Add Product Group
          </Button>
        </Box>
      )}
    </div>
  );
};

ProductGroupsSection.propTypes = {
  show: PropTypes.bool,
  ruleProductGroups: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAddProductGroup: PropTypes.func.isRequired,
  onEditProductGroup: PropTypes.func.isRequired,
  onRemoveProductGroup: PropTypes.func.isRequired,
  requiredCount: PropTypes.number,
  isCountValid: PropTypes.bool,
};

const AddRuleModal = ({
  open = false,
  onClose,
  ruleCategory,
  attributeOptions = {},
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    ruleCategory: ruleCategory || RULE_CATEGORIES.ASSORTMENT,
    ruleType: "",
    subRule: "",
    metric: "",
    metricValue: "",
    interaction: "",
    parameter: "",
    inventorySelector: null,
    mandate: "",
  });

  const [isProductGroupModalOpen, setIsProductGroupModalOpen] = useState(false);
  const [editingProductGroupIndex, setEditingProductGroupIndex] =
    useState(null);
  // Local state for rule product groups (separate from EditPlanogramStep1 groups)
  const [ruleProductGroups, setRuleProductGroups] = useState([]);

  const planogramProducts = useSelector(selectPlanogramProducts);

  // Use full attribute options; do not narrow Add Rule selections by Step 1 scope
  const filteredAttributeOptions = attributeOptions;

  // Get available rule types based on category
  const availableRuleTypes =
    getRuleTypesByCategory(formData.ruleCategory) || [];

  // Get current rule configuration - ensure it's always an object
  const ruleConfig = getRuleConfig(formData.ruleCategory, formData.ruleType);
  const currentConfig =
    ruleConfig && typeof ruleConfig === "object"
      ? ruleConfig
      : {
          showAttributes: false,
          showProductGroups: false,
          showMetric: false,
          showInteraction: false,
        };

  const isComplementaryAssortment =
    formData.ruleCategory === RULE_CATEGORIES.ASSORTMENT &&
    formData.ruleType === "Complementary";
  const requiredProductGroupCount = isComplementaryAssortment ? 2 : null;
  const isProductGroupCountValid =
    !isComplementaryAssortment || ruleProductGroups.length === 2;

  // Update form data when ruleCategory prop changes
  useEffect(() => {
    if (ruleCategory) {
      setFormData((prev) => ({
        ...prev,
        ruleCategory: ruleCategory,
        ruleType: "", // Reset rule type when category changes
      }));
    }
  }, [ruleCategory]);

  // Reset rule type when category changes (handles manual category changes)
  useEffect(() => {
    const currentRuleTypes =
      getRuleTypesByCategory(formData.ruleCategory) || [];
    // If current ruleType is not in the available types for the current category, reset it
    if (formData.ruleType && !currentRuleTypes.includes(formData.ruleType)) {
      setFormData((prev) => ({
        ...prev,
        ruleType: "",
      }));
    }
  }, [formData.ruleCategory]);

  // Auto-select "Item (%)" metric when Overlap rule type is selected
  useEffect(() => {
    if (formData.ruleType === "Overlap" && formData.metric !== "Item (%)") {
      setFormData((prev) => ({
        ...prev,
        metric: "Item (%)",
      }));
    }
  }, [formData.ruleType]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        ruleCategory: ruleCategory || RULE_CATEGORIES.ASSORTMENT,
        ruleType: "",
        subRule: "",
        metric: "",
        metricValue: "",
        interaction: "",
        parameter: "",
        inventorySelector: null,
        mandate: "",
      });
      // Reset rule product groups when modal closes
      setRuleProductGroups([]);
      setEditingProductGroupIndex(null);
    }
  }, [open, ruleCategory]);

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleMerchandisingDataChange = (data) => {
    // Store merchandising-specific data in formData
    setFormData((prev) => ({
      ...prev,
      merchandisingData: data,
    }));
  };

  const buildRuleDataBase = () => ({
    rule_category: formData.ruleCategory, // "Assortment"
    type: formData.ruleType.toLowerCase(), // "complementary", "overlap", "coverage"
    group_name: "AQUAFRESH", // Hardcoded as requested
  });

  // Helper function to generate product group name from attributes
  const generateProductGroupName = (group) => {
    // Priority: brand first, then subcategory, then first available attribute value
    if (group.brands && Array.isArray(group.brands) && group.brands.length > 0) {
      return group.brands[0];
    }
    if (group.brand) {
      return Array.isArray(group.brand) ? group.brand[0] : group.brand;
    }
    if (group.subCategories && Array.isArray(group.subCategories) && group.subCategories.length > 0) {
      return group.subCategories[0];
    }
    if (group.subcategory) {
      return Array.isArray(group.subcategory) ? group.subcategory[0] : group.subcategory;
    }
    // Fallback: use first available attribute value
    const firstKey = Object.keys(group).find(key => {
      const value = group[key];
      return value !== null && value !== undefined && value !== "" && 
             (!Array.isArray(value) || value.length > 0);
    });
    if (firstKey) {
      const value = group[firstKey];
      return Array.isArray(value) ? value[0] : value;
    }
    return "Product Group";
  };

  const buildProductGroups = () => {
    if (!ruleProductGroups || ruleProductGroups.length === 0) return null;

    const attributeMap = {
      brands: "brand",
      subCategories: "subcategory",
      intensities: "intensity",
      benchmarks: "benchmark",
      platforms: "platform",
      needState: "needstate",
      bay: "bay",
      shelf: "shelf",
    };

    const productGroups = [];

    ruleProductGroups.forEach((group) => {
      if (!group || typeof group !== "object") return;

      const clauses = [];
      
      Object.keys(group).forEach((key) => {
        const value = group[key];
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return;
        }

        const apiAttribute = attributeMap[key] || key.toLowerCase();
        const valuesArray = Array.isArray(value) ? value : [value];

        clauses.push({
          attribute: apiAttribute,
          values: valuesArray,
        });
      });

      // Only add product group if it has at least one clause
      if (clauses.length > 0) {
        productGroups.push({
          name: generateProductGroupName(group),
          clauses: clauses,
        });
      }
    });

    return productGroups.length > 0 ? productGroups : null;
  };

  const normalizeInteraction = (interaction) => {
    if (!interaction) return null;
    if (interaction === "Non-Complementary") return "non-complementory";
    return interaction.toLowerCase();
  };

  const normalizeMetric = (metric) => {
    if (!metric) return null;
    const metricMap = {
      "Item count": "item count",
      "Item (%)": "item %",  // Fixed: space instead of parentheses
      "Facing Count": "facing count",
      "Facing (%)": "facing %",  // Fixed: space instead of parentheses
      "Share of Shelf": "share of shelf",
      "Absolute Shelf Space": "absolute shelf space",
    };
    return metricMap[metric] || metric.toLowerCase();
  };

  const applyRuleTypeFields = (ruleData) => {
    if (formData.ruleType === "Complementary") {
      const interaction = normalizeInteraction(formData.interaction);
      if (interaction) ruleData.interaction = interaction;
      return;
    }

    if (
      formData.ruleType === "Overlap" ||
      formData.ruleType === "Coverage" ||
      formData.ruleType === "Representation"
    ) {
      if (formData.parameter) {
        ruleData.parameter = formData.parameter.toLowerCase();
      }

      const metric = normalizeMetric(formData.metric);
      if (metric) ruleData.metric = metric;

      if (
        formData.metricValue !== null &&
        formData.metricValue !== undefined &&
        formData.metricValue !== ""
      ) {
        ruleData.value = Number(formData.metricValue);
      }
    }
  };

  const normalizeRuleType = (ruleData) => {
    // Fix type spelling: "Complementary" -> "complementory" (as per user's example)
    if (ruleData.type === "complementary") {
      ruleData.type = "complementory";
    }
  };

  const handleSubmit = () => {
    if (!isProductGroupCountValid) {
      return;
    }
    // Build rule data matching the exact API structure
    // Store in Redux exactly as it will be sent to API (transformation happens here)
    const ruleData = buildRuleDataBase();
    const productGroups = buildProductGroups();
    if (productGroups) ruleData.product_groups = productGroups;
    applyRuleTypeFields(ruleData);
    normalizeRuleType(ruleData);

    // Dispatch to Redux - stored in API format
    dispatch(addRule(ruleData));

    handleClose();
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProductGroup = () => {
    setEditingProductGroupIndex(null);
    setIsProductGroupModalOpen(true);
  };

  const handleEditSpecificProductGroup = (index) => {
    setEditingProductGroupIndex(index);
    setIsProductGroupModalOpen(true);
  };

  const handleRemoveSpecificProductGroup = (index) => {
    if (
      isProductGroupModalOpen &&
      typeof editingProductGroupIndex === "number" &&
      editingProductGroupIndex === index
    ) {
      setIsProductGroupModalOpen(false);
      setEditingProductGroupIndex(null);
    } else {
      setEditingProductGroupIndex((prevIdx) => {
        if (typeof prevIdx !== "number" || prevIdx < 0) return prevIdx;
        if (prevIdx > index) return prevIdx - 1;
        return prevIdx;
      });
    }

    setRuleProductGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCloseProductGroupModal = () => {
    setIsProductGroupModalOpen(false);
    setEditingProductGroupIndex(null);
  };

  const handleSubmitProductGroup = (selectedAttributes) => {
    // Store in array format (no transformation needed for local state)
    // The transform will happen when the rule is submitted
    const newProductGroup = selectedAttributes;

    if (editingProductGroupIndex !== null && editingProductGroupIndex >= 0) {
      // Update existing product group
      setRuleProductGroups((prev) => {
        const updated = [...prev];
        updated[editingProductGroupIndex] = newProductGroup;
        return updated;
      });
    } else {
      // Add new product group
      setRuleProductGroups((prev) => [...prev, newProductGroup]);
    }

    handleCloseProductGroupModal();
  };

  // Ensure open is always a boolean and onClose is a function
  const isOpen = Boolean(open);
  const safeOnClose = typeof onClose === "function" ? onClose : () => {};

  // Don't render if critical props are missing
  if (typeof onClose !== "function") {
    return null;
  }

  return (
    <>
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
          <div className="flex w-full items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-x-2 text-sm font-semibold text-[#FF9800]">
              <p>Add Rule</p>
            </div>
            <IconButton
              onClick={handleClose}
              aria-label="Close modal"
              size="small"
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Rule Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Rule</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormControl size="small" fullWidth>
                  <Select
                    value={formData.ruleCategory}
                    onChange={(e) =>
                      handleFormChange("ruleCategory", e.target.value)
                    }
                    displayEmpty
                    sx={SELECT_STYLES}
                  >
                    {Object.values(RULE_CATEGORIES).map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <Select
                    key={`rule-type-${formData.ruleCategory}`}
                    value={
                      availableRuleTypes.includes(formData.ruleType)
                        ? formData.ruleType
                        : ""
                    }
                    onChange={(e) =>
                      handleFormChange("ruleType", e.target.value)
                    }
                    displayEmpty
                    sx={SELECT_STYLES}
                    renderValue={(selected) => {
                      if (!selected || !availableRuleTypes.includes(selected)) {
                        return (
                          <span style={{ color: "#9ca3af" }}>
                            Select Rule Type
                          </span>
                        );
                      }
                      return selected;
                    }}
                  >
                    {availableRuleTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Product Groups Section - Only show for Assortment rules */}
            <ProductGroupsSection
              show={currentConfig.showProductGroups}
              ruleProductGroups={ruleProductGroups}
              onAddProductGroup={handleAddProductGroup}
              onEditProductGroup={handleEditSpecificProductGroup}
              onRemoveProductGroup={handleRemoveSpecificProductGroup}
              requiredCount={requiredProductGroupCount}
              isCountValid={isProductGroupCountValid}
            />

            {/* Merchandising Rule Form - Custom component for Merchandising category */}
            {formData.ruleCategory === RULE_CATEGORIES.MERCHANDISING &&
              currentConfig.useCustomComponent && (
                <MerchandisingRuleForm
                  ruleType={formData.ruleType}
                  onDataChange={handleMerchandisingDataChange}
                  attributeOptions={attributeOptions}
                />
              )}

            {/* Interaction Section - Only show when config says so (for Complementary) */}
            {currentConfig.showInteraction && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">
                  {currentConfig.interactionLabel || "Interaction"}
                </h3>
                <RadioGroup
                  value={formData.interaction}
                  onChange={(e) =>
                    handleFormChange("interaction", e.target.value)
                  }
                  row
                  sx={{ gap: 3 }}
                >
                  {currentConfig.interactionOptions?.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: "#222",
                            "&.Mui-checked": { color: "#222" },
                          }}
                        />
                      }
                      label={<Typography fontSize={13}>{option}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Parameter Section - Only show for Representation and Coverage */}
            {currentConfig.showParameter && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">Parameter</h3>
                <RadioGroup
                  value={formData.parameter}
                  onChange={(e) =>
                    handleFormChange("parameter", e.target.value)
                  }
                  row
                  sx={{ gap: 3 }}
                >
                  <FormControlLabel
                    value="Group"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#222",
                          "&.Mui-checked": { color: "#222" },
                        }}
                      />
                    }
                    label={<Typography fontSize={13}>Group</Typography>}
                  />
                  <FormControlLabel
                    value="Each"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#222",
                          "&.Mui-checked": { color: "#222" },
                        }}
                      />
                    }
                    label={<Typography fontSize={13}>Each</Typography>}
                  />
                </RadioGroup>
              </div>
            )}

            {/* Inventory Selector Section - Only show for Inventory rules */}
            {currentConfig.showInventorySelector && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">
                  {currentConfig.inventorySelectorLabel || "Select Value"}
                </h3>
                <Autocomplete
                  options={["1", "2", "3", "4", "5"]}
                  value={formData.inventorySelector}
                  onChange={(event, newValue) => {
                    handleFormChange("inventorySelector", newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select a number"
                      size="small"
                      sx={TEXT_FIELD_STYLES}
                    />
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </div>
            )}

            {/* Mandate Section - Only show for Inventory rules */}
            {currentConfig.showMandate && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">Mandate</h3>
                <RadioGroup
                  value={formData.mandate}
                  onChange={(e) => handleFormChange("mandate", e.target.value)}
                  row
                  sx={{ gap: 3 }}
                >
                  <FormControlLabel
                    value="0"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#222",
                          "&.Mui-checked": { color: "#222" },
                        }}
                      />
                    }
                    label={<Typography fontSize={13}>0</Typography>}
                  />
                  <FormControlLabel
                    value="1"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#222",
                          "&.Mui-checked": { color: "#222" },
                        }}
                      />
                    }
                    label={<Typography fontSize={13}>1</Typography>}
                  />
                </RadioGroup>
              </div>
            )}

            {/* Metric Section - Only show when config says so */}
            {currentConfig.showMetric && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3">Metric</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormControl size="small" fullWidth>
                    <Select
                      value={formData.metric}
                      onChange={(e) =>
                        handleFormChange("metric", e.target.value)
                      }
                      displayEmpty
                      disabled={formData.ruleType === "Overlap"} // Disable for Overlap (only one option)
                      sx={SELECT_STYLES}
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <span style={{ color: "#9ca3af" }}>Metric</span>
                          );
                        }
                        return selected;
                      }}
                    >
                      {(currentConfig.metricOptions || []).map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    placeholder="Metric Value"
                    value={formData.metricValue}
                    onChange={(e) =>
                      handleFormChange("metricValue", e.target.value)
                    }
                    size="small"
                    sx={TEXT_FIELD_STYLES}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex w-full justify-end p-4 border-t">
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!isProductGroupCountValid}
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
              Add Rule
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Add Product Group Modal - Render outside the main Modal */}
      {isProductGroupModalOpen && (
        <AddProductGroupModal
          open={isProductGroupModalOpen}
          onClose={handleCloseProductGroupModal}
          onSubmit={handleSubmitProductGroup}
          attributeOptions={filteredAttributeOptions || {}}
          planogramProducts={planogramProducts || []}
          hideDisabledOptions={true}
          initialValues={
            editingProductGroupIndex !== null &&
            editingProductGroupIndex >= 0 &&
            ruleProductGroups[editingProductGroupIndex] &&
            typeof ruleProductGroups[editingProductGroupIndex] === "object"
              ? ruleProductGroups[editingProductGroupIndex]
              : null
          }
          editingIndex={editingProductGroupIndex}
        />
      )}
    </>
  );
};

AddRuleModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  ruleCategory: PropTypes.string,
  attributeOptions: PropTypes.object,
};

export default AddRuleModal;

