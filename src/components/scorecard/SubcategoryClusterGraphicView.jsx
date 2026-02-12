import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Tooltip,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const isPlainObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);

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
const MetricRow = ({
  metric,
  beforeVal,
  afterVal,
  globalMax,
  sectionKey,
  minBarPercent,
  prefix,
}) => {
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
        <span className="inline-flex items-center gap-1">
          {prefix}
          <span>{metric.title}</span>
        </span>
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
  prefix: PropTypes.node,
};

// Render a section (accordion containing subcategories)
const SectionAccordion = ({ sectionKey, children, isFirst }) => {
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
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

SectionAccordion.propTypes = {
  sectionKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isFirst: PropTypes.bool.isRequired,
};

const detectMetricFirstSection = (sectionObj) => {
  if (!isPlainObject(sectionObj)) return false;
  const topKeys = Object.keys(sectionObj);
  return topKeys.some((k) => {
    const metricBlock = sectionObj[k];
    if (!isPlainObject(metricBlock)) return false;
    return Object.keys(metricBlock).some((groupKey) => {
      const entry = metricBlock[groupKey];
      return isPlainObject(entry) && Object.hasOwn(entry, "value");
    });
  });
};

const guessMetricType = (sectionKey, metricKey) => {
  const k = (metricKey || "").toLowerCase();
  if (sectionKey === "sales") return "currency";
  if (k.includes("share")) return "percent";
  if (metricKey?.includes("Index")) return "number";
  if (sectionKey === "assortment") return "number";
  return "number";
};

const getEntryLeafMap = (entry) => {
  if (!isPlainObject(entry)) return {};
  if (isPlainObject(entry.brands)) return entry.brands;
  if (isPlainObject(entry.children)) return entry.children;
  return {};
};

const hasAnyNonZero = (obj) =>
  Object.values(obj || {}).some((v) => typeof v === "number" && v !== 0);

const LeafListAccordion = ({
  title,
  beforeLeaf,
  afterLeaf,
  metric,
  sectionKey,
  minBarPercent,
}) => {
  const beforeKeys = Object.keys(beforeLeaf || {});
  const afterKeys = Object.keys(afterLeaf || {});
  const leafKeys = [...new Set([...beforeKeys, ...afterKeys])];

  if (leafKeys.length === 0) return null;

  // compute global max for bars across leaves
  const globalMax = Math.max(
    ...leafKeys.map((k) => Math.max(beforeLeaf?.[k] ?? 0, afterLeaf?.[k] ?? 0)),
    1
  );

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ backgroundColor: "#E8F4F8" }}
      >
        <Typography fontWeight="bold" className="text-blue-600">
          {title} ({leafKeys.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div className="flex flex-col space-y-4">
          {leafKeys.map((leafKey, idx) => {
            const beforeVal = beforeLeaf?.[leafKey] ?? 0;
            const afterVal = afterLeaf?.[leafKey] ?? 0;
            const hasData = beforeVal !== 0 || afterVal !== 0;

            return (
              <Accordion key={leafKey} defaultExpanded={idx === 0}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ backgroundColor: "#F9F9F9" }}
                >
                  <Typography fontWeight="semibold" className="text-gray-700">
                    {leafKey}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {hasData ? (
                    <>
                      <div className="w-full flex justify-end mb-2">
                        {sectionKey === "sales" ? "Lift (%)" : "After"}
                      </div>
                      <div className="flex flex-col space-y-3 w-full">
                        <MetricRow
                          key={metric.key}
                          metric={metric}
                          beforeVal={beforeVal}
                          afterVal={afterVal}
                          globalMax={globalMax}
                          sectionKey={sectionKey}
                          minBarPercent={minBarPercent}
                        />
                      </div>
                    </>
                  ) : (
                    <Box className="flex items-center justify-center py-4">
                      <Typography className="text-gray-400 italic">
                        No changes available
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

LeafListAccordion.propTypes = {
  title: PropTypes.string.isRequired,
  beforeLeaf: PropTypes.object,
  afterLeaf: PropTypes.object,
  metric: PropTypes.shape({
    title: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  sectionKey: PropTypes.string.isRequired,
  minBarPercent: PropTypes.number.isRequired,
};

const GroupRowWithChildren = ({
  title,
  metricKey,
  metricType,
  sectionKey,
  beforeVal,
  afterVal,
  beforeLeaf,
  afterLeaf,
  minBarPercent,
  defaultExpanded = false,
}) => {
  const [open, setOpen] = useState(defaultExpanded);

  const beforeKeys = Object.keys(beforeLeaf || {});
  const afterKeys = Object.keys(afterLeaf || {});
  const leafKeys = [...new Set([...beforeKeys, ...afterKeys])];
  const hasLeaf = leafKeys.length > 0;

  const globalMax = Math.max(
    beforeVal,
    afterVal,
    ...Object.values(beforeLeaf || {}).map((v) => (typeof v === "number" ? v : 0)),
    ...Object.values(afterLeaf || {}).map((v) => (typeof v === "number" ? v : 0)),
    1
  );

  const rowMetric = {
    title,
    key: metricKey,
    type: metricType,
  };

  return (
    <div className="flex flex-col">
      <MetricRow
        metric={rowMetric}
        beforeVal={beforeVal}
        afterVal={afterVal}
        globalMax={globalMax}
        sectionKey={sectionKey}
        minBarPercent={minBarPercent}
        prefix={
          hasLeaf ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              aria-label={open ? "Collapse children" : "Expand children"}
              sx={{ p: 0.25 }}
            >
              {open ? (
                <RemoveIcon fontSize="small" />
              ) : (
                <AddIcon fontSize="small" />
              )}
            </IconButton>
          ) : (
            <span style={{ display: "inline-block", width: 24 }} />
          )
        }
      />

      <Collapse in={open && hasLeaf} timeout="auto" unmountOnExit>
        <div className="pl-6">
          <div className="flex flex-col space-y-0">
            {leafKeys.map((leafKey) => {
              const b = beforeLeaf?.[leafKey] ?? 0;
              const a = afterLeaf?.[leafKey] ?? 0;
              if (b === 0 && a === 0) return null;

              return (
                <MetricRow
                  key={`${title}::${leafKey}`}
                  metric={{ title: leafKey, key: metricKey, type: metricType }}
                  beforeVal={b}
                  afterVal={a}
                  globalMax={globalMax}
                  sectionKey={sectionKey}
                  minBarPercent={minBarPercent}
                  prefix={<span style={{ display: "inline-block", width: 24 }} />}
                />
              );
            })}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

GroupRowWithChildren.propTypes = {
  title: PropTypes.string.isRequired,
  metricKey: PropTypes.string.isRequired,
  metricType: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  beforeVal: PropTypes.number.isRequired,
  afterVal: PropTypes.number.isRequired,
  beforeLeaf: PropTypes.object,
  afterLeaf: PropTypes.object,
  minBarPercent: PropTypes.number.isRequired,
  defaultExpanded: PropTypes.bool,
};

// Main component
const SubcategoryClusterGraphicView = ({ data }) => {
  
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return (
      <Box className="flex flex-col h-full w-full items-center justify-center p-4">
        <Typography className="text-gray-400">No subcategory data available.</Typography>
      </Box>
    );
  }

  // Config for each section (same as ClusterGraphicViewNew)
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

  // Extract before and after data
  const beforeData = data.before || {};
  const afterData = data.after || {};

  // Get all sections from before or after data
  const sectionKeys = Object.keys(beforeData).length > 0 
    ? Object.keys(beforeData) 
    : Object.keys(afterData);

  // Filter sections that have metrics defined
  const validSections = sectionKeys.filter(sectionKey => 
    sections[sectionKey] && sections[sectionKey].length > 0
  );

  if (validSections.length === 0) {
    return (
      <Box className="flex flex-col h-full w-full items-center justify-center p-4">
        <Typography className="text-gray-400">No section data available.</Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full w-full">
      {validSections.map((sectionKey, sectionIdx) => {
        const beforeSection = beforeData[sectionKey] || {};
        const afterSection = afterData[sectionKey] || {};

        const isMetricFirst =
          detectMetricFirstSection(beforeSection) ||
          detectMetricFirstSection(afterSection);

        // Hierarchy labels ("Brands"/"Platform"/"Intensity") are intentionally not shown;
        // indentation + expand/collapse makes the structure self-explanatory.

        if (!isMetricFirst) {
          return (
            <SectionAccordion
              key={sectionKey}
              sectionKey={sectionKey}
              isFirst={sectionIdx === 0}
            >
              <Box className="flex items-center justify-center py-4">
                <Typography className="text-gray-400 italic">
                  No section data available.
                </Typography>
              </Box>
            </SectionAccordion>
          );
        }

        const metricKeys = [
          ...new Set([
            ...Object.keys(beforeSection || {}),
            ...Object.keys(afterSection || {}),
          ]),
        ];

        if (metricKeys.length === 0) {
          return (
            <SectionAccordion
              key={sectionKey}
              sectionKey={sectionKey}
              isFirst={sectionIdx === 0}
            >
              <Box className="flex items-center justify-center py-4">
                <Typography className="text-gray-400 italic">
                  No changes available
                </Typography>
              </Box>
            </SectionAccordion>
          );
        }

        return (
          <SectionAccordion
            key={sectionKey}
            sectionKey={sectionKey}
            isFirst={sectionIdx === 0}
          >
            <div className="flex flex-col space-y-3">
              {metricKeys.map((metricKey, metricIdx) => {
                const metricBlockBefore = beforeSection?.[metricKey] || {};
                const metricBlockAfter = afterSection?.[metricKey] || {};
                const groupKeys = [
                  ...new Set([
                    ...Object.keys(metricBlockBefore || {}),
                    ...Object.keys(metricBlockAfter || {}),
                  ]),
                ];

                if (groupKeys.length === 0) return null;

                const metricType = guessMetricType(sectionKey, metricKey);

                return (
                  <Accordion
                    key={`${sectionKey}::${metricKey}`}
                    defaultExpanded={metricIdx === 0}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ backgroundColor: "#EBEFF3" }}
                    >
                      <Typography fontWeight="bold" className="text-gray-800">
                        {metricKey}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex flex-col space-y-2">
                        {groupKeys.map((groupKey, groupIdx) => {
                          const bEntry = metricBlockBefore?.[groupKey];
                          const aEntry = metricBlockAfter?.[groupKey];
                          const beforeVal = isPlainObject(bEntry) ? (bEntry.value ?? 0) : 0;
                          const afterVal = isPlainObject(aEntry) ? (aEntry.value ?? 0) : 0;

                          const beforeLeaf = getEntryLeafMap(bEntry);
                          const afterLeaf = getEntryLeafMap(aEntry);

                          const hasGroupData =
                            beforeVal !== 0 ||
                            afterVal !== 0 ||
                            hasAnyNonZero(beforeLeaf) ||
                            hasAnyNonZero(afterLeaf);

                          if (!hasGroupData) return null;

                          return (
                            <GroupRowWithChildren
                              key={`${sectionKey}::${metricKey}::${groupKey}`}
                              title={groupKey}
                              metricKey={metricKey}
                              metricType={metricType}
                              sectionKey={sectionKey}
                              beforeVal={beforeVal}
                              afterVal={afterVal}
                              beforeLeaf={beforeLeaf}
                              afterLeaf={afterLeaf}
                              minBarPercent={MIN_BAR_PERCENT}
                              defaultExpanded={groupIdx === 0}
                            />
                          );
                        })}
                      </div>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </div>
          </SectionAccordion>
        );
      })}
    </Box>
  );
};

SubcategoryClusterGraphicView.propTypes = {
  data: PropTypes.object,
};

export default SubcategoryClusterGraphicView;

