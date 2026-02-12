import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "idle",
  planogramId: null,
  planogramDetails: null,
  bays: [],
  shelfLines: [],
  planogramProducts: [],
  removedProductIds: [],
  removedProductsWithPosition: [],
  repositionedProductsWithPosition: [], // Track original positions of repositioned products
  orientationChangedProductsWithPosition: [], // Track previous state for orientation (facings) changes
  pendingPlacement: {
    active: false,
    product: null,
    facingsWide: 1,
    facingsHigh: 1,
    compatiblePositions: [],
  },
  // Snapshot of the baseline physical layout (normalized string)
  initialLayoutSnapshot: null,
  // Whether there are unsaved physical layout changes vs the baseline
  hasUnsavedChanges: false,
  // History of previous layout states for Undo
  history: [],
  // Max number of history entries to keep
  maxHistoryLength: 20,
  zoomState: {
    newValue: 1,
    oldValue: 1,
  },
  SCALE: 3,
  planogramFilters: {
    brands: [],
    subCategories: [],
    priceRange: [],
    npds: [],
    intensities: [],
    benchmarks: [],
    promoItems: [],
    platforms: [],
  },
  leftSidebarCollapsed: true,
  rightSidebarCollapsed: true,
  selectedProduct: null,
  productInventorySelectedProduct: null,
  isFullScreen: true,
  isSchemeticView: false,
  violations: [],
  current_violations: {
    violation_count: 0,
    violations: [],
  },
  tagMapFilters: {
    selectedType: "",
    selectedBrands: [],
    selectedSubCategories: [],
  },
  // Local-only activity log for the currently open planogram
  activities: [],
  ruleManager: {},
  // Product KPIs mapped by tpnb
  productKPIsByTpnb: {},
  savedPlanogramState: {
    added_products: {
      bay_details_list: [],
    },
    removed_products: {
      bay_details_list: [],
    },
  },
  rulesManagerPayload: {
    planogram_id: null,
    DOS: 7,
    country: null,
    category: null,
    email: null,
    scope: [],
    objective: {
      contribution_weight: null,
    },
    assortment: {
      item_in_cluster_flag: true,
      item_outside_cluster_flag: false,
      manual_selection: [],
      npd_data: [],
      sku_to_delist: [],
    },
    rules: [],
  },
};

