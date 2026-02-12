const HIERARCHY_SUBCATEGORY = "Sub-Category";

export const filterKPIDataBySelection = (data, selectedKpis) => {
  if (!data || typeof data !== "object") return data;

  const before = data.before || {};
  const after = data.after || {};

  if (!Array.isArray(selectedKpis) || selectedKpis.length === 0) {
    return data;
  }

  // Get all available KPI options to check if all are selected
  const allCategoryKeys = Object.keys(before);
  const allAvailableKPIs = new Set();

  allCategoryKeys.forEach((categoryKey) => {
    allAvailableKPIs.add(categoryKey);
    const metrics = Object.keys(before[categoryKey] || {});
    metrics.forEach((metricKey) => {
      allAvailableKPIs.add(`${categoryKey}:${metricKey}`);
    });
  });

  const selectedSet = new Set(
    selectedKpis.filter((kpi) => kpi && kpi !== "All" && kpi !== "Select All")
  );
  if (
    selectedSet.size === allAvailableKPIs.size &&
    Array.from(allAvailableKPIs).every((kpi) => selectedSet.has(kpi))
  ) {
    return data;
  }

  const allCategorySelected = {};
  const selectedMetricsByCategory = {};

  // Parse selected codes (filter out "All" and "Select All")
  selectedKpis.forEach((code) => {
    if (!code || typeof code !== "string") return;
    if (code === "All" || code === "Select All") return;

    if (code.includes(":")) {
      // Metric-level selection → "sales:Potential Sales"
      const [categoryKey, metricKey] = code.split(":", 2);
      if (!categoryKey || !metricKey) return;

      if (!selectedMetricsByCategory[categoryKey]) {
        selectedMetricsByCategory[categoryKey] = new Set();
      }
      selectedMetricsByCategory[categoryKey].add(metricKey);
    } else {
      // Category-level selection → "sales"
      allCategorySelected[code] = true;
    }
  });

  const filteredBefore = {};
  const filteredAfter = {};

  const categoryKeys = Object.keys(before);

  categoryKeys.forEach((categoryKey) => {
    const beforeCategory = before[categoryKey] || {};
    const afterCategory = after[categoryKey] || {};

    const metrics = Object.keys(beforeCategory);

    const categorySelected =
      allCategorySelected[categoryKey] ||
      (selectedMetricsByCategory[categoryKey] &&
        selectedMetricsByCategory[categoryKey].size > 0);

    if (!categorySelected) return;

    const includeAllMetrics = !!allCategorySelected[categoryKey];
    const selectedMetricSet = selectedMetricsByCategory[categoryKey];

    metrics.forEach((metricKey) => {
      const shouldInclude =
        includeAllMetrics || selectedMetricSet?.has(metricKey);

      if (!shouldInclude) return;

      if (!filteredBefore[categoryKey]) filteredBefore[categoryKey] = {};
      if (!filteredAfter[categoryKey]) filteredAfter[categoryKey] = {};

      filteredBefore[categoryKey][metricKey] = beforeCategory[metricKey];
      filteredAfter[categoryKey][metricKey] = afterCategory[metricKey];
    });
  });

  return {
    ...data,
    before: filteredBefore,
    after: filteredAfter,
  };
};

const isSelectAllOrAllSelected = (selectedArray, availableSet) => {
  if (!Array.isArray(selectedArray) || selectedArray.length === 0) return false;
  if (selectedArray.includes("Select All")) return true;
  if (!availableSet || typeof availableSet.size !== "number") return false;
  if (selectedArray.length !== availableSet.size) return false;
  return Array.from(availableSet).every((v) => selectedArray.includes(v));
};

const isPlainObjectValue = (v) =>
  !!v && typeof v === "object" && !Array.isArray(v);

const detectSectionShapeMetricFirst = (sectionObj) => {
  if (!isPlainObjectValue(sectionObj)) return "unknown";
  const topKeys = Object.keys(sectionObj);
  if (topKeys.length === 0) return "unknown";
  return topKeys.some((k) => {
    const metricBlock = sectionObj[k];
    if (!isPlainObjectValue(metricBlock)) return false;
    return Object.keys(metricBlock).some((groupKey) => {
      const entry = metricBlock[groupKey];
      return isPlainObjectValue(entry) && Object.hasOwn(entry, "value");
    });
  })
    ? "metric_first"
    : "flattened";
};

