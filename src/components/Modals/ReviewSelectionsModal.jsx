import React, { useState, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import { Search } from "lucide-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const ReviewSelectionsModal = ({
  open,
  onClose,
  onApply,
  products = [],
  preSelectedKeys = null,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const gridRef = useRef();

  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: "left",
        sortable: false,
        filter: false,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "tpnb",
        headerName: "TPNB",
        flex: 1.1,
        minWidth: 100,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1.5,
        minWidth: 180,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "brand_name",
        headerName: "Brand",
        flex: 1.2,
        minWidth: 140,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "subCategory_name",
        headerName: "Subcategory",
        flex: 1.3,
        minWidth: 160,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    ],
    []
  );

  const filteredRowData = useMemo(() => {
    if (!searchValue.trim()) return products;
    const searchLower = searchValue.toLowerCase();
    return products.filter(
      (row) =>
        row.tpnb?.toString().toLowerCase().includes(searchLower) ||
        row.name?.toLowerCase().includes(searchLower) ||
        row.brand_name?.toLowerCase().includes(searchLower) ||
        row.subCategory_name?.toLowerCase().includes(searchLower)
    );
  }, [searchValue, products]);

  const handleClose = () => {
    onClose();
  };

  const handleApply = () => {
    const api = gridRef.current?.api;
    const selectedNodes = api ? api.getSelectedNodes() : [];
    const selectedItems = selectedNodes.map((n) => n.data);
    console.log("Apply clicked - selected items:", selectedItems);
    console.log("Total selected items:", selectedItems.length);
    onApply(selectedItems);
  };

  // Select rows when modal opens or products change
  useEffect(() => {
    if (!open || !gridRef.current?.api) return;

    const timer = setTimeout(() => {
      if (gridRef.current?.api && filteredRowData.length > 0) {
        try {
          const api = gridRef.current.api;
          // Deselect all first
          api.deselectAll();

          if (preSelectedKeys === null) {
            // No manual selection yet, select all
            api.selectAll();
          } else {
            // Select only the pre-selected items
            api.forEachNode((node) => {
              if (node.data) {
                const uniqueKey = `${node.data.id}_${node.data.tpnb}`;
                if (preSelectedKeys.has(uniqueKey)) {
                  node.setSelected(true);
                }
              }
            });
          }
        } catch (error) {
          console.error("Error selecting rows:", error);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, filteredRowData, preSelectedKeys]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 850,
          maxWidth: "97vw",
          maxHeight: "93vh",
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between border-b px-8 py-4">
          <div className="flex items-center gap-x-2 text-base font-semibold text-[#FF9800]">
            <p>All Products ({filteredRowData.length})</p>
          </div>
          <IconButton
            onClick={handleClose}
            aria-label="Close modal"
            size="small"
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </div>
        {/* Top Bar, Search */}
        <div className="flex items-center justify-between pb-3 pt-4 px-8 bg-white">
          <div className="relative flex-1 max-w-[500px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 text-sm bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFEBBF]"
              style={{ minWidth: 160 }}
            />
          </div>
        </div>
        {/* Table */}
        <div className="px-8 pb-4 flex-1" style={{ minHeight: 0 }}>
          <div
            className="planogram-table ag-theme-quartz w-full h-full rounded-xl border border-gray-200 shadow-lg relative overflow-hidden "
            style={{ height: "500px" }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={filteredRowData}
              columnDefs={columnDefs}
              rowSelection="multiple"
              suppressRowClickSelection={false}
              defaultColDef={{
                resizable: true,
                sortable: true,
                wrapHeaderText: true,
                autoHeaderHeight: true,
                headerClass: "ag-header-center-align",
              }}
              animateRows={true}
              headerHeight={48}
              rowHeight={56}
              onFirstDataRendered={(params) => {
                // Select rows when data is first rendered
                setTimeout(() => {
                  const api = params.api;
                  // Deselect all first
                  api.deselectAll();

                  if (preSelectedKeys === null) {
                    // No manual selection yet, select all
                    api.selectAll();
                  } else {
                    // Select only the pre-selected items
                    api.forEachNode((node) => {
                      if (node.data) {
                        const uniqueKey = `${node.data.id}_${node.data.tpnb}`;
                        if (preSelectedKeys.has(uniqueKey)) {
                          node.setSelected(true);
                        }
                      }
                    });
                  }
                }, 100);
              }}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex w-full justify-end p-4 border-t">
          <button
            onClick={handleApply}
            className="bg-[#FFB84D] hover:bg-[#FFA726] text-black px-10 py-2.5 rounded-full font-semibold transition-colors shadow-none normal-case text-[14px]"
          >
            Apply
          </button>
        </div>
      </Box>
    </Modal>
  );
};

ReviewSelectionsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      tpnb: PropTypes.string.isRequired,
      brand_name: PropTypes.string,
      subCategory_name: PropTypes.string,
    })
  ),
  preSelectedKeys: PropTypes.oneOfType([
    PropTypes.instanceOf(Set),
    PropTypes.oneOf([null]),
  ]),
};

export default ReviewSelectionsModal;