const planogramVisualizerSlice = createSlice({
  name: "planogramVisualizerData",
  initialState,
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setPlanogramId: (state, action) => {
      state.planogramId = action.payload;
    },
    setPlanogramDetails: (state, action) => {
      state.planogramDetails = action.payload;
    },
    setBays: (state, action) => {
      state.bays = action.payload;
    },
    setShelfLines: (state, action) => {
      state.shelfLines = action.payload;
    },
    setPlanogramProducts: (state, action) => {
      state.planogramProducts = action.payload;
    },
    markProductAsRemoved: (state, action) => {
      const productId = action.payload;
      if (!state.removedProductIds.includes(productId)) {
        state.removedProductIds.push(productId);
      }
    },
    markProductAsRemovedWithPosition: (state, action) => {
      const removedProduct = action.payload;
      // Store with position data for accurate save (item-level tracking)
      state.removedProductsWithPosition.push(removedProduct);
    },
    markProductAsRepositionedWithPosition: (state, action) => {
      const repositionedProduct = action.payload;
      // Store original position data for repositioned products
      state.repositionedProductsWithPosition.push(repositionedProduct);
    },
    markProductAsOrientationChangedWithPosition: (state, action) => {
      const changed = action.payload;
      if (!changed) return;
      const id = changed.productId;
      if (!id) {
        state.orientationChangedProductsWithPosition.push(changed);
        return;
      }
      // De-dupe by unique item id so repeated toggles don't spam the removed list
      const existingIdx =
        state.orientationChangedProductsWithPosition.findIndex(
          (p) => p?.productId === id
        );
      if (existingIdx >= 0) {
        state.orientationChangedProductsWithPosition[existingIdx] = changed;
      } else {
        state.orientationChangedProductsWithPosition.push(changed);
      }
    },
    restoreRemovedProduct: (state, action) => {
      const productId = action.payload;
      // Remove from product-level tracking
      state.removedProductIds = state.removedProductIds.filter(
        (id) => id !== productId
      );
      // Remove from item-level tracking (check both productId and originalProductId)
      state.removedProductsWithPosition =
        state.removedProductsWithPosition.filter(
          (item) =>
            item.productId !== productId && item.originalProductId !== productId
        );
    },
    clearAllRemovedProducts: (state) => {
      state.removedProductIds = [];
      state.removedProductsWithPosition = [];
    },
    clearAllRepositionedProducts: (state) => {
      state.repositionedProductsWithPosition = [];
    },
    clearAllOrientationChangedProducts: (state) => {
      state.orientationChangedProductsWithPosition = [];
    },
    setInitialLayoutSnapshot: (state, action) => {
      state.initialLayoutSnapshot = action.payload || null;
    },
    setHasUnsavedChanges: (state, action) => {
      state.hasUnsavedChanges = Boolean(action.payload);
    },
    pushHistoryEntry: (state, action) => {
      const entry = action.payload;
      if (!entry) return;
      state.history.push(entry);
      if (state.history.length > state.maxHistoryLength) {
        state.history.shift();
      }
    },
    clearHistory: (state) => {
      state.history = [];
    },
    undoLastChange: (state) => {
      const last = state.history.pop();
      if (!last) return;
      state.shelfLines = last.shelfLines || [];
      state.bays = last.bays || [];
      state.violations = last.violations || [];
      state.removedProductIds = last.removedProductIds || [];
      state.removedProductsWithPosition =
        last.removedProductsWithPosition || [];
      state.repositionedProductsWithPosition =
        last.repositionedProductsWithPosition || [];
      state.orientationChangedProductsWithPosition =
        last.orientationChangedProductsWithPosition || [];
    },
    setPendingPlacement: (state, action) => {
      state.pendingPlacement = { ...state.pendingPlacement, ...action.payload };
    },
    setCompatiblePositions: (state, action) => {
      state.pendingPlacement.compatiblePositions = action.payload;
    },
    clearPendingPlacement: (state) => {
      state.pendingPlacement = {
        active: false,
        product: null,
        facingsWide: 1,
        facingsHigh: 1,
        compatiblePositions: [],
      };
    },
    setZoomState: (state, action) => {
      const { oldValue, newValue } = action.payload;
      state.zoomState = { oldValue, newValue };
    },
    setScale: (state, action) => {
      state.SCALE = action.payload;
    },
    setPlanogramFilters: (state, action) => {
      state.planogramFilters = action.payload;
    },
    setLeftSidebarCollapsed: (state, action) => {
      state.leftSidebarCollapsed = action.payload;
    },
    setRightSidebarCollapsed: (state, action) => {
      state.rightSidebarCollapsed = action.payload;
    },
    addViolation: (state, action) => {
      // action.payload: { type, bayIdx, shelfIdx, productId, requiredWidth, timestamp }
      state.violations.push(action.payload);
    },
    removeViolation: (state, action) => {
      // payload may contain productId and optionally bayIdx/shelfIdx
      const { productId, bayIdx, shelfIdx } = action.payload || {};
      state.violations = (state.violations || []).filter(
        (v) =>
          (productId && v.productId !== productId) ||
          (typeof bayIdx === "number" && v.bayIdx !== bayIdx) ||
          (typeof shelfIdx === "number" && v.shelfIdx !== shelfIdx)
      );
    },
    setViolations: (state, action) => {
      state.violations = Array.isArray(action.payload) ? action.payload : [];
    },
    clearViolations: (state) => {
      state.violations = [];
    },
    setCurrentViolations: (state, action) => {
      const payload = action.payload || {};
      const violationCount = Number(payload.violation_count) || 0;
      const violations = Array.isArray(payload.violations)
        ? payload.violations
        : [];
      state.current_violations = {
        ...payload,
        violation_count: violationCount,
        violations,
      };
    },
    clearCurrentViolations: (state) => {
      state.current_violations = {
        violation_count: 0,
        violations: [],
      };
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    setProductInventorySelectedProduct: (state, action) => {
      state.productInventorySelectedProduct = action.payload;
    },
    setIsFullScreen: (state, action) => {
      state.isFullScreen = action.payload;
    },
    setIsSchematicView: (state, action) => {
      state.isSchemeticView = action.payload;
    },
    setTagMapFilters: (state, action) => {
      state.tagMapFilters = { ...state.tagMapFilters, ...action.payload };
    },
    setRuleManager: (state, action) => {
      state.ruleManager = action.payload;
    },
    savePlanogramState: (state, action) => {
      state.savedPlanogramState = action.payload;
    },
    resetTagMapFilters: (state) => {
      state.tagMapFilters = initialState.tagMapFilters;
    },
    resetPlanogramVisualizerData: () => initialState,
    resetVersionChange: (state) => {
      return {
        ...initialState,
        planogramFilters: state.planogramFilters,
        isFullScreen: state.isFullScreen,
        tagMapFilters: state.tagMapFilters,
      };
    },
    // Local activity log reducers
    addActivity: (state, action) => {
      const event = action.payload;
      if (!event) return;
      const MAX_ACTIVITIES = 100;
      state.activities.push(event);
      if (state.activities.length > MAX_ACTIVITIES) {
        const excess = state.activities.length - MAX_ACTIVITIES;
        state.activities.splice(0, excess);
      }
    },
    clearActivities: (state) => {
      state.activities = [];
    },
    setRulesManagerPayload: (state, action) => {
      const incoming = action.payload || {};
      const incomingRules = incoming.rules;
      let nextRules = state.rulesManagerPayload.rules;
      if (incomingRules !== undefined) {
        nextRules = Array.isArray(incomingRules) ? incomingRules : [];
      }

      state.rulesManagerPayload = {
        ...state.rulesManagerPayload,
        ...incoming,
        rules: nextRules,
      };
    },
    clearRulesManagerPayload: (state) => {
      state.rulesManagerPayload = initialState.rulesManagerPayload;
    },
    setRulesPlanogramId: (state, action) => {
      state.rulesManagerPayload.planogram_id = action.payload || null;
    },
    setRules: (state, action) => {
      state.rulesManagerPayload.rules = Array.isArray(action.payload)
        ? action.payload
        : [];
    },
    // Rule management reducers (rules are stored in rulesManagerPayload.rules)
    addRule: (state, action) => {
      const rule = action.payload;
      if (!rule) return;
      if (!state.rulesManagerPayload.rules) {
        state.rulesManagerPayload.rules = [];
      }
      // Store rule exactly as provided (no ruleId, no extra fields)
      state.rulesManagerPayload.rules.push(rule);
    },
    updateRule: (state, action) => {
      const { ruleId, rule } = action.payload;
      if (!ruleId || !rule) return;
      if (!state.rulesManagerPayload.rules) {
        state.rulesManagerPayload.rules = [];
      }
      const index = state.rulesManagerPayload.rules.findIndex(
        (r) => r.ruleId === ruleId
      );
      if (index >= 0) {
        state.rulesManagerPayload.rules[index] = {
          ...state.rulesManagerPayload.rules[index],
          ...rule,
          ruleId, // Ensure ruleId is preserved
        };
      }
    },
    deleteRule: (state, action) => {
      const ruleId = action.payload;
      if (!ruleId || !state.rulesManagerPayload.rules) return;
      state.rulesManagerPayload.rules = state.rulesManagerPayload.rules.filter(
        (r) => r.ruleId !== ruleId
      );
    },
    clearRules: (state) => {
      if (state.rulesManagerPayload) {
        state.rulesManagerPayload.rules = [];
      }
    },
    setProductKPIsByTpnb: (state, action) => {
      state.productKPIsByTpnb = action.payload || {};
    },
  },
});

