import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setClusterData,
  setFilters,
  setOriginalPlanogramId,
  setSelectedPlanogramVersionId,
  selectClusterData,
  selectFilters,
  selectSelectedTab,
  selectOriginalPlanogramId,
  selectSelectedPlanogramVersionId,
  setScorecardData,
  setScorecardLoading,
  setBrands,
  setSubCategories,
  selectViewMode,
  setViewMode,
  selectScorecardData,
  selectScorecardLoading,
} from "../../redux/reducers/scorecardSlice";
import { selectPlanogramDetails } from "../../redux/reducers/planogramVisualizerSlice";
import {
  getScorecardData,
  getRelativeScorecardDataFromDSModule,
} from "../../api/api";
import {
  Autocomplete,
  TextField,
  Box,
  Chip,
  Divider,
  Radio,
  CircularProgress,
  Typography,
} from "@mui/material";

import Checkbox from "@mui/material/Checkbox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import { Grid3x3, ChartNoAxesColumnDecreasing, Download } from "lucide-react";
import bar from "../../assets/bar.svg";

const VIEW_CATEGORY_OVERVIEW = "Category Overview";
const VIEW_PERFORMANCE_OVERVIEW = "Performance Overview";

const HIERARCHY_SUBCATEGORY = "Sub-Category";
const HIERARCHY_BRAND = "Brand";
const HIERARCHY_PLATFORM = "Platform";
const HIERARCHY_INTENSITY = "Intensity";

const SELECT_ALL = "Select All";

