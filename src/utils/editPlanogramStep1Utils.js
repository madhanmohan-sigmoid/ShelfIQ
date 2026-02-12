/**
 * Utility functions for EditPlanogramStep1 component
 */

/**
 * Creates a unique key for a product using id and tpnb
 * @param {Object} product - Product object with id and tpnb
 * @param {string|null} product.id - Product ID (can be null for API products)
 * @param {string} product.tpnb - Product TPNB
 * @returns {string|null} Unique key in format "id_tpnb" or "null_tpnb" if id is null
 */
export const getProductUniqueKey = (product) => {
  if (!product?.tpnb) return null;
  // Handle null id case (for API products without id)
  const id = product.id ?? null;
  return `${id}_${product.tpnb}`;
};

/**
 * Extracts product data from planogram products
 * @param {Object} product - Planogram product object
 * @param {Object} product.product_details - Product details object
 * @returns {Object|null} Extracted product data or null if invalid
 */
export const extractPlanogramProductData = (product) => {
  const details = product.product_details;
  if (!(details?.id && details?.tpnb)) return null;
  return {
    id: details.id,
    name: details.name || "",
    tpnb: details.tpnb,
    brand_name: details.brand_name || "",
    subCategory_name: details.subCategory_name || "",
    INTENSITY: details?.["INTENSITY"] ?? null,
    PLATFORM: details?.["PLATFORM"] ?? null,
    BENCHMARK: details?.["BENCHMARK"] ? 1 : 0,
    PROMOITEM: details?.["PROMOITEM"] ? 1 : 0,
    NPD: details.NPD || false,
    delisted: details.delisted || false,
    // These exist on planogram products (not on all products)
    bay: product?.bay ?? null,
    shelf: product?.shelf ?? null,
  };
};

/**
 * Extracts product data from all products
 * @param {Object} product - Product object
 * @returns {Object|null} Extracted product data or null if invalid
 */
export const extractAllProductData = (product) => {
  if (!(product?.id && product?.tpnb)) return null;
  return {
    id: product.id,
    name: product.name || "",
    tpnb: product.tpnb,
    brand_name: product.brand_name || "",
    subCategory_name: product.subCategory_name || "",
    INTENSITY: product?.["INTENSITY"] ?? product?.INTENSITY ?? null,
    PLATFORM: product?.["PLATFORM"] ?? product?.PLATFORM ?? null,
    BENCHMARK: (product?.["BENCHMARK"] ?? product?.BENCHMARK) ? 1 : 0,
    PROMOITEM: (product?.["PROMOITEM"] ?? product?.PROMOITEM) ? 1 : 0,
    NPD: product.NPD || false,
    delisted: product.delisted || false,
  };
};

/**
 * Filters a flat product list by Step 1 scope product groups.
 *
 * Logic:
 * - OR across product groups (product can match any group)
 * - AND within a group across attributes present in that group
 *
 * @param {Array<Object>} products - Flat products (from calculateBaseProducts)
 * @param {Array<Object>} productGroups - Scope product groups from Step 1
 * @returns {Array<Object>} Filtered products
 */