export const {
  setStatus,
  setPlanogramId,
  setBays,
  setShelfLines,
  setPlanogramProducts,
  markProductAsRemoved,
  markProductAsRemovedWithPosition,
  markProductAsRepositionedWithPosition,
  markProductAsOrientationChangedWithPosition,
  restoreRemovedProduct,
  clearAllRemovedProducts,
  clearAllRepositionedProducts,
  clearAllOrientationChangedProducts,
  setInitialLayoutSnapshot,
  setHasUnsavedChanges,
  pushHistoryEntry,
  clearHistory,
  undoLastChange,
  setPendingPlacement,
  setCompatiblePositions,
  clearPendingPlacement,
  setZoomState,
  setScale,
  setPlanogramFilters,
  setLeftSidebarCollapsed,
  setRightSidebarCollapsed,
  addViolation,
  setViolations,
  clearViolations,
  removeViolation,
  setCurrentViolations,
  clearCurrentViolations,
  setSelectedProduct,
  setProductInventorySelectedProduct,
  setIsFullScreen,
  resetPlanogramVisualizerData,
  setIsSchematicView,
  setTagMapFilters,
  resetTagMapFilters,
  setPlanogramDetails,
  setRuleManager,
  savePlanogramState,
  resetVersionChange,
  addActivity,
  clearActivities,
  setRulesManagerPayload,
  clearRulesManagerPayload,
  setRulesPlanogramId,
  setRules,
  addRule,
  updateRule,
  deleteRule,
  clearRules,
  setProductKPIsByTpnb,
} = planogramVisualizerSlice.actions;

