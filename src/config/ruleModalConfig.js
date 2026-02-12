// Configuration for AddRuleModal content based on rule category and rule type

export const RULE_CATEGORIES = {
  ASSORTMENT: "Assortment",
  INVENTORY: "Inventory",
  MERCHANDISING: "Merchandising",
};

export const ASSORTMENT_RULE_TYPES = [
  "Complementary",
  "Overlap",
  "Representation",
  "Coverage",
];

export const INVENTORY_RULE_TYPES = [
  "Days of Supply (DoS)",
  "Case Pack",
];

export const MERCHANDISING_RULE_TYPES = [
  "CDT",
  "Flow L2R / T2B",
  "Block Fixture Affinity",
  "Block Orientation Preference",
  "Block Anti Affinity",
  "Private Label Placement",
  "Good-Better-Best",
];

// Attribute options for rules
export const ATTRIBUTES = [
  { key: "brand", label: "Brand" },
  { key: "subCategory", label: "Sub Category" },
  { key: "intensities", label: "Intensities" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "platforms", label: "Platforms" },
  { key: "needState", label: "Need State" },
];

// Style constants for form components
export const TEXT_FIELD_STYLES = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
  },
};

export const SELECT_STYLES = {
  borderRadius: 2,
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: 2,
  },
};

export const CHECKBOX_STYLES = {
  color: "#d1d5db",
  "&.Mui-checked": {
    color: "#000",
  },
};

export const METRIC_OPTIONS = [
  "Item Count",
  "Item (%)",
  "Facing Count",
  "Facing (%)",
  "Share of Shelf",
  "Absolute Shelf Space",
];

export const INTERACTION_OPTIONS = [
  "Complementary",
  "Non-Complementary",
];

// Configuration for each rule category and type
export const RULE_CONFIG = {
  [RULE_CATEGORIES.ASSORTMENT]: {
    Complementary: {
      showAttributes: false,
      showProductGroups: true,
      showMetric: false,
      showInteraction: true,
      interactionLabel: "Interaction",
      interactionOptions: INTERACTION_OPTIONS,
    },
    Overlap: {
      showAttributes: false,
      showProductGroups: true,
      showMetric: true,
      showInteraction: false,
      metricOptions: ["Item (%)"], // Only "Item (%)" allowed for Overlap rules
    },
    Representation: {
      showAttributes: false,
      showProductGroups: true,
      showMetric: true,
      showInteraction: false,
      showParameter: true,
      metricOptions: METRIC_OPTIONS,
    },
    Coverage: {
      showAttributes: false,
      showProductGroups: true,
      showMetric: true,
      showInteraction: false,
      showParameter: true,
      metricOptions: METRIC_OPTIONS,
    },
  },
  [RULE_CATEGORIES.INVENTORY]: {
    "Days of Supply (DoS)": {
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
      showInventorySelector: true,
      inventorySelectorLabel: "Select Target DOS",
      showMandate: true,
    },
    "Case Pack": {
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
      showInventorySelector: true,
      inventorySelectorLabel: "Select Pack Out Rules",
      showMandate: true,
    },
  },
  [RULE_CATEGORIES.MERCHANDISING]: {
    CDT: {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Flow L2R / T2B": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Block Fixture Affinity": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Block Orientation Preference": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Block Anti Affinity": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Private Label Placement": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
    "Good-Better-Best": {
      useCustomComponent: true,
      showAttributes: false,
      showProductGroups: false,
      showMetric: false,
      showInteraction: false,
    },
  },
};

// Get rule types based on category
export const getRuleTypesByCategory = (category) => {
  switch (category) {
    case RULE_CATEGORIES.ASSORTMENT:
      return ASSORTMENT_RULE_TYPES;
    case RULE_CATEGORIES.INVENTORY:
      return INVENTORY_RULE_TYPES;
    case RULE_CATEGORIES.MERCHANDISING:
      return MERCHANDISING_RULE_TYPES;
    default:
      return [];
  }
};

// Get configuration for a specific rule
export const getRuleConfig = (category, ruleType) => {
  // If no rule type is selected, return a config that only shows product groups for Assortment
  if (!ruleType) {
    return {
      useCustomComponent: false,
      showAttributes: false,
      showProductGroups: category === RULE_CATEGORIES.ASSORTMENT,
      showMetric: false,
      showInteraction: false,
      showInventorySelector: false,
      showMandate: false,
    };
  }
  
  return RULE_CONFIG[category]?.[ruleType] || {
    useCustomComponent: false,
    showAttributes: false,
    showProductGroups: category === RULE_CATEGORIES.ASSORTMENT,
    showMetric: false,
    showInteraction: false,
    showInventorySelector: false,
    showMandate: false,
  };
};

