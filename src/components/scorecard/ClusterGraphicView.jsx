import React from "react";
import PropTypes from "prop-types";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Tooltip,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useSelector } from "react-redux";
import { selectScorecardData } from "../../redux/reducers/scorecardSlice";

  // Format numbers
  const formatValue = (val, type) => {
    if (!val || val === 0) return "";
    if (type === "currency") return `£ ${val.toFixed(2)}`;
    if (type === "percent") return `${(val * 100).toFixed(2)}%`;
    return val.toFixed(2);
  };

// Calculate lift percentage and related values
const calculateLift = (beforeVal, afterVal, sectionKey) => {
  if (sectionKey !== "sales" || beforeVal === 0) {
    return { liftPercent: null, liftColor: "#6B7280", liftLabel: "--" };
  }

  const diff = afterVal - beforeVal;
  const liftPercent = (diff / beforeVal) * 100;
  
  let liftColor = "#6B7280";
  if (liftPercent > 0) {
    liftColor = "#73C6BA";
  } else if (liftPercent < 0) {
    liftColor = "#CA1432";
  }

  const liftLabel = `${liftPercent > 0 ? "+" : ""}${liftPercent.toFixed(1)}%`;

  return { liftPercent, liftColor, liftLabel };
};

// Calculate bar width with minimum threshold
const calculateBarWidth = (value, globalMax, minBarPercent) => {
  if (value === 0) return 0;
  const rawWidth = (value / globalMax) * 100;
  return Math.max(rawWidth, minBarPercent);
};

