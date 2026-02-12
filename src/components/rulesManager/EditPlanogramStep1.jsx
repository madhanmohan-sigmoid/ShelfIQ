import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormGroup,
  Checkbox,
  TextField,
  Chip,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import AddProductGroupModal from "../Modals/AddProductGroupModal";
import ReviewSelectionsModal from "../Modals/ReviewSelectionsModal";
import { Add } from "@mui/icons-material";

const npdCheckboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const npdCheckedIcon = <CheckBoxIcon fontSize="small" />;
import { useSelector, useDispatch } from "react-redux";
import {
  selectPlanogramProducts,
  selectPlanogramId,
  setRulesManagerPayload,
} from "../../redux/reducers/planogramVisualizerSlice";
import { selectAllProducts } from "../../redux/reducers/productDataSlice";
import {
  getProductDisplayLabel,
  calculateUniqueProductsCount,
  calculateOtherClustersCount,
  getNPDProductsOptions,
  getDelistedProductsOptions,
  getDelistedTPNBSet,
  calculateBaseProducts,
  filterProductsByScopeProductGroups,
  getProductUniqueKey,
  DECIMAL_PATTERN,
  TEXT_FIELD_STYLES,
} from "../../utils/editPlanogramStep1Utils";
import { getNpdProducts, getDelistedProducts } from "../../api/api";
import toast from "react-hot-toast";

const scopesDescription =
  "No product groups available. Add one to see the combinations.";

