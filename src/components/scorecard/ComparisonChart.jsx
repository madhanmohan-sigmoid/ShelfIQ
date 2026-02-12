import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
} from "@mui/material";
import PropTypes from "prop-types";

const ComparisonChart = ({ data }) => {
  if (!data) return <Typography className="p-2">No data available</Typography>;

  // Convert API values into our chart structure with MUI colors
  const before = [
    {
      label: "Sales Amount (£)",
      value: data.before.avg_sales,
      color: "primary.main",
      type: "currency",
    },
    {
      label: "Unique Item Count",
      value: data.before.avg_unique_item_count,
      color: "primary.main",
      type: "count",
    },
    {
      label: "Facings Count",
      value: data.before.avg_facing_count,
      color: "primary.main",
      type: "count",
    },
    {
      label: "Shelf Space (cm)",
      value: data.before.avg_shelf_space,
      color: "primary.main",
      type: "measurement",
    },
    {
      label: "Shelf Share",
      value: data.before.avg_shelf_share,
      isPercent: true,
      color: "primary.main",
      type: "percentage",
    },
    {
      label: "Sales Share",
      value: data.before.avg_sales_share,
      isPercent: true,
      color: "primary.main",
      type: "percentage",
    },
  ];

  const after = [
    {
      label: "Sales Amount (£)",
      value: data.after.avg_sales,
      color: "success.main",
      type: "currency",
    },
    {
      label: "Unique Item Count",
      value: data.after.avg_unique_item_count,
      color: "success.main",
      type: "count",
    },
    {
      label: "Facings Count",
      value: data.after.avg_facing_count,
      color: "success.main",
      type: "count",
    },
    {
      label: "Shelf Space (cm)",
      value: data.after.avg_shelf_space,
      color: "success.main",
      type: "measurement",
    },
    {
      label: "Shelf Share",
      value: data.after.avg_shelf_share,
      isPercent: true,
      color: "success.main",
      type: "percentage",
    },
    {
      label: "Sales Share",
      value: data.after.avg_sales_share,
      isPercent: true,
      color: "success.main",
      type: "percentage",
    },
  ];

  // Calculate Lift values (After - Before)
  const lift = [
    {
      label: "Shelf Space Lift (cm)",
      value: data.after.avg_shelf_space - data.before.avg_shelf_space,
      color: "info.main",
      type: "measurement",
    },
    {
      label: "Shelf Space Lift (%)",
      value:
        ((data.after.avg_shelf_space - data.before.avg_shelf_space) /
          data.before.avg_shelf_space) *
        100,
      isPercent: true,
      color: "info.main",
      type: "percentage",
    },
    {
      label: "Sales Lift (£)",
      value: data.after.avg_sales - data.before.avg_sales,
      color: "info.main",
      type: "currency",
    },
    {
      label: "Sales Lift (%)",
      value:
        ((data.after.avg_sales - data.before.avg_sales) /
          data.before.avg_sales) *
        100,
      isPercent: true,
      color: "info.main",
      type: "percentage",
    },
  ];

  const renderBars = (arr, columnTitle) =>
    arr.map((item) => {
      // For percentage metrics, use 100 as base; for others, use type-specific maximum
      let widthPercent;
      if (item.isPercent) {
        widthPercent = Math.abs(item.value); // Direct percentage value (0-100)
      } else {
        const typeMetrics = arr.filter((metric) => metric.type === item.type);
        const typeMax = Math.max(
          ...typeMetrics.map((metric) => Math.abs(metric.value))
        );
        widthPercent = (Math.abs(item.value) / typeMax) * 100;
      }

      // Ensure minimum visibility for all bars
      if (widthPercent < 15 && widthPercent > 0) {
        widthPercent = 15; // Minimum 15% width for visibility
      }

      // Cap maximum width to prevent bars from being too wide
      if (widthPercent > 95) {
        widthPercent = 95;
      }

      return (
        <Box key={`${columnTitle}-${item.label}`} sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "text.secondary" }}
            >
              {item.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {item.isPercent
                ? `${item.value.toFixed(2)}%`
                : item.value.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
            </Typography>
          </Box>

          {/* MUI LinearProgress for bars */}
          <Box sx={{ position: "relative", mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={widthPercent}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundColor:
                    item.value < 0 ? "rgba(25, 118, 210, 0.3)" : item.color,
                },
              }}
            />
          </Box>
        </Box>
      );
    });

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "white",
        borderRadius: 1,
        boxShadow: 1,
        border: "1px solid",
        borderColor: "grey.200",
        px: 2,
        py: 1.5,
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: 5,
      }}
    >
      {/* Before Column */}
      <Box
        sx={{
          flex: "1",
          minWidth: 0,
        }}
      >
        <Card
          variant="outlined"
          sx={{ height: "100%", width: "100%", backgroundColor: "white" }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                mb: 2,
                textAlign: "center",
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              Before
            </Typography>
            {renderBars(before, "Before")}
          </CardContent>
        </Card>
      </Box>

      {/* After Column */}
      <Box
        sx={{
          flex: "1",
          minWidth: 0,
        }}
      >
        <Card
          variant="outlined"
          sx={{ height: "100%", width: "100%", backgroundColor: "white" }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                mb: 2,
                textAlign: "center",
                color: "success.main",
                fontWeight: 600,
              }}
            >
              After
            </Typography>
            {renderBars(after, "After")}
          </CardContent>
        </Card>
      </Box>

      {/* Lift Column */}
      <Box
        sx={{
          flex: "1",
          minWidth: 0,
        }}
      >
        <Card
          variant="outlined"
          sx={{ height: "100%", width: "100%", backgroundColor: "white" }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                mb: 2,
                textAlign: "center",
                color: "info.main",
                fontWeight: 600,
              }}
            >
              Lift
            </Typography>
            {renderBars(lift, "Lift")}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ComparisonChart;

ComparisonChart.propTypes = {
  data: PropTypes.shape({
    before: PropTypes.object,
    after: PropTypes.object,
  }),
};
