/**
 * Utility functions for transforming rules to API payload format
 */

/**
 * Normalizes metric names to API format
 * Matches exact format from user's payload examples
 * @param {string} metric - Metric name from UI
 * @returns {string} Normalized metric name
 */
export const normalizeMetric = (metric) => {
  if (!metric) return "";
  
  // Match exact format from user's examples: "facing count", "item %"
  const metricMap = {
    "Item count": "item count",
    "Item (%)": "item %",  // Fixed: space instead of parentheses
    "Facing Count": "facing count",
    "Facing (%)": "facing %",  // Fixed: space instead of parentheses
    "Share of Shelf": "share of shelf",
    "Absolute Shelf Space": "absolute shelf space",
  };
  
  // Return mapped value or lowercase version
  return metricMap[metric] || metric.toLowerCase();
};

/**
 * Normalizes interaction variable for Complementary rules
 * @param {string} interaction - Interaction value from UI
 * @returns {string} Normalized interaction variable
 */
export const normalizeInteractionVariable = (interaction) => {
  if (!interaction) return "";
  
  // Match exact format from user's payload example: "non-complementory"
  const interactionMap = {
    "Complementary": "complementary",
    "Non-Complementary": "non-complementory",
  };
  
  return interactionMap[interaction] || interaction.toLowerCase();
};

/**
 * Normalizes rule type to API format (lowercase)
 * @param {string} ruleType - Rule type from UI
 * @returns {string} Normalized rule type
 */
export const normalizeRuleType = (ruleType) => {
  if (!ruleType) return "";
  
  // Match exact format from user's payload: "coverage", "complementory", "overlap"
  const typeMap = {
    "Complementary": "complementory", // Note: user's example shows "complementory" not "complementary"
    "Overlap": "overlap",
    "Coverage": "coverage",
  };
  
  return typeMap[ruleType] || ruleType.toLowerCase();
};

/**
 * Transforms product groups from UI format to API format
 * @param {Array} productGroups - Array of product group objects from UI
 * @returns {Array} Array of product groups in API format
 */
export const transformProductGroupsToApi = (productGroups) => {
  if (!Array.isArray(productGroups) || productGroups.length === 0) {
    return [];
  }

  // Map attribute keys from UI format to API format (all lowercase as per user's example)
  const attributeMapping = {
    brands: "brand",
    subCategories: "subcategory", // lowercase, no camelCase
    intensities: "intensity",
    benchmarks: "benchmark",
    platforms: "platform",
    needState: "needstate",
    bay: "bay",
    shelf: "shelf",
  };

  return productGroups.flatMap((group) => {
    const apiGroups = [];

    // Process each attribute in the product group
    Object.keys(group).forEach((key) => {
      const value = group[key];
      const apiAttribute = attributeMapping[key] || key.toLowerCase();

      // Skip if value is empty or invalid
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return;
      }

      // Convert to array if not already
      const valuesArray = Array.isArray(value) ? value : [value];

      // Add to API groups
      apiGroups.push({
        attribute: apiAttribute,
        values: valuesArray,
      });
    });

    return apiGroups;
  });
};

/**
 * Transforms a single rule from Redux to API format
 * Rules are now stored in Redux in API format, so just return as-is
 * @param {Object} rule - Rule object from Redux (already in API format)
 * @returns {Object} Rule object in API format
 */
export const transformRuleToApiFormat = (rule) => {
  if (!rule?.rule_category || !rule?.type) {
    return null;
  }

  // Only handle Assortment rules for now
  if (rule.rule_category !== "Assortment") {
    return null;
  }

  const validTypes = ["coverage", "complementory", "overlap"];
  if (!validTypes.includes(rule.type)) {
    return null;
  }

  // Rules are already in API format, return as-is
  return rule;
};

/**
 * Transforms all rules from Redux to API format
 * @param {Array} rules - Array of rules from Redux
 * @returns {Array} Array of rules in API format
 */
export const transformRulesToApiFormat = (rules) => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return [];
  }

  return rules
    .map(transformRuleToApiFormat)
    .filter((rule) => rule !== null); // Remove null/invalid rules
};

