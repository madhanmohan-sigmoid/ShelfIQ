import React from "react";
import { render, screen } from "@testing-library/react";
import BrandSchematicView from "../BrandSchematicView";

const mockGrid = jest.fn();

jest.mock("ag-grid-react", () => ({
  AgGridReact: (props) => {
    mockGrid(props);
    const { rowData, columnDefs } = props;
    return (
      <div data-testid="ag-grid">
        rows:{rowData?.length ?? 0} cols:{columnDefs?.length ?? 0}
      </div>
    );
  },
}));

const createBrandData = (brandMap, iterationOrder = Object.keys(brandMap)) => {
  const dataset = { categories: brandMap };
  Object.defineProperty(dataset, "forEach", {
    enumerable: false,
    value: (cb) => {
      for (const brand of iterationOrder) {
        cb(brand);
      }
    },
  });
  return dataset;
};

const metrics = {
  before: {
    sales: 10,
    unique_item_count: 1,
    total_facings: 1,
    total_space: 1,
    shelf_share: 1,
    sales_share: 1,
  },
  after: {
    sales: 15,
    unique_item_count: 2,
    total_facings: 2,
    total_space: 3,
    shelf_share: 1.5,
    sales_share: 1.2,
  },
};

describe("BrandSchematicView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Early return conditions", () => {
    it("renders a placeholder when no brands are selected (empty array)", () => {
      const brandData = createBrandData({});
      render(<BrandSchematicView brandData={brandData} selectedBrands={[]} />);

      expect(screen.getByText(/No Brands Selected/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select brands from the filter bar/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("renders a placeholder when selectedBrands is null", () => {
      const brandData = createBrandData({ BrandA: metrics });
      render(<BrandSchematicView brandData={brandData} selectedBrands={null} />);

      expect(screen.getByText(/No Brands Selected/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("renders a placeholder when selectedBrands is undefined", () => {
      const brandData = createBrandData({ BrandA: metrics });
      render(<BrandSchematicView brandData={brandData} selectedBrands={undefined} />);

      expect(screen.getByText(/No Brands Selected/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("returns empty array when brandData is null", () => {
      render(<BrandSchematicView brandData={null} selectedBrands={["BrandA"]} />);

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("returns empty array when brandData is undefined", () => {
      render(<BrandSchematicView brandData={undefined} selectedBrands={["BrandA"]} />);

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });
  });

  describe("No data scenarios", () => {
    it("shows a no data message when brand has only before data", () => {
      const brandData = createBrandData({
        BrandGhost: { before: metrics.before },
      });

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["BrandGhost"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(screen.getByText(/No data found for the selected brands/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("shows a no data message when brand has only after data", () => {
      const brandData = createBrandData({
        BrandGhost: { after: metrics.after },
      });

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["BrandGhost"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("shows a no data message when brand is not found in any category", () => {
      // Create brandData where the selected brand doesn't exist in any category
      const brandData = {
        Category1: { OtherBrand: metrics },
        Category2: { AnotherBrand: metrics },
      };
      Object.defineProperty(brandData, "forEach", {
        enumerable: false,
        value: (cb) => {
          for (const brand of ["NonExistentBrand"]) {
            cb(brand);
          }
        },
      });

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["NonExistentBrand"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });

    it("shows a no data message when brandData is empty object", () => {
      const brandData = createBrandData({});

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["BrandA"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(mockGrid).not.toHaveBeenCalled();
    });
  });

  describe("Data transformation and lift calculations", () => {
    it("transforms brand metrics into grid rows with lift calculations", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(screen.getByTestId("ag-grid")).toHaveTextContent("rows:1");
      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              brand: "BRANDA",
              before_sales: 10,
              after_sales: 15,
              sales_lift: 5,
              sales_lift_percent: 50,
              shelf_space_lift: 2,
              shelf_space_lift_percent: 200,
            }),
          ]),
        })
      );
    });

    it("handles division by zero for sales lift percent when before.sales is 0", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, sales: 0 },
          after: { ...metrics.after, sales: 10 },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              sales_lift: 10,
              sales_lift_percent: 0,
            }),
          ]),
        })
      );
    });

    it("handles division by zero for shelf space lift percent when before.total_space is 0", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, total_space: 0 },
          after: { ...metrics.after, total_space: 5 },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              shelf_space_lift: 5,
              shelf_space_lift_percent: 0,
            }),
          ]),
        })
      );
    });

    it("handles negative lift values correctly", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, sales: 20, total_space: 10 },
          after: { ...metrics.after, sales: 10, total_space: 5 },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              sales_lift: -10,
              sales_lift_percent: -50,
              shelf_space_lift: -5,
              shelf_space_lift_percent: -50,
            }),
          ]),
        })
      );
    });

    it("handles zero lift values correctly", () => {
      const brandData = createBrandData({
        BrandA: {
          before: metrics.before,
          after: { ...metrics.before },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              sales_lift: 0,
              sales_lift_percent: 0,
              shelf_space_lift: 0,
              shelf_space_lift_percent: 0,
            }),
          ]),
        })
      );
    });

    it("defaults total_facings to 0 when missing in before data", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, total_facings: undefined },
          after: metrics.after,
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              before_facings: 0,
            }),
          ]),
        })
      );
    });

    it("defaults total_facings to 0 when missing in after data", () => {
      const brandData = createBrandData({
        BrandA: {
          before: metrics.before,
          after: { ...metrics.after, total_facings: null },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              after_facings: 0,
            }),
          ]),
        })
      );
    });

    it("converts brand name to uppercase", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["branda"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              brand: "BRANDA",
            }),
          ]),
        })
      );
    });

    it("handles multiple brands selected", () => {
      const brandData = createBrandData({
        BrandA: metrics,
        BrandB: {
          before: { ...metrics.before, sales: 20 },
          after: { ...metrics.after, sales: 30 },
        },
      });

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["BrandA", "BrandB"]}
        />
      );

      expect(screen.getByTestId("ag-grid")).toHaveTextContent("rows:2");
      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({ brand: "BRANDA" }),
            expect.objectContaining({ brand: "BRANDB" }),
          ]),
        })
      );
    });

    it("finds brand in second category when not in first", () => {
      const brandData = {
        Category1: { OtherBrand: metrics },
        Category2: { BrandA: metrics },
      };
      Object.defineProperty(brandData, "forEach", {
        enumerable: false,
        value: (cb) => {
          for (const brand of ["BrandA"]) {
            cb(brand);
          }
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({ brand: "BRANDA" }),
          ]),
        })
      );
    });

    it("includes all before and after fields in transformed data", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      const rowData = mockGrid.mock.calls[0][0].rowData[0];
      expect(rowData).toHaveProperty("before_sales");
      expect(rowData).toHaveProperty("before_item_count");
      expect(rowData).toHaveProperty("before_facings");
      expect(rowData).toHaveProperty("before_shelf_space");
      expect(rowData).toHaveProperty("before_shelf_share");
      expect(rowData).toHaveProperty("before_sales_share");
      expect(rowData).toHaveProperty("after_sales");
      expect(rowData).toHaveProperty("after_item_count");
      expect(rowData).toHaveProperty("after_facings");
      expect(rowData).toHaveProperty("after_shelf_space");
      expect(rowData).toHaveProperty("after_shelf_share");
      expect(rowData).toHaveProperty("after_sales_share");
      expect(rowData).toHaveProperty("sales_lift");
      expect(rowData).toHaveProperty("sales_lift_percent");
      expect(rowData).toHaveProperty("shelf_space_lift");
      expect(rowData).toHaveProperty("shelf_space_lift_percent");
    });
  });

  describe("Grid configuration", () => {
    it("passes correct column definitions to AgGridReact", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          columnDefs: expect.arrayContaining([
            expect.objectContaining({
              headerName: "",
              marryChildren: true,
              children: expect.arrayContaining([
                expect.objectContaining({
                  headerName: "Brand",
                  field: "brand",
                }),
              ]),
            }),
            expect.objectContaining({
              headerName: "Before",
              marryChildren: true,
            }),
            expect.objectContaining({
              headerName: "After",
              marryChildren: true,
            }),
            expect.objectContaining({
              headerName: "Lift",
              marryChildren: true,
            }),
          ]),
        })
      );
    });

    it("passes correct defaultColDef to AgGridReact", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultColDef: expect.objectContaining({
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
            headerHeight: 60,
            suppressHorizontalScroll: false,
            cellStyle: expect.objectContaining({
              fontSize: "12px",
              textAlign: "center",
            }),
            cellClass: "group-border-right",
          }),
        })
      );
    });

    it("passes all required grid props to AgGridReact", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          animateRows: true,
          headerHeight: 50,
          suppressColumnVirtualisation: false,
          suppressRowVirtualisation: false,
          suppressHorizontalScroll: false,
          enableRangeSelection: true,
          enableCharts: true,
          suppressColumnMove: true,
          suppressDragLeaveHidesColumns: true,
          allowMoveColumns: false,
          suppressMenuHide: true,
          suppressSizeToFit: true,
          domLayout: "normal",
        })
      );
    });

    it("renders grid with ref attached", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      // Verify grid was rendered (ref is handled internally by React)
      expect(mockGrid).toHaveBeenCalled();
      expect(screen.getByTestId("ag-grid")).toBeInTheDocument();
    });
  });

  describe("ValueFormatter branches", () => {
    it("formats sales values correctly including null/undefined", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      const columnDefs = mockGrid.mock.calls[0][0].columnDefs;
      
      // Test before_sales formatter
      const beforeSalesCol = columnDefs[1].children.find(
        (col) => col.field === "before_sales"
      );
      expect(beforeSalesCol.valueFormatter({ value: 10.5 })).toBe("£ 10.5");
      expect(beforeSalesCol.valueFormatter({ value: null })).toBe("£ 0.0");
      expect(beforeSalesCol.valueFormatter({ value: undefined })).toBe("£ 0.0");
      expect(beforeSalesCol.valueFormatter({ value: 0 })).toBe("£ 0.0");

      // Test after_sales formatter
      const afterSalesCol = columnDefs[2].children.find(
        (col) => col.field === "after_sales"
      );
      expect(afterSalesCol.valueFormatter({ value: 15.75 })).toBe("£ 15.8");
      expect(afterSalesCol.valueFormatter({ value: null })).toBe("£ 0.0");
      expect(afterSalesCol.valueFormatter({ value: undefined })).toBe("£ 0.0");
    });

    it("formats shelf space values correctly including null/undefined", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      const columnDefs = mockGrid.mock.calls[0][0].columnDefs;
      
      // Test before_shelf_space formatter
      const beforeShelfSpaceCol = columnDefs[1].children.find(
        (col) => col.field === "before_shelf_space"
      );
      expect(beforeShelfSpaceCol.valueFormatter({ value: 10.5 })).toBe("10.5");
      expect(beforeShelfSpaceCol.valueFormatter({ value: null })).toBe("0.0");
      expect(beforeShelfSpaceCol.valueFormatter({ value: undefined })).toBe("0.0");
      expect(beforeShelfSpaceCol.valueFormatter({ value: 0 })).toBe("0.0");

      // Test after_shelf_space formatter
      const afterShelfSpaceCol = columnDefs[2].children.find(
        (col) => col.field === "after_shelf_space"
      );
      expect(afterShelfSpaceCol.valueFormatter({ value: 15.75 })).toBe("15.8");
      expect(afterShelfSpaceCol.valueFormatter({ value: null })).toBe("0.0");
    });

    it("formats share percentage values correctly including null/undefined", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      const columnDefs = mockGrid.mock.calls[0][0].columnDefs;
      
      // Test before_shelf_share formatter
      const beforeShelfShareCol = columnDefs[1].children.find(
        (col) => col.field === "before_shelf_share"
      );
      expect(beforeShelfShareCol.valueFormatter({ value: 10.5 })).toBe("10.5%");
      expect(beforeShelfShareCol.valueFormatter({ value: null })).toBe("0.0%");
      expect(beforeShelfShareCol.valueFormatter({ value: undefined })).toBe("0.0%");
      expect(beforeShelfShareCol.valueFormatter({ value: 0 })).toBe("0.0%");

      // Test after_shelf_share formatter
      const afterShelfShareCol = columnDefs[2].children.find(
        (col) => col.field === "after_shelf_share"
      );
      expect(afterShelfShareCol.valueFormatter({ value: 15.75 })).toBe("15.8%");
      expect(afterShelfShareCol.valueFormatter({ value: null })).toBe("0.0%");

      // Test before_sales_share formatter
      const beforeSalesShareCol = columnDefs[1].children.find(
        (col) => col.field === "before_sales_share"
      );
      expect(beforeSalesShareCol.valueFormatter({ value: 20.25 })).toBe("20.3%");
      expect(beforeSalesShareCol.valueFormatter({ value: null })).toBe("0.0%");

      // Test after_sales_share formatter
      const afterSalesShareCol = columnDefs[2].children.find(
        (col) => col.field === "after_sales_share"
      );
      expect(afterSalesShareCol.valueFormatter({ value: 25.5 })).toBe("25.5%");
      expect(afterSalesShareCol.valueFormatter({ value: null })).toBe("0.0%");
    });

    it("formats lift values correctly including null/undefined", () => {
      const brandData = createBrandData({
        BrandA: metrics,
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      const columnDefs = mockGrid.mock.calls[0][0].columnDefs;
      
      // Test shelf_space_lift formatter
      const shelfSpaceLiftCol = columnDefs[3].children.find(
        (col) => col.field === "shelf_space_lift"
      );
      expect(shelfSpaceLiftCol.valueFormatter({ value: 5.5 })).toBe("5.5");
      expect(shelfSpaceLiftCol.valueFormatter({ value: null })).toBe("0.0");
      expect(shelfSpaceLiftCol.valueFormatter({ value: undefined })).toBe("0.0");
      expect(shelfSpaceLiftCol.valueFormatter({ value: -2.5 })).toBe("-2.5");

      // Test shelf_space_lift_percent formatter
      const shelfSpaceLiftPercentCol = columnDefs[3].children.find(
        (col) => col.field === "shelf_space_lift_percent"
      );
      expect(shelfSpaceLiftPercentCol.valueFormatter({ value: 50.75 })).toBe("50.8%");
      expect(shelfSpaceLiftPercentCol.valueFormatter({ value: null })).toBe("0.0%");
      expect(shelfSpaceLiftPercentCol.valueFormatter({ value: -25.5 })).toBe("-25.5%");

      // Test sales_lift formatter
      const salesLiftCol = columnDefs[3].children.find(
        (col) => col.field === "sales_lift"
      );
      expect(salesLiftCol.valueFormatter({ value: 100.5 })).toBe("£ 100.5");
      expect(salesLiftCol.valueFormatter({ value: null })).toBe("£ 0.0");
      expect(salesLiftCol.valueFormatter({ value: -50.25 })).toBe("£ -50.3");

      // Test sales_lift_percent formatter
      const salesLiftPercentCol = columnDefs[3].children.find(
        (col) => col.field === "sales_lift_percent"
      );
      expect(salesLiftPercentCol.valueFormatter({ value: 75.25 })).toBe("75.3%");
      expect(salesLiftPercentCol.valueFormatter({ value: null })).toBe("0.0%");
      expect(salesLiftPercentCol.valueFormatter({ value: -30.5 })).toBe("-30.5%");
    });
  });

  describe("Edge cases", () => {
    it("handles very large numbers correctly", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, sales: 1000000, total_space: 50000 },
          after: { ...metrics.after, sales: 2000000, total_space: 100000 },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              sales_lift: 1000000,
              sales_lift_percent: 100,
              shelf_space_lift: 50000,
              shelf_space_lift_percent: 100,
            }),
          ]),
        })
      );
    });

    it("handles decimal values correctly", () => {
      const brandData = createBrandData({
        BrandA: {
          before: { ...metrics.before, sales: 10.5, total_space: 1.25 },
          after: { ...metrics.after, sales: 15.75, total_space: 2.5 },
        },
      });

      render(
        <BrandSchematicView brandData={brandData} selectedBrands={["BrandA"]} />
      );

      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({
              sales_lift: 5.25,
              sales_lift_percent: 50,
              shelf_space_lift: 1.25,
              shelf_space_lift_percent: 100,
            }),
          ]),
        })
      );
    });

    it("filters out brands without both before and after data", () => {
      const brandData = createBrandData({
        BrandA: metrics,
        BrandB: { before: metrics.before },
        BrandC: { after: metrics.after },
        BrandD: metrics,
      });

      render(
        <BrandSchematicView
          brandData={brandData}
          selectedBrands={["BrandA", "BrandB", "BrandC", "BrandD"]}
        />
      );

      expect(screen.getByTestId("ag-grid")).toHaveTextContent("rows:2");
      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: expect.arrayContaining([
            expect.objectContaining({ brand: "BRANDA" }),
            expect.objectContaining({ brand: "BRANDD" }),
          ]),
        })
      );
    });
  });
});