export const filterSubcategoryBrandData = (
  data,
  selectedSubcats,
  selectedBrands,
  {
    hierarchy_1 = HIERARCHY_SUBCATEGORY,
    hierarchy_2 = "Brand",
    hierarchy2Filter = [],
  } = {}
) => {
  if (!data || typeof data !== "object") return data;

  const subcatsArray = Array.isArray(selectedSubcats) ? selectedSubcats : [];
  const brandsArray = Array.isArray(selectedBrands) ? selectedBrands : [];
  const leafArray = Array.isArray(hierarchy2Filter) ? hierarchy2Filter : [];

  const isPlainObject = (v) =>
    !!v && typeof v === "object" && !Array.isArray(v);

  const getSectionShape = (sectionObj) => {
    // Shape A (flattened): section[subcat] = { metricKey: number, brands: {...} }
    // Shape B (metric-first): section[metricKey][groupKey] = { value, brands|children }
    if (!isPlainObject(sectionObj)) return "unknown";
    const topKeys = Object.keys(sectionObj);
    if (topKeys.length === 0) return "unknown";

    // If ANY top-level value looks like a metric block (object whose values contain {value})
    // then treat section as metric-first.
    return topKeys.some((k) => {
      const maybeMetricBlock = sectionObj[k];
      if (!isPlainObject(maybeMetricBlock)) return false;
      const innerKeys = Object.keys(maybeMetricBlock);
      return innerKeys.some((ik) => {
        const entry = maybeMetricBlock[ik];
        return isPlainObject(entry) && Object.hasOwn(entry, "value");
      });
    })
      ? "metric_first"
      : "flattened";
  };

  const getAllGroupsFromMetricFirst = (metricBlock) => {
    if (!isPlainObject(metricBlock)) return [];
    return Object.keys(metricBlock).filter(
      (k) => k !== "brands" && k !== "children"
    );
  };

  const getEntryLeafMap = (entry) => {
    if (!isPlainObject(entry)) return {};
    if (isPlainObject(entry.brands)) return entry.brands;
    if (isPlainObject(entry.children)) return entry.children;
    return {};
  };

  const allAvailableSubcats = new Set();
  const allAvailableBrands = new Set();
  const allAvailableLeafs = new Set();

  const beforeData = data.before || {};
  const afterData = data.after || {};

  const sections = new Set([
    ...Object.keys(beforeData),
    ...Object.keys(afterData),
  ]);

  const collectLeafKeysFromMetricFirst = (leafMap) => {
    Object.keys(leafMap || {}).forEach((leafKey) => {
      if (hierarchy_1 === "Brand") {
        allAvailableLeafs.add(leafKey);
      } else {
        allAvailableBrands.add(leafKey);
      }
    });
  };

  sections.forEach((sectionKey) => {
    const beforeSection = beforeData[sectionKey] || {};
    const afterSection = afterData[sectionKey] || {};

    const shape =
      getSectionShape(beforeSection) === "metric_first"
        ? "metric_first"
        : getSectionShape(afterSection);

    if (shape === "metric_first") {
      // section[metricKey][groupKey] = { value, brands|children }
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        const beforeMetric = beforeSection?.[metricKey] || {};
        const afterMetric = afterSection?.[metricKey] || {};
        const groups = new Set([
          ...getAllGroupsFromMetricFirst(beforeMetric),
          ...getAllGroupsFromMetricFirst(afterMetric),
        ]);

        groups.forEach((groupKey) => {
          if (hierarchy_1 === "Brand") {
            allAvailableBrands.add(groupKey);
          } else {
            allAvailableSubcats.add(groupKey);
          }

          const beforeEntry = beforeMetric?.[groupKey];
          const afterEntry = afterMetric?.[groupKey];
          const leafMap = {
            ...getEntryLeafMap(beforeEntry),
            ...getEntryLeafMap(afterEntry),
          };
          collectLeafKeysFromMetricFirst(leafMap);
        });
      });
      return;
    }

    // Flattened shape: section[subcat] = { metricKey: number, brands: { brand: { metricKey: number } } }
    const subcatsInSection = new Set([
      ...Object.keys(beforeSection),
      ...Object.keys(afterSection),
    ]);

    subcatsInSection.forEach((subcat) => {
      if (subcat === "brands") return;
      allAvailableSubcats.add(subcat);

      const beforeSubcat = beforeSection[subcat] || {};
      const afterSubcat = afterSection[subcat] || {};
      const brandsInSubcat = beforeSubcat.brands || afterSubcat.brands || {};

      Object.keys(brandsInSubcat).forEach((brand) => {
        allAvailableBrands.add(brand);
      });
    });
  });

  // Check if "Select All" is explicitly selected OR if all items are selected
  const hasSelectAllSubcats = isSelectAllOrAllSelected(
    subcatsArray,
    allAvailableSubcats
  );

  const hasSelectAllBrands = isSelectAllOrAllSelected(
    brandsArray,
    allAvailableBrands
  );

  const hasSelectAllLeafs = isSelectAllOrAllSelected(
    leafArray,
    allAvailableLeafs
  );

  const subcatValues = subcatsArray.filter(
    (v) => v && v !== "All" && v !== "Select All"
  );
  const brandValues = brandsArray.filter(
    (v) => v && v !== "All" && v !== "Select All"
  );
  const leafValues = leafArray.filter(
    (v) => v && v !== "All" && v !== "Select All"
  );

  // Empty arrays mean "no filter applied" = show all data (default behavior)
  // Only filter if we have specific selections AND it's not "all items selected"
  const filterSubcats =
    hierarchy_1 === HIERARCHY_SUBCATEGORY &&
    subcatValues.length > 0 &&
    !hasSelectAllSubcats;
  const filterBrands = brandValues.length > 0 && !hasSelectAllBrands;
  const filterLeafs =
    hierarchy_1 === "Brand" &&
    (hierarchy_2 === "Platform" || hierarchy_2 === "Intensity") &&
    leafValues.length > 0 &&
    !hasSelectAllLeafs;

  // If all filter arrays are empty, show all data (default - no filter applied)
  if (
    subcatsArray.length === 0 &&
    brandsArray.length === 0 &&
    leafArray.length === 0
  ) {
    return data; // Show all
  }

  const subcatSet = filterSubcats ? new Set(subcatValues) : null;
  const brandSet = filterBrands ? new Set(brandValues) : null;
  const leafSet = filterLeafs ? new Set(leafValues) : null;

  const filterObjectByKeySet = (obj, keySet) => {
    const out = {};
    if (!isPlainObject(obj) || !keySet) return out;
    Object.keys(obj).forEach((k) => {
      if (keySet.has(k)) out[k] = obj[k];
    });
    return out;
  };

  const copyEntryWithoutLeaves = (entry) => {
    const copy = isPlainObject(entry) ? { ...entry } : {};
    delete copy.brands;
    delete copy.children;
    return copy;
  };

  const shouldSkipMetricFirstGroup = (groupKey) => {
    if (hierarchy_1 === HIERARCHY_SUBCATEGORY) {
      return filterSubcats && subcatSet && !subcatSet.has(groupKey);
    }
    return filterBrands && brandSet && !brandSet.has(groupKey);
  };

  const addSubcategoryMetricFirstGroup = (
    groupKey,
    beforeEntry,
    afterEntry,
    filteredBeforeMetric,
    filteredAfterMetric
  ) => {
    const beforeLeaf = getEntryLeafMap(beforeEntry);
    const afterLeaf = getEntryLeafMap(afterEntry);

    const filteredBeforeLeaf =
      filterBrands && brandSet
        ? filterObjectByKeySet(beforeLeaf, brandSet)
        : beforeLeaf;
    const filteredAfterLeaf =
      filterBrands && brandSet
        ? filterObjectByKeySet(afterLeaf, brandSet)
        : afterLeaf;

    const beforeCopy = copyEntryWithoutLeaves(beforeEntry);
    const afterCopy = copyEntryWithoutLeaves(afterEntry);

    if (
      Object.keys(filteredBeforeLeaf || {}).length > 0 ||
      Object.keys(filteredAfterLeaf || {}).length > 0
    ) {
      beforeCopy.brands = filteredBeforeLeaf;
      afterCopy.brands = filteredAfterLeaf;
    }

    if (Object.keys(beforeCopy).length > 0)
      filteredBeforeMetric[groupKey] = beforeCopy;
    if (Object.keys(afterCopy).length > 0)
      filteredAfterMetric[groupKey] = afterCopy;
  };

  const addBrandMetricFirstGroup = (
    groupKey,
    beforeEntry,
    afterEntry,
    filteredBeforeMetric,
    filteredAfterMetric
  ) => {
    if (filterLeafs && leafSet) {
      const beforeLeaf = getEntryLeafMap(beforeEntry);
      const afterLeaf = getEntryLeafMap(afterEntry);

      const filteredBeforeLeaf = filterObjectByKeySet(beforeLeaf, leafSet);
      const filteredAfterLeaf = filterObjectByKeySet(afterLeaf, leafSet);

      const beforeCopy = copyEntryWithoutLeaves(beforeEntry);
      const afterCopy = copyEntryWithoutLeaves(afterEntry);

      if (
        Object.keys(filteredBeforeLeaf).length > 0 ||
        Object.keys(filteredAfterLeaf).length > 0
      ) {
        beforeCopy.children = filteredBeforeLeaf;
        afterCopy.children = filteredAfterLeaf;
      }

      if (Object.keys(beforeCopy).length > 0)
        filteredBeforeMetric[groupKey] = beforeCopy;
      if (Object.keys(afterCopy).length > 0)
        filteredAfterMetric[groupKey] = afterCopy;
      return;
    }

    if (isPlainObject(beforeEntry))
      filteredBeforeMetric[groupKey] = beforeEntry;
    if (isPlainObject(afterEntry)) filteredAfterMetric[groupKey] = afterEntry;
  };

  const filteredBefore = {};
  const filteredAfter = {};

  sections.forEach((sectionKey) => {
    const beforeSection = beforeData[sectionKey] || {};
    const afterSection = afterData[sectionKey] || {};

    const filteredBeforeSection = {};
    const filteredAfterSection = {};

    const shape =
      getSectionShape(beforeSection) === "metric_first"
        ? "metric_first"
        : getSectionShape(afterSection);

    if (shape === "metric_first") {
      // section[metricKey][groupKey] = { value, brands|children }
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        const beforeMetric = beforeSection?.[metricKey] || {};
        const afterMetric = afterSection?.[metricKey] || {};
        const groups = new Set([
          ...getAllGroupsFromMetricFirst(beforeMetric),
          ...getAllGroupsFromMetricFirst(afterMetric),
        ]);

        const filteredBeforeMetric = {};
        const filteredAfterMetric = {};

        groups.forEach((groupKey) => {
          if (shouldSkipMetricFirstGroup(groupKey)) return;

          const beforeEntry = beforeMetric?.[groupKey];
          const afterEntry = afterMetric?.[groupKey];

          if (hierarchy_1 === HIERARCHY_SUBCATEGORY) {
            addSubcategoryMetricFirstGroup(
              groupKey,
              beforeEntry,
              afterEntry,
              filteredBeforeMetric,
              filteredAfterMetric
            );
            return;
          }

          addBrandMetricFirstGroup(
            groupKey,
            beforeEntry,
            afterEntry,
            filteredBeforeMetric,
            filteredAfterMetric
          );
        });

        if (
          Object.keys(filteredBeforeMetric).length > 0 ||
          Object.keys(filteredAfterMetric).length > 0
        ) {
          filteredBeforeSection[metricKey] = filteredBeforeMetric;
          filteredAfterSection[metricKey] = filteredAfterMetric;
        }
      });

      if (
        Object.keys(filteredBeforeSection).length > 0 ||
        Object.keys(filteredAfterSection).length > 0
      ) {
        filteredBefore[sectionKey] = filteredBeforeSection;
        filteredAfter[sectionKey] = filteredAfterSection;
      }
      return;
    }

    const subcatsInSection = new Set([
      ...Object.keys(beforeSection),
      ...Object.keys(afterSection),
    ]);

    subcatsInSection.forEach((subcat) => {
      if (subcat === "brands") return;
      if (filterSubcats && subcatSet && !subcatSet.has(subcat)) return;

      const beforeSubcat = beforeSection[subcat] || {};
      const afterSubcat = afterSection[subcat] || {};

      const beforeBrands = beforeSubcat.brands || {};
      const afterBrands = afterSubcat.brands || {};

      let filteredBeforeBrands = {};
      let filteredAfterBrands = {};

      if (filterBrands && brandSet) {
        Object.keys(beforeBrands).forEach((brand) => {
          if (brandSet.has(brand))
            filteredBeforeBrands[brand] = beforeBrands[brand];
        });
        Object.keys(afterBrands).forEach((brand) => {
          if (brandSet.has(brand))
            filteredAfterBrands[brand] = afterBrands[brand];
        });
      } else {
        filteredBeforeBrands = beforeBrands;
        filteredAfterBrands = afterBrands;
      }

      const shouldIncludeSubcat =
        !filterBrands ||
        Object.keys(filteredBeforeBrands).length > 0 ||
        Object.keys(filteredAfterBrands).length > 0;

      if (shouldIncludeSubcat) {
        const beforeSubcatCopy = { ...beforeSubcat };
        const afterSubcatCopy = { ...afterSubcat };
        delete beforeSubcatCopy.brands;
        delete afterSubcatCopy.brands;

        if (
          Object.keys(filteredBeforeBrands).length > 0 ||
          Object.keys(filteredAfterBrands).length > 0
        ) {
          beforeSubcatCopy.brands = filteredBeforeBrands;
          afterSubcatCopy.brands = filteredAfterBrands;
        }

        filteredBeforeSection[subcat] = beforeSubcatCopy;
        filteredAfterSection[subcat] = afterSubcatCopy;
      }
    });

    if (
      Object.keys(filteredBeforeSection).length > 0 ||
      Object.keys(filteredAfterSection).length > 0
    ) {
      filteredBefore[sectionKey] = filteredBeforeSection;
      filteredAfter[sectionKey] = filteredAfterSection;
    }
  });

  return {
    ...data,
    before: filteredBefore,
    after: filteredAfter,
  };
};

