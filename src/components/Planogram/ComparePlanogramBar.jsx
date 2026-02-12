import React from "react";
import { Box, Typography, IconButton, Tooltip as MuiTooltip } from "@mui/material";
import {
  ArrowBack,
  TableRows,
  GridOn as GridOnIcon,
  FilterList as FilterListIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Legend from "../Legend";

export default function ComparePlanogramBar({
  view = "kpi",
  onToggleView,
  onFilterClick,
  onDownload,
  activeFiltersCount = 0,
  syncScrollEnabled = false,
  onToggleSyncScroll,
}) {
  const navigate = useNavigate();
  const hasActiveFilters = (activeFiltersCount || 0) > 0;

  return (
    <Box
      sx={{
        px: 6,
        py: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        minHeight: "56px",
        zIndex: 40,
        position: "sticky",
        top: "70px",
        fontFamily:
          'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        "& *": {
          fontFamily:
            'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      {/* Left side */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        <IconButton aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
          Compare Planograms
        </Typography>
      </Box>

      {/* Right side */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Legend */}
        <Legend />
        {/* 3-way View toggle */}
        <div className="flex items-center rounded-full border border-black overflow-hidden w-max">
          <MuiTooltip title="KPI View" placement="bottom">
            <button
              onClick={() => onToggleView("kpi")}
              className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
                view === "kpi" ? "bg-[#FFEBBF]" : ""
              }`}
              style={{
                borderRadius: "20px 0 0 20px",
                borderRight: "1px solid #e5e7eb",
              }}
            >
              <BarChartIcon
                fontSize="small"
                sx={{ color: view === "kpi" ? "#FFB000" : undefined }}
              />
            </button>
          </MuiTooltip>

          <MuiTooltip title="Planogram View" placement="bottom">
            <button
              onClick={() => onToggleView("planogram")}
              className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
                view === "planogram" ? "bg-[#FFEBBF]" : ""
              }`}
              style={{ borderRadius: 0, borderRight: "1px solid #e5e7eb" }}
            >
              <GridOnIcon
                fontSize="small"
                sx={{ color: view === "planogram" ? "#FFB000" : undefined }}
              />
            </button>
          </MuiTooltip>

          <MuiTooltip title="Schematic View" placement="bottom">
            <button
              onClick={() => onToggleView("schematic")}
              className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
                view === "schematic" ? "bg-[#FFEBBF] rounded-r-full" : ""
              }`}
              style={{ borderRadius: "0 20px 20px 0" }}
            >
              <TableRows
                fontSize="small"
                sx={{ color: view === "schematic" ? "#FFB000" : undefined }}
              />
            </button>
          </MuiTooltip>
        </div>

        {/* Filter button with badge count */}
        <button
          className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1.5 relative"
          onClick={onFilterClick}
        >
          <div className="relative">
            <FilterListIcon sx={{ fontSize: 20 }} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white bg-red-150 text-[8px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <span>Filter</span>
        </button>

        {/* Scroll sync toggle */}
        <MuiTooltip
          title={syncScrollEnabled ? "Unlink horizontal scroll" : "Link horizontal scroll"}
          placement="bottom"
        >
          <button
            onClick={onToggleSyncScroll}
            className="flex items-center justify-center rounded-lg px-3 py-2 transition-colors"
            aria-pressed={syncScrollEnabled}
          >
            {syncScrollEnabled ? (
              <LinkIcon sx={{ fontSize: 20, color: "#FFB000" }} />
            ) : (
              <LinkOffIcon sx={{ fontSize: 20 }} />
            )}
          </button>
        </MuiTooltip>

        {/* Download button */}
        <MuiTooltip title="Download" placement="bottom">
          <button
            onClick={onDownload}
            className="flex items-center justify-center rounded-lg px-3 py-2 transition-colors"
          >
            <DownloadIcon sx={{ fontSize: 20 }} />
          </button>
        </MuiTooltip>
      </Box>
    </Box>
  );
}

ComparePlanogramBar.propTypes = {
  view: PropTypes.oneOf(["kpi", "planogram", "schematic"]),
  onToggleView: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func,
  onDownload: PropTypes.func,
  activeFiltersCount: PropTypes.number,
  syncScrollEnabled: PropTypes.bool,
  onToggleSyncScroll: PropTypes.func,
};