export const filterProductsByScopeProductGroups = (
  products = [],
  productGroups = []
) => {
  if (!Array.isArray(products) || products.length === 0) return [];
  if (!Array.isArray(productGroups) || productGroups.length === 0) {
    // No scope defined yet -> don't reduce the list
    return products;
  }

  const normalizeText = (v) => {
    if (v === null || v === undefined) return "";
    return String(v).trim().toLowerCase();
  };

  const normalizeArray = (value) => {
    if (value === null || value === undefined || value === "") return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
  };

  const matchesGroup = (product, group) => {
    if (!group || typeof group !== "object") return false;

    const selectedBrands = normalizeArray(group.brands ?? group.brand).map(
      normalizeText
    );
    const selectedSubCats = normalizeArray(
      group.subCategories ?? group.subcategory
    ).map(normalizeText);
    const selectedIntensities = normalizeArray(
      group.intensities ?? group.intensity
    ).map(normalizeText);
    const selectedPlatforms = normalizeArray(
      group.platforms ?? group.platform
    ).map(normalizeText);

    // Benchmarks are stored as [0,1] flags in the modal
    const selectedBenchmarks = normalizeArray(group.benchmarks ?? group.benchmark);

    // bay/shelf are stored as arrays of strings in AddProductGroupModal
    const selectedBays = normalizeArray(group.bay);
    const selectedShelves = normalizeArray(group.shelf);

    const productBrand = normalizeText(product?.brand_name);
    const productSubCat = normalizeText(product?.subCategory_name);
    const productIntensity = normalizeText(product?.INTENSITY);
    const productPlatform = normalizeText(product?.PLATFORM);

    const brandMatch =
      selectedBrands.length === 0 || selectedBrands.includes(productBrand);
    const subCatMatch =
      selectedSubCats.length === 0 ||
      selectedSubCats.includes(productSubCat);

    const intensityMatch =
      selectedIntensities.length === 0 ||
      selectedIntensities.includes(productIntensity);
    const platformMatch =
      selectedPlatforms.length === 0 ||
      selectedPlatforms.includes(productPlatform);

    const benchmarkMatch =
      selectedBenchmarks.length === 0 ||
      selectedBenchmarks.includes(product?.BENCHMARK ?? 0);

    const bayValue =
      product?.bay === null || product?.bay === undefined
        ? undefined
        : String(product.bay);
    const shelfValue =
      product?.shelf === null || product?.shelf === undefined
        ? undefined
        : String(product.shelf);

    const bayMatch =
      selectedBays.length === 0 || selectedBays.includes(bayValue);
    const shelfMatch =
      selectedShelves.length === 0 || selectedShelves.includes(shelfValue);

    return (
      brandMatch &&
      subCatMatch &&
      intensityMatch &&
      platformMatch &&
      benchmarkMatch &&
      bayMatch &&
      shelfMatch
    );
  };

  return products.filter((p) => productGroups.some((g) => matchesGroup(p, g)));
};

/**
 * Formats product display label for autocomplete
 * @param {Object} product - Product object
 * @returns {string} Formatted display label
 */
export const getProductDisplayLabel = (product) => {
  const parts = [];
  if (product?.tpnb) parts.push(product.tpnb);
  if (product?.name) parts.push(product.name);
  return parts.length > 0 ? parts.join("_") : "Unknown Product";
};

/**
 * Calculates unique products count based on id and tpnb
 * @param {Array} planogramProducts - Array of planogram products
 * @returns {number} Count of unique products
 */
export const calculateUniqueProductsCount = (planogramProducts) => {
  if (!planogramProducts || planogramProducts.length === 0) return 0;
  
  const uniqueSet = new Set();
  planogramProducts.forEach((product) => {
    const productDetails = product.product_details;
    if (productDetails?.id && productDetails?.tpnb) {
      const uniqueKey = getProductUniqueKey(productDetails);
      if (uniqueKey) {
        uniqueSet.add(uniqueKey);
      }
    }
  });
  
  return uniqueSet.size;
};

/**
 * Calculates products not in planogram (items from other clusters)
 * @param {Array} allProducts - Array of all products
 * @param {Array} planogramProducts - Array of planogram products
 * @returns {number} Count of products not in planogram
 */
export const calculateOtherClustersCount = (allProducts, planogramProducts) => {
  if (!allProducts || allProducts.length === 0) return 0;
  
  if (!planogramProducts || planogramProducts.length === 0) {
    // If no planogram products, all products are "other clusters"
    const uniqueSet = new Set();
    allProducts.forEach((product) => {
      const uniqueKey = getProductUniqueKey(product);
      if (uniqueKey) {
        uniqueSet.add(uniqueKey);
      }
    });
    return uniqueSet.size;
  }

  // Create a set of unique planogram products (id_tpnb)
  const planogramSet = new Set();
  planogramProducts.forEach((product) => {
    const productDetails = product.product_details;
    const uniqueKey = getProductUniqueKey(productDetails);
    if (uniqueKey) {
      planogramSet.add(uniqueKey);
    }
  });

  // Find products not in planogram
  const otherClustersSet = new Set();
  allProducts.forEach((product) => {
    const uniqueKey = getProductUniqueKey(product);
    if (uniqueKey && !planogramSet.has(uniqueKey)) {
      otherClustersSet.add(uniqueKey);
    }
  });

  return otherClustersSet.size;
};

/**
 * Transforms NPD API response to product structure
 * @param {Object} apiProduct - Product from NPD API response
 * @returns {Object|null} Transformed product object
 */
