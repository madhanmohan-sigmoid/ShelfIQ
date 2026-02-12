import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useSelector } from "react-redux";
import {
  selectPlanogramProducts,
  selectPlanogramFilters,
} from "../redux/reducers/planogramVisualizerSlice";
import { useMemo, useRef, useCallback, useEffect } from "react";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import { filteredProducts as getFilteredProductsAll } from "../utils/filterUtils";
import MultiFilter from "./MultiFilter";
import CustomHeaderWithMenu from "./CustomHeaderWithMenu";
import PropTypes from "prop-types";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Factory that builds a named header component instance per column set
const createHeaderComponent = (allColumns) => {
  const SchematicHeaderComponent = (params) => (
    <CustomHeaderWithMenu {...params} columns={allColumns} gridApi={params.api} />
  );
  SchematicHeaderComponent.displayName = "SchematicHeaderComponent";
  return SchematicHeaderComponent;
};

function SchematicView({
  overrideFilters = null,
  isCompare = false,
  isOrangeTheme = false,
  coloredProducts = [],
  onGridReadyExternal,
  onBodyScrollExternal,
  onViewportReadyExternal,
}) {
  const gridRef = useRef();
  const containerRef = useRef(null);

  const rawProducts = useSelector(selectPlanogramProducts);
  const reduxFilters = useSelector(selectPlanogramFilters);

  // Use override filters if provided (for compare mode), otherwise use Redux filters
  const filters = overrideFilters === null ? reduxFilters : overrideFilters;

  const filteredProducts = useMemo(() => {
    return getFilteredProductsAll(rawProducts, filters);
  }, [rawProducts, filters]);

  const highlightedProductColors = useMemo(() => {
    if (!Array.isArray(coloredProducts) || coloredProducts.length === 0) {
      return new Map();
    }
    return coloredProducts.reduce((map, entry) => {
      if (entry?.product_id == null) {
        return map;
      }
      const key = String(entry.product_id);
      map.set(key, entry.brandColor || "#FFB000");
      return map;
    }, new Map());
  }, [coloredProducts]);

  const onGridReady = useCallback(
    (params) => {
      gridRef.current = params.api;
      if (onGridReadyExternal) {
        onGridReadyExternal(params.api);
      }
    },
    [onGridReadyExternal]
  );

  // Expose the AG Grid center viewport element to parent (for scroll sync)
  useEffect(() => {
    if (!onViewportReadyExternal || !containerRef.current) return;

    const viewport = containerRef.current.querySelector(
      ".ag-center-cols-viewport"
    );
    if (viewport) {
      onViewportReadyExternal(viewport);
    }
  }, [onViewportReadyExternal]);

  const products = useMemo(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      if ((a?.bay ?? 0) !== (b?.bay ?? 0)) {
        return (a?.bay ?? 0) - (b?.bay ?? 0);
      }
      if ((a?.shelf ?? 0) !== (b?.shelf ?? 0)) {
        return (a?.shelf ?? 0) - (b?.shelf ?? 0);
      }
      return (a?.position ?? 0) - (b?.position ?? 0);
    });

    const grouped = {};
    sorted.forEach((item) => {
      const bay = item?.bay ?? 0;
      const shelf = item?.shelf ?? 0;
      const key = `${bay}-${shelf}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    const transformed = [];
    Object.values(grouped).forEach((items) => {
      const groupItems = Array.isArray(items) ? items : [];
      groupItems.forEach((item, index) => {
        const details = item?.product_details ?? {};
        const kpis = item?.product_kpis ?? null;
        const productId =
          item?.product_id ??
          details?.product_id ??
          details?.productId ??
          null;

        transformed.push({
          name: details?.name,
          tpnb: details?.tpnb,
          position: index + 1,
          orientation: item?.orientation,
          linear: item?.linear / 10,
          shelfwidth: item?.shelfwidth,
          traywidth: details?.tray_width,
          trayheight: details?.tray_height,
          traydepth: details?.tray_depth,
          product_id: productId,
          facings_high: item?.facings_high,
          facings_wide: item?.facings_wide,
          bay: item?.bay,
          shelf: item?.shelf,
          brand: details?.brand_name,
          sub_category: details?.subCategory_name,

          ...(kpis && {
            status: kpis.flag,
            units_per_week: kpis.units_per_wk,
            sales_per_wk: kpis.sales_per_wk,
            total_space: kpis.total_space,
            DOS: kpis.DOS,
          }),
        });
      });
    });

    return transformed;
  }, [filteredProducts]);

  const baseColumns = useMemo(
    () => [
      {
        field: "tpnb",
        headerName: "TPNB",
        sortable: true,
        resizable: true,
        width: 120,
        filter: MultiFilter,
        pinned: "left",
      },
      {
        field: "name",
        headerName: "Name",
        sortable: true,
        resizable: true,
        width: 250,
        filter: MultiFilter,
        pinned: "left",
      },
      {
        field: "brand",
        headerName: "Brand",
        sortable: true,
        resizable: true,
        width: 200,
        filter: MultiFilter,
        pinned: isCompare ? undefined : "left",
      },
      {
        field: "sub_category",
        headerName: "Sub Category",
        sortable: true,
        resizable: true,
        width: 200,
        filter: MultiFilter,
        pinned: isCompare ? undefined : "left",
      },
      {
        field: "bay",
        headerName: "Bay",
        sortable: true,
        resizable: true,
        width: 40,
        filter: MultiFilter,
      },
      {
        field: "shelf",
        headerName: "Shelf",
        sortable: true,
        resizable: true,
        width: 40,
        filter: MultiFilter,
      },
      {
        field: "position",
        headerName: "Position",
        sortable: true,
        resizable: true,
        width: 100,
      },
      {
        field: "linear",
        headerName: "Linear (cm)",
        sortable: true,
        resizable: true,
        width: 120,
      },
      {
        field: "facings_high",
        headerName: "Facings High",
        sortable: true,
        resizable: true,
        width: 130,
      },
      {
        field: "facings_wide",
        headerName: "Facings Wide",
        sortable: true,
        resizable: true,
        width: 140,
      },
      {
        field: "traywidth",
        headerName: "Tray Width (cm)",
        sortable: true,
        resizable: true,
        width: 160,
      },
      {
        field: "trayheight",
        headerName: "Tray Height (cm)",
        sortable: true,
        resizable: true,
        width: 160,
      },
      {
        field: "traydepth",
        headerName: "Tray Depth (cm)",
        sortable: true,
        resizable: true,
        width: 160,
      },
      {
        field: "orientation",
        headerName: "Orientation",
        sortable: true,
        resizable: true,
        width: 130,
      },
      {
        field: "shelfwidth",
        headerName: "Shelf Width (cm)",
        sortable: true,
        resizable: true,
        width: 160,
      },
    ],
    [isCompare]
  );

  const kpiColumns = [
    { field: "status", headerName: "Status", sortable: true, width: 120 },
    {
      field: "units_per_week",
      headerName: "Units per Week",
      sortable: true,
      width: 160,
    },
    {
      field: "sales_per_wk",
      headerName: "Sales per Week",
      sortable: true,
      width: 160,
    },
    {
      field: "total_space",
      headerName: "Total Space",
      sortable: true,
      width: 120,
    },
    { field: "DOS", headerName: "DOS", sortable: true, width: 40 },
  ];

  const columnDefs = useMemo(() => {
    const hasKpis = products.some((p) => p.status !== undefined);

    let columns;
    if (!hasKpis) {
      columns = baseColumns;
    } else {
      const idx = baseColumns.findIndex((col) => col.field === "facings_wide");
      columns = [
        ...baseColumns.slice(0, idx + 1),
        ...kpiColumns,
        ...baseColumns.slice(idx + 1),
      ];
    }

    // In compare mode, strip all column filters; otherwise retain them
    columns = columns.map((col) =>
      isCompare ? { ...col, filter: undefined } : { ...col }
    );

    const originalColumns = [...columns];
    return columns.map(col => ({
      ...col,
      headerComponent: createHeaderComponent(originalColumns)
    }));
  }, [products, isCompare]);

  const getOrangeThemeRowStyle = useCallback(
    (params) => {
      if (!isOrangeTheme) return undefined;
      const d = params?.data;
      if (!d) return { backgroundColor: "#ffffff" };

      // Apply orange theme row styling similar to MyPlanogramTable
      if (d.version === "Original") {
        return {
          backgroundColor: "#FFF8F5",
          fontWeight: "500",
        };
      }

      if (d.__isParent) {
        return {
          backgroundColor: "#FFDDCA",
          fontWeight: "500",
        };
      }

      if (d.__isChild) {
        return {
          color: "#374151",
          backgroundColor: "#ffffff",
        };
      }

      return { backgroundColor: "#ffffff" };
    },
    [isOrangeTheme]
  );

  const shouldApplyRowStyle =
    isOrangeTheme || (isCompare && highlightedProductColors.size > 0);

  const getRowStyle = useCallback(
    (params) => {
      const baseStyle = getOrangeThemeRowStyle(params) || undefined;
      const data = params?.data;
      if (!data || !isCompare) return baseStyle;

      const highlightColor = highlightedProductColors.get(
        String(data.product_id ?? "")
      );

      if (!highlightColor) {
        return baseStyle;
      }

      return {
        ...(baseStyle || {}),
        boxShadow: `inset 0 0 0 2px ${highlightColor}`,
        borderRadius: "6px",
      };
    },
    [getOrangeThemeRowStyle, highlightedProductColors, isCompare]
  );

  return (
    <div ref={containerRef} className="w-full px-6 pb-6">
      <div
        className={`ag-theme-quartz h-[calc(93vh-150px)] rounded-xl border border-gray-200 shadow-lg overflow-hidden planogram-table ${
          isOrangeTheme ? "myplanogram-table" : ""
        }`}
      >
        <AgGridReact
          ref={gridRef}
          rowData={products}
          columnDefs={columnDefs}
          defaultColDef={{
            wrapHeaderText: true,
            autoHeaderHeight: true,
            resizable: true,
            sortable: true,
            suppressSizeToFit: true,
            minWidth: 100,
            headerClass: "ag-header-center-align",
            cellClass: "group-border-right",
          }}
          animateRows={true}
          headerHeight={48}
          suppressColumnVirtualisation={false}
          suppressRowVirtualisation={false}
          suppressHorizontalScroll={true}
          onGridReady={onGridReady}
          onBodyScroll={onBodyScrollExternal}
          getRowStyle={shouldApplyRowStyle ? getRowStyle : undefined}
        />
      </div>
    </div>
  );
}

export default SchematicView;

SchematicView.propTypes = {
  overrideFilters: PropTypes.object,
  isCompare: PropTypes.bool,
  isOrangeTheme: PropTypes.bool,
  coloredProducts: PropTypes.arrayOf(
    PropTypes.shape({
      product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      brandColor: PropTypes.string,
    })
  ),
  onGridReadyExternal: PropTypes.func,
  onBodyScrollExternal: PropTypes.func,
  onViewportReadyExternal: PropTypes.func,
};
