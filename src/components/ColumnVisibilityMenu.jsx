import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { InputBase, Divider } from "@mui/material";

const ColumnVisibilityMenu = ({
  anchorPosition,
  open,
  onClose,
  columns,
  gridApi,
}) => {
  const [searchText, setSearchText] = useState("");
  const [colVisibility, setColVisibility] = useState({});
  const popupRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (open && gridApi) {
      const state = {};
      for (const col of columns) {
        const agCol = gridApi.getColumn(col.field);
        state[col.field] = agCol ? agCol.isVisible() : true;
      }
      setColVisibility(state);
    }
  }, [open, columns, gridApi]);

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    function onDocumentClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocumentClick, true);
    } else {
      document.removeEventListener("mousedown", onDocumentClick, true);
    }
    return () =>
      document.removeEventListener("mousedown", onDocumentClick, true);
  }, [open, onClose]);

  if (!open || !anchorPosition) return null;

  const filteredColumns = columns.filter((col) => {
    const header = String(col.headerName || "").toLowerCase();
    const field = String(col.field || "").toLowerCase();
    const query = searchText.trim().toLowerCase();
    return !query || header.includes(query) || field.includes(query);
  });

  const isColumnVisible = (field) =>
    colVisibility[field] !== undefined ? colVisibility[field] : true;

  const handleToggle = (field) => {
    const newVisible = !isColumnVisible(field);
    setColVisibility({ ...colVisibility, [field]: newVisible });
    if (gridApi) gridApi.setColumnVisible(field, newVisible);
  };

  const handleReset = () => {
    const updated = { ...colVisibility };
    for (const col of columns) {
      updated[col.field] = true;
      if (gridApi) gridApi.setColumnVisible(col.field, true);
    }
    setColVisibility(updated);
  };

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: anchorPosition.top,
        left: anchorPosition.left,
        zIndex: 1300,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
      }}
      className="min-w-[280px] max-w-[360px] w-auto p-4 bg-white rounded-lg text-sm font-sans text-gray-700"
    >
      {/* Search */}
      <InputBase
        inputRef={searchInputRef}
        type="text"
        placeholder="Search columns"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          display: "block",
          border: "1px solid #E0E0E0",
          borderRadius: 1.5,
          fontSize: 14,
          background: "#fafbfc",
          px: 1.5,
          py: 0.5,
          width: "100%",
          height: 32,
          color: "text.primary",
          "& input": { p: 0, m: 0 },
          mb: 1,
        }}
      />
      <Divider />

      {/* Checkbox list */}
      <div className="min-h-[120px] max-h-[300px] overflow-y-auto mb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredColumns.length === 0 ? (
          <p className="text-center text-black mt-6">No columns found</p>
        ) : (
          filteredColumns.map((col) => (
            <button
              type="button"
              key={col.field}
              className="flex w-full items-center cursor-pointer py-2.5 px-3 rounded-md hover:bg-black/5 transition text-left text-sm text-black font-normal"
              onClick={() => handleToggle(col.field)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(col.field);
                }
              }}
            >
              <div className="relative w-4 h-4 mr-3">
                <input
                  type="checkbox"
                  checked={isColumnVisible(col.field)}
                  readOnly
                  className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div
                  className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                    isColumnVisible(col.field)
                      ? "bg-black border-black"
                      : "bg-white border-black"
                  }`}
                >
                  {isColumnVisible(col.field) && (
                    <svg
                      className="w-[10px] h-[10px] pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#ffffff"
                      strokeWidth={5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span
                className="text-sm text-black break-words flex-1 min-w-0"
                title={col.headerName || ""}
              >
                {col.headerName || col.field}
              </span>
            </button>
          ))
        )}
      </div>
      <Divider />
      {/* Buttons */}
      <div className="flex justify-between mt-3">
        <button
          className="rounded-md border border-black px-4 py-2 flex-1 mr-2 text-black bg-white hover:bg-gray-100 
            text-sm font-medium transition disabled:bg-gray-200 disabled:opacity-70"
          onClick={handleReset}
          type="button"
        >
          Reset
        </button>
        <button
          className="rounded-md px-4 py-2 flex-1 bg-black text-white text-sm font-medium transition hover:bg-black/90"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
};

ColumnVisibilityMenu.propTypes = {
  anchorPosition: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      headerName: PropTypes.string,
      pinned: PropTypes.string,
    })
  ).isRequired,
  gridApi: PropTypes.object,
};

export default ColumnVisibilityMenu;
