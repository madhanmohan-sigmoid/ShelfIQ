import reducer, {
  setStatus,
  setPlanogramId,
  setPlanogramDetails,
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
  removeViolation,
  setViolations,
  clearViolations,
  setCurrentViolations,
  clearCurrentViolations,
  setSelectedProduct,
  setProductInventorySelectedProduct,
  setIsFullScreen,
  setIsSchematicView,
  setTagMapFilters,
  resetTagMapFilters,
  setRuleManager,
  savePlanogramState,
  resetPlanogramVisualizerData,
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
  selectStatus,
  selectPlanogramId,
  selectBays,
  selectShelfLines,
  selectPlanogramProducts,
  selectZoomState,
  selectScale,
  selectPlanogramFilters,
  selectLeftSidebarCollapsed,
  selectRightSidebarCollapsed,
  selectSelectedProduct,
  selectProductInventorySelectedProduct,
  selectIsFullScreen,
  selectIsSchematicView,
  selectTagMapFilters,
  selectPlanogramDetails,
  selectRuleManager,
  selectRemovedProductIds,
  selectRemovedProductsWithPosition,
  selectRepositionedProductsWithPosition,
  selectOrientationChangedProductsWithPosition,
  selectPendingPlacement,
  selectSavedPlanogramState,
  selectInitialLayoutSnapshot,
  selectHasUnsavedChanges,
  selectCanUndo,
  selectActivities,
  selectRulesManagerPayload,
  selectRules,
  selectProductKPIsByTpnb,
  selectCurrentViolations,
} from '../planogramVisualizerSlice';