const ScorecardFilters = () => {
  const dispatch = useDispatch();

  const filters = useSelector(selectFilters);
  const clusterData = useSelector(selectClusterData);
  const activeTab = useSelector(selectSelectedTab);
  const before_planogram_id = useSelector(selectOriginalPlanogramId);
  const after_planogram_id = useSelector(selectSelectedPlanogramVersionId);
  const viewMode = useSelector(selectViewMode);
  const planogramDetails = useSelector(selectPlanogramDetails);
  const scorecardData = useSelector(selectScorecardData);
  const scorecardLoading = useSelector(selectScorecardLoading);

  const [expandedKPICategories, setExpandedKPICategories] = useState(new Set());
  const showLiftKPIs = !!filters.showLiftKPIs;
  const [expandedHierarchy1, setExpandedHierarchy1] = useState(null);
  const [expandedHierarchy2, setExpandedHierarchy2] = useState(null);

  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  const getValidVersions = (cluster) =>
    cluster?.planogram_details?.planogram_versions?.filter(
      (v) => v.version_number !== 0
    ) || [];

  const getOptionDisplayLabel = (option) => {
    if (typeof option === "object") {
      return option.label ?? option.value ?? "";
    }
    return option ?? "";
  };

  const handleClearFilters = () => {
    // Reset only user-selectable filters while keeping the current cluster/version context intact.
    const cleared = {
      scorecardView: VIEW_CATEGORY_OVERVIEW,
      kpi: [],
      productView: [],
      subCategoryFilter: [],
      brandFilter: [],
      hierarchy2Filter: [],
      brands: [],
      subCategories: [],
      hierarchy_1: "",
      hierarchy_2: "",
      showLiftKPIs: false,
    };
    setExpandedKPICategories(new Set());
    dispatch(setFilters({ ...filters, ...cleared }));
  };

  // Ensure hierarchy selections stay valid whenever Performance Overview is active.
  useEffect(() => {
    const currentView = filters.scorecardView || VIEW_CATEGORY_OVERVIEW;
    if (currentView !== VIEW_PERFORMANCE_OVERVIEW) return;

    const currentH1 = filters.hierarchy_1 || HIERARCHY_SUBCATEGORY;
    const currentH2 = filters.hierarchy_2 || "";

    let nextH2 = currentH2;
    if (currentH1 === HIERARCHY_SUBCATEGORY) {
      nextH2 = HIERARCHY_BRAND;
    } else if (currentH1 === HIERARCHY_BRAND) {
      if (nextH2 !== HIERARCHY_PLATFORM && nextH2 !== HIERARCHY_INTENSITY) {
        nextH2 = HIERARCHY_PLATFORM;
      }
    }

    const updates = {};
    if (filters.hierarchy_1 !== currentH1) updates.hierarchy_1 = currentH1;
    if (filters.hierarchy_2 !== nextH2) updates.hierarchy_2 = nextH2;
    // If hierarchy_2 is being forced/changed, clear hierarchy2Filter (leaf selection) to avoid stale filters.
    if (filters.hierarchy_2 !== nextH2 && filters.hierarchy2Filter?.length) {
      updates.hierarchy2Filter = [];
    }
    // If hierarchy_1 is Subcategory, hierarchy2Filter should never apply.
    if (
      currentH1 === HIERARCHY_SUBCATEGORY &&
      filters.hierarchy2Filter?.length
    ) {
      updates.hierarchy2Filter = [];
    }

    if (Object.keys(updates).length > 0) {
      dispatch(setFilters({ ...filters, ...updates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.scorecardView,
    filters.hierarchy_1,
    filters.hierarchy_2,
    dispatch,
  ]);

  const renderCompactTag = (
    filterKey,
    selected = [],
    getTagProps = () => ({}),
    optionsList = []
  ) => {
    if (!selected || selected.length === 0) return null;

    const labels = selected.map(getOptionDisplayLabel);
    let summaryLabel = null;

    if (filterKey === "subCategoryFilter" || filterKey === "brandFilter") {
      const allOptions = (optionsList || []).filter((v) => v !== "Select All");
      const hasSelectAll = labels.includes("Select All");
      if (
        hasSelectAll ||
        (allOptions.length > 0 &&
          labels.filter((l) => l !== "Select All").length === allOptions.length)
      ) {
        summaryLabel = "All";
      }
    }

    if (!summaryLabel) {
      const first = labels[0] ?? "";
      const truncated = first.length > 10 ? `${first.slice(0, 10)}…` : first;
      summaryLabel =
        labels.length > 1 ? `${truncated}+${labels.length - 1}` : truncated;
    }

    const tagProps = getTagProps({ index: 0 });
    const { key, ...restTagProps } = tagProps;

    return [
      <Chip
        key={key || "summary"}
        label={summaryLabel}
        size="small"
        {...restTagProps}
        sx={{
          fontSize: "0.75rem",
          background: "#e3f2fd",
          color: "#1565c0",
          height: 22,
          maxWidth: "90%",
        }}
      />,
    ];
  };

  const resolveInitialSelection = (clusters, details) => {
    if (!clusters?.length) {
      return { selectedCluster: null, selectedVersion: null };
    }

    const clusterFromPlanogram = details?.clusterName
      ? clusters.find((c) => c.cluster_name === details.clusterName)
      : null;

    const selectedCluster = clusterFromPlanogram || clusters[0];
    const validVersions = getValidVersions(selectedCluster);

    const versionFromPlanogram =
      clusterFromPlanogram && details?.version
        ? validVersions.find((v) => v.version_number === details.version)
        : null;

    return {
      selectedCluster,
      selectedVersion: versionFromPlanogram || validVersions[0] || null,
    };
  };

  useEffect(() => {
    const defaults = {
      scorecardView: filters.scorecardView || VIEW_CATEGORY_OVERVIEW,
      kpi: filters.kpi && filters.kpi.length > 0 ? filters.kpi : [],
      showLiftKPIs: filters.showLiftKPIs || false,
    };

    const needsUpdate =
      !filters.scorecardView || !filters.kpi || filters.kpi.length === 0;

    if (needsUpdate) {
      dispatch(setFilters({ ...filters, ...defaults }));
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getScorecardData(
        "8514770d-3cd3-4de4-96e4-c3055df96581"
      );
      if (!res?.data?.data) return;

      const data = res.data.data;
      dispatch(setClusterData(data));

      const { selectedCluster, selectedVersion } = resolveInitialSelection(
        data?.clusters,
        planogramDetails
      );

      if (!selectedCluster) return;

      const defaultYear = data.year || "";
      const defaultStoreIds =
        selectedCluster.stores?.map((s) => s.store_id) || [];

      dispatch(
        setFilters({
          ...filters,
          clusterName: selectedCluster.cluster_name,
          year: defaultYear,
          version: selectedVersion?.version_number || "",
          storeIds: defaultStoreIds,
          scorecardView: filters.scorecardView || VIEW_CATEGORY_OVERVIEW,
          kpi: filters.kpi && filters.kpi.length > 0 ? filters.kpi : [],
          productView: filters.productView || [],
          showLiftKPIs: filters.showLiftKPIs || false,
        })
      );

      if (selectedCluster.planogram_details?.planogram_id) {
        dispatch(
          setOriginalPlanogramId(selectedCluster.planogram_details.planogram_id)
        );
      }

      dispatch(
        setSelectedPlanogramVersionId(selectedVersion?.planogram_id || null)
      );
    };
    fetchData();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    const resolvePlanogramId = (clusterName, versionNumber) => {
      if (after_planogram_id) return after_planogram_id;
      if (!clusterName || !versionNumber) return null;

      const selectedCluster = clusterData?.clusters?.find(
        (c) => c.cluster_name === clusterName
      );
      const selectedVersion =
        selectedCluster?.planogram_details?.planogram_versions?.find(
          (v) => v.version_number === versionNumber
        );
      return selectedVersion?.planogram_id || null;
    };

    const buildHierarchyPayload = (viewValue, basePayload) => {
      if (viewValue !== VIEW_PERFORMANCE_OVERVIEW) return basePayload;

      const h1 = filters.hierarchy_1 || HIERARCHY_SUBCATEGORY;
      let h2 = filters.hierarchy_2 || "";
      if (h1 === HIERARCHY_SUBCATEGORY) {
        h2 = HIERARCHY_BRAND;
      } else if (
        h1 === HIERARCHY_BRAND &&
        h2 !== HIERARCHY_PLATFORM &&
        h2 !== HIERARCHY_INTENSITY
      ) {
        h2 = HIERARCHY_PLATFORM;
      }
      return { ...basePayload, hierarchy_1: h1, hierarchy_2: h2 };
    };

    const fetchScorecardData = async () => {
      const clusterName = filters.clusterName || "";
      const versionNumber = filters.version || "";
      const version = versionNumber ? `V${versionNumber}` : "";
      const planogramId = resolvePlanogramId(clusterName, versionNumber);

      if (!clusterName || !version || !planogramId) {
        dispatch(setScorecardLoading(false));
        dispatch(setScorecardData([]));
        return;
      }

      dispatch(setScorecardLoading(true));
      const viewValue = filters.scorecardView || VIEW_CATEGORY_OVERVIEW;

      const basePayload = {
        view: viewValue,
        cluster: clusterName,
        version: version,
        original_id: before_planogram_id,
        planogram_id: planogramId,
        time_period: "6 Months",
      };

      const payload = buildHierarchyPayload(viewValue, basePayload);
      const res = await getRelativeScorecardDataFromDSModule(payload);

      const scorecardData = res?.data?.data?.data || [];
      dispatch(setScorecardData(scorecardData));
    };

    fetchScorecardData()
      .catch((error) => {
        console.error("Failed to fetch scorecard data", error);
        dispatch(setScorecardData([]));
        dispatch(setBrands([]));
        dispatch(setSubCategories([]));
        dispatch(setFilters({ brands: [], subCategories: [] }));
      })
      .finally(() => {
        dispatch(setScorecardLoading(false));
      });
  }, [
    before_planogram_id,
    after_planogram_id,
    activeTab,
    dispatch,
    filters.clusterName,
    filters.version,
    filters.scorecardView,
    filters.hierarchy_1,
    filters.hierarchy_2,
    clusterData,
  ]);

  // Initialize subCategoryFilter and brandFilter with all available values when data becomes available
  useEffect(() => {
    if (
      filters.scorecardView === VIEW_PERFORMANCE_OVERVIEW &&
      scorecardData &&
      typeof scorecardData === "object"
    ) {
      const { subCategories, brands } =
        extractSubcategoriesAndBrandsFromScorecard(
          scorecardData,
          filters?.hierarchy_1 || HIERARCHY_SUBCATEGORY
        );

      // Store available brands and subcategories in Redux (for reference)
      dispatch(setBrands(brands));
      dispatch(setSubCategories(subCategories));

      // DON'T auto-initialize filters - keep them empty so "show all" is the default
      // Filters will remain empty until user explicitly selects something
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecardData, filters.scorecardView, dispatch]);

  const extractSubcategoriesAndBrandsFromScorecard = (
    scorecard,
    hierarchy_1 = HIERARCHY_SUBCATEGORY
  ) => {
    if (!scorecard || typeof scorecard !== "object") {
      return { subCategories: [], brands: [] };
    }

    const isPlainObject = (v) =>
      !!v && typeof v === "object" && !Array.isArray(v);

    // Supported shapes:
    // A) flattened: before.sales.KIDS.{ "Potential Sales": number, brands: { AQUAFRESH: { "Potential Sales": number } } }
    // B) metric-first: before.sales["Potential Sales"].KIDS.{ value: number, brands: { AQUAFRESH: number } }
    const subcategorySet = new Set();
    const brandSet = new Set();

    const beforeData = scorecard.before || {};
    const afterData = scorecard.after || {};

    // Get all sections (sales, productivity, etc.)
    const sections = new Set([
      ...Object.keys(beforeData),
      ...Object.keys(afterData),
    ]);

    const addBrandKeys = (mapObj) => {
      Object.keys(mapObj || {}).forEach((k) => brandSet.add(k));
    };

    const detectMetricFirstShape = (section) => {
      const keys = Object.keys(section || {});
      for (const k of keys) {
        const metricBlock = section[k];
        if (!isPlainObject(metricBlock)) continue;
        const groupKeys = Object.keys(metricBlock);
        for (const groupKey of groupKeys) {
          const entry = metricBlock[groupKey];
          if (isPlainObject(entry) && Object.hasOwn(entry, "value")) {
            return true;
          }
        }
      }
      return false;
    };

    const processGroupKey = (groupKey, beforeMetric, afterMetric) => {
      // groupKey is Subcategory (h1=Subcategory) or Brand (h1=Brand)
      if (hierarchy_1 === HIERARCHY_BRAND) {
        brandSet.add(groupKey);
      } else {
        subcategorySet.add(groupKey);
      }

      const entry = beforeMetric?.[groupKey] || afterMetric?.[groupKey] || {};
      const leaf = entry?.brands || entry?.children || {};
      if (hierarchy_1 === HIERARCHY_SUBCATEGORY) {
        // leaf is brands
        addBrandKeys(leaf);
      }
    };

    const processMetricKey = (metricKey, beforeSection, afterSection) => {
      const beforeMetric = beforeSection?.[metricKey] || {};
      const afterMetric = afterSection?.[metricKey] || {};
      const groupKeys = new Set([
        ...Object.keys(beforeMetric || {}),
        ...Object.keys(afterMetric || {}),
      ]);

      groupKeys.forEach((groupKey) => {
        processGroupKey(groupKey, beforeMetric, afterMetric);
      });
    };

    const processMetricFirstSection = (beforeSection, afterSection) => {
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        processMetricKey(metricKey, beforeSection, afterSection);
      });
    };

    const processFlattenedSection = (beforeSection, afterSection) => {
      const subcatsInSection = new Set([
        ...Object.keys(beforeSection),
        ...Object.keys(afterSection),
      ]);

      subcatsInSection.forEach((subcat) => {
        if (subcat === "brands") return;
        subcategorySet.add(subcat);
        const beforeSubcat = beforeSection[subcat] || {};
        const afterSubcat = afterSection[subcat] || {};
        const brandsInSubcat = beforeSubcat.brands || afterSubcat.brands || {};
        addBrandKeys(brandsInSubcat);
      });
    };

    sections.forEach((sectionKey) => {
      const beforeSection = beforeData[sectionKey] || {};
      const afterSection = afterData[sectionKey] || {};

      const isMetricFirst = detectMetricFirstShape(beforeSection);

      if (isMetricFirst) {
        processMetricFirstSection(beforeSection, afterSection);
        return;
      }

      processFlattenedSection(beforeSection, afterSection);
    });

    return {
      subCategories: Array.from(subcategorySet),
      brands: Array.from(brandSet),
    };
  };

  const extractLeafValuesFromScorecard = (scorecard) => {
    if (!scorecard || typeof scorecard !== "object") return [];

    const isPlainObject = (v) =>
      !!v && typeof v === "object" && !Array.isArray(v);

    const leafSet = new Set();

    const beforeData = scorecard.before || {};
    const afterData = scorecard.after || {};

    const sections = new Set([
      ...Object.keys(beforeData),
      ...Object.keys(afterData),
    ]);

    const hasValueProperty = (entry) => {
      return isPlainObject(entry) && Object.hasOwn(entry, "value");
    };

    const detectMetricFirst = (sectionObj) => {
      if (!isPlainObject(sectionObj)) return false;
      const keys = Object.keys(sectionObj);
      for (const k of keys) {
        const metricBlock = sectionObj[k];
        if (!isPlainObject(metricBlock)) continue;
        const groupKeys = Object.keys(metricBlock);
        for (const groupKey of groupKeys) {
          const entry = metricBlock[groupKey];
          if (hasValueProperty(entry)) return true;
        }
      }
      return false;
    };

    const processGroupKeyForLeaves = (groupKey, beforeMetric, afterMetric) => {
      const bEntry = beforeMetric?.[groupKey] || {};
      const aEntry = afterMetric?.[groupKey] || {};

      const bLeaf =
        (isPlainObject(bEntry) && (bEntry.children || bEntry.brands)) || {};
      const aLeaf =
        (isPlainObject(aEntry) && (aEntry.children || aEntry.brands)) || {};

      Object.keys(bLeaf || {}).forEach((k) => leafSet.add(k));
      Object.keys(aLeaf || {}).forEach((k) => leafSet.add(k));
    };

    const processMetricKeyForLeaves = (
      metricKey,
      beforeSection,
      afterSection
    ) => {
      const beforeMetric = beforeSection?.[metricKey] || {};
      const afterMetric = afterSection?.[metricKey] || {};
      const groupKeys = new Set([
        ...Object.keys(beforeMetric || {}),
        ...Object.keys(afterMetric || {}),
      ]);

      groupKeys.forEach((groupKey) => {
        processGroupKeyForLeaves(groupKey, beforeMetric, afterMetric);
      });
    };

    const processMetricKeys = (beforeSection, afterSection) => {
      const metricKeys = new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]);

      metricKeys.forEach((metricKey) => {
        processMetricKeyForLeaves(metricKey, beforeSection, afterSection);
      });
    };

    sections.forEach((sectionKey) => {
      const beforeSection = beforeData[sectionKey] || {};
      const afterSection = afterData[sectionKey] || {};

      const metricFirst =
        detectMetricFirst(beforeSection) || detectMetricFirst(afterSection);
      if (!metricFirst) return;

      processMetricKeys(beforeSection, afterSection);
    });

    return Array.from(leafSet);
  };

  const toggleExpanded = (level, value) => {
    if (level === 1) {
      setExpandedHierarchy1((prev) => (prev === value ? null : value));
    } else {
      setExpandedHierarchy2((prev) => (prev === value ? null : value));
    }
  };

  const applyCheckboxToggle = ({
    list,
    selected,
    keyToUpdate,
    value,
    toggleType,
  }) => {
    const options = Array.isArray(list) ? list : [];
    const curr = Array.isArray(selected) ? selected : [];

    const isAllState = curr.length === 0;
    const isExplicitAll = options.length > 0 && curr.length === options.length;

    if (toggleType === "selectAll") {
      // empty means "show all"
      dispatch(setFilters({ ...filters, [keyToUpdate]: [] }));
      return;
    }

    if (!value) return;

    // In "all" state, unchecking any item should become explicit-all-minus-one
    if (isAllState) {
      dispatch(
        setFilters({
          ...filters,
          [keyToUpdate]: options.filter((v) => v !== value),
        })
      );
      return;
    }

    if (isExplicitAll) {
      dispatch(
        setFilters({
          ...filters,
          [keyToUpdate]: options.filter((v) => v !== value),
        })
      );
      return;
    }

    if (curr.includes(value)) {
      dispatch(
        setFilters({
          ...filters,
          [keyToUpdate]: curr.filter((v) => v !== value),
        })
      );
    } else {
      dispatch(setFilters({ ...filters, [keyToUpdate]: [...curr, value] }));
    }
  };

  const handleClusterChange = (event, value) => {
    const newCluster = clusterData?.clusters?.find(
      (c) => c.cluster_name === value
    );
    if (newCluster) {
      const validVersions =
        newCluster.planogram_details?.planogram_versions?.filter(
          (v) => v.version_number !== 0
        ) || [];
      const defaultVersion = validVersions[0]?.version_number || "";
      const defaultStoreIds = newCluster.stores?.map((s) => s.store_id) || [];

      dispatch(
        setFilters({
          ...filters,
          clusterName: value || "",
          version: defaultVersion,
          storeIds: defaultStoreIds,
          year: clusterData?.year || "",
          scorecardView: filters.scorecardView || "Category Overview",
          kpi: filters.kpi || ["All"],
          productView: filters.productView || [],
          showLiftKPIs: filters.showLiftKPIs || false,
        })
      );

      if (newCluster.planogram_details?.planogram_id) {
        dispatch(
          setOriginalPlanogramId(newCluster.planogram_details.planogram_id)
        );
      }

      const v1Planogram = validVersions.find((v) => v.version_number >= 1);
      dispatch(
        setSelectedPlanogramVersionId(v1Planogram?.planogram_id || null)
      );
    }
  };

  // Keep KPI category → sub-KPI list consistent across all API response shapes/views.
  // Mirrors `ClusterGraphicViewNew` section config.
  const KPI_CATEGORY_CONFIG = [
    {
      key: "sales",
      label: "Sales",
      metrics: [
        "Potential Sales",
        "Potential Sales (Yearly)",
        "Kenvue Potential Sales",
        "Kenvue Potential Sales (Yearly)",
        "Lost Sales",
        "Lost Sales (Kenvue)",
        "avg sales per item",
        "avg sales per item (Kenvue)",
        "avg sales per cm",
        "avg sales per cm (Kenvue)",
      ],
    },
    {
      key: "productivity",
      label: "Productivity",
      metrics: [
        "Kenvue shelf share",
        "Kenvue sales share",
        "Kenvue Index",
        "Kenvue Productivity",
      ],
    },
    {
      key: "assortment",
      label: "Assortment",
      metrics: [
        "Total Item count",
        "Total Item count (Kenvue)",
        "Total Items added",
        "Total Items added (Kenvue)",
        "Total Items removed",
        "Total Items removed (Kenvue)",
        "Overlapping Items",
        "Overlapping Items (Kenvue)",
      ],
    },
    { key: "inventory", label: "Inventory", metrics: [] },
    { key: "marchandising", label: "Merchandising", metrics: [] },
  ];

  const getAllAvailableKPIOptions = () => {
    const allOptions = [];

    KPI_CATEGORY_CONFIG.forEach((category) => {
      const hasChildren = (category.metrics || []).length > 0;
      allOptions.push({
        value: category.key,
        label: category.label,
        isCategory: true,
        categoryKey: category.key,
        hasChildren,
      });

      (category.metrics || []).forEach((metric) => {
        allOptions.push({
          value: `${category.key}:${metric}`,
          label: metric,
          isCategory: false,
          categoryKey: category.key,
          metricKey: metric,
          isChild: true,
        });
      });
    });

    return allOptions;
  };

  const buildKPIOptions = () => {
    const options = [];

    options.push({
      value: "All",
      label: "All",
      isCategory: false,
      isSelectAll: true,
    });

    KPI_CATEGORY_CONFIG.forEach((category) => {
      const hasChildren = (category.metrics || []).length > 0;
      options.push({
        value: category.key,
        label: category.label,
        isCategory: true,
        categoryKey: category.key,
        hasChildren,
      });

      if (hasChildren && expandedKPICategories.has(category.key)) {
        (category.metrics || []).forEach((metric) => {
          options.push({
            value: `${category.key}:${metric}`,
            label: metric,
            isCategory: false,
            categoryKey: category.key,
            metricKey: metric,
            isChild: true,
          });
        });
      }
    });

    return options;
  };

  const kpiOptions = buildKPIOptions();

  const findOptionInList = (list, val) => {
    return list.find((opt) =>
      typeof opt === "object" ? opt.value === val : opt === val
    );
  };

  const convertStoredValueToOption = (
    val,
    visibleOptions,
    allAvailableOptions
  ) => {
    if (typeof val === "object") return val;

    let found = findOptionInList(visibleOptions, val);

    if (!found) {
      found = allAvailableOptions.find((opt) =>
        typeof opt === "object" ? opt.value === val : false
      );
    }

    return found || val;
  };

  const hierarchy_1_value = filters?.hierarchy_1 || HIERARCHY_SUBCATEGORY;
  const { subCategories: hierarchySubCategories, brands: hierarchyBrands } =
    useMemo(
      () =>
        extractSubcategoriesAndBrandsFromScorecard(
          scorecardData,
          hierarchy_1_value
        ),
      [scorecardData, hierarchy_1_value]
    );
  const hierarchyLeafs = useMemo(
    () => extractLeafValuesFromScorecard(scorecardData),
    [scorecardData]
  );

  const dynamicFilterConfig = (() => {
    const currentView = filters.scorecardView || VIEW_CATEGORY_OVERVIEW;

    let viewSpecificFilters = [];
    if (currentView === VIEW_CATEGORY_OVERVIEW) {
      viewSpecificFilters = [
        {
          key: "category",
          label: "Category",
          type: "readonly",
          value: "Oral Care",
        },
      ];
    } else if (currentView === VIEW_PERFORMANCE_OVERVIEW) {
      const h1Value = filters.hierarchy_1 || HIERARCHY_SUBCATEGORY;
      viewSpecificFilters = [
        {
          key: "hierarchy_1",
          label: "Hierarchy 1",
          type: "single",
          options: [HIERARCHY_SUBCATEGORY, HIERARCHY_BRAND].map((opt) => ({
            label: opt,
            value: opt,
          })),
          renderOptionAsRadio: true,
        },
        {
          key: "hierarchy_2",
          label: "Hierarchy 2",
          type: "single",
          options: [
            HIERARCHY_BRAND,
            HIERARCHY_PLATFORM,
            HIERARCHY_INTENSITY,
          ].map((opt) => ({
            label: opt,
            value: opt,
            disabled:
              h1Value === HIERARCHY_SUBCATEGORY
                ? opt !== HIERARCHY_BRAND
                : opt === HIERARCHY_BRAND,
          })),
          getOptionDisabled: (option) => !!option?.disabled,
          renderOptionAsRadio: true,
        },
      ];
    }

    return [
      {
        key: "scorecardView",
        label: "View",
        type: "single",
        options: [
          { label: VIEW_CATEGORY_OVERVIEW, value: VIEW_CATEGORY_OVERVIEW },
          {
            label: VIEW_PERFORMANCE_OVERVIEW,
            value: VIEW_PERFORMANCE_OVERVIEW,
          },
        ],
      },
      ...viewSpecificFilters,
      {
        key: "kpi",
        label: "KPI",
        type: "multi",
        options: kpiOptions,
        groupBy: (option) =>
          typeof option === "object" ? option.group : "All",
        getOptionLabel: (option) =>
          typeof option === "object" ? option.label : option,
      },
      {
        key: "productView",
        label: "Product View",
        type: "multi",
        options: ["Only-Kenvue", "Non-Kenvue"],
      },
    ];
  })();

  const getDefaultFilterValue = (filterKey) => {
    if (filterKey === "scorecardView") {
      return VIEW_CATEGORY_OVERVIEW;
    }
    return "";
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width={"100%"}
      px={1}
      py={1}
      sx={{ flexWrap: { xs: "wrap", sm: "nowrap" }, gap: { xs: 1, sm: 1.5 } }}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
        flex={1}
        sx={{ minWidth: 0 }}
      >
        {dynamicFilterConfig.map((filter) => {
          if (filter.type === "readonly") {
            return (
              <TextField
                key={filter.key}
                label={filter.label}
                value={filter.value}
                InputProps={{ readOnly: true }}
                variant="outlined"
                size="small"
                sx={{
                  width: 180,
                  "& .MuiInputBase-root": { fontSize: 13 },
                  "& .MuiInputLabel-root": { fontSize: 13 },
                }}
                InputLabelProps={{ shrink: true }}
              />
            );
          }
          if (filter.type === "multi") {
            const width = 300;
            const isKPI = filter.key === "kpi";

            const getSelectedValues = () => {
              let storedValues = filters[filter.key] || [];

              // Product view: simple multi-select - return empty array when empty to show placeholder
              if (filter.key === "productView" && !isKPI) {
                if (!storedValues || storedValues.length === 0) {
                  return [];
                }
                return storedValues;
              }

              // KPI: work like Brand/Subcategory - show "All" when all selected, empty when none
              if (isKPI) {
                const allAvailableOptions = getAllAvailableKPIOptions();
                const allOptionValues = allAvailableOptions
                  .map((opt) => opt?.value)
                  .filter(Boolean);
                const visibleOptions = filter.options;

                // If nothing is selected, return [] (show placeholder)
                if (!storedValues || storedValues.length === 0) {
                  return [];
                }

                // Convert stored values to option objects
                const selectedOptions = storedValues
                  .map((val) =>
                    convertStoredValueToOption(
                      val,
                      visibleOptions,
                      allAvailableOptions
                    )
                  )
                  .filter(Boolean);

                // If all are selected, visually show "All" + all options
                if (
                  storedValues.length === allOptionValues.length &&
                  allOptionValues.every((val) => storedValues.includes(val))
                ) {
                  // Find the "All" option from filter.options to match its format
                  const allOption = filter.options.find(
                    (opt) =>
                      opt &&
                      ((typeof opt === "object" &&
                        (opt.value === "All" || opt.isSelectAll)) ||
                        opt === "All")
                  ) || { value: "All", label: "All", isSelectAll: true };
                  return [allOption, ...selectedOptions];
                }

                // Otherwise show just current selection
                return selectedOptions;
              }

              // Subcategory / Brand (DS module):
              if (
                filter.key === "subCategoryFilter" ||
                filter.key === "brandFilter"
              ) {
                const allOptions = (filter.options || []).filter(
                  (v) => v !== "Select All"
                );

                // If nothing is selected, return []
                if (!storedValues || storedValues.length === 0) {
                  return [];
                }
                // If all are selected, visually show Select All
                if (storedValues.length === allOptions.length) {
                  return ["Select All", ...allOptions];
                }
                // Else show just current selection
                return storedValues;
              }

              // Fallback for any other multi filter
              return storedValues;
            };

            const getChildOptionsForCategory = (
              allAvailableOptions,
              categoryKey
            ) => {
              return allAvailableOptions.filter(
                (opt) =>
                  typeof opt === "object" &&
                  opt.categoryKey === categoryKey &&
                  opt.isChild
              );
            };

            const addChildValuesToSet = (childOptions, finalSet) => {
              childOptions.forEach((child) => {
                if (child.value) {
                  finalSet.add(child.value);
                }
              });
            };

            const processCategorySelection = (
              categoryCode,
              allAvailableOptions,
              categoryCodes,
              cleanedSelectedCodes,
              newlyAddedCategories,
              finalSet,
              fullySelectedCategories
            ) => {
              const childOptions = getChildOptionsForCategory(
                allAvailableOptions,
                categoryCode
              );
              const childValues = childOptions
                .map((opt) => opt.value)
                .filter(Boolean);

              // If category has no children, check if it's selected
              if (childValues.length === 0) {
                if (categoryCodes.has(categoryCode)) {
                  finalSet.add(categoryCode);
                  fullySelectedCategories.add(categoryCode);
                }
                return;
              }

              // Check if all children are selected
              const allChildrenSelected = childValues.every((childValue) =>
                cleanedSelectedCodes.includes(childValue)
              );

              // If user just clicked the parent category checkbox, add parent + all children
              if (newlyAddedCategories.has(categoryCode)) {
                finalSet.add(categoryCode);
                addChildValuesToSet(childOptions, finalSet);
                fullySelectedCategories.add(categoryCode);
                return;
              }

              // If all children are selected (either via parent or individually), add parent + all children
              if (allChildrenSelected) {
                finalSet.add(categoryCode);
                addChildValuesToSet(childOptions, finalSet);
                fullySelectedCategories.add(categoryCode);
              } else {
                // Not all children are selected - only add the explicitly selected children
                // Don't add the parent category
                childValues.forEach((childValue) => {
                  if (cleanedSelectedCodes.includes(childValue)) {
                    finalSet.add(childValue);
                  }
                });
              }
            };

            const processKPISelection = (value, allAvailableOptions) => {
              const allOptionValues = allAvailableOptions
                .map((opt) => opt?.value)
                .filter(Boolean);

              // Check if "All" was just clicked
              const hasSelectAll = value.some((v) => {
                if (typeof v === "object") {
                  return v?.value === "All" || v?.isSelectAll;
                }
                return v === "All" || v === "Select All";
              });

              if (hasSelectAll) {
                const prevCodes = filters[filter.key] || [];
                // If all are selected, deselect all (empty array)
                if (
                  prevCodes.length === allOptionValues.length &&
                  allOptionValues.every((val) => prevCodes.includes(val))
                ) {
                  dispatch(setFilters({ ...filters, [filter.key]: [] }));
                } else {
                  // Select all (store all actual values, not "All")
                  dispatch(
                    setFilters({ ...filters, [filter.key]: allOptionValues })
                  );
                }
                return;
              }

              // Never store "All" or "Select All", only real option values
              const selectedCodes = (value || [])
                .map((v) => (typeof v === "object" ? v.value : v))
                .filter(
                  (code) => code && code !== "All" && code !== "Select All"
                );

              const prevCodes = filters[filter.key] || [];

              const prevCategories = new Set(
                prevCodes.filter((code) => code && !code.includes(":"))
              );
              const currCategories = new Set(
                selectedCodes.filter((code) => code && !code.includes(":"))
              );

              // Find categories that were just added (user clicked parent checkbox)
              const newlyAddedCategories = new Set(
                [...currCategories].filter((c) => !prevCategories.has(c))
              );

              // Find categories that were just removed (user unchecked parent checkbox)
              const removedCategories = new Set(
                [...prevCategories].filter((c) => !currCategories.has(c))
              );

              const cleanedSelectedCodes = selectedCodes.filter((code) => {
                for (const cat of removedCategories) {
                  if (code === cat || code.startsWith(`${cat}:`)) {
                    return false;
                  }
                }
                return true;
              });

              const finalSet = new Set();

              // Separate categories and metrics from what user just selected
              const categoryCodes = new Set(
                cleanedSelectedCodes.filter(
                  (code) => code && !code.includes(":")
                )
              );
              const metricCodes = cleanedSelectedCodes.filter((code) =>
                code?.includes(":")
              );

              // Track which categories are fully selected (category + all children)
              const fullySelectedCategories = new Set();

              // First, process all categories to determine which are fully selected
              const allCategoryKeys = new Set(
                allAvailableOptions
                  .filter((opt) => opt.isCategory)
                  .map((opt) => opt.categoryKey)
              );

              allCategoryKeys.forEach((categoryCode) => {
                processCategorySelection(
                  categoryCode,
                  allAvailableOptions,
                  categoryCodes,
                  cleanedSelectedCodes,
                  newlyAddedCategories,
                  finalSet,
                  fullySelectedCategories
                );
              });

              // Add all metric-level selections that aren't part of a fully selected category
              metricCodes.forEach((code) => {
                const [categoryKey] = code.split(":", 2);
                // Only add if the category is not fully selected (otherwise it's already added above)
                if (!fullySelectedCategories.has(categoryKey)) {
                  finalSet.add(code);
                }
              });

              dispatch(
                setFilters({
                  ...filters,
                  [filter.key]: Array.from(finalSet),
                })
              );
            };

            return (
              <Autocomplete
                key={filter.key}
                multiple
                disableCloseOnSelect
                size="small"
                options={filter.options}
                value={getSelectedValues()}
                onChange={(event, value) => {
                  if (isKPI) {
                    const allAvailableOptions = getAllAvailableKPIOptions();
                    processKPISelection(value, allAvailableOptions);
                  } else {
                    // brandFilter / subCategoryFilter
                    if (
                      filter.key === "brandFilter" ||
                      filter.key === "subCategoryFilter"
                    ) {
                      const allOptions = (filter.options || []).filter(
                        (v) => v !== "Select All"
                      );
                      // Check if Select All was just clicked
                      const hasSelectAll = value.includes("Select All");

                      if (hasSelectAll) {
                        if (
                          (filters[filter.key] || []).length ===
                          allOptions.length
                        ) {
                          // Deselect all if everything was selected
                          dispatch(
                            setFilters({ ...filters, [filter.key]: [] })
                          );
                        } else {
                          // Select all if partially selected
                          dispatch(
                            setFilters({ ...filters, [filter.key]: allOptions })
                          );
                        }
                        return;
                      }
                      // Never store Select All, only real options
                      const justRealOptions = value.filter(
                        (v) => v !== "Select All"
                      );
                      dispatch(
                        setFilters({
                          ...filters,
                          [filter.key]: justRealOptions,
                        })
                      );
                      return;
                    }
                    // All other filters fallback
                    dispatch(setFilters({ ...filters, [filter.key]: value }));
                  }
                }}
                groupBy={filter.groupBy || undefined}
                getOptionLabel={
                  filter.getOptionLabel ||
                  ((option) => {
                    if (typeof option === "object")
                      return option.label || option.value;
                    return option;
                  })
                }
                isOptionEqualToValue={(option, value) => {
                  if (typeof option === "object" && typeof value === "object") {
                    return option.value === value.value;
                  }
                  if (typeof option === "object") {
                    return option.value === value;
                  }
                  if (typeof value === "object") {
                    return option === value.value;
                  }
                  return option === value;
                }}
                renderTags={(selected, getTagProps) => {
                  const isEmpty =
                    (filter.key === "subCategoryFilter" ||
                      filter.key === "brandFilter" ||
                      filter.key === "kpi" ||
                      filter.key === "productView") &&
                    (!selected || selected.length === 0);
                  if (isEmpty) return null;
                  return renderCompactTag(
                    filter.key,
                    selected,
                    getTagProps,
                    filter.options
                  );
                }}
                renderInput={(params) => {
                  // For Subcategory / Brand / KPI / Product View filters: show placeholder when empty
                  const isEmpty =
                    (filter.key === "subCategoryFilter" ||
                      filter.key === "brandFilter" ||
                      filter.key === "kpi" ||
                      filter.key === "productView") &&
                    (!filters[filter.key] || filters[filter.key].length === 0);

                  return (
                    <TextField
                      {...params}
                      label={filter.label}
                      placeholder={isEmpty ? filter.label : ""}
                      variant="outlined"
                      size="small"
                      sx={{
                        width: width,
                        "& .MuiInputBase-root": { fontSize: 13 },
                        "& .MuiInputLabel-root": { fontSize: 13 },
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  );
                }}
                renderOption={(optionProps, option, { selected }) => {
                  // NOTE: `optionProps` is from MUI's `renderOption` callback (not React component props).
                  // Sonar's React "props validation" rule is name-based; avoid naming it `props`.
                  const { style, disabled, ...restProps } = optionProps;
                  const optionLabel =
                    typeof option === "object" ? option.label : option;
                  const isChild = typeof option === "object" && option.isChild;
                  const isCategory =
                    typeof option === "object" && option.isCategory;
                  const hasChildren =
                    typeof option === "object" && option.hasChildren;
                  const isExpanded =
                    typeof option === "object" &&
                    expandedKPICategories.has(option.categoryKey);

                  return (
                    <li
                      {...restProps}
                      style={{
                        fontSize: 13,
                        padding: 0,
                        minHeight: 32,
                        width: "100%",
                        ...style,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          padding: "6px 12px",
                          minHeight: 32,
                          paddingLeft: isKPI && isChild ? "32px" : "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          width: "100%",
                          cursor: disabled ? "default" : "pointer",
                        }}
                      >
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8, padding: 2 }}
                          checked={selected}
                          size="small"
                        />

                        <span
                          style={{ fontSize: 13, lineHeight: 1.2, flex: 1 }}
                        >
                          {optionLabel}
                        </span>

                        {isKPI && isCategory && hasChildren && (
                          <button
                            type="button"
                            className="expand-arrow"
                            aria-label={`${
                              isExpanded ? "Collapse" : "Expand"
                            } ${optionLabel}`}
                            aria-expanded={isExpanded}
                            style={{
                              marginLeft: "auto",
                              fontSize: 12,
                              cursor: "pointer",
                              userSelect: "none",
                              padding: "2px 4px",
                              borderRadius: "2px",
                              border: "none",
                              background: "transparent",
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newExpanded = new Set(
                                expandedKPICategories
                              );
                              if (isExpanded) {
                                newExpanded.delete(option.categoryKey);
                              } else {
                                newExpanded.add(option.categoryKey);
                              }
                              setExpandedKPICategories(newExpanded);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                const newExpanded = new Set(
                                  expandedKPICategories
                                );
                                if (isExpanded) {
                                  newExpanded.delete(option.categoryKey);
                                } else {
                                  newExpanded.add(option.categoryKey);
                                }
                                setExpandedKPICategories(newExpanded);
                              }
                            }}
                          >
                            {isExpanded ? (
                              <RemoveIcon fontSize="small" />
                            ) : (
                              <AddIcon fontSize="small" />
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                }}
                sx={{
                  width: width,
                  "& .MuiChip-root": { height: 22, fontSize: 12, px: 0.5 },
                  "& .MuiAutocomplete-option": {
                    fontSize: 13,
                    padding: "6px 12px",
                  },
                  "& .MuiAutocomplete-groupLabel": {
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: "#f5f5f5",
                    padding: "8px 12px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  },
                }}
              />
            );
          }
          const isHierarchy =
            filters.scorecardView === VIEW_PERFORMANCE_OVERVIEW &&
            (filter.key === "hierarchy_1" || filter.key === "hierarchy_2");

          if (isHierarchy) {
            const h1 = filters.hierarchy_1 || HIERARCHY_SUBCATEGORY;
            const h2 =
              filters.hierarchy_2 ||
              (h1 === HIERARCHY_SUBCATEGORY
                ? HIERARCHY_BRAND
                : HIERARCHY_PLATFORM);
            const isH1 = filter.key === "hierarchy_1";
            const expanded = isH1 ? expandedHierarchy1 : expandedHierarchy2;
            const isExpanded = (val) => expanded === val;

            const addItemsToList = (out, list, r, keyToUpdate, selected) => {
              (list || []).forEach((item) => {
                out.push({
                  type: "item",
                  parentValue: r.value,
                  label: item,
                  value: item,
                  keyToUpdate,
                  list,
                  selected,
                });
              });
            };

            const processHierarchy1Radio = (r, out) => {
              out.push(r);
              if (!isExpanded(r.value)) return;

              const list =
                r.value === HIERARCHY_SUBCATEGORY
                  ? hierarchySubCategories
                  : hierarchyBrands;
              const keyToUpdate =
                r.value === HIERARCHY_SUBCATEGORY
                  ? "subCategoryFilter"
                  : "brandFilter";
              const selected = filters[keyToUpdate] || [];

              out.push({
                type: "selectAll",
                parentValue: r.value,
                label: SELECT_ALL,
                keyToUpdate,
                list,
                selected,
              });

              if (scorecardLoading && (!list || list.length === 0)) {
                out.push({
                  type: "loading",
                  parentValue: r.value,
                  label:
                    r.value === HIERARCHY_SUBCATEGORY
                      ? "Generating sub-categories…"
                      : "Generating brands…",
                });
                return;
              }

              addItemsToList(out, list, r, keyToUpdate, selected);
            };

            const buildHierarchyOptions = () => {
              if (isH1) {
                const base = [HIERARCHY_SUBCATEGORY, HIERARCHY_BRAND].map(
                  (v) => ({
                    type: "radio",
                    label:
                      v === HIERARCHY_SUBCATEGORY ? "Subcategory" : "Brand",
                    value: v,
                    disabled: false,
                  })
                );
                const out = [];
                base.forEach((r) => {
                  processHierarchy1Radio(r, out);
                });
                return out;
              }

              // hierarchy_2
              const processBrandRadio = (r, out) => {
                const list = hierarchyBrands;
                const keyToUpdate = "brandFilter";
                const selected = filters.brandFilter || [];

                out.push({
                  type: "selectAll",
                  parentValue: r.value,
                  label: "Select All",
                  keyToUpdate,
                  list,
                  selected,
                });

                if (scorecardLoading && (!list || list.length === 0)) {
                  out.push({
                    type: "loading",
                    parentValue: r.value,
                    label: "Generating brands…",
                  });
                  return;
                }

                addItemsToList(out, list, r, keyToUpdate, selected);
              };

              const processPlatformIntensityRadio = (r, out) => {
                const list = hierarchyLeafs;
                const keyToUpdate = "hierarchy2Filter";
                const selected = filters.hierarchy2Filter || [];

                out.push({
                  type: "selectAll",
                  parentValue: r.value,
                  label: "Select All",
                  keyToUpdate,
                  list,
                  selected,
                });

                if (scorecardLoading && (!list || list.length === 0)) {
                  out.push({
                    type: "loading",
                    parentValue: r.value,
                    label:
                      r.value === "Platform"
                        ? "Generating platforms…"
                        : "Generating intensities…",
                  });
                  return;
                }

                addItemsToList(out, list, r, keyToUpdate, selected);
              };

              const processHierarchy2Radio = (r, out) => {
                out.push(r);
                if (!isExpanded(r.value)) return;

                if (r.disabled) return;

                if (r.value === "Brand") {
                  processBrandRadio(r, out);
                  return;
                }

                // Platform / Intensity leafs
                processPlatformIntensityRadio(r, out);
              };

              const base = [
                HIERARCHY_BRAND,
                HIERARCHY_PLATFORM,
                HIERARCHY_INTENSITY,
              ].map((v) => ({
                type: "radio",
                label: v,
                value: v,
                disabled:
                  h1 === HIERARCHY_SUBCATEGORY
                    ? v !== HIERARCHY_BRAND
                    : v === HIERARCHY_BRAND,
              }));

              const out = [];
              base.forEach((r) => {
                processHierarchy2Radio(r, out);
              });

              return out;
            };

            const options = buildHierarchyOptions();
            const selectedRadioValue = isH1 ? h1 : h2;
            const selectedRadioOption =
              options.find(
                (o) => o.type === "radio" && o.value === selectedRadioValue
              ) || null;

            const computeCheckboxState = (opt) => {
              const list = Array.isArray(opt.list) ? opt.list : [];
              const selected = Array.isArray(opt.selected) ? opt.selected : [];
              const isAllState = selected.length === 0;
              const isExplicitAll =
                list.length > 0 && selected.length === list.length;
              if (opt.type === "selectAll") {
                return {
                  checked: isAllState || isExplicitAll,
                  indeterminate: selected.length > 0 && !isExplicitAll,
                };
              }
              // item
              return {
                checked:
                  isAllState || isExplicitAll || selected.includes(opt.value),
                indeterminate: false,
              };
            };

            return (
              <Autocomplete
                key={filter.key}
                size="small"
                disableClearable
                disableCloseOnSelect
                options={options}
                value={selectedRadioOption}
                filterOptions={(x) => x}
                getOptionDisabled={(opt) => !!opt.disabled}
                getOptionLabel={(opt) => opt?.label ?? ""}
                isOptionEqualToValue={(opt, val) =>
                  opt?.value === val?.value && opt?.type === val?.type
                }
                onChange={(event, opt) => {
                  if (!opt) return;
                  if (opt.type !== "radio") return;

                  if (filter.key === "hierarchy_1") {
                    const nextH1 = opt.value || HIERARCHY_SUBCATEGORY;
                    const nextH2 =
                      nextH1 === HIERARCHY_SUBCATEGORY
                        ? HIERARCHY_BRAND
                        : HIERARCHY_PLATFORM;
                    setExpandedHierarchy1(null);
                    setExpandedHierarchy2(null);
                    dispatch(
                      setFilters({
                        ...filters,
                        hierarchy_1: nextH1,
                        hierarchy_2: nextH2,
                        hierarchy2Filter: [],
                      })
                    );
                    return;
                  }

                  if (filter.key === "hierarchy_2") {
                    setExpandedHierarchy2(null);
                    dispatch(
                      setFilters({
                        ...filters,
                        hierarchy_2: opt.value,
                        hierarchy2Filter: [],
                      })
                    );
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={filter.label}
                    variant="outlined"
                    size="small"
                    sx={{
                      width: 200,
                      "& .MuiInputBase-root": { fontSize: 13 },
                      "& .MuiInputLabel-root": { fontSize: 13 },
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ ...params.inputProps, readOnly: true }}
                  />
                )}
                renderOption={(optionProps, option, { selected }) => {
                  // NOTE: `optionProps` is from MUI's `renderOption` callback (not React component props).
                  // Sonar's React "props validation" rule is name-based; avoid naming it `props`.
                  const { style, ...rest } = optionProps;

                  if (option.type === "radio") {
                    const disabled = !!option.disabled;
                    const expandedForThis = isExpanded(option.value);
                    const canExpand =
                      !disabled && option.value === selectedRadioValue;

                    return (
                      <li
                        {...rest}
                        style={{
                          ...style,
                          fontSize: 13,
                          padding: "6px 12px",
                          minHeight: 32,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        <Radio
                          checked={selected}
                          size="small"
                          disabled={disabled}
                          sx={{ padding: 0 }}
                        />
                        <span
                          style={{ fontSize: 13, lineHeight: 1.2, flex: 1 }}
                        >
                          {option.label}
                        </span>

                        {canExpand && (
                          <button
                            type="button"
                            aria-label={`${
                              expandedForThis ? "Collapse" : "Expand"
                            } ${option.label}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(isH1 ? 1 : 2, option.value);
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {expandedForThis ? (
                              <RemoveIcon fontSize="small" />
                            ) : (
                              <AddIcon fontSize="small" />
                            )}
                          </button>
                        )}
                      </li>
                    );
                  }

                  if (option.type === "loading") {
                    return (
                      <li
                        {...rest}
                        style={{
                          ...style,
                          fontSize: 13,
                          padding: "6px 12px 6px 40px",
                          minHeight: 32,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "#6b7280",
                        }}
                      >
                        <CircularProgress size={14} />
                        <Typography variant="caption">
                          {option.label}
                        </Typography>
                      </li>
                    );
                  }

                  // selectAll / item
                  const { checked, indeterminate } =
                    computeCheckboxState(option);
                  const isSelectAll = option.type === "selectAll";

                  return (
                    <li
                      {...rest}
                      style={{
                        ...style,
                        fontSize: 13,
                        padding: "4px 12px 4px 40px",
                        minHeight: 30,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          applyCheckboxToggle({
                            list: option.list,
                            selected: option.selected,
                            keyToUpdate: option.keyToUpdate,
                            value: option.value,
                            toggleType: isSelectAll ? "selectAll" : "item",
                          });
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          indeterminate={indeterminate}
                          size="small"
                          sx={{ padding: 0 }}
                        />
                        <span style={{ fontSize: 13, lineHeight: 1.2 }}>
                          {option.label}
                        </span>
                      </button>
                    </li>
                  );
                }}
                sx={{
                  width: 200,
                  "& .MuiAutocomplete-option": { fontSize: 13 },
                }}
              />
            );
          }

          return (
            <Autocomplete
              key={filter.key}
              size="small"
              disableClearable={filter.type !== "multi"}
              options={filter.options}
              getOptionDisabled={filter.getOptionDisabled}
              value={(() => {
                const stored =
                  filters[filter.key] || getDefaultFilterValue(filter.key);
                const opts = filter.options || [];
                const hasObjectOptions = opts.some(
                  (o) => typeof o === "object"
                );
                if (!hasObjectOptions) return stored;
                return (
                  opts.find(
                    (o) =>
                      o &&
                      typeof o === "object" &&
                      (o.value === stored || o.label === stored)
                  ) || null
                );
              })()}
              onChange={(event, value) => {
                const next =
                  value && typeof value === "object" ? value.value : value;
                dispatch(setFilters({ ...filters, [filter.key]: next }));
              }}
              getOptionLabel={(option) => {
                if (typeof option === "object") {
                  return option.label ?? option.value ?? "";
                }
                return option ?? "";
              }}
              isOptionEqualToValue={(option, value) => {
                if (typeof option === "object" && typeof value === "object") {
                  return option.value === value.value;
                }
                if (typeof option === "object") {
                  return option.value === value;
                }
                if (typeof value === "object") {
                  return option === value.value;
                }
                return option === value;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={filter.label}
                  variant="outlined"
                  size="small"
                  sx={{
                    width: 200,
                    "& .MuiInputBase-root": { fontSize: 13 },
                    "& .MuiInputLabel-root": { fontSize: 13 },
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              renderOption={(props, option, { selected }) => {
                const label =
                  typeof option === "object" ? option.label : option;
                const disabled = filter.getOptionDisabled
                  ? !!filter.getOptionDisabled(option)
                  : false;

                if (filter.renderOptionAsRadio) {
                  return (
                    <li
                      {...props}
                      style={{
                        fontSize: 13,
                        padding: "6px 12px",
                        minHeight: 32,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: disabled ? 0.5 : 1,
                      }}
                    >
                      <Radio
                        checked={selected}
                        size="small"
                        disabled={disabled}
                        sx={{ padding: 0 }}
                      />
                      <span style={{ fontSize: 13, lineHeight: 1.2 }}>
                        {label}
                      </span>
                    </li>
                  );
                }

                return (
                  <li
                    {...props}
                    style={{ fontSize: 13, padding: "6px 12px", minHeight: 32 }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1.2 }}>
                      {label}
                    </span>
                  </li>
                );
              }}
              sx={{
                width: 200,
                "& .MuiAutocomplete-option": {
                  fontSize: 13,
                  padding: "6px 12px",
                },
              }}
            />
          );
        })}
        <Autocomplete
          size="small"
          disableClearable
          options={clusterData?.clusters?.map((c) => c.cluster_name) || []}
          value={filters.clusterName || ""}
          onChange={handleClusterChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cluster"
              variant="outlined"
              size="small"
              sx={{
                width: 150,
                "& .MuiInputBase-root": { fontSize: 13 },
                "& .MuiInputLabel-root": { fontSize: 13 },
              }}
              InputLabelProps={{ shrink: true }}
            />
          )}
          renderOption={(props, option) => (
            <li
              {...props}
              style={{ fontSize: 13, padding: "6px 12px", minHeight: 32 }}
            >
              <span style={{ fontSize: 13, lineHeight: 1.2 }}>{option}</span>
            </li>
          )}
          sx={{
            width: 150,
            "& .MuiAutocomplete-option": { fontSize: 13, padding: "6px 12px" },
          }}
        />
        <Autocomplete
          size="small"
          disableClearable
          options={
            clusterData?.clusters
              ?.find((c) => c.cluster_name === filters.clusterName)
              ?.planogram_details?.planogram_versions?.filter(
                (v) => v.version_number !== 0
              )
              ?.map((v) => ({
                label: `${v.short_desc || ""} (V${v.version_number})`,
                value: v.version_number,
                planogramId: v.planogram_id,
              })) || []
          }
          value={
            clusterData?.clusters
              ?.find((c) => c.cluster_name === filters.clusterName)
              ?.planogram_details?.planogram_versions?.filter(
                (v) => v.version_number !== 0
              )
              ?.map((v) => ({
                label: `${v.short_desc || ""} (V${v.version_number})`,
                value: v.version_number,
                planogramId: v.planogram_id,
              }))
              ?.find((opt) => opt.value == filters.version) || null
          }
          onChange={(event, newValue) => {
            if (newValue) {
              dispatch(setFilters({ ...filters, version: newValue.value }));
              dispatch(setSelectedPlanogramVersionId(newValue.planogramId));
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Version"
              variant="outlined"
              size="small"
              sx={{
                width: 180,
                "& .MuiInputBase-root": { fontSize: 13 },
                "& .MuiInputLabel-root": { fontSize: 13 },
              }}
              InputLabelProps={{ shrink: true }}
            />
          )}
          renderOption={(props, option) => (
            <li
              {...props}
              style={{ fontSize: 13, padding: "6px 12px", minHeight: 32 }}
            >
              <span style={{ fontSize: 13, lineHeight: 1.2 }}>
                {option.label}
              </span>
            </li>
          )}
          sx={{
            width: 180,
            "& .MuiAutocomplete-option": { fontSize: 13, padding: "6px 12px" },
          }}
        />
      </Box>

      <Box display="flex" alignItems="center" gap={1.5} flexShrink={0}>
        <Box display="flex" alignItems="center" gap={1}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            checked={showLiftKPIs}
            onChange={(e) =>
              dispatch(
                setFilters({ ...filters, showLiftKPIs: e.target.checked })
              )
            }
            size="small"
            sx={{ padding: 0.5 }}
          />
          <span className="text-sm text-gray-700">Show Lift KPIs</span>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ height: 24, alignSelf: "center" }}
        />

        <button
          onClick={handleClearFilters}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 underline cursor-pointer bg-transparent border-none p-0"
        >
          Clear
        </button>

        <button
          onClick={() => {
            console.log("Download clicked");
          }}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1.5"
        >
          <Download size={16} />
        </button>

        <div className="rounded-full border border-black flex items-center h-fit flex-shrink-0">
          <button
            onClick={() => dispatch(setViewMode("schematic"))}
            className={`${
              viewMode === "schematic" ? "bg-[#CDDCEB]" : ""
            } px-3 py-2 rounded-l-full w-12 duration-500 transition-all`}
          >
            {viewMode === "schematic" ? (
              <Grid3x3 size={24} fill="#3774B1" stroke="#CDDCEB" />
            ) : (
              <Grid3x3 />
            )}
          </button>
          <button
            onClick={() => dispatch(setViewMode("graphic"))}
            className={`${
              viewMode === "graphic" ? "bg-[#CDDCEB] h-full" : ""
            } px-3 py-2 rounded-r-full w-12 duration-500 transition-all`}
          >
            <div className="h-6 flex items-center justify-center">
              {viewMode === "graphic" ? (
                <div className="rotate-90">
                  <ChartNoAxesColumnDecreasing
                    size={18}
                    color="#3774B1"
                    strokeWidth={4}
                  />
                </div>
              ) : (
                <img src={bar} alt="Graphic view icon" />
              )}
            </div>
          </button>
        </div>
      </Box>
    </Box>
  );
};

export default ScorecardFilters;