export const transformNPDProductFromAPI = (apiProduct) => {
  if (!apiProduct?.tpnb) return null;
  return {
    id: null, // API doesn't provide id
    name: apiProduct.name || "",
    tpnb: String(apiProduct.tpnb), // Ensure string
    brand_name: apiProduct.brand || "",
    subCategory_name: apiProduct.subgroup || "",
    NPD: true, // All products from NPD API are NPD
    delisted: false, // Not delisted
    width: apiProduct.width ?? null,
    height: apiProduct.height ?? null,
    depth: apiProduct.depth ?? null,
    traywidth: apiProduct.traywidth ?? null,
    trayheight: apiProduct.trayheight ?? null,
    traydepth: apiProduct.traydepth ?? null,
    sales_per_wk: apiProduct.sales_per_wk ?? null,
    units_per_wk: apiProduct.units_per_wk ?? null,
    scenario: apiProduct.scenario ?? [],
  };
};

/**
 * Transforms delisted API response to product structure
 * @param {Object} apiProduct - Product from delisted API responsexa
 * @returns {Object|null} Transformed product object
 */
export const transformDelistedProductFromAPI = (apiProduct) => {
  if (!apiProduct?.tpnb) return null;
  return {
    id: null, // API doesn't provide id
    name: apiProduct.name || "",
    tpnb: String(apiProduct.tpnb), // Ensure string
    brand_name: apiProduct.brand || "",
    subCategory_name: apiProduct.subgroup || "",
    NPD: false,
    delisted: true, // All products from delisted API are delisted
    width: apiProduct.width ?? null,
    height: apiProduct.height ?? null,
    depth: apiProduct.depth ?? null,
    traywidth: apiProduct.traywidth ?? null,
    trayheight: apiProduct.trayheight ?? null,
    traydepth: apiProduct.traydepth ?? null,
    sales_per_wk: apiProduct.sales_per_wk ?? null,
    units_per_wk: apiProduct.units_per_wk ?? null,
    scenario: apiProduct.scenario ?? [],
  };
};

/**
 * Gets all products with NPD=true for autocomplete options
 * Can use API data or filter from allProducts
 * @param {Array} npdApiProducts - Array of NPD products from API (optional)
 * @param {Array} allProducts - Array of all products (fallback)
 * @returns {Array} Array of NPD products
 */
export const getNPDProductsOptions = (npdApiProducts, allProducts = null) => {
  // If API products are provided, use them
  if (npdApiProducts && Array.isArray(npdApiProducts) && npdApiProducts.length > 0) {
    return npdApiProducts
      .map((product) => transformNPDProductFromAPI(product))
      .filter(Boolean);
  }
  
  // Fallback to filtering allProducts
  if (!allProducts) return [];
  return allProducts
    .filter((product) => product?.NPD === true)
    .map((product) => extractAllProductData(product))
    .filter(Boolean);
};

/**
 * Gets all products with delisted=true for autocomplete options
 * Can use API data or filter from allProducts
 * @param {Array} delistedApiProducts - Array of delisted products from API (optional)
 * @param {Array} allProducts - Array of all products (fallback)
 * @returns {Array} Array of delisted products
 */
export const getDelistedProductsOptions = (delistedApiProducts, allProducts = null) => {
  // If API products are provided, use them
  if (delistedApiProducts && Array.isArray(delistedApiProducts) && delistedApiProducts.length > 0) {
    return delistedApiProducts
      .map((product) => transformDelistedProductFromAPI(product))
      .filter(Boolean);
  }
  
  // Fallback to filtering allProducts
  if (!allProducts) return [];
  return allProducts
    .filter((product) => product?.delisted === true)
    .map((product) => extractAllProductData(product))
    .filter(Boolean);
};

/**
 * Creates a Set of TPNBs from delisted API products for filtering
 * @param {Array} delistedApiProducts - Array of delisted products from API
 * @returns {Set<string>} Set of TPNB strings
 */
export const getDelistedTPNBSet = (delistedApiProducts) => {
  if (!delistedApiProducts || !Array.isArray(delistedApiProducts)) return new Set();
  const tpnbSet = new Set();
  delistedApiProducts.forEach((product) => {
    if (product?.tpnb) {
      tpnbSet.add(String(product.tpnb));
    }
  });
  return tpnbSet;
};

/**
 * Transforms product group from array format to flat structure
 * @param {Object} productGroup - Product group object with array values
 * @returns {Object} Transformed product group
 * Note: For brands and subCategories, preserves arrays for multi-select support
 * For other attributes, takes the first value for backward compatibility
 */
