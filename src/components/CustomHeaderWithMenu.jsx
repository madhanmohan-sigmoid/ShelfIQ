import React, { useState, useRef } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import ColumnVisibilityMenu from "./ColumnVisibilityMenu";
import PropTypes from "prop-types";

const CustomHeaderWithMenu = ({
  displayName,
  column,
  api,
  columnApi,
  gridApi,
  columns,
  enableSorting,
  progressSort,
}) => {
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setOptionsAnchorEl(event.currentTarget);
    setOptionsMenuOpen(true);
  };

  const handleOptionsClose = () => {
    setOptionsMenuOpen(false);
    setIsHovered(false);
  };

  const handleHoverEnter = () => {
    setIsHovered(true);
  };

  const handleHoverLeave = () => {
    if (!optionsMenuOpen) {
      setIsHovered(false);
    }
  };

  const handleOpenFilterMenu = () => {
    // Close our options menu and delegate to AG Grid's native column menu (which includes filter UI)
    setOptionsMenuOpen(false);
    if (api?.showColumnMenuAfterButtonClick && buttonRef.current && column) {
      api.showColumnMenuAfterButtonClick(column, buttonRef.current);
    } else if (api?.showColumnMenu && column) {
      api.showColumnMenu(column);
    }
  };

  const triggerSort = (isMultiSort = false) => {
    if (!enableSorting) return;
    if (progressSort) {
      progressSort(isMultiSort);
    } else if (columnApi && column) {
      columnApi.applyColumnState({
        state: [{ colId: column.getColId(), sort: "asc" }],
        defaultState: { sort: null },
      });
    }
  };

  const colDef = column?.getColDef ? column.getColDef() : column?.colDef;
  const hasFilter = Boolean(colDef?.filter);

  // Use gridApi if provided, otherwise fall back to api prop
  const gridApiToUse = gridApi || api;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: "0 6px",
      }}
    >
      <button
        type="button"
        style={{
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          padding: 0,
          margin: 0,
          cursor: enableSorting ? "pointer" : "default",
          border: "none",
          background: "transparent",
          textAlign: "left",
        }}
        title={displayName}
        onClick={(event) => {
          if (!enableSorting) return;
          event.preventDefault();
          triggerSort(event.shiftKey);
        }}
        disabled={!enableSorting}
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
      > 
        <span
          style={{
            display: "inline-block",
            maxWidth: "100%",
            paddingRight: isHovered ? 28 : 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "padding-right 120ms ease",
          }}
        >
          {displayName}
        </span>
      </button>
      <IconButton
        ref={buttonRef}
        size="small"
        onClick={handleMenuClick}
        sx={{
          padding: "2px",
          position: "absolute",
          right: 2,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: isHovered ? 0.85 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 120ms ease",
          "&:hover": {
            opacity: 1,
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
        aria-label="Column options"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={optionsAnchorEl}
        open={optionsMenuOpen}
        onClose={handleOptionsClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 280,
              maxWidth: 360,
              px: 1,
              py: 1,
              borderRadius: 2,
              boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
              "& .MuiMenuItem-root": {
                borderRadius: 1.5,
                px: 1,
                py: 1,
                fontSize: 14,
                color: "#111",
              },
            },
          },
        }}
      >
        {hasFilter && (
          <MenuItem
            onClick={() => {
              handleOpenFilterMenu();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              <FilterAltOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Filters
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleOptionsClose();
            if (buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setAnchorPosition({
                top: rect.bottom,
                left: rect.left,
              });
              setColumnMenuOpen(true);
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
            <ViewColumnOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Column Management
        </MenuItem>
      </Menu>
      {columnMenuOpen && anchorPosition && (
        <ColumnVisibilityMenu
          anchorPosition={anchorPosition}
          open={columnMenuOpen}
          onClose={() => setColumnMenuOpen(false)}
          columns={columns}
          gridApi={gridApiToUse}
        />
      )}
    </div>
  );
};

CustomHeaderWithMenu.propTypes = {
  displayName: PropTypes.string,
  column: PropTypes.object,
  api: PropTypes.object,
  columnApi: PropTypes.object,
  gridApi: PropTypes.object,
  enableSorting: PropTypes.bool,
  progressSort: PropTypes.func,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      headerName: PropTypes.string,
      pinned: PropTypes.string,
    })
  ).isRequired,
};

CustomHeaderWithMenu.displayName = "CustomHeaderWithMenu";

export default CustomHeaderWithMenu;