describe('planogramVisualizerSlice', () => {
  const initialState = {
    status: "idle",
    planogramId: null,
    planogramDetails: null,
    bays: [],
    shelfLines: [],
    planogramProducts: [],
    removedProductIds: [],
    removedProductsWithPosition: [],
    repositionedProductsWithPosition: [],
    orientationChangedProductsWithPosition: [],
    pendingPlacement: {
      active: false,
      product: null,
      facingsWide: 1,
      facingsHigh: 1,
      compatiblePositions: [],
    },
    initialLayoutSnapshot: null,
    hasUnsavedChanges: false,
    history: [],
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
    tagMapFilters: {
      selectedType: "",
      selectedBrands: [],
      selectedSubCategories: [],
    },
    activities: [],
    ruleManager: {},
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

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setStatus', () => {
    it('should update status', () => {
      const action = setStatus('loading');
      const state = reducer(initialState, action);
      expect(state.status).toBe('loading');
    });
  });

  describe('setPlanogramId', () => {
    it('should set planogram ID', () => {
      const action = setPlanogramId('planogram-123');
      const state = reducer(initialState, action);
      expect(state.planogramId).toBe('planogram-123');
    });
  });

  describe('setPlanogramDetails', () => {
    it('should set planogram details', () => {
      const details = { id: '123', name: 'Test Planogram' };
      const action = setPlanogramDetails(details);
      const state = reducer(initialState, action);
      expect(state.planogramDetails).toEqual(details);
    });
  });

  describe('setBays', () => {
    it('should set bays', () => {
      const bays = [{ id: 1, name: 'Bay 1' }];
      const action = setBays(bays);
      const state = reducer(initialState, action);
      expect(state.bays).toEqual(bays);
    });
  });

  describe('setShelfLines', () => {
    it('should set shelf lines', () => {
      const shelfLines = [{ id: 1, name: 'Shelf 1' }];
      const action = setShelfLines(shelfLines);
      const state = reducer(initialState, action);
      expect(state.shelfLines).toEqual(shelfLines);
    });
  });

  describe('setPlanogramProducts', () => {
    it('should set planogram products', () => {
      const products = [{ id: 1, name: 'Product 1' }];
      const action = setPlanogramProducts(products);
      const state = reducer(initialState, action);
      expect(state.planogramProducts).toEqual(products);
    });
  });

  describe('markProductAsRemoved', () => {
    it('should add product ID to removedProductIds', () => {
      const action = markProductAsRemoved('product-1');
      const state = reducer(initialState, action);
      expect(state.removedProductIds).toContain('product-1');
    });

    it('should not add duplicate product IDs', () => {
      const stateWithRemoved = reducer(initialState, markProductAsRemoved('product-1'));
      const action = markProductAsRemoved('product-1');
      const state = reducer(stateWithRemoved, action);
      expect(state.removedProductIds.filter(id => id === 'product-1').length).toBe(1);
    });
  });

  describe('markProductAsRemovedWithPosition', () => {
    it('should add product with position data', () => {
      const removedProduct = {
        productId: 'product-1',
        bayIdx: 0,
        shelfIdx: 1,
        position: { x: 10, y: 20 }
      };
      const action = markProductAsRemovedWithPosition(removedProduct);
      const state = reducer(initialState, action);
      expect(state.removedProductsWithPosition).toContainEqual(removedProduct);
    });
  });

  describe('markProductAsRepositionedWithPosition', () => {
    it('should add repositioned product with position data', () => {
      const repositionedProduct = {
        productId: 'product-1',
        originalBayIdx: 0,
        originalShelfIdx: 1,
        newBayIdx: 1,
        newShelfIdx: 2
      };
      const action = markProductAsRepositionedWithPosition(repositionedProduct);
      const state = reducer(initialState, action);
      expect(state.repositionedProductsWithPosition).toContainEqual(repositionedProduct);
    });
  });

  describe('markProductAsOrientationChangedWithPosition', () => {
    it('should ignore falsy payload', () => {
      const state = reducer(initialState, markProductAsOrientationChangedWithPosition(null));
      expect(state.orientationChangedProductsWithPosition).toEqual([]);
    });

    it('should add orientation change when productId is missing', () => {
      const changed = { originalProductId: 'product-1', facing: 2 };
      const action = markProductAsOrientationChangedWithPosition(changed);
      const state = reducer(initialState, action);
      expect(state.orientationChangedProductsWithPosition).toContainEqual(changed);
    });

    it('should update existing orientation change by productId', () => {
      const initial = { productId: 'product-1', facing: 2 };
      const updated = { productId: 'product-1', facing: 3 };
      let state = reducer(
        initialState,
        markProductAsOrientationChangedWithPosition(initial)
      );
      state = reducer(state, markProductAsOrientationChangedWithPosition(updated));
      expect(state.orientationChangedProductsWithPosition).toHaveLength(1);
      expect(state.orientationChangedProductsWithPosition[0]).toEqual(updated);
    });

    it('should add orientation change when new productId', () => {
      const changed = { productId: 'product-2', facing: 2 };
      const action = markProductAsOrientationChangedWithPosition(changed);
      const state = reducer(initialState, action);
      expect(state.orientationChangedProductsWithPosition).toContainEqual(changed);
    });
  });

  describe('restoreRemovedProduct', () => {
    it('should remove product from removedProductIds', () => {
      const stateWithRemoved = reducer(initialState, markProductAsRemoved('product-1'));
      const action = restoreRemovedProduct('product-1');
      const state = reducer(stateWithRemoved, action);
      expect(state.removedProductIds).not.toContain('product-1');
    });

    it('should remove product from removedProductsWithPosition', () => {
      const removedProduct = {
        productId: 'product-1',
        bayIdx: 0,
        shelfIdx: 1
      };
      const stateWithRemoved = reducer(
        initialState,
        markProductAsRemovedWithPosition(removedProduct)
      );
      const action = restoreRemovedProduct('product-1');
      const state = reducer(stateWithRemoved, action);
      expect(state.removedProductsWithPosition).not.toContainEqual(removedProduct);
    });

    it('should remove by originalProductId as well', () => {
      const removedProduct = {
        originalProductId: 'product-1',
        bayIdx: 0,
        shelfIdx: 1
      };
      const stateWithRemoved = reducer(
        initialState,
        markProductAsRemovedWithPosition(removedProduct)
      );
      const action = restoreRemovedProduct('product-1');
      const state = reducer(stateWithRemoved, action);
      expect(state.removedProductsWithPosition).not.toContainEqual(removedProduct);
    });
  });

  describe('clearAllRemovedProducts', () => {
    it('should clear all removed products', () => {
      let state = reducer(initialState, markProductAsRemoved('product-1'));
      state = reducer(state, markProductAsRemovedWithPosition({ productId: 'product-2' }));
      const action = clearAllRemovedProducts();
      state = reducer(state, action);
      expect(state.removedProductIds).toEqual([]);
      expect(state.removedProductsWithPosition).toEqual([]);
    });
  });

  describe('clearAllRepositionedProducts', () => {
    it('should clear all repositioned products', () => {
      const repositionedProduct = { productId: 'product-1' };
      let state = reducer(initialState, markProductAsRepositionedWithPosition(repositionedProduct));
      const action = clearAllRepositionedProducts();
      state = reducer(state, action);
      expect(state.repositionedProductsWithPosition).toEqual([]);
    });
  });

  describe('clearAllOrientationChangedProducts', () => {
    it('should clear all orientation changed products', () => {
      const changed = { productId: 'product-1', facing: 2 };
      let state = reducer(
        initialState,
        markProductAsOrientationChangedWithPosition(changed)
      );
      const action = clearAllOrientationChangedProducts();
      state = reducer(state, action);
      expect(state.orientationChangedProductsWithPosition).toEqual([]);
    });
  });

  describe('setInitialLayoutSnapshot', () => {
    it('should set initial layout snapshot', () => {
      const action = setInitialLayoutSnapshot('snapshot-1');
      const state = reducer(initialState, action);
      expect(state.initialLayoutSnapshot).toBe('snapshot-1');
    });

    it('should clear initial layout snapshot when payload falsy', () => {
      const stateWithSnapshot = reducer(
        initialState,
        setInitialLayoutSnapshot('snapshot-1')
      );
      const state = reducer(stateWithSnapshot, setInitialLayoutSnapshot(''));
      expect(state.initialLayoutSnapshot).toBe(null);
    });
  });

  describe('setHasUnsavedChanges', () => {
    it('should set hasUnsavedChanges to boolean', () => {
      const state = reducer(initialState, setHasUnsavedChanges('truthy'));
      expect(state.hasUnsavedChanges).toBe(true);
    });
  });

  describe('history management', () => {
    it('pushHistoryEntry should ignore empty payload', () => {
      const state = reducer(initialState, pushHistoryEntry(null));
      expect(state.history).toEqual([]);
    });

    it('pushHistoryEntry should add entry', () => {
      const entry = { shelfLines: [{ id: 1 }] };
      const state = reducer(initialState, pushHistoryEntry(entry));
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toEqual(entry);
    });

    it('pushHistoryEntry should cap history length', () => {
      let state = initialState;
      for (let i = 0; i < initialState.maxHistoryLength + 2; i += 1) {
        state = reducer(state, pushHistoryEntry({ idx: i }));
      }
      expect(state.history).toHaveLength(initialState.maxHistoryLength);
      expect(state.history[0]).toEqual({ idx: 2 });
    });

    it('clearHistory should empty history', () => {
      let state = reducer(initialState, pushHistoryEntry({ idx: 1 }));
      state = reducer(state, clearHistory());
      expect(state.history).toEqual([]);
    });

    it('undoLastChange should restore previous layout state', () => {
      const entry = {
        shelfLines: [{ id: 1 }],
        bays: [{ id: 2 }],
        violations: [{ productId: 'p1' }],
        removedProductIds: ['p2'],
        removedProductsWithPosition: [{ productId: 'p2' }],
        repositionedProductsWithPosition: [{ productId: 'p3' }],
        orientationChangedProductsWithPosition: [{ productId: 'p4' }]
      };
      let state = reducer(initialState, pushHistoryEntry(entry));
      state = reducer(state, undoLastChange());
      expect(state.shelfLines).toEqual(entry.shelfLines);
      expect(state.bays).toEqual(entry.bays);
      expect(state.violations).toEqual(entry.violations);
      expect(state.removedProductIds).toEqual(entry.removedProductIds);
      expect(state.removedProductsWithPosition).toEqual(entry.removedProductsWithPosition);
      expect(state.repositionedProductsWithPosition).toEqual(
        entry.repositionedProductsWithPosition
      );
      expect(state.orientationChangedProductsWithPosition).toEqual(
        entry.orientationChangedProductsWithPosition
      );
    });

    it('undoLastChange should do nothing when history is empty', () => {
      const state = reducer(initialState, undoLastChange());
      expect(state).toEqual(initialState);
    });
  });

  describe('setPendingPlacement', () => {
    it('should update pending placement', () => {
      const placement = { active: true, product: { id: 'product-1' } };
      const action = setPendingPlacement(placement);
      const state = reducer(initialState, action);
      expect(state.pendingPlacement.active).toBe(true);
      expect(state.pendingPlacement.product).toEqual({ id: 'product-1' });
    });

    it('should merge with existing pending placement', () => {
      const stateWithPlacement = reducer(
        initialState,
        setPendingPlacement({ active: true, product: { id: 'product-1' } })
      );
      const action = setPendingPlacement({ facingsWide: 2 });
      const state = reducer(stateWithPlacement, action);
      expect(state.pendingPlacement.active).toBe(true);
      expect(state.pendingPlacement.facingsWide).toBe(2);
    });
  });

  describe('setCompatiblePositions', () => {
    it('should set compatible positions', () => {
      const positions = [{ bayIdx: 0, shelfIdx: 1 }];
      const action = setCompatiblePositions(positions);
      const state = reducer(initialState, action);
      expect(state.pendingPlacement.compatiblePositions).toEqual(positions);
    });
  });

  describe('clearPendingPlacement', () => {
    it('should reset pending placement to initial state', () => {
      let state = reducer(initialState, setPendingPlacement({ active: true, product: { id: 'product-1' } }));
      const action = clearPendingPlacement();
      state = reducer(state, action);
      expect(state.pendingPlacement).toEqual(initialState.pendingPlacement);
    });
  });

  describe('setZoomState', () => {
    it('should set zoom state', () => {
      const zoomState = { oldValue: 1, newValue: 2 };
      const action = setZoomState(zoomState);
      const state = reducer(initialState, action);
      expect(state.zoomState).toEqual(zoomState);
    });
  });

  describe('setScale', () => {
    it('should set scale', () => {
      const action = setScale(5);
      const state = reducer(initialState, action);
      expect(state.SCALE).toBe(5);
    });
  });

  describe('setPlanogramFilters', () => {
    it('should set planogram filters', () => {
      const filters = {
        brands: ['Brand1'],
        subCategories: ['Category1']
      };
      const action = setPlanogramFilters(filters);
      const state = reducer(initialState, action);
      expect(state.planogramFilters).toEqual(filters);
    });
  });

  describe('setLeftSidebarCollapsed', () => {
    it('should set left sidebar collapsed state', () => {
      const action = setLeftSidebarCollapsed(false);
      const state = reducer(initialState, action);
      expect(state.leftSidebarCollapsed).toBe(false);
    });
  });

  describe('setRightSidebarCollapsed', () => {
    it('should set right sidebar collapsed state', () => {
      const action = setRightSidebarCollapsed(false);
      const state = reducer(initialState, action);
      expect(state.rightSidebarCollapsed).toBe(false);
    });
  });

  describe('addViolation', () => {
    it('should add a violation', () => {
      const violation = {
        type: 'width',
        bayIdx: 0,
        shelfIdx: 1,
        productId: 'product-1',
        requiredWidth: 100,
        timestamp: Date.now()
      };
      const action = addViolation(violation);
      const state = reducer(initialState, action);
      expect(state.violations).toContainEqual(violation);
    });
  });

  describe('removeViolation', () => {
    it('should remove violation by productId', () => {
      const violation = {
        type: 'width',
        productId: 'product-1',
        bayIdx: 0,
        shelfIdx: 1
      };
      let state = reducer(initialState, addViolation(violation));
      const action = removeViolation({ productId: 'product-1' });
      state = reducer(state, action);
      expect(state.violations).not.toContainEqual(violation);
    });

    it('should remove violation by bayIdx and shelfIdx', () => {
      const violation = {
        type: 'width',
        productId: 'product-1',
        bayIdx: 0,
        shelfIdx: 1
      };
      let state = reducer(initialState, addViolation(violation));
      const action = removeViolation({ bayIdx: 0, shelfIdx: 1 });
      state = reducer(state, action);
      expect(state.violations).not.toContainEqual(violation);
    });

    it('should keep violations that do not match', () => {
      const violation1 = { type: 'width', productId: 'product-1', bayIdx: 0, shelfIdx: 1 };
      const violation2 = { type: 'width', productId: 'product-2', bayIdx: 1, shelfIdx: 2 };
      let state = reducer(initialState, addViolation(violation1));
      state = reducer(state, addViolation(violation2));
      const action = removeViolation({ productId: 'product-1' });
      state = reducer(state, action);
      expect(state.violations).not.toContainEqual(violation1);
      expect(state.violations).toContainEqual(violation2);
    });

    it('should remove by bayIdx only', () => {
      const violation1 = { type: 'width', productId: 'p1', bayIdx: 0, shelfIdx: 1 };
      const violation2 = { type: 'width', productId: 'p2', bayIdx: 1, shelfIdx: 2 };
      let state = reducer(initialState, addViolation(violation1));
      state = reducer(state, addViolation(violation2));
      state = reducer(state, removeViolation({ bayIdx: 0 }));
      expect(state.violations).not.toContainEqual(violation1);
      expect(state.violations).toContainEqual(violation2);
    });

    it('should clear violations when payload is missing', () => {
      let state = reducer(initialState, addViolation({ type: 'width', productId: 'p1' }));
      state = reducer(state, addViolation({ type: 'width', productId: 'p2' }));
      state = reducer(state, removeViolation());
      expect(state.violations).toEqual([]);
    });
  });

  describe('setViolations', () => {
    it('should set violations array', () => {
      const violations = [
        { type: 'width', productId: 'product-1' },
        { type: 'height', productId: 'product-2' }
      ];
      const action = setViolations(violations);
      const state = reducer(initialState, action);
      expect(state.violations).toEqual(violations);
    });

    it('should handle non-array payload by setting empty array', () => {
      const action = setViolations(null);
      const state = reducer(initialState, action);
      expect(state.violations).toEqual([]);
    });
  });

  describe('clearViolations', () => {
    it('should clear all violations', () => {
      let state = reducer(initialState, addViolation({ type: 'width', productId: 'product-1' }));
      const action = clearViolations();
      state = reducer(state, action);
      expect(state.violations).toEqual([]);
    });
  });

  describe('current violations', () => {
    it('should set normalized current violations payload', () => {
      const payload = {
        violation_count: '3',
        violations: [{ type: 'width', productId: 'p1' }],
        extraField: 'value',
      };
      const action = setCurrentViolations(payload);
      const state = reducer(initialState, action);
      expect(state.current_violations.violation_count).toBe(3);
      expect(state.current_violations.violations).toEqual(payload.violations);
      expect(state.current_violations.extraField).toBe('value');
    });

    it('should default violations array when payload invalid', () => {
      const action = setCurrentViolations({ violation_count: 'abc', violations: null });
      const state = reducer(initialState, action);
      expect(state.current_violations.violation_count).toBe(0);
      expect(state.current_violations.violations).toEqual([]);
    });

    it('clearCurrentViolations should reset to default', () => {
      const setState = reducer(initialState, setCurrentViolations({ violation_count: 2, violations: [{ id: 'p1' }] }));
      const state = reducer(setState, clearCurrentViolations());
      expect(state.current_violations).toEqual({
        violation_count: 0,
        violations: [],
      });
    });
  });

  describe('setSelectedProduct', () => {
    it('should set selected product', () => {
      const product = { id: 'product-1', name: 'Product 1' };
      const action = setSelectedProduct(product);
      const state = reducer(initialState, action);
      expect(state.selectedProduct).toEqual(product);
    });
  });

  describe('setProductInventorySelectedProduct', () => {
    it('should set product inventory selected product', () => {
      const product = { id: 'product-1', name: 'Product 1' };
      const action = setProductInventorySelectedProduct(product);
      const state = reducer(initialState, action);
      expect(state.productInventorySelectedProduct).toEqual(product);
    });
  });

  describe('setIsFullScreen', () => {
    it('should set isFullScreen state', () => {
      const action = setIsFullScreen(false);
      const state = reducer(initialState, action);
      expect(state.isFullScreen).toBe(false);
    });
  });

  describe('setIsSchematicView', () => {
    it('should set isSchemeticView state', () => {
      const action = setIsSchematicView(true);
      const state = reducer(initialState, action);
      expect(state.isSchemeticView).toBe(true);
    });
  });

  describe('setTagMapFilters', () => {
    it('should update tag map filters', () => {
      const filters = { selectedType: 'brand', selectedBrands: ['Brand1'] };
      const action = setTagMapFilters(filters);
      const state = reducer(initialState, action);
      expect(state.tagMapFilters.selectedType).toBe('brand');
      expect(state.tagMapFilters.selectedBrands).toEqual(['Brand1']);
    });

    it('should merge with existing tag map filters', () => {
      let state = reducer(initialState, setTagMapFilters({ selectedType: 'brand' }));
      const action = setTagMapFilters({ selectedBrands: ['Brand1'] });
      state = reducer(state, action);
      expect(state.tagMapFilters.selectedType).toBe('brand');
      expect(state.tagMapFilters.selectedBrands).toEqual(['Brand1']);
    });
  });

  describe('resetTagMapFilters', () => {
    it('should reset tag map filters to initial state', () => {
      let state = reducer(initialState, setTagMapFilters({ selectedType: 'brand', selectedBrands: ['Brand1'] }));
      const action = resetTagMapFilters();
      state = reducer(state, action);
      expect(state.tagMapFilters).toEqual(initialState.tagMapFilters);
    });
  });

  describe('setRuleManager', () => {
    it('should set rule manager', () => {
      const ruleManager = { rules: [] };
      const action = setRuleManager(ruleManager);
      const state = reducer(initialState, action);
      expect(state.ruleManager).toEqual(ruleManager);
    });
  });

  describe('savePlanogramState', () => {
    it('should save planogram state', () => {
      const savedState = {
        added_products: { bay_details_list: [{ id: 1 }] },
        removed_products: { bay_details_list: [] }
      };
      const action = savePlanogramState(savedState);
      const state = reducer(initialState, action);
      expect(state.savedPlanogramState).toEqual(savedState);
    });
  });

  describe('resetPlanogramVisualizerData', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setPlanogramId('planogram-123'));
      state = reducer(state, setBays([{ id: 1 }]));
      const action = resetPlanogramVisualizerData();
      state = reducer(state, action);
      expect(state).toEqual(initialState);
    });
  });

  describe('resetVersionChange', () => {
    it('should reset to initial state but preserve planogramFilters and isFullScreen', () => {
      const customFilters = { brands: ['Brand1'], subCategories: [] };
      let state = reducer(initialState, setPlanogramFilters(customFilters));
      state = reducer(state, setIsFullScreen(false));
      state = reducer(state, setPlanogramId('planogram-123'));
      const action = resetVersionChange();
      state = reducer(state, action);
      expect(state.planogramFilters).toEqual(customFilters);
      expect(state.isFullScreen).toBe(false);
      expect(state.planogramId).toBe(null);
      expect(state.bays).toEqual([]);
    });
  });

  describe('activities', () => {
    it('addActivity should push activity', () => {
      const activity = { type: 'open', ts: 123 };
      const state = reducer(initialState, addActivity(activity));
      expect(state.activities).toEqual([activity]);
    });

    it('addActivity should ignore empty activity', () => {
      const state = reducer(initialState, addActivity(null));
      expect(state.activities).toEqual([]);
    });

    it('addActivity should cap activities at 100', () => {
      let state = initialState;
      for (let i = 0; i < 105; i += 1) {
        state = reducer(state, addActivity({ idx: i }));
      }
      expect(state.activities).toHaveLength(100);
      expect(state.activities[0]).toEqual({ idx: 5 });
    });

    it('clearActivities should clear activities', () => {
      let state = reducer(initialState, addActivity({ idx: 1 }));
      state = reducer(state, clearActivities());
      expect(state.activities).toEqual([]);
    });
  });

  describe('rules manager payload', () => {
    it('setRulesManagerPayload should merge payload and normalize rules', () => {
      const payload = { planogram_id: 10, rules: ['r1'] };
      const state = reducer(initialState, setRulesManagerPayload(payload));
      expect(state.rulesManagerPayload.planogram_id).toBe(10);
      expect(state.rulesManagerPayload.rules).toEqual(['r1']);
    });

    it('setRulesManagerPayload should keep existing rules when rules missing', () => {
      let state = reducer(initialState, setRules(['r1']));
      state = reducer(state, setRulesManagerPayload({ planogram_id: 11 }));
      expect(state.rulesManagerPayload.planogram_id).toBe(11);
      expect(state.rulesManagerPayload.rules).toEqual(['r1']);
    });

    it('setRulesManagerPayload should default rules to [] when invalid', () => {
      const state = reducer(initialState, setRulesManagerPayload({ rules: 'bad' }));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('clearRulesManagerPayload should reset payload', () => {
      const stateWithPayload = reducer(
        initialState,
        setRulesManagerPayload({ planogram_id: 10, rules: ['r1'] })
      );
      const state = reducer(stateWithPayload, clearRulesManagerPayload());
      expect(state.rulesManagerPayload).toEqual(initialState.rulesManagerPayload);
    });

    it('setRulesPlanogramId should set planogram_id', () => {
      const state = reducer(initialState, setRulesPlanogramId(22));
      expect(state.rulesManagerPayload.planogram_id).toBe(22);
    });

    it('setRulesPlanogramId should set planogram_id to null for falsy', () => {
      const state = reducer(initialState, setRulesPlanogramId(undefined));
      expect(state.rulesManagerPayload.planogram_id).toBe(null);
    });

    it('setRules should set rules array', () => {
      const state = reducer(initialState, setRules(['r1', 'r2']));
      expect(state.rulesManagerPayload.rules).toEqual(['r1', 'r2']);
    });

    it('setRules should default to empty array for non-array', () => {
      const state = reducer(initialState, setRules('bad'));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('addRule should add rule', () => {
      const rule = { ruleId: 'r1', name: 'rule1' };
      const state = reducer(initialState, addRule(rule));
      expect(state.rulesManagerPayload.rules).toEqual([rule]);
    });

    it('addRule should initialize rules when missing', () => {
      const stateWithNullRules = {
        ...initialState,
        rulesManagerPayload: { ...initialState.rulesManagerPayload, rules: null }
      };
      const state = reducer(stateWithNullRules, addRule({ ruleId: 'r1' }));
      expect(state.rulesManagerPayload.rules).toEqual([{ ruleId: 'r1' }]);
    });

    it('addRule should ignore empty rule', () => {
      const state = reducer(initialState, addRule(null));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('updateRule should update existing rule by ruleId', () => {
      const initialRule = { ruleId: 'r1', name: 'rule1' };
      const updatedRule = { name: 'rule1-updated' };
      let state = reducer(initialState, addRule(initialRule));
      state = reducer(state, updateRule({ ruleId: 'r1', rule: updatedRule }));
      expect(state.rulesManagerPayload.rules).toEqual([
        { ruleId: 'r1', name: 'rule1-updated' }
      ]);
    });

    it('updateRule should ignore when ruleId or rule missing', () => {
      let state = reducer(initialState, addRule({ ruleId: 'r1', name: 'rule1' }));
      state = reducer(state, updateRule({ ruleId: null, rule: { name: 'x' } }));
      state = reducer(state, updateRule({ ruleId: 'r1', rule: null }));
      expect(state.rulesManagerPayload.rules).toEqual([{ ruleId: 'r1', name: 'rule1' }]);
    });

    it('updateRule should do nothing when ruleId not found', () => {
      let state = reducer(initialState, addRule({ ruleId: 'r1', name: 'rule1' }));
      state = reducer(state, updateRule({ ruleId: 'missing', rule: { name: 'x' } }));
      expect(state.rulesManagerPayload.rules).toEqual([{ ruleId: 'r1', name: 'rule1' }]);
    });

    it('updateRule should initialize rules when missing', () => {
      const stateWithNullRules = {
        ...initialState,
        rulesManagerPayload: { ...initialState.rulesManagerPayload, rules: null }
      };
      const state = reducer(stateWithNullRules, updateRule({ ruleId: 'r1', rule: { name: 'x' } }));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('deleteRule should remove rule by ruleId', () => {
      let state = reducer(initialState, addRule({ ruleId: 'r1' }));
      state = reducer(state, deleteRule('r1'));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('deleteRule should ignore when ruleId missing or rules undefined', () => {
      const stateWithNullRules = {
        ...initialState,
        rulesManagerPayload: { ...initialState.rulesManagerPayload, rules: null }
      };
      let state = reducer(stateWithNullRules, deleteRule('r1'));
      expect(state.rulesManagerPayload.rules).toBe(null);
      state = reducer(initialState, deleteRule(null));
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });

    it('clearRules should clear rules array', () => {
      let state = reducer(initialState, addRule({ ruleId: 'r1' }));
      state = reducer(state, clearRules());
      expect(state.rulesManagerPayload.rules).toEqual([]);
    });
  });

  describe('setProductKPIsByTpnb', () => {
    it('should set productKPIsByTpnb with fallback', () => {
      const state = reducer(initialState, setProductKPIsByTpnb({ '123': { kpi: 1 } }));
      expect(state.productKPIsByTpnb).toEqual({ '123': { kpi: 1 } });
      const cleared = reducer(state, setProductKPIsByTpnb());
      expect(cleared.productKPIsByTpnb).toEqual({});
    });
  });

  describe('Selectors', () => {
    const mockState = {
      planogramVisualizerData: {
        ...initialState,
        status: 'loading',
        planogramId: 'planogram-123',
        bays: [{ id: 1 }],
        shelfLines: [{ id: 1 }],
        planogramProducts: [{ id: 1 }],
        zoomState: { oldValue: 1, newValue: 2 },
        SCALE: 5,
        planogramFilters: { brands: ['Brand1'] },
        leftSidebarCollapsed: false,
        rightSidebarCollapsed: false,
        selectedProduct: { id: 'product-1' },
        productInventorySelectedProduct: { id: 'product-2' },
        isFullScreen: false,
        isSchemeticView: true,
        tagMapFilters: { selectedType: 'brand' },
        planogramDetails: { id: '123' },
        ruleManager: { rules: [] },
        removedProductIds: ['product-1'],
        removedProductsWithPosition: [{ productId: 'product-1' }],
        repositionedProductsWithPosition: [{ productId: 'product-1' }],
        orientationChangedProductsWithPosition: [{ productId: 'product-2' }],
        pendingPlacement: { active: true },
        savedPlanogramState: { added_products: { bay_details_list: [] } },
        initialLayoutSnapshot: 'snapshot-1',
        hasUnsavedChanges: true,
        history: [{ idx: 1 }],
        activities: [{ type: 'open' }],
        rulesManagerPayload: {
          planogram_id: 1,
          rules: [{ ruleId: 'r1' }]
        },
        productKPIsByTpnb: { '123': { kpi: 1 } }
      }
    };

    it('selectStatus should return status', () => {
      expect(selectStatus(mockState)).toBe('loading');
    });

    it('selectPlanogramId should return planogramId', () => {
      expect(selectPlanogramId(mockState)).toBe('planogram-123');
    });

    it('selectBays should return bays', () => {
      expect(selectBays(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectShelfLines should return shelfLines', () => {
      expect(selectShelfLines(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectPlanogramProducts should return planogramProducts', () => {
      expect(selectPlanogramProducts(mockState)).toEqual([{ id: 1 }]);
    });

    it('selectZoomState should return zoomState', () => {
      expect(selectZoomState(mockState)).toEqual({ oldValue: 1, newValue: 2 });
    });

    it('selectScale should return SCALE', () => {
      expect(selectScale(mockState)).toBe(5);
    });

    it('selectPlanogramFilters should return planogramFilters', () => {
      expect(selectPlanogramFilters(mockState)).toEqual({ brands: ['Brand1'] });
    });

    it('selectLeftSidebarCollapsed should return leftSidebarCollapsed', () => {
      expect(selectLeftSidebarCollapsed(mockState)).toBe(false);
    });

    it('selectRightSidebarCollapsed should return rightSidebarCollapsed', () => {
      expect(selectRightSidebarCollapsed(mockState)).toBe(false);
    });

    it('selectSelectedProduct should return selectedProduct', () => {
      expect(selectSelectedProduct(mockState)).toEqual({ id: 'product-1' });
    });

    it('selectProductInventorySelectedProduct should return productInventorySelectedProduct', () => {
      expect(selectProductInventorySelectedProduct(mockState)).toEqual({ id: 'product-2' });
    });

    it('selectIsFullScreen should return isFullScreen', () => {
      expect(selectIsFullScreen(mockState)).toBe(false);
    });

    it('selectIsSchematicView should return isSchemeticView', () => {
      expect(selectIsSchematicView(mockState)).toBe(true);
    });

    it('selectTagMapFilters should return tagMapFilters', () => {
      expect(selectTagMapFilters(mockState)).toEqual({ selectedType: 'brand' });
    });

    it('selectPlanogramDetails should return planogramDetails', () => {
      expect(selectPlanogramDetails(mockState)).toEqual({ id: '123' });
    });

    it('selectRuleManager should return ruleManager', () => {
      expect(selectRuleManager(mockState)).toEqual({ rules: [] });
    });

    it('selectRemovedProductIds should return removedProductIds or empty array', () => {
      expect(selectRemovedProductIds(mockState)).toEqual(['product-1']);
      expect(selectRemovedProductIds({ planogramVisualizerData: {} })).toEqual([]);
    });

    it('selectRemovedProductsWithPosition should return removedProductsWithPosition or empty array', () => {
      expect(selectRemovedProductsWithPosition(mockState)).toEqual([{ productId: 'product-1' }]);
      expect(selectRemovedProductsWithPosition({ planogramVisualizerData: {} })).toEqual([]);
    });

    it('selectRepositionedProductsWithPosition should return repositionedProductsWithPosition or empty array', () => {
      expect(selectRepositionedProductsWithPosition(mockState)).toEqual([{ productId: 'product-1' }]);
      expect(selectRepositionedProductsWithPosition({ planogramVisualizerData: {} })).toEqual([]);
    });

    it('selectOrientationChangedProductsWithPosition should return orientationChangedProductsWithPosition or empty array', () => {
      expect(selectOrientationChangedProductsWithPosition(mockState)).toEqual([{ productId: 'product-2' }]);
      expect(selectOrientationChangedProductsWithPosition({ planogramVisualizerData: {} })).toEqual([]);
    });

    it('selectPendingPlacement should return pendingPlacement', () => {
      expect(selectPendingPlacement(mockState)).toEqual({ active: true });
    });

    it('selectSavedPlanogramState should return savedPlanogramState', () => {
      expect(selectSavedPlanogramState(mockState)).toEqual({ added_products: { bay_details_list: [] } });
    });

    it('selectInitialLayoutSnapshot should return initialLayoutSnapshot', () => {
      expect(selectInitialLayoutSnapshot(mockState)).toBe('snapshot-1');
    });

    it('selectHasUnsavedChanges should return hasUnsavedChanges', () => {
      expect(selectHasUnsavedChanges(mockState)).toBe(true);
    });

    it('selectCanUndo should return true when history exists', () => {
      expect(selectCanUndo(mockState)).toBe(true);
      expect(selectCanUndo({ planogramVisualizerData: { history: [] } })).toBe(false);
    });

    it('selectActivities should return activities', () => {
      expect(selectActivities(mockState)).toEqual([{ type: 'open' }]);
    });

    it('selectRulesManagerPayload should return payload', () => {
      expect(selectRulesManagerPayload(mockState)).toEqual({
        planogram_id: 1,
        rules: [{ ruleId: 'r1' }]
      });
    });

    it('selectRules should return rules array', () => {
      expect(selectRules(mockState)).toEqual([{ ruleId: 'r1' }]);
    });

    it('selectProductKPIsByTpnb should return productKPIsByTpnb', () => {
      expect(selectProductKPIsByTpnb(mockState)).toEqual({ '123': { kpi: 1 } });
    });

    it('selectCurrentViolations should return default when missing', () => {
      expect(selectCurrentViolations(mockState)).toEqual({
        violation_count: 0,
        violations: [],
      });
    });

    it('selectCurrentViolations should return provided violations when present', () => {
      const stateWithCurrent = {
        planogramVisualizerData: {
          ...mockState.planogramVisualizerData,
          current_violations: {
            violation_count: 5,
            violations: [{ productId: 'p1' }],
            extra: 'info',
          },
        },
      };
      expect(selectCurrentViolations(stateWithCurrent)).toEqual({
        violation_count: 5,
        violations: [{ productId: 'p1' }],
        extra: 'info',
      });
    });
  });
});