export const transformProductGroup = (productGroup) => {
  const transformed = {};
  
  // Map attribute keys from camelCase arrays to lowercase
  // For brands/subCategories, keep as arrays; for others, use single values
  const arrayAttributes = new Set(["brands", "subCategories"]);
  const attributeMapping = {
    brands: "brands", // Keep as array
    subCategories: "subCategories", // Keep as array
    intensities: "intensity",
    benchmarks: "benchmark",
    platforms: "platform",
    needState: "needState",
    bay: "bay",
    shelf: "shelf",
  };

  Object.keys(productGroup).forEach((key) => {
    const value = productGroup[key];
    const mappedKey = attributeMapping[key] || key.toLowerCase();
    
      // For brands and subCategories, preserve arrays for multi-select
      if (arrayAttributes.has(key)) {
        if (Array.isArray(value) && value.length > 0) {
          transformed[mappedKey] = value; // Keep as array
        } else if (value !== null && value !== undefined && value !== "") {
          transformed[mappedKey] = Array.isArray(value) ? value : [value];
        }
      } else if (Array.isArray(value) && value.length > 0) {
        // For other attributes, take the first value (backward compatibility)
        transformed[mappedKey] = value[0];
      } else if (value !== null && value !== undefined && value !== "") {
        transformed[mappedKey] = value;
      }
  });

  return transformed;
};

/**
 * Gets display values for product group (subcategory first, then brand)
 * Handles both array format (from EditPlanogramStep1/AddRuleModal) and transformed format (from Redux)
 * For multi-select arrays, shows first value for display
 * @param {Object} productGroup - Product group object (array or transformed format)
 * @returns {Object} Object with subCategory and brand display values
 */
export const getProductGroupDisplayValues = (productGroup) => {
  // Guard against null/undefined
  if (!productGroup || typeof productGroup !== 'object') {
    return { subCategory: "", brand: "" };
  }

  // Handle array format (from EditPlanogramStep1 state or AddRuleModal)
  // Also handle transformed format from Redux (which now preserves arrays for brands/subCategories)
  if (productGroup.subCategories || productGroup.brands) {
    const subCategories = productGroup.subCategories || [];
    const brands = productGroup.brands || [];
    
    // Get first subcategory and first brand for display
    // For multi-select, display first value (additional values are in the array)
    const subCategory = Array.isArray(subCategories) && subCategories.length > 0 
      ? subCategories[0] 
      : (subCategories || "");
    const brand = Array.isArray(brands) && brands.length > 0 
      ? brands[0] 
      : (brands || "");
    
    return { subCategory, brand };
  }
  
  // Handle legacy flat format (backward compatibility)
  const subCategory = productGroup.subcategory || "";
  const brand = productGroup.brand || "";
  
  return { subCategory, brand };
};

/**
 * Reverse transforms product group from flat structure back to array format
 * @param {Object} productGroup - Product group object in flat format
 * @returns {Object} Product group object with array values
 */
export const reverseTransformProductGroup = (productGroup) => {
  // Guard against null/undefined
  if (!productGroup || typeof productGroup !== 'object') {
    return {};
  }

  const reversed = {};
  
  // Map attribute keys from lowercase single values back to camelCase arrays
  const attributeMapping = {
    brand: "brands",
    subcategory: "subCategories",
    intensity: "intensities",
    benchmark: "benchmarks",
    platform: "platforms",
    needState: "needState",
    bay: "bay",
    shelf: "shelf",
  };

  Object.keys(productGroup).forEach((key) => {
    const value = productGroup[key];
    const mappedKey = attributeMapping[key] || key;
    
    // Convert single value back to array format
    if (value !== null && value !== undefined && value !== "") {
      reversed[mappedKey] = Array.isArray(value) ? value : [value];
    }
  });

  return reversed;
};

/**
 * Calculates base products based on checkbox selections
 * @param {Object} params - Parameters object
 * @param {Object} params.assortmentOptions - Assortment options object
 * @param {boolean} params.assortmentOptions.existingItems - Include existing items
 * @param {boolean} params.assortmentOptions.otherClusters - Include other clusters
 * @param {boolean} params.assortmentOptions.removeDelistedItems - Remove delisted items
 * @param {Array} params.planogramProducts - Array of planogram products
 * @param {Array} params.allProducts - Array of all products
 * @param {Array} params.selectedNPDProducts - Array of selected NPD products
 * @param {Array} params.selectedDelistedProducts - Array of selected delisted products
 * @param {Set<string>} params.delistedTPNBSet - Set of TPNBs from delisted API for filtering
 * @returns {Array} Array of base products
 */
