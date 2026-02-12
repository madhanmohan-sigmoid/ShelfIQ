import React from "react";
import { Box, Button, Typography } from "@mui/material";
import {
  BarChart,
  Settings,
  Package,
  TrendingUp,
  PieChart,
  Eye,
  BadgePercent,
} from "lucide-react";

const KPIS = [
  { label: "Sales lift", value: 10, IconComponent: TrendingUp },
  { label: "Kenvue shelf share", value: 7, IconComponent: PieChart },
  { label: "DOS", value: 50, IconComponent: Package },
  { label: "Merchandising", value: 15, IconComponent: BadgePercent },
  { label: "Hand eye level", value: 18, IconComponent: Eye },
];

const PlanogramKPIs = ({ leftCollapsed, rightCollapsed }) => {
  // Emulate the logic from PlanogramGrid for consistent width/collapse behavior
  // But do NOT shrink to the min, just mimic the grid's maxWidth logic
  const leftWidth = leftCollapsed ? 32 : 280;
  const rightWidth = rightCollapsed ? 0 : 250;
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const MAX_WIDTH = screenWidth - leftWidth - rightWidth - 80;

  return (
    <Box
      sx={{
        backgroundColor: "#f8f9fa",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        borderRadius: "8px",
        padding: "12px 16px",
        margin: "18px auto 0 auto",
        width: "100%",
        maxWidth: Math.min(MAX_WIDTH, 1400),
        minWidth: 320,
        transition: "max-width 0.25s",
        overflow: "visible",
      }}
      className="planogram-bg"
    >
      {/* Heading and Settings */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BarChart size={18} color="#191919" strokeWidth={2} />
          <Typography
            sx={{
              fontWeight: 600,
              color: "#191919",
              fontFamily: "inherit",
              fontSize: "14px",
              letterSpacing: 0.2,
            }}
          >
            KPI&rsquo;s
          </Typography>
        </Box>
        <Button
          variant="text"
          sx={{
            minWidth: 0,
            p: 0.5,
            color: "#191919",
            borderRadius: "4px",
            background: "none",
            "&:hover": { background: "none", color: "#000" },
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            textTransform: "none",
          }}
          startIcon={<Settings size={18} color="#191919" strokeWidth={2} />}
        >
          Settings
        </Button>
      </Box>
      {/* Metric cards */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        {KPIS.map(({ label, value, IconComponent }) => {
          const Icon = IconComponent;
          return (
            <Box
              key={label}
              sx={{
                flex: 1,
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.01)",
                height: 70,
                p: 1.5,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                minWidth: 0,
                overflow: "hidden",
                gap: 1.5,
              }}
            >
              <Icon
                size={20}
                color="#222"
                strokeWidth={2}
                style={{ minWidth: 24 }}
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  ml: 1,
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 400,
                    color: "#444",
                    fontSize: 13,
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "#191919",
                    fontSize: 18,
                    mt: 0.3,
                  }}
                >
                  {value}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PlanogramKPIs;

import PropTypes from "prop-types";

PlanogramKPIs.propTypes = {
  leftCollapsed: PropTypes.bool,
  rightCollapsed: PropTypes.bool,
};
