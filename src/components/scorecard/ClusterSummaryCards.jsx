import React from "react";
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const ClusterSummaryCards = ({ data }) => {
  if (!data) return null;

  const calculateLift = (beforeValue, afterValue) => {
    if (
      beforeValue === 0 ||
      beforeValue === null ||
      beforeValue === undefined
    ) {
      return { value: afterValue - beforeValue, percentage: 0 };
    }
    const lift = afterValue - beforeValue;
    const percentage = (lift / beforeValue) * 100;

    // Convert -0 to 0 for both lift value and percentage
    const normalizedLift =
      typeof lift === "number" && Object.is(lift, -0) ? 0 : lift;
    const normalizedPercentage =
      typeof percentage === "number" && Object.is(percentage, -0)
        ? 0
        : percentage;

    return { value: normalizedLift, percentage: normalizedPercentage };
  };

  const getValueColor = (value) => {
    if (value === null || value === undefined) return "#4B5563"; // gray-600
    if (value <= 0) return "#DC2626"; // red-600
    return "#115E59"; // teal-800 for positive values
  };

  const getLiftColor = (liftValue, liftPercentage) => {
    // Base background color on percentage for consistency with icon and text coloring
    if (liftPercentage > 0)
      return "text-green-600 bg-green-50 border-green-200";
    if (liftPercentage < 0) return "text-red-600 bg-red-50 border-red-200";
    if (liftPercentage === 0) return "text-red-600 bg-red-50 border-red-200"; // Red for zero values
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getPercentageColor = (percentage) => {
    if (percentage > 0) return "#059669";
    if (percentage < 0) return "#DC2626";
    return "#4B5563";
  };

  const getLiftIcon = (liftValue, liftPercentage) => {
    // Base icon on percentage for consistency with coloring
    if (liftPercentage > 0)
      return <TrendingUp className="w-4 h-4" style={{ color: "#059669" }} />;
    if (liftPercentage < 0)
      return <TrendingDown className="w-4 h-4" style={{ color: "#DC2626" }} />;
    if (liftPercentage === 0) return null; // No icon for zero values
    return <Minus className="w-4 h-4" style={{ color: "#4B5563" }} />;
  };

  const summaryMetrics = [
    {
      title: "Total Sales",
      beforeValue: data.before.sales["Potential Sales (Yearly)"] || 0,
      afterValue: data.after.sales["Potential Sales (Yearly)"] || 0,

      format: "currency",
    },
    {
      title: "Kenvue Sales",
      beforeValue: data.before.sales["Kenvue Potential Sales (Yearly)"] || 0,
      afterValue: data.after.sales["Kenvue Potential Sales (Yearly)"] || 0,

      format: "currency",
    },
    {
      title: "Kenvue Shelf Share",
      beforeValue: (data.before.productivity["Kenvue shelf share"] || 0) * 100,
      afterValue: (data.after.productivity["Kenvue shelf share"] || 0) * 100,

      format: "percentage",
    },
    {
      title: "Total Items",
      beforeValue: data.before.assortment["Total Item count"] || 0,
      afterValue: data.after.assortment["Total Item count"] || 0,

      format: "number",
    },
    {
      title: "Kenvue Items",
      beforeValue: data.before.assortment["Total Item count (Kenvue)"] || 0,
      afterValue: data.after.assortment["Total Item count (Kenvue)"] || 0,

      format: "number",
    },
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return "-";

    // Convert -0 to 0
    if (typeof value === "number" && Object.is(value, -0)) {
      value = 0;
    }

    switch (format) {
      case "currency":
        return `£${value.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
        return value.toLocaleString();
      default:
        return value;
    }
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryMetrics.map((metric) => {
          const lift = calculateLift(metric.beforeValue, metric.afterValue);

          return (
            <div
              key={metric.title}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{metric.icon}</div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLiftColor(
                    lift.value,
                    lift.percentage
                  )}`}
                >
                  {getLiftIcon(lift.value, lift.percentage)}
                  <span style={{ color: getPercentageColor(lift.percentage) }}>
                    {lift.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-3">
                {metric.title}
              </h3>

              <div className="space-y-1">
                <div
                  className="text-xs"
                  style={{ color: getValueColor(metric.beforeValue) }}
                >
                  Before: {formatValue(metric.beforeValue, metric.format)}
                </div>
                <div
                  className="text-xs"
                  style={{ color: getValueColor(metric.afterValue) }}
                >
                  After: {formatValue(metric.afterValue, metric.format)}
                </div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: getValueColor(lift.value) }}
                >
                  {formatValue(lift.value, metric.format)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClusterSummaryCards;

ClusterSummaryCards.propTypes = {
  data: PropTypes.shape({
    before: PropTypes.object,
    after: PropTypes.object,
  }),
};
