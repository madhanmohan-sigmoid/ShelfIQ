import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import "./scorecard.css";
import PropTypes from "prop-types";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const BrandSchematicView = ({ brandData, selectedBrands }) => {
  const gridRef = useRef();

  console.log(typeof brandData, brandData);
  const rowData = useMemo(() => {
    if (!brandData || !selectedBrands || selectedBrands.length === 0) return [];

    const transformedData = [];

    brandData.forEach((brandName) => {
      // search brand across all categories
      let brandInfo = null;

      for (const category of Object.values(brandData)) {
        if (category[brandName]) {
          brandInfo = category[brandName];
          break;
        }
      }
      console.log(brandInfo);

      if (brandInfo?.before && brandInfo?.after) {
        // Calculate lift values
        const salesLift = brandInfo.after.sales - brandInfo.before.sales;
        const salesLiftPercent =
          brandInfo.before.sales > 0
            ? (salesLift / brandInfo.before.sales) * 100
            : 0;

        const shelfSpaceLift =
          brandInfo.after.total_space - brandInfo.before.total_space;
        const shelfSpaceLiftPercent =
          brandInfo.before.total_space > 0
            ? (shelfSpaceLift / brandInfo.before.total_space) * 100
            : 0;

        transformedData.push({
          brand: brandName.toUpperCase(),

          // Before data
          before_sales: brandInfo.before.sales,
          before_item_count: brandInfo.before.unique_item_count,
          before_facings: brandInfo.before.total_facings || 0,
          before_shelf_space: brandInfo.before.total_space,
          before_shelf_share: brandInfo.before.shelf_share,
          before_sales_share: brandInfo.before.sales_share,

          // After data
          after_sales: brandInfo.after.sales,
          after_item_count: brandInfo.after.unique_item_count,
          after_facings: brandInfo.after.total_facings || 0,
          after_shelf_space: brandInfo.after.total_space,
          after_shelf_share: brandInfo.after.shelf_share,
          after_sales_share: brandInfo.after.sales_share,

          // Lifts
          sales_lift: salesLift,
          sales_lift_percent: salesLiftPercent,
          shelf_space_lift: shelfSpaceLift,
          shelf_space_lift_percent: shelfSpaceLiftPercent,
        });
      }
    });

    console.log(transformedData);

    return transformedData;
  }, [brandData, selectedBrands]);

  const columnDefs = [
    {
      headerName: "",
      marryChildren: true,
      children: [
        {
          headerName: "Brand",
          field: "brand",
          width: 200,
          sortable: true,
          cellStyle: { fontWeight: "bold", textAlign: "left" },
          cellClass: "group-sep-border-right",
        },
      ],
    },
    {
      headerName: "Before",
      marryChildren: true,

      children: [
        {
          field: "before_sales",
          headerName: "Sales Amount (£)",
          valueFormatter: (p) =>
            p.value ? `£ ${p.value.toFixed(1)}` : "£ 0.0",
          width: 120,
        },
        {
          field: "before_item_count",
          headerName: "Unique Item Count",
          width: 120,
        },
        { field: "before_facings", headerName: "Facings Count", width: 120 },
        {
          field: "before_shelf_space",
          headerName: "Shelf Space (cm)",
          valueFormatter: (p) => (p.value ? p.value.toFixed(1) : "0.0"),
          width: 120,
        },
        {
          field: "before_shelf_share",
          headerName: "Shelf Share",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 100,
        },
        {
          field: "before_sales_share",
          headerName: "Sales Share",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 100,
          cellClass: "group-sep-border-right",
        },
      ],
    },
    {
      headerName: "After",
      marryChildren: true,

      children: [
        {
          field: "after_sales",
          headerName: "Sales Amount (£)",
          valueFormatter: (p) =>
            p.value ? `£ ${p.value.toFixed(1)}` : "£ 0.0",
          width: 120,
        },
        {
          field: "after_item_count",
          headerName: "Unique Item Count",
          width: 120,
        },
        { field: "after_facings", headerName: "Facings Count", width: 120 },
        {
          field: "after_shelf_space",
          headerName: "Shelf Space (cm)",
          valueFormatter: (p) => (p.value ? p.value.toFixed(1) : "0.0"),
          width: 120,
        },
        {
          field: "after_shelf_share",
          headerName: "Shelf Share",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 100,
        },
        {
          field: "after_sales_share",
          headerName: "Sales Share",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 100,
          cellClass: "group-sep-border-right",
        },
      ],
    },
    {
      headerName: "Lift",
      marryChildren: true,
      headerClass: "ag-header-center",
      children: [
        {
          field: "shelf_space_lift",
          headerName: "Shelf Space Lift (cm)",
          valueFormatter: (p) => (p.value ? p.value.toFixed(1) : "0.0"),
          width: 120,
        },
        {
          field: "shelf_space_lift_percent",
          headerName: "Shelf Space Lift (%)",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 120,
        },
        {
          field: "sales_lift",
          headerName: "Sales Lift (£)",
          valueFormatter: (p) =>
            p.value ? `£ ${p.value.toFixed(1)}` : "£ 0.0",
          width: 120,
        },
        {
          field: "sales_lift_percent",
          headerName: "Sales Lift (%)",
          valueFormatter: (p) => (p.value ? `${p.value.toFixed(1)}%` : "0.0%"),
          width: 120,
        },
      ],
    },
  ];

  // Default column properties
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
    // cellClass: 'ag-cell-center-align'
    cellClass: "group-border-right",
  };

  if (!selectedBrands || selectedBrands.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Brands Selected</p>
          <p>Please select brands from the filter bar above to view data</p>
        </div>
      </div>
    );
  }

  if (rowData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No Data Available</p>
          <p>No data found for the selected brands</p>
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
            headerHeight={50}
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
            //   pagination={true}
            //   paginationPageSize={25}
            //   paginationPageSizeSelector={[10, 25, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
};

export default BrandSchematicView;

BrandSchematicView.propTypes = {
  brandData: PropTypes.any,
  selectedBrands: PropTypes.arrayOf(PropTypes.string),
};
