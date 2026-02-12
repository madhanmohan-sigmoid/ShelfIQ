import React, { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import { getFallbackImage } from '../utils/productUtils';
import MultiFilter from './MultiFilter';
import PropTypes from 'prop-types';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const ProductLibraryTable = ({ products, onProductClick, onEditClick }) => {
    const gridRef = useRef();

    const formatPrice = (price) => {
        return `£${Number((price || 0) / 100).toFixed(2)}`;
    };

    const formatDimension = (value) => {
        return value ? `${value}mm` : '-';
    };

    // Use products directly as rowData since we're using original field names
    const rowData = useMemo(() => products, [products]);

    // Base columns definition matching SchematicView pattern
    const baseColumns = useMemo(() => [
        {
            field: 'tpnb',
            headerName: 'TPNB',
            width: 120,
            pinned: 'left',
        },
        {
            field: 'name',
            headerName: 'Name',
            width: 490,
        },
        {
            field: 'brand_name',
            headerName: 'Brand',
            width: 200,
        },
        {
            field: 'subCategory_name',
            headerName: 'Sub Category',
            width: 240,
        },
        // {
        //     field: 'units_per_week',
        //     headerName: 'Units per Week',
        //     width: 180,
        // },
        // {
        //     field: 'sales_per_wk',
        //     headerName: 'Sales per Week',
        //     width: 180,
        // },
        {
            field: 'PROMOITEM',
            headerName: 'Promo Item',
            width: 150,
            cellRenderer: (params) => {
                if (params.value === null || params.value === undefined) return '-';
                return params.value === true ? 'true' : 'false';
            },
        },
        {
            field: 'NPD',
            headerName: 'NPD',
            width: 80,
            cellRenderer: (params) => {
                if (params.value === null || params.value === undefined) return '-';
                return params.value === true ? 'true' : 'false';
            },
        },
        {
            field: 'BENCHMARK',
            headerName: 'Benchmark',
            width: 150,
            cellRenderer: (params) => {
                if (params.value === null || params.value === undefined) return '-';
                return params.value === true ? 'true' : 'false';
            },
        },
        {
            field: 'INTENSITY',
            headerName: 'Intensity',
            width: 120,
        },
        {
            field: 'PLATFORM',
            headerName: 'Platform',
            width: 120,
        },
        // {
        //     field: 'total_space',
        //     headerName: 'Total Space',
        //     width: 150,
        // },
        {
            field: 'tray_width',
            headerName: 'Tray Width(cm)',
            width: 180,
            valueFormatter: (params) => params.value || '-',
        },
        {
            field: 'tray_height',
            headerName: 'Tray Height(cm)',
            width: 180,
            valueFormatter: (params) => params.value || '-',
        },
        {
            field: 'tray_depth',
            headerName: 'Tray Depth(cm)',
            width: 180,
            valueFormatter: (params) => params.value || '-',
        },
    ], [onProductClick, onEditClick]);

    // Default column definition matching SchematicView pattern
    const defaultColDef = useMemo(() => ({
        wrapHeaderText: true,
        autoHeaderHeight: true,
        resizable: true,
        sortable: true,
        filter: 'MultiFilter',
        suppressSizeToFit: true,
        minWidth: 100,
        // flex: 1.5,
        headerClass: "ag-header-custom",
        cellClass: 'group-border-right'
    }), []);

    // Custom filter components
    const components = useMemo(() => ({
        MultiFilter: MultiFilter,
    }), []);

    const onRowClicked = (event) => {
        onProductClick(event.data);
    };

    return (
        <div
            className="ag-theme-quartz"
            style={{
                height: '70vh',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={baseColumns}
                defaultColDef={defaultColDef}
                components={components}
                // onRowClicked={onRowClicked}
                rowSelection="single"
                pagination={false}
                domLayout="normal"
                suppressRowClickSelection={false}
                suppressCellFocus={true}
                suppressRowHoverHighlight={false}
                suppressColumnVirtualisation={false}
                suppressRowVirtualisation={false}
                suppressHorizontalScroll={true}
                animateRows={true}
                headerHeight={48}
                rowBuffer={10}
                rowModelType="clientSide"
                getRowStyle={(params) => {
                    if (params.node.isSelected()) {
                        return { backgroundColor: '#FF9F9F' }; 
                    }
                    return params.node.rowIndex % 2 === 0
                        ? { backgroundColor: '#fafafa' }
                        : { backgroundColor: '#ffffff' };
                }}
            />
        </div>
    );
};

export default ProductLibraryTable;

ProductLibraryTable.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
  onProductClick: PropTypes.func,
  onEditClick: PropTypes.func,
};