function EditPlanogramStep1({
  objective,
  setObjective,
  assortmentOptions,
  setAssortmentOptions,
  attributeOptions,
  onValidationChange,
}) {
  const [reviewSelectionsOpen, setReviewSelectionsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weightedSalesValue, setWeightedSalesValue] = useState("");
  const [weightedSalesVolume, setWeightedSalesVolume] = useState("");
  const [baseProducts, setBaseProducts] = useState([]); // Products from checkbox selections
  const [manualSelectionKeys, setManualSelectionKeys] = useState(null); // Set of manually selected product keys (null = no manual selection yet)
  const [productGroups, setProductGroups] = useState([]); // Array of product group objects
  const [selectedNPDProducts, setSelectedNPDProducts] = useState([]); // Array of manually selected NPD products
  const [selectedDelistedProducts, setSelectedDelistedProducts] = useState([]); // Array of manually selected delisted products
  
  // State for API data
  const [npdApiProducts, setNpdApiProducts] = useState([]);
  const [delistedApiProducts, setDelistedApiProducts] = useState([]);
  
  // Determine initial objective case based on objective prop
  const getInitialContributionWeight = () => {
    if (objective === "maximize-value") return 1;
    if (objective === "maximize-volume") return 0;
    return null;
  };

  const [objectiveState, setObjectiveState] = useState({
    contribution_weight: getInitialContributionWeight(),
  });
  const planogramProducts = useSelector(selectPlanogramProducts);
  const planogramId = useSelector(selectPlanogramId);
  const allProducts = useSelector(selectAllProducts);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Sync objectiveState when objective prop changes (only on mount or when objective changes externally)
  useEffect(() => {
    if (objective === "maximize-value") {
      const newState = { contribution_weight: 1 };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    } else if (objective === "maximize-volume") {
      const newState = { contribution_weight: 0 };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    } else if (objective === "contribution") {
      // Only update if weightedSalesValue exists, otherwise keep current state
      if (weightedSalesValue) {
        const numValue = Number.parseFloat(weightedSalesValue);
        if (!Number.isNaN(numValue)) {
          const newState = { contribution_weight: numValue };
          setObjectiveState(newState);
          console.log("Objective State:", newState);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective]);

  // Calculate unique products count based on id and tpnb
  const uniqueProductsCount = useMemo(() => {
    return calculateUniqueProductsCount(planogramProducts);
  }, [planogramProducts]);

  // Calculate products not in planogram (items from other clusters)
  const otherClustersCount = useMemo(() => {
    return calculateOtherClustersCount(allProducts, planogramProducts);
  }, [allProducts, planogramProducts]);

  // Fetch NPD and delisted products from API (no mock fallbacks)
  useEffect(() => {
    const fetchNPDProducts = async () => {
      try {
        const response = await getNpdProducts();
        const apiData = response?.data?.data;
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          setNpdApiProducts(apiData);
        } else {
          // No valid API data: keep empty and clear selections to avoid stale state
          setNpdApiProducts([]);
          setSelectedNPDProducts([]);
        }
      } catch (error) {
        console.error("Error fetching NPD products:", error);
        // No fallback: keep empty and clear selections
        setNpdApiProducts([]);
        setSelectedNPDProducts([]);
      }
    };

    const fetchDelistedProducts = async () => {
      try {
        const response = await getDelistedProducts();
        const apiData = response?.data?.data;
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          setDelistedApiProducts(apiData);
          setSelectedDelistedProducts(
            getDelistedProductsOptions(apiData, allProducts)
          );
        } else {
          // No valid API data: keep empty and clear selections to avoid stale state
          setDelistedApiProducts([]);
          setSelectedDelistedProducts([]);
        }
      } catch (error) {
        console.error("Error fetching delisted products:", error);
        // No fallback: keep empty and clear selections
        setDelistedApiProducts([]);
        setSelectedDelistedProducts([]);
      }
    };

    fetchNPDProducts();
    fetchDelistedProducts();
  }, []);

  // Get NPD products options from API data
  const npdProductsOptions = useMemo(() => {
    // IMPORTANT: NPD dropdown should be API-only (no fallback to allProducts)
    return getNPDProductsOptions(npdApiProducts, null);
  }, [npdApiProducts]);

  // Get delisted TPNB set for filtering
  const delistedTPNBSet = useMemo(() => {
    return getDelistedTPNBSet(delistedApiProducts);
  }, [delistedApiProducts]);

  // Calculate base products based on checkbox selections (without manual filtering)
  useEffect(() => {
    const unscopedBaseProducts = calculateBaseProducts({
      assortmentOptions,
      planogramProducts,
      allProducts,
      selectedNPDProducts,
      selectedDelistedProducts,
      delistedTPNBSet, // Pass delisted TPNB set for filtering
    });

    // Apply Scope (product groups) filtering on top of Assortment filtering
    const scopeFilteredProducts = filterProductsByScopeProductGroups(
      unscopedBaseProducts,
      productGroups
    );

    // Important: always include explicitly selected NPD products in the manual selection list
    // even if scope filtering would exclude them (explicit selection should win).
    const mergedByKey = new Map();
    scopeFilteredProducts.forEach((p) => {
      const k = getProductUniqueKey(p);
      if (k) mergedByKey.set(k, p);
    });
    selectedNPDProducts.forEach((p) => {
      const k = getProductUniqueKey(p);
      if (k) mergedByKey.set(k, p);
    });
    const finalBaseProducts = Array.from(mergedByKey.values());

    console.log(
      "Base products updated (assortment + scope):",
      finalBaseProducts
    );
    console.log("Total base products count:", finalBaseProducts.length);
    setBaseProducts(finalBaseProducts);
    
    // Reset manual selections when base products change (checkbox selections changed)
    // Only reset if it's not just NPD products being added
    // We'll preserve manual selections when NPD products are selected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    assortmentOptions.existingItems,
    assortmentOptions.otherClusters,
    assortmentOptions.removeDelistedItems,
    selectedNPDProducts,
    selectedDelistedProducts,
    delistedTPNBSet, // Add to dependencies
    productGroups,
    planogramProducts,
    allProducts,
  ]);

  // Clear NPD selections when the toggle is turned off (so base list updates too)
  useEffect(() => {
    if (!assortmentOptions?.npdPlus && selectedNPDProducts.length > 0) {
      setSelectedNPDProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assortmentOptions?.npdPlus]);

  // If scope/assortment changes shrink the base list, clamp manual selections to still-visible products
  useEffect(() => {
    if (!(manualSelectionKeys instanceof Set)) return;
    if (!Array.isArray(baseProducts) || baseProducts.length === 0) return;

    const allowedKeys = new Set(
      baseProducts.map((p) => getProductUniqueKey(p)).filter(Boolean)
    );
    const next = new Set(
      Array.from(manualSelectionKeys).filter((k) => allowedKeys.has(k))
    );

    // Avoid state updates if no change
    if (next.size === manualSelectionKeys.size) return;
    setManualSelectionKeys(next);
  }, [baseProducts, manualSelectionKeys]);


  // Build and dispatch rulesManagerPayload to Redux
  useEffect(() => {
    // Build scope as array of { attribute, values } (merged across all product groups)
    const buildScopeFromProductGroups = (groups) => {
      if (!Array.isArray(groups)) return [];

      const attributeMap = {
        brands: "brand",
        brand: "brand",
        subCategories: "subgroup",
        subcategory: "subgroup",
        intensities: "intensity",
        benchmarks: "benchmark",
        platforms: "platform",
        needState: "needstate",
        bay: "bay",
        shelf: "shelf",
      };

      const merged = new Map(); // attribute -> Set(values)

      // Helper function to add a single value to merged map
      const addValueToMerged = (mappedAttr, value) => {
        if (value === null || value === undefined || value === "") return;
        if (!merged.has(mappedAttr)) merged.set(mappedAttr, new Set());
        merged.get(mappedAttr).add(value);
      };

      // Helper function to add multiple values to merged map
      const addValuesToMerged = (mappedAttr, valuesArray) => {
        for (const value of valuesArray) {
          addValueToMerged(mappedAttr, value);
        }
      };

      // Helper function to process a single attribute key-value pair
      const processAttribute = (key, value) => {
        const mappedAttr = attributeMap[key] || key.toLowerCase();
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return;
        }
        const valuesArray = Array.isArray(value) ? value : [value];
        addValuesToMerged(mappedAttr, valuesArray);
      };

      // Helper function to process a single group
      const processGroup = (group) => {
        if (!group || typeof group !== "object") return;
        const keys = Object.keys(group);
        for (const key of keys) {
          processAttribute(key, group[key]);
        }
      };

      for (const group of groups) {
        processGroup(group);
      }

      return Array.from(merged.entries()).map(([attribute, set]) => ({
        attribute,
        values: Array.from(set),
      }));
    };

    const scopeAsAttributes = buildScopeFromProductGroups(productGroups);

    // Calculate manual_selection - send only TPNB values as an array of strings
    // If manualSelectionKeys is null, all baseProducts are selected, so send empty array
    // If manualSelectionKeys is a Set, send only the TPNBs of products that are in the Set
    let manualSelection = [];
    if (manualSelectionKeys !== null && manualSelectionKeys instanceof Set) {
      const selectedProducts = baseProducts.filter((product) => {
        const uniqueKey = getProductUniqueKey(product);
        return uniqueKey && manualSelectionKeys.has(uniqueKey);
      });
      // Extract only TPNB values as strings
      manualSelection = selectedProducts
        .map((product) => product?.tpnb)
        .filter((tpnb) => tpnb != null)
        .map(String); // Ensure all TPNBs are strings
    }

    // NPD payload: array of TPNBs (like delisted)
    const buildNpdTpnbArray = (products) => {
      if (!Array.isArray(products)) return [];
      return products
        .map((p) => Number(p?.tpnb || 0))
        .filter((tpnb) => !!tpnb);
    };


    // Build sku_to_delist only if "Remove delisted items" is checked
    const buildSkuToDelist = (products) => {
      if (!assortmentOptions.removeDelistedItems) return [];
      return products
        .map(p => Number(p.tpnb || 0))
        .filter(tpnb => !!tpnb);
    };

    // Build the payload in line with required structure
    const hasManualSelection =
      Array.isArray(manualSelection) && manualSelection.length > 0;

    // item_in_cluster_flag should always be true
    const itemInClusterFlag = true;
    const itemOutsideClusterFlag = hasManualSelection
      ? false
      : !!assortmentOptions.otherClusters; // was items_from_other_clusters

    const npdDataValue = hasManualSelection
      ? []
      : buildNpdTpnbArray(selectedNPDProducts);
    const skuToDelistValue = hasManualSelection
      ? []
      : buildSkuToDelist(selectedDelistedProducts);

    const payload = {
      scope: scopeAsAttributes,
      objective: {
        contribution_weight: objectiveState.contribution_weight,
      },
      assortment: {
        item_in_cluster_flag: itemInClusterFlag,
        item_outside_cluster_flag: itemOutsideClusterFlag,
        manual_selection: manualSelection, // same
        npd_data: npdDataValue,
        sku_to_delist: skuToDelistValue,
      },
      planogram_id: planogramId || null,
      DOS: 7,
      country: null,
      category: null,
      email: user?.email || null,
    };


    // Dispatch to Redux
    dispatch(setRulesManagerPayload(payload));
    console.log("Rules Manager Payload updated:", payload);
  }, [
    productGroups,
    objectiveState,
    selectedNPDProducts,
    assortmentOptions.removeDelistedItems,
    assortmentOptions.existingItems,
    assortmentOptions.otherClusters,
    baseProducts,
    manualSelectionKeys,
    user?.email,
    dispatch,
  ]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddProductGroup = (selectedAttributes) => {
    // Transform selectedAttributes to product group object format
    // selectedAttributes is an object like: { brands: ["COLGATE"], subCategories: ["TOOTHPASTE"], ... }
    setProductGroups((prev) => [...prev, selectedAttributes]);
    handleCloseModal();
  };

  // Validation: Step 1 is valid if at least one product group exists AND an objective is selected
  const validationState = useMemo(() => {
    const hasProductGroups = productGroups.length > 0;
    const hasObjective = Boolean(objective);
    return {
      isValid: hasProductGroups && hasObjective,
      hasProductGroups,
      hasObjective,
    };
  }, [productGroups.length, objective]);

  // Expose validation state to parent
  useEffect(() => {
    if (typeof onValidationChange === "function") {
      onValidationChange(validationState);
    }
  }, [validationState, onValidationChange]);

  // Render compact tags for NPD autocomplete (similar to AddProductGroupModal)
  const renderNPDCompactTags = (selected = [], getTagProps = () => ({})) => {
    const visible = selected.filter(
      (value) => value !== null && value !== undefined
    );
    if (visible.length === 0) return null;

    const [firstValue, ...rest] = visible;
    const label = getProductDisplayLabel(firstValue);
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

  // Helper function to handle objective radio change
  const handleObjectiveChange = (selectedValue) => {
    setObjective(selectedValue);
    
    if (selectedValue === "maximize-value") {
      const newState = { contribution_weight: 1 };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    } else if (selectedValue === "maximize-volume") {
      const newState = { contribution_weight: 0 };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    } else if (selectedValue === "contribution") {
      // If weightedSalesValue exists and is valid, use it; otherwise set to null
      const numValue = weightedSalesValue ? Number.parseFloat(weightedSalesValue) : null;
      const newState = { 
        contribution_weight: (numValue !== null && !Number.isNaN(numValue) && numValue >= 0 && numValue <= 1) ? numValue : null
      };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    }
  };

  // Helper function to handle weighted sales value change
  const handleWeightedSalesValueChange = (v) => {
    // Allow empty string
    if (v === "") {
      setWeightedSalesValue("");
      setWeightedSalesVolume("");
      const newState = { contribution_weight: null };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
      return;
    }
    
    // Check if it matches the decimal pattern (allows 0-1 range)
    // Allow: empty, single digit 0-1, decimal numbers like 0.5, 0.99, etc.
    if (!/^[01]?(\.\d*)?$/.test(v)) {
      return;
    }

    const numValue = Number.parseFloat(v);
    
    // Allow partial input like "0." or "." or "1."
    if (v.endsWith(".") || v === ".") {
      setWeightedSalesValue(v);
      return;
    }
    
    // Validate that value is not greater than 1
    if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setWeightedSalesValue(v);
      // Auto-fill the other field
      const otherValue = (1 - numValue).toFixed(1);
      setWeightedSalesVolume(otherValue);
      
      // Update objective state
      const newState = { case: "contribution", value: numValue };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    }
  };

  // Helper function to handle weighted sales volume change
  const handleWeightedSalesVolumeChange = (v) => {
    // Allow empty string
    if (v === "") {
      setWeightedSalesValue("");
      setWeightedSalesVolume("");
      const newState = { contribution_weight: null };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
      return;
    }
    
    // Check if it matches the decimal pattern (allows 0-1 range)
    // Allow: empty, single digit 0-1, decimal numbers like 0.5, 0.99, etc.
    if (!/^[01]?(\.\d*)?$/.test(v)) {
      return;
    }

    const numValue = Number.parseFloat(v);
    
    // Allow partial input like "0." or "." or "1."
    if (v.endsWith(".") || v === ".") {
      setWeightedSalesVolume(v);
      return;
    }
    
    // Validate that value is not greater than 1
    if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      setWeightedSalesVolume(v);
      // Auto-fill the other field
      const otherValue = (1 - numValue).toFixed(1);
      setWeightedSalesValue(otherValue);
      
      // Update objective state (use weighted sales value)
      const newState = { contribution_weight: Number.parseFloat(otherValue) };
      setObjectiveState(newState);
      console.log("Objective State:", newState);
    }
  };

  // Helper function to render chip with multiple values
  const renderMultiValueChip = (values, labelPrefix = "") => {
    if (values.length === 0) return null;
    
    const [firstValue, ...rest] = values;
    const displayLabel = rest.length > 0 
      ? `${firstValue} +${rest.length}` 
      : firstValue;
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
    <Box>
      <Box sx={{ mb: 2, p: 2, bgcolor: "white", borderRadius: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1" fontSize={14} fontWeight={600}>
              Scope
            </Typography>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: "#D1D5DB" }} />
          </Box>
          <Button
            variant="contained"
            onClick={handleOpenModal}
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            sx={{
              fontWeight: 600,
              borderRadius: 10,
              px: 3,
              py: 1.5,
              border: "none",
              bgcolor: "#FFAE80",
              color: "black",
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            Add Product Group
          </Button>
        </Box>
        <Typography fontSize={12} fontWeight={600} mb={0.75}>
          Product Groups
        </Typography>
        {productGroups.length === 0 ? (
          <Box
            bgcolor="#FFDDCA"
            borderRadius={1.5}
            p={1.5}
            display="flex"
            alignItems="center"
            gap={1.5}
            border={"1px solid #FFD7BA"}
            width="fit-content"
          >
            <WarningAmberIcon sx={{ fontSize: 18, color: "#FF782C" }} />
            <Typography color="#B65A18" fontSize={12}>
              {scopesDescription}
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
            {productGroups.map((productGroup, index) => {
              // Extract arrays directly from productGroup
              let subCategories;
              if (Array.isArray(productGroup.subCategories)) {
                subCategories = productGroup.subCategories;
              } else if (productGroup.subcategory) {
                subCategories = [productGroup.subcategory];
              } else {
                subCategories = [];
              }
              
              let brands;
              if (Array.isArray(productGroup.brands)) {
                brands = productGroup.brands;
              } else if (productGroup.brand) {
                brands = [productGroup.brand];
              } else {
                brands = [];
              }
              
              // Skip if no display values
              if (subCategories.length === 0 && brands.length === 0) return null;
              
              // Create a unique key combining index with first values for stability
              const groupKey = `pg-${index}-${subCategories[0] || ''}-${brands[0] || ''}`;
              
              return (
                <Box
                  key={groupKey}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Typography fontSize={12} fontWeight={600} color="#222">
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
              );
            })}
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 2, p: 2, bgcolor: "white", borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
          <Typography variant="subtitle1" fontSize={14} fontWeight={600}>
            Objective
          </Typography>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: "#D1D5DB" }} />
        </Box>
        <RadioGroup
          value={objective}
          onChange={(e) => handleObjectiveChange(e.target.value)}
          sx={{ gap: 1 }}
        >
          <FormControlLabel
            value="maximize-value"
            control={
              <Radio
                size="small"
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={<Typography fontSize={13}>Maximize Sales Value</Typography>}
            sx={{ width: "fit-content", alignSelf: "flex-start" }}
          />
          <FormControlLabel
            value="maximize-volume"
            control={
              <Radio
                size="small"
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={<Typography fontSize={13}>Maximize Sales Volume</Typography>}
            sx={{ width: "fit-content", alignSelf: "flex-start" }}
          />
          <FormControlLabel
            value="contribution"
            control={
              <Radio
                size="small"
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={3}>
                <Typography fontSize={13} sx={{ pointerEvents: "none" }}>
                  Contribution (Weighted Sales Value & Volume)
                </Typography>
                {objective === "contribution" && (
                  <>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        fontSize={12}
                        color="text.secondary"
                        sx={{ pointerEvents: "none" }}
                      >
                        Weighted Sales Value
                      </Typography>
                      <TextField
                        type="text"
                        value={weightedSalesValue}
                        onChange={(e) => handleWeightedSalesValueChange(e.target.value)}
                        size="small"
                        inputProps={{
                          inputMode: "decimal",
                          pattern: DECIMAL_PATTERN,
                        }}
                        sx={{ width: 80, ...TEXT_FIELD_STYLES }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        fontSize={12}
                        color="text.secondary"
                        sx={{ pointerEvents: "none" }}
                      >
                        Weighted Sales Volume
                      </Typography>
                      <TextField
                        type="text"
                        value={weightedSalesVolume}
                        onChange={(e) => handleWeightedSalesVolumeChange(e.target.value)}
                        size="small"
                        inputProps={{
                          inputMode: "decimal",
                          pattern: DECIMAL_PATTERN,
                        }}
                        sx={{ width: 80, ...TEXT_FIELD_STYLES }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </Box>
                  </>
                )}
              </Box>
            }
            sx={{ width: "fit-content", alignSelf: "flex-start" }}
          />
        </RadioGroup>
      </Box>

      <Box sx={{ mb: 2, p: 2, bgcolor: "white", borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
          <Typography variant="subtitle1" fontSize={14} fontWeight={600}>
            Assortment
          </Typography>
          <InfoOutlinedIcon sx={{ fontSize: 16, color: "#D1D5DB" }} />
        </Box>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={assortmentOptions.npdPlus}
                onChange={(e) =>
                  setAssortmentOptions({
                    ...assortmentOptions,
                    npdPlus: e.target.checked,
                  })
                }
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography fontSize={13} fontWeight={500}>
                  Include NPD Flag
                </Typography>
                {assortmentOptions.npdPlus && (
                  <Autocomplete
                    multiple
                    size="small"
                    limitTags={1}
                    getLimitTagsText={(more) => `+${more}`}
                    disableCloseOnSelect
                    options={npdProductsOptions}
                    value={selectedNPDProducts}
                    onChange={(event, newValue) => {
                      setSelectedNPDProducts(newValue);
                    }}
                    getOptionLabel={(option) => getProductDisplayLabel(option)}
                    isOptionEqualToValue={(option, value) => {
                      return getProductUniqueKey(option) === getProductUniqueKey(value);
                    }}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                          <Checkbox
                            icon={npdCheckboxIcon}
                            checkedIcon={npdCheckedIcon}
                            checked={selected}
                            sx={{ mr: 1 }}
                          />
                          <span style={{ fontSize: "0.8125rem" }}>
                            {getProductDisplayLabel(option)}
                          </span>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select NPD products..."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      renderNPDCompactTags(value, getTagProps)
                    }
                    sx={{ minWidth: 300, maxWidth: 600 }}
                    ListboxProps={{
                      sx: {
                        "& .MuiAutocomplete-option": {
                          fontSize: "0.8125rem",
                        },
                      },
                    }}
                  />
                )}
              </Box>
            }
            sx={{ width: "fit-content", alignSelf: "flex-start", margin: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={assortmentOptions.removeDelistedItems}
                onChange={(e) => {
                  setAssortmentOptions({
                    ...assortmentOptions,
                    removeDelistedItems: e.target.checked,
                  });
                }}
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={
              <Typography fontSize={13} fontWeight={500}>
                Remove delisted items
              </Typography>
            }
            sx={{ width: "fit-content", alignSelf: "flex-start", margin: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={true}
                disabled={true}
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography fontSize={13} fontWeight={500}>
                  Existing items on the planogram
                </Typography>
                <Chip
                  label={uniqueProductsCount}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: "#FFDDCA",
                    color: "#B65A18",
                    border: "1px solid #FFD7BA",
                    "& .MuiChip-label": {
                      px: 1,
                    },
                  }}
                />
              </Box>
            }
            sx={{ width: "fit-content", alignSelf: "flex-start", margin: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={assortmentOptions.otherClusters}
                onChange={(e) =>
                  setAssortmentOptions({
                    ...assortmentOptions,
                    otherClusters: e.target.checked,
                  })
                }
                sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography fontSize={13} fontWeight={500}>
                  Items from other clusters
                </Typography>
                {assortmentOptions.otherClusters && (
                  <Chip
                    label={otherClustersCount}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: "#FFDDCA",
                      color: "#B65A18",
                      border: "1px solid #FFD7BA",
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                )}
              </Box>
            }
            sx={{ width: "fit-content", alignSelf: "flex-start", margin: 0 }}
          />
        </FormGroup>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
          <Button
            variant="text"
            size="small"
            onClick={() => setReviewSelectionsOpen(true)}
            sx={{
              color: "#FF782C",
              fontWeight: 600,
              fontSize: 12,
              textTransform: "none",
            }}
          >
            Review Selections
          </Button>
        </Box>
          {/* ReviewSelectionsModal included below */}
      </Box>

      <AddProductGroupModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddProductGroup}
        attributeOptions={attributeOptions}
        planogramProducts={planogramProducts}
      />
      <ReviewSelectionsModal
        open={reviewSelectionsOpen}
        onClose={() => setReviewSelectionsOpen(false)}
        onApply={(selectedItems) => {
          // Store manual selections as a Set of product keys
          const selectedKeys = new Set(
            selectedItems.map((item) => getProductUniqueKey(item)).filter(Boolean)
          );
          console.log("Updating manual selections:", selectedKeys);
          console.log("Total manually selected items:", selectedKeys.size);
          setManualSelectionKeys(selectedKeys);
          setReviewSelectionsOpen(false);
        }}
        products={baseProducts}
        preSelectedKeys={manualSelectionKeys}
      />
    </Box>
  );
}

EditPlanogramStep1.propTypes = {
  objective: PropTypes.string.isRequired,
  setObjective: PropTypes.func.isRequired,
  assortmentOptions: PropTypes.shape({
    npdPlus: PropTypes.bool,
    removeDelistedItems: PropTypes.bool,
    existingItems: PropTypes.bool,
    otherClusters: PropTypes.bool,
  }).isRequired,
  setAssortmentOptions: PropTypes.func.isRequired,
  existingItemsCount: PropTypes.number.isRequired,
  setExistingItemsCount: PropTypes.func.isRequired,
  onManualSelectionClick: PropTypes.func,
  attributeOptions: PropTypes.object,
  onValidationChange: PropTypes.func,
};

export default EditPlanogramStep1;