//selectors
export const selectStatus = (state) => state.planogramVisualizerData.status;
export const selectPlanogramId = (state) =>
  state.planogramVisualizerData.planogramId;
export const selectBays = (state) => state.planogramVisualizerData.bays;
export const selectShelfLines = (state) =>
  state.planogramVisualizerData.shelfLines;
export const selectPlanogramProducts = (state) =>
  state.planogramVisualizerData.planogramProducts;
export const selectZoomState = (state) =>
  state.planogramVisualizerData.zoomState;
export const selectScale = (state) => state.planogramVisualizerData.SCALE;
export const selectPlanogramFilters = (state) =>
  state.planogramVisualizerData.planogramFilters;
export const selectLeftSidebarCollapsed = (state) =>
  state.planogramVisualizerData.leftSidebarCollapsed;
export const selectRightSidebarCollapsed = (state) =>
  state.planogramVisualizerData.rightSidebarCollapsed;
export const selectSelectedProduct = (state) =>
  state.planogramVisualizerData.selectedProduct;
export const selectProductInventorySelectedProduct = (state) =>
  state.planogramVisualizerData.productInventorySelectedProduct;
export const selectIsFullScreen = (state) =>
  state.planogramVisualizerData.isFullScreen;
export const selectIsSchematicView = (state) =>
  state.planogramVisualizerData.isSchemeticView;
export const selectTagMapFilters = (state) =>
  state.planogramVisualizerData.tagMapFilters;
export const selectPlanogramDetails = (state) =>
  state.planogramVisualizerData.planogramDetails;
export const selectRuleManager = (state) =>
  state.planogramVisualizerData.ruleManager;
export const selectRemovedProductIds = (state) =>
  state.planogramVisualizerData.removedProductIds || [];
export const selectRemovedProductsWithPosition = (state) =>
  state.planogramVisualizerData.removedProductsWithPosition || [];
export const selectRepositionedProductsWithPosition = (state) =>
  state.planogramVisualizerData.repositionedProductsWithPosition || [];
export const selectOrientationChangedProductsWithPosition = (state) =>
  state.planogramVisualizerData.orientationChangedProductsWithPosition || [];
export const selectPendingPlacement = (state) =>
  state.planogramVisualizerData.pendingPlacement;
export const selectSavedPlanogramState = (state) =>
  state.planogramVisualizerData.savedPlanogramState;
export const selectInitialLayoutSnapshot = (state) =>
  state.planogramVisualizerData.initialLayoutSnapshot;
export const selectHasUnsavedChanges = (state) =>
  state.planogramVisualizerData.hasUnsavedChanges;
export const selectCanUndo = (state) =>
  (state.planogramVisualizerData.history || []).length > 0;
export const selectActivities = (state) =>
  state.planogramVisualizerData.activities || [];
export const selectRulesManagerPayload = (state) =>
  state.planogramVisualizerData.rulesManagerPayload;
export const selectRules = (state) =>
  state.planogramVisualizerData.rulesManagerPayload?.rules || [];
export const selectProductKPIsByTpnb = (state) =>
  state.planogramVisualizerData.productKPIsByTpnb || {};
export const selectCurrentViolations = (state) =>
  state.planogramVisualizerData.current_violations || {
    violation_count: 0,
    violations: [],
  };
export default planogramVisualizerSlice.reducer;
