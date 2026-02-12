import React, { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import PropTypes from "prop-types";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./scorecard.css";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const SubcategorySchematicView = ({
  subcategoryData,
  selectedSubcategories,
}) => {
  const gridRef = useRef();
  const [gridError, setGridError] = useState(false);

  // Debug logging
  console.log("SubcategorySchematicView props:", {
    subcategoryData,
    selectedSubcategories,
  });

  // Transform subcategory data for AG Grid with Before/After side by side and Lift calculations
  // Using the same calculation logic as ComparisonChart
  const rowData = useMemo(() => {
    console.log("Processing data:", { subcategoryData, selectedSubcategories });

    if (
      !subcategoryData ||
      !selectedSubcategories ||
      selectedSubcategories.length === 0
    ) {
      console.log("Missing required data, returning empty array");
      return [];
    }

    const transformedData = [];

    for (const subcategoryName of selectedSubcategories) {
      const subcategoryKey = subcategoryName;
      const subcategoryInfo = subcategoryData[subcategoryKey];

      console.log(`Processing subcategory: ${subcategoryName}`, {
        subcategoryKey,
        subcategoryInfo,
      });

      if (subcategoryInfo?.before && subcategoryInfo?.after) {
        // Calculate lift values using the same logic as ComparisonChart
        const salesLift =
          subcategoryInfo.after.avg_sales - subcategoryInfo.before.avg_sales;
        const salesLiftPercent =
          subcategoryInfo.before.avg_sales > 0
            ? (salesLift / subcategoryInfo.before.avg_sales) * 100
            : 0;
        const shelfSpaceLift =
          subcategoryInfo.after.avg_shelf_space -
          subcategoryInfo.before.avg_shelf_space;
        const shelfSpaceLiftPercent =
          subcategoryInfo.before.avg_shelf_space > 0
            ? (shelfSpaceLift / subcategoryInfo.before.avg_shelf_space) * 100
            : 0;

        const rowItem = {
          subcategory: subcategoryName.toUpperCase(),
          // Before data - matching ComparisonChart structure
          before_sales: subcategoryInfo.before.avg_sales,
          before_item_count: subcategoryInfo.before.avg_unique_item_count,
          before_facings: subcategoryInfo.before.avg_facing_count || 0,
          before_shelf_space: subcategoryInfo.before.avg_shelf_space,
          before_shelf_share: subcategoryInfo.before.avg_shelf_share,
          before_sales_share: subcategoryInfo.before.avg_sales_share,
          // After data - matching ComparisonChart structure
          after_sales: subcategoryInfo.after.avg_sales,
          after_item_count: subcategoryInfo.after.avg_unique_item_count,
          after_facings: subcategoryInfo.after.avg_facing_count || 0,
          after_shelf_space: subcategoryInfo.after.avg_shelf_space,
          after_shelf_share: subcategoryInfo.after.avg_shelf_share,
          after_sales_share: subcategoryInfo.after.avg_sales_share,
          // Lift calculations - using exact same logic as ComparisonChart
          shelf_space_lift: shelfSpaceLift,
          shelf_space_lift_percent: shelfSpaceLiftPercent,
          sales_lift: salesLift,
          sales_lift_percent: salesLiftPercent,
        };

        transformedData.push(rowItem);
        console.log("Added row item:", rowItem);
      } else {
        console.log(
          `Skipping subcategory ${subcategoryName}: missing data structure`,
          subcategoryInfo
        );
      }
    }

    console.log("Final transformed data:", transformedData);
    return transformedData;
  }, [subcategoryData, selectedSubcategories]);

  // Column definitions for AG Grid with Before/After side by side and Lift columns
  const columnDefs = [
    {
      headerName: "",
      marryChildren: true,
      children: [
        {
          field: "subcategory",
          headerName: "Subcategory",
          sortable: true,
          filter: false,
          cellStyle: { fontWeight: "bold", textAlign: "left" },
          width: 200,
          cellClass: "group-sep-border-right",
        },
      ],
    },
    {
      headerName: "Before",
      headerClass: "ag-header-center-align before-section",
      children: [
        {
          field: "before_sales",
          headerName: "Sales Amount\n(£)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `£ ${params.value.toFixed(1)}` : "£ 0.0",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-border-right",

          width: 120,
        },
        {
          field: "before_item_count",
          headerName: "Unique Item\nCount",
          type: "numericColumn",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "before_facings",
          headerName: "Facings\nCount",
          type: "numericColumn",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "before_shelf_space",
          headerName: "Shelf Space\n(cm)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? params.value.toFixed(1) : "0.0",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "before_shelf_share",
          headerName: "Shelf\nShare",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-border-right",
          width: 100,
        },
        {
          field: "before_sales_share",
          headerName: "Sales\nShare",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align before-section",
          cellClass: "group-sep-border-right",
          width: 100,
        },
      ],
    },
    {
      headerName: "After",
      headerClass: "ag-header-center-align after-section",
      children: [
        {
          field: "after_sales",
          headerName: "Sales Amount (£)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `£ ${params.value.toFixed(1)}` : "£ 0.0",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "after_item_count",
          headerName: "Unique\nItem Count",
          type: "numericColumn",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "after_facings",
          headerName: "Facings\nCount",
          type: "numericColumn",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "after_shelf_space",
          headerName: "Shelf Space\n(cm)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? params.value.toFixed(1) : "0.0",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "after_shelf_share",
          headerName: "Shelf\nShare",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-border-right",
          width: 100,
        },
        {
          field: "after_sales_share",
          headerName: "Sales\nShare",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align after-section",
          cellClass: "group-sep-border-right",
          width: 100,
        },
      ],
    },
    {
      headerName: "Lift",
      headerClass: "ag-header-center-align lift-section",
      children: [
        {
          field: "shelf_space_lift",
          headerName: "Shelf Space\nLift (cm)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? params.value.toFixed(1) : "0.0",
          headerClass: "ag-header-center-align lift-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "shelf_space_lift_percent",
          headerName: "Shelf Space\nLift (%)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align lift-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "sales_lift",
          headerName: "Sales\nLift (£)",
          type: "numericColumn",
          valueFormatter: (params) => `£ ${params.value?.toFixed(1) ?? "0"}`,
          headerClass: "ag-header-center-align lift-section",
          cellClass: "group-border-right",
          width: 120,
        },
        {
          field: "sales_lift_percent",
          headerName: "Sales\nLift (%)",
          type: "numericColumn",
          valueFormatter: (params) =>
            params.value ? `${params.value.toFixed(1)}%` : "0.0%",
          headerClass: "ag-header-center-align lift-section",
          cellClass: "group-border-right",
          width: 120,
        },
      ],
    },
  ];

  const defaultColDef = {
    wrapHeaderText: true,
    autoHeaderHeight: false,
    resizable: false,
    sortable: true,
    filter: false,
    suppressSizeToFit: true,
    suppressColumnMove: true,
    suppressMenu: true,
    lockPosition: true,
    suppressMovableColumns: true,
    headerClass: "ag-header-center-align",
    headerHeight: 60, // Fixed header height to prevent auto-adjustment
    suppressHorizontalScroll: false,
    cellStyle: { fontSize: "12px", textAlign: "center" }, // Center align cell content
    cellClass: "group-border-right",
  };

  if (!selectedSubcategories || selectedSubcategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Subcategories Selected</p>
          <p>
            Please select subcategories from the filter bar above to view data
          </p>
        </div>
      </div>
    );
  }

  if (rowData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Data Available</p>
          <p>No data found for the selected subcategories</p>
        </div>
      </div>
    );
  }

  if (gridError) {
    return (
      <div className="w-full px-6 pb-6">
        <div className="mb-4 flex text-sm font-semibold text-gray-700 overflow-hidden">
          <div
            className="bg-amber-100 text-amber-800 px-3 py-2 text-center border border-amber-200 rounded-l-lg flex-shrink-0"
            style={{ width: "120px" }}
          >
            Subcategory
          </div>
          <div className="bg-amber-100 text-amber-800 px-3 py-2 text-center border border-amber-200 flex-1">
            Before
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-2 text-center border border-green-200 flex-1">
            After
          </div>
          <div
            className="bg-gray-100 text-gray-800 px-3 py-2 text-center border border-gray-200 rounded-r-lg flex-shrink-0"
            style={{ width: "320px" }}
          >
            Lift
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                  Subcategory
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales (£)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Items
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Facings
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Space (cm)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Share
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales Share
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales (£)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Items
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Facings
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Space (cm)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Share
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales Share
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Space Lift (cm)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Shelf Space Lift (%)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales Lift (£)
                </th>
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold">
                  Sales Lift (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {rowData.map((row, index) => (
                <tr
                  key={row.subcategory}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-200 px-3 py-2 font-semibold">
                    {row.subcategory}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {`${"\u00A3"}${row.before_sales?.toFixed(1) || "0.0"}`}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.before_item_count || "0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.before_facings || "0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.before_shelf_space?.toFixed(1) || "0.0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {(row.before_shelf_share * 100)?.toFixed(1) || "0.0"}%
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {(row.before_sales_share * 100)?.toFixed(1) || "0.0"}%
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {`${"\u00A3"}${row.after_sales?.toFixed(1) || "0.0"}`}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.after_item_count || "0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.after_facings || "0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.after_shelf_space?.toFixed(1) || "0.0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {(row.after_shelf_share * 100)?.toFixed(1) || "0.0"}%
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {(row.after_sales_share * 100)?.toFixed(1) || "0.0"}%
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.shelf_space_lift?.toFixed(1) || "0.0"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.shelf_space_lift_percent?.toFixed(1) || "0.0"}%
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {`${"\u00A3"}${row.sales_lift?.toFixed(1) || "0.0"}`}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.sales_lift_percent?.toFixed(1) || "0.0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 pb-6">
      <div className="w-full overflow-x-auto">
        <div
          className="ag-theme-quartz w-full rounded-xl border border-gray-200 shadow-lg"
          style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            headerHeight={60}
            suppressColumnVirtualisation={false}
            suppressRowVirtualisation={false}
            suppressHorizontalScroll={false}
            enableRangeSelection={true}
            enableCharts={true}
            suppressColumnMove={true}
            suppressDragLeaveHidesColumns={true}
            allowMoveColumns={false}
            suppressMenuHide={true}
            suppressSizeToFit={true}
            domLayout="normal"
            onGridReady={() => console.log("AG Grid ready")}
            onGridError={(error) => {
              console.error("AG Grid error:", error);
              setGridError(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SubcategorySchematicView;

SubcategorySchematicView.propTypes = {
  subcategoryData: PropTypes.object,
  selectedSubcategories: PropTypes.arrayOf(PropTypes.string),
};
