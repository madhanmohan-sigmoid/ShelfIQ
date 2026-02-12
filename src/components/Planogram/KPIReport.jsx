import React from "react";
import { Box, Skeleton } from "@mui/material";
import {
  Tag,
  SquareStack,
  ShoppingBasket,
  BadgePercent,
  TrendingUp,
  Package,
  PieChart,
} from "lucide-react";

const kpiMetrics = [
  {
    key: "totalBrands",
    label: "Total no. of Brands",
    icon: Tag,
    apiKey: "totalNoOfBrands",
  },
  {
    key: "totalSubCategories",
    label: "Total no. of Sub categories",
    icon: Tag,
    apiKey: "totalNoOfSubCategories",
  },
  {
    key: "totalItems",
    label: "Total Items",
    icon: ShoppingBasket,
    apiKey: "totalItems",
  },
  {
    key: "uniqueItems",
    label: "Unique Items",
    icon: SquareStack,
    apiKey: "uniqueItems",
  },
  {
    key: "totalSales",
    label: "Total sales",
    icon: TrendingUp,
    apiKey: "totalSales",
  },
  {
    key: "totalUnitsSold",
    label: "Total Units sold",
    icon: Package,
    apiKey: "totalUnitsSold",
  },
  {
    key: "averageDaysOfSupply",
    label: "Average days of supply",
    icon: PieChart,
    apiKey: "averageDaysOfSupply",
  },
];

export default function KPIReport({
  heading = "PLANOGRAM REPORT",
  comparisonData = null,
  loading = false,
}) {
  return (
    <Box
      sx={{
        border: "2px solid #e3e3e3",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        p: 2.5,
        flex: 1,
        background: "white",
        height: "100%",
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <span
          style={{
            color: "#FFB000",
            fontWeight: 700,
            fontSize: 16,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {heading}
        </span>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
          {kpiMetrics.map(({ key, label, icon: Icon, apiKey }) => {
            // Show skeleton if loading or if we haven't received any data yet
            const showSkeleton = loading || comparisonData === null;

            // Use API data if available (only check when not loading and data exists)
            const hasApiData =
              !showSkeleton &&
              comparisonData &&
              apiKey &&
              comparisonData[apiKey] !== undefined &&
              comparisonData[apiKey] !== null;

            const value = hasApiData ? comparisonData[apiKey] : null;

            // Format the value based on the metric type, or show "N/A"
            let displayValue = "N/A";
            if (hasApiData) {
              if (key === "totalSales" && typeof value === "number") {
                displayValue = `${value} pounds`;
              } else if (
                key === "kenvueShelfShare" &&
                typeof value === "string" &&
                !value.includes("%")
              ) {
                displayValue = value;
              } else {
                displayValue = value;
              }
            }

            return (
              <Box
                key={key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.3,
                  background: "#f5f5f6",
                  borderRadius: "9px",
                  px: 2,
                  py: 1.7,
                  minHeight: 56,
                  fontSize: 14,
                }}
              >
                <Icon size={17} color="#FFB000" style={{ minWidth: 16 }} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}
                  >
                    {label}
                  </div>
                  {showSkeleton ? (
                    <Skeleton
                      variant="text"
                      width="60%"
                      height={24}
                      sx={{ bgcolor: "rgba(0, 0, 0, 0.08)" }}
                    />
                  ) : (
                    <div
                      style={{ fontWeight: 700, color: "#1f2937", fontSize: 18 }}
                    >
                      {displayValue}
                    </div>
                  )}
                </div>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

import PropTypes from "prop-types";

KPIReport.propTypes = {
  heading: PropTypes.string,
  comparisonData: PropTypes.object,
  loading: PropTypes.bool,
};