// Render a single bar
const MetricBar = ({ value, width, color, formatValue, type }) => {
  const shouldShowValue = value !== 0 && width > 5;
  
  return (
    <div className="flex items-center relative">
      <Tooltip title={formatValue(value, type)} arrow placement="top">
        <div
          className="h-6 rounded-l-2xl rounded-r-full relative"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        >
          {shouldShowValue && (
            <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-medium text-white">
              {formatValue(value, type)}
            </span>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

MetricBar.propTypes = {
  value: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  formatValue: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
};

// Render lift chip for sales section
const LiftChip = ({ liftPercent, liftColor, liftLabel }) => {
  const getIcon = () => {
    if (liftPercent === null || liftPercent === 0) {
      return undefined;
    }
    return liftPercent > 0 ? (
      <TrendingUpIcon sx={{ color: liftColor }} />
    ) : (
      <TrendingDownIcon sx={{ color: liftColor }} />
    );
  };

  return (
    <div className="col-span-2 flex justify-end">
      <Chip
        size="small"
        variant="outlined"
        label={liftLabel}
        icon={getIcon()}
        sx={{
          borderColor: liftColor,
          color: liftColor,
          backgroundColor: "transparent",
          fontWeight: 600,
        }}
      />
    </div>
  );
};

LiftChip.propTypes = {
  liftPercent: PropTypes.number,
  liftColor: PropTypes.string.isRequired,
  liftLabel: PropTypes.string.isRequired,
};

// Render a single metric row
const MetricRow = ({ metric, beforeVal, afterVal, globalMax, sectionKey, minBarPercent }) => {
  // Normalize values
  const normalizedBefore = Number.parseFloat(beforeVal.toFixed(2));
  const normalizedAfter = Number.parseFloat(afterVal.toFixed(2));
  const diff = Number.parseFloat((normalizedAfter - normalizedBefore).toFixed(2));

  // Skip if both values are zero
  if (normalizedBefore === 0 && normalizedAfter === 0) {
    return null;
  }

  const isPositive = diff >= 0;
  const beforeWidth = calculateBarWidth(normalizedBefore, globalMax, minBarPercent);
  const afterWidth = calculateBarWidth(normalizedAfter, globalMax, minBarPercent);
  
  const { liftPercent, liftColor, liftLabel } = calculateLift(
    normalizedBefore,
    normalizedAfter,
    sectionKey
  );

  const afterBarColor = isPositive ? "#73C6BA" : "#CA1432";

  const renderRightColumn = () => {
    if (sectionKey === "sales") {
      return (
        <LiftChip
          liftPercent={liftPercent}
          liftColor={liftColor}
          liftLabel={liftLabel}
        />
      );
    }
    return (
      <div className="col-span-2 text-right font-semibold text-sm">
        {normalizedAfter === 0 ? 0 : formatValue(normalizedAfter, metric.type)}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 items-center gap-2 w-full border-b pb-3">
      {/* Metric Name */}
      <Typography className="font-medium text-sm col-span-2">
        {metric.title}
      </Typography>

      {/* Bar Section */}
      <div className="col-span-8 flex flex-col space-y-1">
        <MetricBar
          value={normalizedBefore}
          width={beforeWidth}
          color="#3774B1"
          formatValue={formatValue}
          type={metric.type}
        />
        <MetricBar
          value={normalizedAfter}
          width={afterWidth}
          color={afterBarColor}
          formatValue={formatValue}
          type={metric.type}
        />
      </div>

      {/* Right-hand Value / Lift */}
      {renderRightColumn()}
    </div>
  );
};

MetricRow.propTypes = {
  metric: PropTypes.shape({
    title: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  beforeVal: PropTypes.number.isRequired,
  afterVal: PropTypes.number.isRequired,
  globalMax: PropTypes.number.isRequired,
  sectionKey: PropTypes.string.isRequired,
  minBarPercent: PropTypes.number.isRequired,
};

// Render a section (accordion with metrics)
const SectionAccordion = ({ sectionKey, metrics, beforeSection, afterSection, isFirst, minBarPercent }) => {
  if (Object.keys(beforeSection).length === 0) return null;

  // compute global max for bars
  const globalMax = Math.max(
    ...metrics.map((m) =>
      Math.max(beforeSection[m.key] ?? 0, afterSection[m.key] ?? 0)
    ),
    1
  );

  const headerLabel = sectionKey === "sales" ? "Lift (%)" : "After";

  return (
    <Accordion defaultExpanded={isFirst}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ backgroundColor: "#F2F2F2" }}
      >
        <Typography fontWeight="bold" className="capitalize">
          {sectionKey}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div className="w-full flex justify-end mb-2">
          {headerLabel}
        </div>
        <div className="flex flex-col space-y-3 w-full">
          {metrics.map((metric) => {
            const beforeVal = beforeSection[metric.key] ?? 0;
            const afterVal = afterSection[metric.key] ?? 0;

            return (
              <MetricRow
                key={metric.key}
                metric={metric}
                beforeVal={beforeVal}
                afterVal={afterVal}
                globalMax={globalMax}
                sectionKey={sectionKey}
                minBarPercent={minBarPercent}
              />
            );
          })}
          {/* Legend at the bottom */}
          <div className="flex justify-center items-center mt-3 gap-x-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#3774B1]" />
              <span className="text-xs">Before</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#73C6BA]" />
              <span className="text-xs">+ve Lift</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#CA1432]" />
              <span className="text-xs">-ve Lift</span>
            </div>
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

SectionAccordion.propTypes = {
  sectionKey: PropTypes.string.isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    })
  ).isRequired,
  beforeSection: PropTypes.object.isRequired,
  afterSection: PropTypes.object.isRequired,
  isFirst: PropTypes.bool.isRequired,
  minBarPercent: PropTypes.number.isRequired,
};

const ClusterGraphicView = ({ data }) => {
  const reduxClusterData = useSelector(selectScorecardData);
  const clusterData = data || reduxClusterData;
  if (!clusterData) return null;

  // Config for each section
  const sections = {
    sales: [
      { title: "Potential Sales", key: "Potential Sales", type: "currency" },
      {
        title: "Potential Sales (Yearly)",
        key: "Potential Sales (Yearly)",
        type: "currency",
      },
      {
        title: "Kenvue Potential Sales",
        key: "Kenvue Potential Sales",
        type: "currency",
      },
      {
        title: "Kenvue Potential Sales (Yearly)",
        key: "Kenvue Potential Sales (Yearly)",
        type: "currency",
      },
      { title: "Lost Sales", key: "Lost Sales", type: "currency" },
      {
        title: "Lost Sales (Kenvue)",
        key: "Lost Sales (Kenvue)",
        type: "currency",
      },
      {
        title: "avg sales per item",
        key: "avg sales per item",
        type: "currency",
      },
      {
        title: "avg sales per item (Kenvue)",
        key: "avg sales per item (Kenvue)",
        type: "currency",
      },
      { title: "avg sales per cm", key: "avg sales per cm", type: "currency" },
      {
        title: "avg sales per cm (Kenvue)",
        key: "avg sales per cm (Kenvue)",
        type: "currency",
      },
    ],
    productivity: [
      {
        title: "Kenvue shelf share",
        key: "Kenvue shelf share",
        type: "percent",
      },
      {
        title: "Kenvue sales share",
        key: "Kenvue sales share",
        type: "percent",
      },
      { title: "Kenvue Index", key: "Kenvue Index", type: "number" },
      {
        title: "Kenvue Productivity",
        key: "Kenvue Productivity",
        type: "number",
      },
    ],
    assortment: [
      { title: "Total Item count", key: "Total Item count", type: "number" },
      {
        title: "Total Item count (Kenvue)",
        key: "Total Item count (Kenvue)",
        type: "number",
      },
      { title: "Total Items added", key: "Total Items added", type: "number" },
      {
        title: "Total Items added (Kenvue)",
        key: "Total Items added (Kenvue)",
        type: "number",
      },
      {
        title: "Total Items removed",
        key: "Total Items removed",
        type: "number",
      },
      {
        title: "Total Items removed (Kenvue)",
        key: "Total Items removed (Kenvue)",
        type: "number",
      },
      { title: "Overlapping Items", key: "Overlapping Items", type: "number" },
      {
        title: "Overlapping Items (Kenvue)",
        key: "Overlapping Items (Kenvue)",
        type: "number",
      },
    ],
    inventory: [], // currently no keys
    marchandising: [], // currently no keys
  };

  const MIN_BAR_PERCENT = 8; // minimum visible width percentage for non-zero values

  return (
    <Box className="flex flex-col h-full w-full">
      {Object.entries(sections).map(([sectionKey, metrics], idx) => {
        const beforeSection = clusterData.before?.[sectionKey] || {};
        const afterSection = clusterData.after?.[sectionKey] || {};

        return (
          <SectionAccordion
            key={sectionKey}
            sectionKey={sectionKey}
            metrics={metrics}
            beforeSection={beforeSection}
            afterSection={afterSection}
            isFirst={idx === 0}
            minBarPercent={MIN_BAR_PERCENT}
          />
        );
      })}
    </Box>
  );
};

ClusterGraphicView.propTypes = {
  data: PropTypes.object,
};

export default ClusterGraphicView;