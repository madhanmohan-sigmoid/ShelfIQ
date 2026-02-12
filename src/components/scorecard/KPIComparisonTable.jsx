import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const KPIComparisonTable = ({ data, view }) => {
  const isSubCategoryView = view === "Performance Overview";

  // expand all rows by default
  const [expandedRows, setExpandedRows] = useState({
    sales: true,
    productivity: true,
    inventory: true,
    assortment: true,
    marchandising: true,
  });

  const [expandedSubkpis, setExpandedSubkpis] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const handleRowToggle = (kpiKey) => {
    setExpandedRows((prev) => ({
      ...prev,
      [kpiKey]: !prev[kpiKey],
    }));
  };

  const handleSubkpiToggle = (subkpiKey) => {
    setExpandedSubkpis((prev) => ({
      ...prev,
      [subkpiKey]: !prev[subkpiKey],
    }));
  };

  const handleGroupToggle = (groupRowKey, enabled) => {
    if (!enabled) return;
    setExpandedGroups((prev) => ({
      ...prev,
      [groupRowKey]: !prev[groupRowKey],
    }));
  };

  const coerceNumber = (v) =>
    typeof v === "number" && !Number.isNaN(v) ? v : null;

  const calculateLift = (beforeValue, afterValue) => {
    const b = coerceNumber(beforeValue);
    const a = coerceNumber(afterValue);

    if (beforeValue === null || beforeValue === undefined) {
      return { value: a ?? 0, percentage: 0 };
    }

    if (b === null) {
      // If inputs are non-numeric (e.g., object during view switch), avoid NaN propagation.
      return { value: 0, percentage: 0 };
    }

    const lift = (a ?? 0) - b;
    const percentage = b ? (lift / b) * 100 : 0;

    return {
      value: Object.is(lift, -0) ? 0 : lift,
      percentage: Object.is(percentage, -0) ? 0 : percentage,
    };
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return "-";
    if (Object.is(value, -0)) value = 0;

    if (
      key.toLowerCase().includes("share") ||
      key.includes("Index") ||
      key.includes("Productivity")
    ) {
      return typeof value === "number" ? `${(value * 100).toFixed(1)}%` : value;
    }

    if (key.toLowerCase().includes("sales")) {
      return typeof value === "number"
        ? `£${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : value;
    }

    if (key.toLowerCase().includes("count") || key.includes("Items")) {
      return typeof value === "number" ? value.toLocaleString() : value;
    }

    return value;
  };

  const getValueColor = (value) => {
    if (value === null || value === undefined) return "#4B5563";
    return value <= 0 ? "#DC2626" : "#115E59";
  };

  const getLiftColor = (liftValue) => {
    if (liftValue > 0) return "text-green-600 bg-green-50 border-green-200";
    if (liftValue < 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-yellow-600";
  };

  const getLiftIcon = (liftValue, liftPercentage) => {
    if (liftPercentage > 0)
      return <TrendingUp className="w-4 h-4" style={{ color: "#059669" }} />;
    if (liftPercentage < 0)
      return <TrendingDown className="w-4 h-4" style={{ color: "#DC2626" }} />;
    return <Minus className="w-4 h-4" style={{ color: "#D97706" }} />;
  };

  const getPercentageColor = (percentage) => {
    if (percentage > 0) return "#059669";
    if (percentage < 0) return "#DC2626";
    return "#B45309";
  };

  const kpiCategories = [
    { key: "sales", label: "Sales", disabled: false },
    {
      key: "productivity",
      label: "Productivity",
      disabled: false,
    },
    // { key: 'inventory', label: 'Inventory' },
    {
      key: "assortment",
      label: "Assortment",
      disabled: false,
    },
    // { key: 'marchandising', label: 'Merchandising' }
  ];

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

  const resolveShape = (beforeSection, afterSection) => {
    const beforeShape = detectSectionShape(beforeSection);
    if (beforeShape === "metric_first") return "metric_first";
    return detectSectionShape(afterSection);
  };

  const getMetricKeysForSection = (beforeSection, afterSection, shape) => {
    if (shape === "metric_first") {
      return [
        ...new Set([
          ...Object.keys(beforeSection || {}),
          ...Object.keys(afterSection || {}),
        ]),
      ];
    }
    // flattened
    const groupKeys = [
      ...new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]),
    ].filter((k) => k !== "brands");

    const metricSet = new Set();
    groupKeys.forEach((g) => {
      const b = beforeSection?.[g] || {};
      const a = afterSection?.[g] || {};
      Object.keys(b || {}).forEach((mk) => {
        if (mk !== "brands") metricSet.add(mk);
      });
      Object.keys(a || {}).forEach((mk) => {
        if (mk !== "brands") metricSet.add(mk);
      });
    });
    return Array.from(metricSet);
  };

  const getGroupKeysForMetric = (beforeSection, afterSection, shape, metricKey) => {
    if (shape === "metric_first") {
      const b = beforeSection?.[metricKey] || {};
      const a = afterSection?.[metricKey] || {};
      return [
        ...new Set([
          ...Object.keys(b || {}),
          ...Object.keys(a || {}),
        ]),
      ];
    }

    // flattened: groups are top-level keys (subcats)
    return [
      ...new Set([
        ...Object.keys(beforeSection || {}),
        ...Object.keys(afterSection || {}),
      ]),
    ].filter((k) => k !== "brands");
  };

  const getGroupEntryValue = (section, shape, groupKey, metricKey) => {
    if (shape === "metric_first") {
      const entry = section?.[metricKey]?.[groupKey];
      return isPlainObject(entry) ? (entry.value ?? null) : null;
    }
    // flattened
    const entry = section?.[groupKey];
    return isPlainObject(entry) ? (entry?.[metricKey] ?? null) : null;
  };

  const getLeafMap = (section, shape, groupKey, metricKey) => {
    if (shape === "metric_first") {
      const entry = section?.[metricKey]?.[groupKey];
      if (!isPlainObject(entry)) return {};
      if (isPlainObject(entry.brands)) return entry.brands;
      if (isPlainObject(entry.children)) return entry.children;
      return {};
    }
    // flattened: brands nested under groupKey.brands[brandKey][metricKey]
    const entry = section?.[groupKey];
    if (!isPlainObject(entry)) return {};
    return isPlainObject(entry.brands) ? entry.brands : {};
  };

  const getLeafValue = (leafMap, shape, leafKey, metricKey) => {
    if (shape === "metric_first") {
      const v = leafMap?.[leafKey];
      return typeof v === "number" ? v : null;
    }
    const v = leafMap?.[leafKey]?.[metricKey];
    return typeof v === "number" ? v : null;
  };

  const hasAnyHierarchicalData = () => {
    if (!data || typeof data !== "object" || !data.before || !data.after) return false;

    const activeSections = ["sales", "productivity", "assortment"];
    for (const sectionKey of activeSections) {
      const beforeSection = data.before?.[sectionKey] || {};
      const afterSection = data.after?.[sectionKey] || {};
      const shape = resolveShape(beforeSection, afterSection);

      const metricKeys = getMetricKeysForSection(beforeSection, afterSection, shape);
      for (const metricKey of metricKeys) {
        const groupKeys = getGroupKeysForMetric(
          beforeSection,
          afterSection,
          shape,
          metricKey
        );
        for (const groupKey of groupKeys) {
          const b = getGroupEntryValue(beforeSection, shape, groupKey, metricKey);
          const a = getGroupEntryValue(afterSection, shape, groupKey, metricKey);
          const leafB = getLeafMap(beforeSection, shape, groupKey, metricKey);
          const leafA = getLeafMap(afterSection, shape, groupKey, metricKey);
          if (
            typeof b === "number" ||
            typeof a === "number" ||
            Object.keys(leafB || {}).length > 0 ||
            Object.keys(leafA || {}).length > 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const hasValidData = (() => {
    if (isSubCategoryView) return hasAnyHierarchicalData();
    return (
      data?.before &&
      data?.after &&
      kpiCategories.some(
        (cat) => Object.keys(data.before?.[cat.key] || {}).length > 0
      )
    );
  })();

  const buildLeafRows = ({
    leafKeys,
    beforeLeafMap,
    afterLeafMap,
    shape,
    metricKey,
    groupRowKey,
  }) => {
    const rows = [];
    for (const leafKey of leafKeys) {
      const leafBefore = getLeafValue(beforeLeafMap, shape, leafKey, metricKey);
      const leafAfter = getLeafValue(afterLeafMap, shape, leafKey, metricKey);
      const leafLift = calculateLift(leafBefore, leafAfter);

      rows.push(
        <tr
          key={`${groupRowKey}::leaf::${leafKey}`}
          className="bg-white transition-colors duration-200 border border-gray-300"
        >
          <td className="pl-20 py-2 font-medium text-gray-800 border border-gray-300">
            {leafKey}
          </td>

          <td
            className="py-2 text-center text-sm border border-gray-300"
            style={{ color: getValueColor(leafBefore) }}
          >
            {formatValue(leafBefore, metricKey)}
          </td>

          <td
            className="py-2 text-center text-sm border border-gray-300"
            style={{ color: getValueColor(leafAfter) }}
          >
            {formatValue(leafAfter, metricKey)}
          </td>

          <td
            className="py-2 text-center text-sm border border-gray-300"
            style={{ color: getValueColor(leafLift.value) }}
          >
            {formatValue(leafLift.value, metricKey)}
          </td>

          <td className="py-2 text-center">
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLiftColor(
                leafLift.value
              )}`}
            >
              {getLiftIcon(leafLift.value, leafLift.percentage)}
              <span style={{ color: getPercentageColor(leafLift.percentage) }}>
                {leafLift.percentage.toFixed(1)}%
              </span>
            </div>
          </td>
          <td></td>
        </tr>
      );
    }
    return rows;
  };

  if (!hasValidData) {
    return (
      <div className="p-6 text-center text-gray-500">No data available</div>
    );
  }

  return (
    <div
      className="rounded-lg w-full shadow-sm"
      style={{ height: "calc(100vh - 245px)" }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-white font-semibold w-1/3 sticky top-0 z-20 bg-[#3774B1] border border-gray-300">
              KPI
            </th>
            <th className="px-4 py-3 text-center text-white font-semibold sticky top-0 z-20 bg-[#3774B1] border border-gray-300">
              Before
            </th>
            <th className="px-4 py-3 text-center text-white font-semibold sticky top-0 z-20 bg-[#3774B1] border border-gray-300">
              After
            </th>
            <th className="px-4 py-3 text-center text-white font-semibold sticky top-0 z-20 bg-[#3774B1] border border-gray-300">
              Lift
            </th>
            <th className="px-4 py-3 text-center text-white font-semibold sticky top-0 z-20 bg-[#3774B1]">
              Lift %
            </th>
            <th className="px-4 py-3 text-center text-white font-semibold w-16 sticky top-0 z-20 bg-[#3774B1]"></th>
          </tr>
        </thead>

        <tbody>
          {kpiCategories.map((category) => {
            const isExpanded = expandedRows[category.key];

            // Performance Overview: Disabled categories (inventory, merchandising)
            if (isSubCategoryView && category.disabled) {
              return (
                <tr
                  key={category.key}
                  className="bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                >
                  <td className="px-4 py-3 font-semibold">{category.label}</td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-center">
                    <Minus className="w-4 h-4 text-gray-400" />
                  </td>
                </tr>
              );
            }

            // Performance Overview: hierarchical table:
            // KPI Category -> Metric (sub-KPI) -> Group (Sub-Category or Brand) -> Leaf (Brand or Platform/Intensity)
            if (
              isSubCategoryView &&
              (category.key === "sales" ||
                category.key === "productivity" ||
                category.key === "assortment")
            ) {
              const beforeSection = data?.before?.[category.key] || {};
              const afterSection = data?.after?.[category.key] || {};
              const shape = resolveShape(beforeSection, afterSection);

              const metricKeys = getMetricKeysForSection(
                beforeSection,
                afterSection,
                shape
              );

              if (metricKeys.length === 0) return null;

              const categoryLabel = category.label;

              return (
                <React.Fragment key={category.key}>
                  <tr
                    className="cursor-pointer bg-[#EBEFF3] transition-colors duration-200 border border-gray-300"
                    onClick={() => handleRowToggle(category.key)}
                  >
                    <td className="px-4 py-3 font-semibold">{categoryLabel}</td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </td>
                  </tr>

                  {isExpanded &&
                    metricKeys.map((metricKey) => {
                      const subkpiKey = `${category.key}::${metricKey}`;
                      const isMetricExpanded = !!expandedSubkpis[subkpiKey];

                      const groupKeys = getGroupKeysForMetric(
                        beforeSection,
                        afterSection,
                        shape,
                        metricKey
                      );

                      const hasAnyGroups = groupKeys.length > 0;
                      let metricExpandIcon = (
                        <Minus className="w-4 h-4 text-gray-400" />
                      );
                      if (hasAnyGroups) {
                        metricExpandIcon = isMetricExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        );
                      }

                      return (
                        <React.Fragment key={subkpiKey}>
                          {/* Metric row */}
                          <tr
                            className="bg-teal-50 transition-colors duration-200 border border-gray-300 cursor-pointer"
                            onClick={handleSubkpiToggle.bind(null, subkpiKey)}
                          >
                            {/* Metric/sub-KPI row: no vertical grid lines (header-like row) */}
                            <td className="pl-8 py-2 font-medium text-teal-800">
                              {metricKey}
                            </td>
                            <td className="py-2 text-center text-sm"></td>
                            <td className="py-2 text-center text-sm"></td>
                            <td className="py-2 text-center text-sm"></td>
                            <td className="py-2 text-center text-sm"></td>
                            <td className="py-2 text-center">
                              {metricExpandIcon}
                            </td>
                          </tr>

                          {/* Group rows */}
                          {isMetricExpanded &&
                            groupKeys.map((groupKey) => {
                              const groupRowKey = `${subkpiKey}::${groupKey}`;
                              const beforeValue = getGroupEntryValue(
                                beforeSection,
                                shape,
                                groupKey,
                                metricKey
                              );
                              const afterValue = getGroupEntryValue(
                                afterSection,
                                shape,
                                groupKey,
                                metricKey
                              );
                              const lift = calculateLift(beforeValue, afterValue);

                              const beforeLeafMap = getLeafMap(
                                beforeSection,
                                shape,
                                groupKey,
                                metricKey
                              );
                              const afterLeafMap = getLeafMap(
                                afterSection,
                                shape,
                                groupKey,
                                metricKey
                              );
                              const leafKeys = [
                                ...new Set([
                                  ...Object.keys(beforeLeafMap || {}),
                                  ...Object.keys(afterLeafMap || {}),
                                ]),
                              ];

                              const hasLeaf = leafKeys.length > 0;
                              const isGroupExpanded =
                                !!expandedGroups[groupRowKey] && hasLeaf;

                              let groupExpandIcon = (
                                <Minus className="w-4 h-4 text-gray-400" />
                              );
                              if (hasLeaf) {
                                groupExpandIcon = isGroupExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                );
                              }

                              return (
                                <React.Fragment key={groupRowKey}>
                                  <tr
                                    className="bg-white transition-colors duration-200 border border-gray-300 cursor-pointer"
                                    onClick={handleGroupToggle.bind(
                                      null,
                                      groupRowKey,
                                      hasLeaf
                                    )}
                                  >
                                    <td className="pl-14 py-2 font-medium text-gray-800 border border-gray-300">
                                      {groupKey}
                                    </td>

                                    <td
                                      className="py-2 text-center text-sm border border-gray-300"
                                      style={{ color: getValueColor(beforeValue) }}
                                    >
                                      {formatValue(beforeValue, metricKey)}
                                    </td>

                                    <td
                                      className="py-2 text-center text-sm border border-gray-300"
                                      style={{ color: getValueColor(afterValue) }}
                                    >
                                      {formatValue(afterValue, metricKey)}
                                    </td>

                                    <td
                                      className="py-2 text-center text-sm border border-gray-300"
                                      style={{ color: getValueColor(lift.value) }}
                                    >
                                      {formatValue(lift.value, metricKey)}
                                    </td>

                                    <td className="py-2 text-center">
                                      <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLiftColor(
                                          lift.value
                                        )}`}
                                      >
                                        {getLiftIcon(lift.value, lift.percentage)}
                                        <span
                                          style={{
                                            color: getPercentageColor(lift.percentage),
                                          }}
                                        >
                                          {lift.percentage.toFixed(1)}%
                                        </span>
                                      </div>
                                    </td>

                                    <td className="py-2 text-center">
                                      {groupExpandIcon}
                                    </td>
                                  </tr>

                                  {/* Leaf rows */}
                                  {isGroupExpanded &&
                                    buildLeafRows({
                                      leafKeys,
                                      beforeLeafMap,
                                      afterLeafMap,
                                      shape,
                                      metricKey,
                                      groupRowKey,
                                    })}
                                </React.Fragment>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            }

            // Default: Category Overview behaviour (existing logic)
            const beforeData = data.before[category.key] || {};
            const afterData = data.after[category.key] || {};
            
            // Filter out non-primitive entries; Category Overview should render only primitive metric values.
            const isRenderablePrimitive = (v) =>
              v === null ||
              v === undefined ||
              typeof v === "number" ||
              typeof v === "string";

            const metrics = Object.keys(beforeData).filter((metric) => {
              const beforeValue = beforeData[metric];
              const afterValue = afterData[metric];
              return (
                isRenderablePrimitive(beforeValue) && isRenderablePrimitive(afterValue)
              );
            });

            // If no valid metrics found, don't render this category
            if (metrics.length === 0) {
              return null;
            }

            return (
              <React.Fragment key={category.key}>
                {/* Category Row */}
                <tr
                  className="cursor-pointer bg-[#EBEFF3] transition-colors duration-200 border border-gray-300"
                  onClick={() => handleRowToggle(category.key)}
                >
                  <td className="px-4 py-3 font-semibold">{category.label}</td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </td>
                </tr>

                {/* Metric Rows */}
                {isExpanded &&
                  metrics.map((metric) => {
                    const beforeValue = beforeData[metric];
                    const afterValue = afterData[metric];
                    const lift = calculateLift(beforeValue, afterValue);

                    return (
                      <tr
                        key={`${category.key}-${metric}`}
                        className="bg-teal-50 hover:bg-teal-100 transition-colors duration-200 border border-gray-300"
                      >
                        <td className="pl-8 py-2 font-medium text-teal-800 border border-gray-300">
                          {metric}
                        </td>

                        <td
                          className="py-2 text-center text-sm border border-gray-300"
                          style={{ color: getValueColor(beforeValue) }}
                        >
                          {formatValue(beforeValue, metric)}
                        </td>

                        <td
                          className="py-2 text-center text-sm border border-gray-300"
                          style={{ color: getValueColor(afterValue) }}
                        >
                          {formatValue(afterValue, metric)}
                        </td>

                        <td
                          className="py-2 text-center text-sm border border-gray-300"
                          style={{ color: getValueColor(lift.value) }}
                        >
                          {formatValue(lift.value, metric)}
                        </td>

                        <td className="py-2 text-center">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLiftColor(
                              lift.value
                            )}`}
                          >
                            {getLiftIcon(lift.value, lift.percentage)}
                            <span
                              style={{
                                color: getPercentageColor(lift.percentage),
                              }}
                            >
                              {lift.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>

                        <td></td>
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

KPIComparisonTable.propTypes = {
  data: PropTypes.shape({
    before: PropTypes.object,
    after: PropTypes.object,
  }),
  view: PropTypes.string,
};

export default KPIComparisonTable;
