import React, { useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./TableView.css";

import {
  selectFilteredScorecardData,
  selectSelectedTab,
} from "../../redux/reducers/scorecardSlice";

const TableView = () => {
  const gridRef = useRef();
  const rowData = useSelector(selectFilteredScorecardData);
  const activeTab = useSelector(selectSelectedTab);

  const twoDecimalFormatter = (p) =>
    p.value != null && !isNaN(p.value) ? p.value.toFixed(2) : "";

  const percentFormatter = (p) =>
    p.value != null && !isNaN(p.value) ? `${p.value.toFixed(2)}%` : "";

  const columnDefs = useMemo(() => {
    const baseCols = [
      { headerName: "Sub-Category", field: "subcategory", pinned: "left",resizable:true },
    ];

    if (activeTab === "brand") {
      baseCols.push({ headerName: "Brand", field: "brand", pinned: "left",resizable:true });
    }

    return [
      ...baseCols,
      {
        headerName: "Before",
        headerClass: "group-header",
        children: [
          { headerName: "Sales", field: "before_sales", valueFormatter: twoDecimalFormatter,minWidth: 100 },
          { headerName: "Item Count", field: "before_item_count", valueFormatter: twoDecimalFormatter },
          { headerName: "Facings", field: "before_facings", valueFormatter: twoDecimalFormatter },
          { headerName: "Shelf Space", field: "before_shelf_space", valueFormatter: twoDecimalFormatter },
          { headerName: "Shelf Share %", field: "before_shelf_share", valueFormatter: percentFormatter,minWidth: 140 },
          { headerName: "Sales Share %", field: "before_sales_share", valueFormatter: percentFormatter, cellClass: "group-end",minWidth: 140 },
        ],
      },
      {
        headerName: "After",
        headerClass: "group-header",
        children: [
          { headerName: "Sales", field: "after_sales", valueFormatter: twoDecimalFormatter,minWidth: 100 },
          { headerName: "Item Count", field: "after_item_count", valueFormatter: twoDecimalFormatter },
          { headerName: "Facings", field: "after_facings", valueFormatter: twoDecimalFormatter },
          { headerName: "Shelf Space", field: "after_shelf_space", valueFormatter: twoDecimalFormatter },
          { headerName: "Shelf Share %", field: "after_shelf_share", valueFormatter: percentFormatter,minWidth: 140 },
          { headerName: "Sales Share %", field: "after_sales_share", valueFormatter: percentFormatter, cellClass: "group-end",minWidth: 140 },
        ],
      },
      {
        headerName: "Lift",
        headerClass: "group-header",
        children: [
          { headerName: "Sales Δ", field: "sales_lift", valueFormatter: twoDecimalFormatter,minWidth: 100 },
          { headerName: "Sales Δ%", field: "sales_lift_percent", valueFormatter: percentFormatter },
          { headerName: "Shelf Space Δ", field: "shelf_space_lift", valueFormatter: twoDecimalFormatter,minWidth: 140 },
          { headerName: "Shelf Space Δ%", field: "shelf_space_lift_percent", valueFormatter: percentFormatter, cellClass: "group-end",minWidth: 160 },
        ],
      },
    ];
  }, [activeTab]);

  return (
    <div
      className="ag-theme-quartz custom-grid"
      style={{ height: "calc(100vh - 200px)", width: "100%" }}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          resizable: false,
          minWidth: 120,
          flex: 1,
          suppressMovable: true

        
        }}
      />
    </div>
  );
};

export default TableView;