export const calculateBaseProducts = ({
  assortmentOptions,
  planogramProducts,
  allProducts,
  selectedNPDProducts = [],
  selectedDelistedProducts = [],
  delistedTPNBSet = new Set(),
}) => {
  const productsMap = new Map(); // Use Map to track by unique id_tpnb key

  // 1. Existing items on planogram (always included since checkbox is checked by default)
  if (assortmentOptions.existingItems && planogramProducts) {
    planogramProducts.forEach((product) => {
      const productData = extractPlanogramProductData(product);
      if (productData) {
        const uniqueKey = getProductUniqueKey(productData);
        if (uniqueKey) {
          productsMap.set(uniqueKey, productData);
        }
      }
    });
  }

  // 2. Items from other clusters
  if (assortmentOptions.otherClusters && allProducts) {
    // Create set of planogram product keys
    const planogramKeys = new Set();
    if (planogramProducts) {
      planogramProducts.forEach((product) => {
        const details = product.product_details;
        const uniqueKey = getProductUniqueKey(details);
        if (uniqueKey) {
          planogramKeys.add(uniqueKey);
        }
      });
    }

    // Add products not in planogram
    allProducts.forEach((product) => {
      const uniqueKey = getProductUniqueKey(product);
      if (uniqueKey && !planogramKeys.has(uniqueKey)) {
        const productData = extractAllProductData(product);
        if (productData) {
          productsMap.set(uniqueKey, productData);
        }
      }
    });
  }

  // 3. Add manually selected NPD products
  selectedNPDProducts.forEach((product) => {
    const uniqueKey = getProductUniqueKey(product);
    if (uniqueKey && !productsMap.has(uniqueKey)) {
      productsMap.set(uniqueKey, product);
    }
  });

  // 4. Add manually selected delisted products (only if removeDelistedItems is unchecked)
  if (!assortmentOptions.removeDelistedItems) {
    selectedDelistedProducts.forEach((product) => {
      const uniqueKey = getProductUniqueKey(product);
      if (uniqueKey && !productsMap.has(uniqueKey)) {
        productsMap.set(uniqueKey, product);
      }
    });
  }

  // Convert Map to array - these are the base products before delisted filtering
  let finalBaseProducts = Array.from(productsMap.values());

  // 5. Filter out delisted items if removeDelistedItems is checked (default behavior)
  // Use delistedTPNBSet to filter by tpnb if available
  if (assortmentOptions.removeDelistedItems) {
    if (delistedTPNBSet.size > 0) {
      // Filter using TPNB set from API
      finalBaseProducts = finalBaseProducts.filter((product) => {
        const productTPNB = String(product.tpnb);
        return !delistedTPNBSet.has(productTPNB);
      });
    } else {
      // Fallback: filter by delisted property if API data not available
      finalBaseProducts = finalBaseProducts.filter((product) => {
        return product.delisted !== true;
      });
    }
  }

  return finalBaseProducts;
};

/**
 * Calculates items from other clusters for payload
 * @param {Array} allProducts - Array of all products
 * @param {Array} planogramProducts - Array of planogram products
 * @returns {Array} Array of products from other clusters
 */
export const calculateItemsFromOtherClusters = (allProducts, planogramProducts) => {
  const itemsFromOtherClusters = [];
  
  if (!allProducts || !planogramProducts) return itemsFromOtherClusters;

  const planogramKeys = new Set();
  planogramProducts.forEach((product) => {
    const details = product.product_details;
    const uniqueKey = getProductUniqueKey(details);
    if (uniqueKey) {
      planogramKeys.add(uniqueKey);
    }
  });

  allProducts.forEach((product) => {
    const uniqueKey = getProductUniqueKey(product);
    if (uniqueKey && !planogramKeys.has(uniqueKey)) {
      const productData = extractAllProductData(product);
      if (productData) {
        itemsFromOtherClusters.push(productData);
      }
    }
  });

  return itemsFromOtherClusters;
};

/**
 * Constants
 */
export const DECIMAL_PATTERN = String.raw`^\d{0,2}(\.\d?)?$`;

export const TEXT_FIELD_STYLES = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
  },
};

