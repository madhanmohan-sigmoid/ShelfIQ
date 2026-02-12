import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useRef, useMemo, useState } from "react";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Menu, MenuItem, Tooltip } from "@mui/material";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { selectRules } from "../../redux/reducers/planogramVisualizerSlice";
import AddRuleModal from "../Modals/AddRuleModal";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Custom cell renderer for product groups (clauses) with pills
const ProductGroupRenderer = ({ value }) => {
  if (!value || !Array.isArray(value) || value.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap items-center justify-center py-1">
      {value.map((clause, idx) => {
        const label = clause?.label || clause;
        const tooltip = clause?.tooltip || label;
        const key = clause?.key || `${label}-${idx}`;

        if (!label) return null;

        return (
          <div key={key} className="flex items-center gap-1">
            {idx > 0 && (
              <span className="text-gray-400 text-xs" aria-hidden="true">
                -
              </span>
            )}
            <Tooltip title={tooltip} arrow placement="top">
              <span
                className="px-3 py-1 bg-[#E0E0E0] text-[#222] text-xs rounded font-medium"
                style={{ height: 24, fontSize: 12, fontWeight: 500 }}
              >
                {label}
              </span>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
};

ProductGroupRenderer.propTypes = {
  value: PropTypes.array,
};

const RulesTable = ({ attributeOptions = {} }) => {
  const rules = useSelector(selectRules);
  const gridRef = useRef();
  const [searchValue, setSearchValue] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedRuleCategory, setSelectedRuleCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const menuOpen = Boolean(menuAnchorEl);

  // Transform Redux rules to table row format
  const rowData = useMemo(() => {
    if (!Array.isArray(rules) || rules.length === 0) {
      return [];
    }

    const toDisplayClauses = (clauses = []) => {
      if (!Array.isArray(clauses) || clauses.length === 0) return [];

      const normalizedClauses = clauses.map((clause, idx) => ({
        attribute: (clause?.attribute || "").toLowerCase(),
        values: Array.isArray(clause?.values) ? clause.values : [],
        originalIndex: idx,
      }));

      const result = [];
      const included = new Set();

      const addClause = (clause) => {
        if (!clause || result.length >= 2) return;
        if (included.has(clause.originalIndex)) return;
        if (!Array.isArray(clause.values) || clause.values.length === 0) return;

        const [firstValue, ...rest] = clause.values;
        const label =
          rest.length > 0 ? `${firstValue} +${rest.length}` : firstValue;

        result.push({
          key: `${clause.attribute || "attr"}-${clause.originalIndex}`,
          label,
          tooltip: clause.values.join(", "),
          attribute: clause.attribute,
        });
        included.add(clause.originalIndex);
      };

      const brandClause = normalizedClauses.find(
        (c) => c.attribute === "brand"
      );
      const subcategoryClause = normalizedClauses.find(
        (c) => c.attribute === "subcategory"
      );

      addClause(brandClause);
      addClause(subcategoryClause);

      normalizedClauses.forEach((clause) => {
        if (result.length >= 2) return;
        if (["brand", "subcategory"].includes(clause.attribute)) return;
        addClause(clause);
      });

      return result;
    };

    return rules.map((rule, index) => {
      let clauseSource = [];
      
      // Handle product_groups structure: extract clauses from each product group
      if (Array.isArray(rule?.product_groups) && rule.product_groups.length > 0) {
        // Flatten clauses from all product groups for display
        rule.product_groups.forEach((pg) => {
          if (Array.isArray(pg?.clauses) && pg.clauses.length > 0) {
            clauseSource.push(...pg.clauses);
          }
        });
      } else if (Array.isArray(rule?.clauses) && rule.clauses.length > 0) {
        // Fallback to flat clauses array for backward compatibility
        clauseSource = rule.clauses;
      }

      const attributeDisplay = toDisplayClauses(clauseSource);

      return {
        // ID is just the row index (as requested)
        id: index + 1,
        // API fields
        type: rule?.type || "—",
        rule_category: rule?.rule_category || "—",
        productGroup: attributeDisplay,
        // Keep original rule for actions/edit/copy/delete flows
        _raw: rule,
      };
    });
  }, [rules]);

  const columnDefs = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        flex: 0.6,
        minWidth: 80,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "type",
        headerName: "Type",
        flex: 1.2,
        minWidth: 130,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "rule_category",
        headerName: "Rule Category",
        flex: 1.5,
        minWidth: 150,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        field: "productGroup",
        headerName: "Product Group",
        flex: 2.2,
        minWidth: 260,
        cellRenderer: ProductGroupRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 4px",
        },
        autoHeight: true,
      },
    ],
    []
  );

  const filteredRowData = useMemo(() => {
    if (!searchValue.trim()) return rowData;
    const searchLower = searchValue.toLowerCase();
    return rowData.filter((row) => {
      return (
        String(row.id).includes(searchLower) ||
        row.type?.toLowerCase().includes(searchLower) ||
        row.rule_category?.toLowerCase().includes(searchLower) ||
        row.productGroup?.some((attr) =>
          (attr?.label || attr)
            ?.toLowerCase()
            .includes(searchLower)
        )
      );
    });
  }, [rowData, searchValue]);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleMenuItemClick = (ruleCategory) => {
    setSelectedRuleCategory(ruleCategory);
    handleMenuClose();
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRuleCategory(null);
  };


  return (
    <div className="w-full space-y-4 px-6 pb-6">
      {/* Top Bar: Custom Search and Add Rule */}
      <div className="flex items-center justify-between pb-2 pt-1 px-1">
        {/* Left: Custom styled search input */}
        <div className="relative flex-1 max-w-[500px]">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-300 text-sm bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFEBBF]"
            style={{ minWidth: 160 }}
          />
        </div>
        {/* Right: Add Rule button with dropdown menu */}
        <button
          onClick={handleMenuOpen}
          type="button"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-[#FFAE80] border-[#FFAE80] text-black focus:ring-[#FFAE80] hover:scale-105 hover:shadow-md ml-4"
          style={{ fontSize: 15, fontWeight: 500 }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 180,
                borderRadius: 2,
                boxShadow: "0px 8px 24px rgba(0,0,0,0.15)",
                "& .MuiMenuItem-root": {
                  borderRadius: 1,
                  px: 2,
                  py: 1.5,
                  fontSize: 14,
                  color: "#111",
                  "&:hover": {
                    backgroundColor: "#FFEBBF",
                  },
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => handleMenuItemClick("Assortment")}>
            Assortment
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick("Inventory")}>
            Inventory
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick("Merchandising")}>
            Merchandising
          </MenuItem>
        </Menu>
      </div>
      {/* Table */}
      <div className="planogram-table ag-theme-quartz w-full h-[500px] rounded-xl border border-gray-200 shadow-lg relative overflow-hidden myplanogram-table">
        <AgGridReact
          ref={gridRef}
          rowData={filteredRowData}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            flex: 1,
            minWidth: 120,
            cellStyle: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            },
            headerClass: "ag-header-center-align",
          }}
          animateRows={true}
          headerHeight={48}
          rowHeight={60}
          getRowStyle={(params) => {
            const d = params?.data;
            if (!d) return { backgroundColor: "#ffffff" };
            // Apply orange theme styling similar to myPlanogram variant
            return {
              backgroundColor: "#ffffff",
              color: "#374151",
            };
          }}
        />
      </div>
      {/* Add Rule Modal - Only render when needed */}
      {modalOpen && (
        <AddRuleModal
          open={modalOpen}
          onClose={handleModalClose}
          ruleCategory={selectedRuleCategory}
          attributeOptions={attributeOptions}
        />
      )}
    </div>
  );
};

RulesTable.propTypes = {
  attributeOptions: PropTypes.object,
};

export default RulesTable;