/**
 * Keep only KPI metrics (and their parent categories/brands/subcategories)
 * that show a non-zero lift between after and before.
 *
 * Supports both Category Overview (single before/after blocks) and
 * Performance Overview (object keyed by subcategory with brands nested).
 *
 * @param {object} data
 * @param {"Category Overview"|"Performance Overview"} view
 * @returns {object}
 */
export const filterScorecardDataWithLift = (
  data,
  view = "Category Overview"
) => {
  if (!data || typeof data !== "object") return data;

  const isPlainObject = (v) =>
    !!v && typeof v === "object" && !Array.isArray(v);

  const detectSectionShape = (sectionObj) => {
    // "flattened": section[subcat] = { metricKey: number, brands: { brand: {metricKey:number} } }
    // "metric_first": section[metricKey][groupKey] = { value, brands|children }
    if (!isPlainObject(sectionObj)) return "unknown";
    const topKeys = Object.keys(sectionObj);
    if (topKeys.length === 0) return "unknown";
    return topKeys.some((k) => {
      const metricBlock = sectionObj[k];
      if (!isPlainObject(metricBlock)) return false;
      return Object.keys(metricBlock).some((groupKey) => {
        const entry = metricBlock[groupKey];
        return isPlainObject(entry) && Object.hasOwn(entry, "value");
      });
    })
      ? "metric_first"
      : "flattened";
  };

  const hasLift = (beforeVal, afterVal) => {
    const beforeNum = Number(beforeVal) || 0;
    const afterNum = Number(afterVal) || 0;
    return beforeNum !== afterNum;
  };

  const filterLeafValuesWithLift = (leafKeys, beforeLeaf, afterLeaf) => {
    const filteredBefore = {};
    const filteredAfter = {};
    let hasAnyLift = false;

    leafKeys.forEach((leafKey) => {
      const lb = beforeLeaf?.[leafKey];
      const la = afterLeaf?.[leafKey];
      if (!hasLift(lb, la)) return;

      hasAnyLift = true;
      if (typeof lb === "number") filteredBefore[leafKey] = lb;
      if (typeof la === "number") filteredAfter[leafKey] = la;
    });

    return { hasAnyLift, filteredBefore, filteredAfter };
  };

  const filterMetricBlocks = (beforeBlock = {}, afterBlock = {}) => {
    const filteredBefore = {};
    const filteredAfter = {};

    const categoryKeys = new Set([
      ...Object.keys(beforeBlock || {}),
      ...Object.keys(afterBlock || {}),
    ]);

    categoryKeys.forEach((categoryKey) => {
      const beforeCategory = beforeBlock?.[categoryKey] || {};
      const afterCategory = afterBlock?.[categoryKey] || {};

      const isBeforeObj =
        beforeCategory &&
        typeof beforeCategory === "object" &&
        !Array.isArray(beforeCategory);
      const isAfterObj =
        afterCategory &&
        typeof afterCategory === "object" &&
        !Array.isArray(afterCategory);

      if (!isBeforeObj || !isAfterObj) {
        if (hasLift(beforeCategory, afterCategory)) {
          filteredBefore[categoryKey] = beforeCategory;
          filteredAfter[categoryKey] = afterCategory;
        }
        return;
      }

      const metricKeys = new Set([
        ...Object.keys(beforeCategory || {}),
        ...Object.keys(afterCategory || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        const beforeVal = beforeCategory?.[metricKey];
        const afterVal = afterCategory?.[metricKey];

        if (!hasLift(beforeVal, afterVal)) return;

        if (!filteredBefore[categoryKey]) filteredBefore[categoryKey] = {};
        if (!filteredAfter[categoryKey]) filteredAfter[categoryKey] = {};

        filteredBefore[categoryKey][metricKey] = beforeVal;
        filteredAfter[categoryKey][metricKey] = afterVal;
      });
    });

    return { before: filteredBefore, after: filteredAfter };
  };

  if (view !== "Performance Overview") {
    const { before, after } = filterMetricBlocks(data.before, data.after);
    return {
      ...data,
      before,
      after,
    };
  }

  const beforeData = data.before || {};
  const afterData = data.after || {};

  const filteredBefore = {};
  const filteredAfter = {};

  const sections = new Set([
    ...Object.keys(beforeData),
    ...Object.keys(afterData),
  ]);

  sections.forEach((sectionKey) => {
    const beforeSection = beforeData[sectionKey] || {};
    const afterSection = afterData[sectionKey] || {};

    const shape =
      detectSectionShape(beforeSection) === "metric_first"
        ? "metric_first"
        : detectSectionShape(afterSection);

    const filteredBeforeSection = {};
    const filteredAfterSection = {};

    if (shape === "metric_first") {
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        const beforeMetric = beforeSection?.[metricKey] || {};
        const afterMetric = afterSection?.[metricKey] || {};

        const filteredBeforeMetric = {};
        const filteredAfterMetric = {};

        const groupKeys = new Set([
          ...Object.keys(beforeMetric || {}),
          ...Object.keys(afterMetric || {}),
        ]);

        groupKeys.forEach((groupKey) => {
          const bEntry = beforeMetric?.[groupKey];
          const aEntry = afterMetric?.[groupKey];
          const bVal = isPlainObject(bEntry) ? bEntry.value : null;
          const aVal = isPlainObject(aEntry) ? aEntry.value : null;

          const bLeaf =
            (isPlainObject(bEntry) && (bEntry.brands || bEntry.children)) || {};
          const aLeaf =
            (isPlainObject(aEntry) && (aEntry.brands || aEntry.children)) || {};

          const leafKeys = new Set([
            ...Object.keys(bLeaf || {}),
            ...Object.keys(aLeaf || {}),
          ]);

          let groupHasLift = hasLift(bVal, aVal);

          const {
            hasAnyLift: hasLeafLift,
            filteredBefore: filteredLeafB,
            filteredAfter: filteredLeafA,
          } = filterLeafValuesWithLift(leafKeys, bLeaf, aLeaf);

          if (hasLeafLift) groupHasLift = true;

          if (!groupHasLift) return;

          const bCopy = isPlainObject(bEntry) ? { ...bEntry } : { value: bVal };
          const aCopy = isPlainObject(aEntry) ? { ...aEntry } : { value: aVal };

          delete bCopy.brands;
          delete bCopy.children;
          delete aCopy.brands;
          delete aCopy.children;

          if (
            Object.keys(filteredLeafB).length > 0 ||
            Object.keys(filteredLeafA).length > 0
          ) {
            const hasChildrenContainer =
              (isPlainObject(bEntry) && isPlainObject(bEntry.children)) ||
              (isPlainObject(aEntry) && isPlainObject(aEntry.children));

            if (hasChildrenContainer) {
              bCopy.children = filteredLeafB;
              aCopy.children = filteredLeafA;
            } else {
              bCopy.brands = filteredLeafB;
              aCopy.brands = filteredLeafA;
            }
          }

          filteredBeforeMetric[groupKey] = bCopy;
          filteredAfterMetric[groupKey] = aCopy;
        });

        if (
          Object.keys(filteredBeforeMetric).length > 0 ||
          Object.keys(filteredAfterMetric).length > 0
        ) {
          filteredBeforeSection[metricKey] = filteredBeforeMetric;
          filteredAfterSection[metricKey] = filteredAfterMetric;
        }
      });

      if (
        Object.keys(filteredBeforeSection).length > 0 ||
        Object.keys(filteredAfterSection).length > 0
      ) {
        filteredBefore[sectionKey] = filteredBeforeSection;
        filteredAfter[sectionKey] = filteredAfterSection;
      }
      return;
    }

    const subcatsInSection = new Set([
      ...Object.keys(beforeSection),
      ...Object.keys(afterSection),
    ]);

    subcatsInSection.forEach((subcat) => {
      if (subcat === "brands") return;

      const beforeSubcat = beforeSection[subcat] || {};
      const afterSubcat = afterSection[subcat] || {};

      const beforeSubcatMetrics = { ...beforeSubcat };
      const afterSubcatMetrics = { ...afterSubcat };
      delete beforeSubcatMetrics.brands;
      delete afterSubcatMetrics.brands;

      let hasSubcatLift = false;
      Object.keys(beforeSubcatMetrics).forEach((metricKey) => {
        const beforeVal = beforeSubcatMetrics[metricKey];
        const afterVal = afterSubcatMetrics[metricKey];
        if (hasLift(beforeVal, afterVal)) hasSubcatLift = true;
      });

      const beforeBrands = beforeSubcat.brands || {};
      const afterBrands = afterSubcat.brands || {};
      const filteredBrandsBefore = {};
      const filteredBrandsAfter = {};

      const brandKeys = new Set([
        ...Object.keys(beforeBrands),
        ...Object.keys(afterBrands),
      ]);

      for (const brandKey of brandKeys) {
        const beforeBrand = beforeBrands[brandKey] || {};
        const afterBrand = afterBrands[brandKey] || {};

        let hasBrandLift = false;
        const brandMetricKeys = new Set([
          ...Object.keys(beforeBrand),
          ...Object.keys(afterBrand),
        ]);

        for (const metricKey of brandMetricKeys) {
          const beforeVal = beforeBrand[metricKey];
          const afterVal = afterBrand[metricKey];
          if (hasLift(beforeVal, afterVal)) hasBrandLift = true;
        }

        if (hasBrandLift) {
          filteredBrandsBefore[brandKey] = beforeBrand;
          filteredBrandsAfter[brandKey] = afterBrand;
        }
      }

      if (
        hasSubcatLift ||
        Object.keys(filteredBrandsBefore).length > 0 ||
        Object.keys(filteredBrandsAfter).length > 0
      ) {
        const filteredSubcatBefore = { ...beforeSubcatMetrics };
        const filteredSubcatAfter = { ...afterSubcatMetrics };

        if (
          Object.keys(filteredBrandsBefore).length > 0 ||
          Object.keys(filteredBrandsAfter).length > 0
        ) {
          filteredSubcatBefore.brands = filteredBrandsBefore;
          filteredSubcatAfter.brands = filteredBrandsAfter;
        }

        filteredBeforeSection[subcat] = filteredSubcatBefore;
        filteredAfterSection[subcat] = filteredSubcatAfter;
      }
    });

    if (
      Object.keys(filteredBeforeSection).length > 0 ||
      Object.keys(filteredAfterSection).length > 0
    ) {
      filteredBefore[sectionKey] = filteredBeforeSection;
      filteredAfter[sectionKey] = filteredAfterSection;
    }
  });

  return {
    ...data,
    before: filteredBefore,
    after: filteredAfter,
  };
};

/**
 * Filter scorecard data based on Product View selection.
 * Filters metrics based on whether they contain "Kenvue" in their key names.
 *
 * @param {object} data - Scorecard data with before/after structure
 * @param {string[]} productView - Array containing "Only-Kenvue", "Non-Kenvue", or both/empty
 * @param {"Category Overview"|"Performance Overview"} view - Current view type
 * @returns {object} Filtered data
 */
export const filterScorecardDataByProductView = (
  data,
  productView = [],
  view = "Category Overview"
) => {
  if (!data || typeof data !== "object") return data;

  const productViewArray = Array.isArray(productView) ? productView : [];

  const hasOnlyKenvue = productViewArray.includes("Only-Kenvue");
  const hasNonKenvue = productViewArray.includes("Non-Kenvue");

  if (productViewArray.length === 0 || (hasOnlyKenvue && hasNonKenvue)) {
    return data;
  }

  const isKenvueMetric = (key) => {
    if (!key || typeof key !== "string") return false;
    return key.toLowerCase().includes("kenvue");
  };

  if (view !== "Performance Overview") {
    const beforeData = data.before || {};
    const afterData = data.after || {};
    const filteredBefore = {};
    const filteredAfter = {};

    const categoryKeys = new Set([
      ...Object.keys(beforeData),
      ...Object.keys(afterData),
    ]);

    categoryKeys.forEach((categoryKey) => {
      const beforeCategory = beforeData[categoryKey] || {};
      const afterCategory = afterData[categoryKey] || {};

      const isBeforeObj =
        beforeCategory &&
        typeof beforeCategory === "object" &&
        !Array.isArray(beforeCategory);
      const isAfterObj =
        afterCategory &&
        typeof afterCategory === "object" &&
        !Array.isArray(afterCategory);

      if (!isBeforeObj || !isAfterObj) {
        const shouldInclude = hasOnlyKenvue
          ? isKenvueMetric(categoryKey)
          : !isKenvueMetric(categoryKey);

        if (shouldInclude) {
          filteredBefore[categoryKey] = beforeCategory;
          filteredAfter[categoryKey] = afterCategory;
        }
        return;
      }

      const metricKeys = new Set([
        ...Object.keys(beforeCategory || {}),
        ...Object.keys(afterCategory || {}),
      ]);

      const filteredBeforeMetrics = {};
      const filteredAfterMetrics = {};

      metricKeys.forEach((metricKey) => {
        const shouldInclude = hasOnlyKenvue
          ? isKenvueMetric(metricKey)
          : !isKenvueMetric(metricKey);

        if (shouldInclude) {
          filteredBeforeMetrics[metricKey] = beforeCategory[metricKey];
          filteredAfterMetrics[metricKey] = afterCategory[metricKey];
        }
      });

      if (
        Object.keys(filteredBeforeMetrics).length > 0 ||
        Object.keys(filteredAfterMetrics).length > 0
      ) {
        filteredBefore[categoryKey] = filteredBeforeMetrics;
        filteredAfter[categoryKey] = filteredAfterMetrics;
      }
    });

    return {
      ...data,
      before: filteredBefore,
      after: filteredAfter,
    };
  }

  const beforeData = data.before || {};
  const afterData = data.after || {};
  const filteredBefore = {};
  const filteredAfter = {};

  const filterMetricObjectByProductView = (beforeObj = {}, afterObj = {}) => {
    const filteredBeforeObj = {};
    const filteredAfterObj = {};

    const keys = new Set([
      ...Object.keys(beforeObj || {}),
      ...Object.keys(afterObj || {}),
    ]);

    keys.forEach((metricKey) => {
      const shouldInclude = hasOnlyKenvue
        ? isKenvueMetric(metricKey)
        : !isKenvueMetric(metricKey);
      if (!shouldInclude) return;

      if (Object.hasOwn(beforeObj, metricKey))
        filteredBeforeObj[metricKey] = beforeObj[metricKey];
      if (Object.hasOwn(afterObj, metricKey))
        filteredAfterObj[metricKey] = afterObj[metricKey];
    });

    return { filteredBeforeObj, filteredAfterObj };
  };

  const sections = new Set([
    ...Object.keys(beforeData),
    ...Object.keys(afterData),
  ]);

  sections.forEach((sectionKey) => {
    const beforeSection = beforeData[sectionKey] || {};
    const afterSection = afterData[sectionKey] || {};

    const filteredBeforeSection = {};
    const filteredAfterSection = {};

    const shape =
      detectSectionShapeMetricFirst(beforeSection) === "metric_first"
        ? "metric_first"
        : detectSectionShapeMetricFirst(afterSection);

    if (shape === "metric_first") {
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        const shouldInclude = hasOnlyKenvue
          ? isKenvueMetric(metricKey)
          : !isKenvueMetric(metricKey);
        if (!shouldInclude) return;
        if (beforeSection?.[metricKey])
          filteredBeforeSection[metricKey] = beforeSection[metricKey];
        if (afterSection?.[metricKey])
          filteredAfterSection[metricKey] = afterSection[metricKey];
      });

      if (
        Object.keys(filteredBeforeSection).length > 0 ||
        Object.keys(filteredAfterSection).length > 0
      ) {
        filteredBefore[sectionKey] = filteredBeforeSection;
        filteredAfter[sectionKey] = filteredAfterSection;
      }
      return;
    }

    const subcatsInSection = new Set([
      ...Object.keys(beforeSection),
      ...Object.keys(afterSection),
    ]);

    subcatsInSection.forEach((subcat) => {
      if (subcat === "brands") return;

      const beforeSubcat = beforeSection[subcat] || {};
      const afterSubcat = afterSection[subcat] || {};

      const beforeSubcatMetrics = { ...beforeSubcat };
      const afterSubcatMetrics = { ...afterSubcat };
      delete beforeSubcatMetrics.brands;
      delete afterSubcatMetrics.brands;

      const {
        filteredBeforeObj: filteredSubcatBeforeMetrics,
        filteredAfterObj: filteredSubcatAfterMetrics,
      } = filterMetricObjectByProductView(
        beforeSubcatMetrics,
        afterSubcatMetrics
      );

      const beforeBrands = beforeSubcat.brands || {};
      const afterBrands = afterSubcat.brands || {};
      const filteredBrandsBefore = {};
      const filteredBrandsAfter = {};

      Object.keys(beforeBrands).forEach((brandKey) => {
        const beforeBrand = beforeBrands[brandKey] || {};
        const afterBrand = afterBrands[brandKey] || {};

        const {
          filteredBeforeObj: filteredBrandBeforeMetrics,
          filteredAfterObj: filteredBrandAfterMetrics,
        } = filterMetricObjectByProductView(beforeBrand, afterBrand);

        if (
          Object.keys(filteredBrandBeforeMetrics).length > 0 ||
          Object.keys(filteredBrandAfterMetrics).length > 0
        ) {
          filteredBrandsBefore[brandKey] = filteredBrandBeforeMetrics;
          filteredBrandsAfter[brandKey] = filteredBrandAfterMetrics;
        }
      });

      const hasSubcatMetrics =
        Object.keys(filteredSubcatBeforeMetrics).length > 0 ||
        Object.keys(filteredSubcatAfterMetrics).length > 0;
      const hasBrands =
        Object.keys(filteredBrandsBefore).length > 0 ||
        Object.keys(filteredBrandsAfter).length > 0;

      if (hasSubcatMetrics || hasBrands) {
        const filteredSubcatBefore = { ...filteredSubcatBeforeMetrics };
        const filteredSubcatAfter = { ...filteredSubcatAfterMetrics };

        if (hasBrands) {
          filteredSubcatBefore.brands = filteredBrandsBefore;
          filteredSubcatAfter.brands = filteredBrandsAfter;
        }

        filteredBeforeSection[subcat] = filteredSubcatBefore;
        filteredAfterSection[subcat] = filteredSubcatAfter;
      }
    });

    if (
      Object.keys(filteredBeforeSection).length > 0 ||
      Object.keys(filteredAfterSection).length > 0
    ) {
      filteredBefore[sectionKey] = filteredBeforeSection;
      filteredAfter[sectionKey] = filteredAfterSection;
    }
  });

  return {
    ...data,
    before: filteredBefore,
    after: filteredAfter,
  };
};
