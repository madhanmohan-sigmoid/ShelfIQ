import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SubcategorySchematicView from "../SubcategorySchematicView";

const mockGrid = jest.fn();
const mockSetGridError = jest.fn();

jest.mock("ag-grid-react", () => ({
  // eslint-disable-next-line react/prop-types
  AgGridReact: (props) => {
    mockGrid(props);
    // eslint-disable-next-line react/prop-types
    const { rowData, columnDefs, onGridError, onGridReady } = props;
    return (
      <div data-testid="ag-grid">
        rows:{rowData?.length ?? 0} cols:{columnDefs?.length ?? 0}
        <button
          data-testid="trigger-grid-error"
          onClick={() => onGridError?.({ message: "Grid error" })}
        >
          Trigger Error
        </button>
        <button data-testid="trigger-grid-ready" onClick={() => onGridReady?.()}>
          Trigger Ready
        </button>
      </div>
    );
  },
}));

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

const makeSubcategoryData = () => ({
  Hair: {
    before: {
      avg_sales: 10,
      avg_unique_item_count: 1,
      avg_facing_count: 1,
      avg_shelf_space: 1,
      avg_shelf_share: 1,
      avg_sales_share: 1,
    },
    after: {
      avg_sales: 15,
      avg_unique_item_count: 2,
      avg_facing_count: 2,
      avg_shelf_space: 3,
      avg_shelf_share: 2,
      avg_sales_share: 0.5,
    },
  },
});

describe("SubcategorySchematicView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Empty States", () => {
    it("shows an empty state when no subcategories are selected", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{}}
          selectedSubcategories={[]}
        />
      );

      expect(
        screen.getByText(/No Subcategories Selected/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Please select subcategories from the filter bar above to view data/i
        )
      ).toBeInTheDocument();
    });

    it("shows an empty state when selectedSubcategories is null", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{}}
          selectedSubcategories={null}
        />
      );

      expect(
        screen.getByText(/No Subcategories Selected/i)
      ).toBeInTheDocument();
    });

    it("shows an empty state when selectedSubcategories is undefined", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{}}
          selectedSubcategories={undefined}
        />
      );

      expect(
        screen.getByText(/No Subcategories Selected/i)
      ).toBeInTheDocument();
    });

    it("shows 'No Data Available' when subcategories are selected but no data exists", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{}}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
      expect(
        screen.getByText(/No data found for the selected subcategories/i)
      ).toBeInTheDocument();
    });

    it("shows 'No Data Available' when subcategory data exists but missing before/after", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{
            Hair: {
              before: null,
              after: null,
            },
          }}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });

    it("shows 'No Data Available' when subcategory data exists but missing before", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{
            Hair: {
              after: {
                avg_sales: 15,
                avg_unique_item_count: 2,
                avg_facing_count: 2,
                avg_shelf_space: 3,
                avg_shelf_share: 2,
                avg_sales_share: 0.5,
              },
            },
          }}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });

    it("shows 'No Data Available' when subcategory data exists but missing after", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={{
            Hair: {
              before: {
                avg_sales: 10,
                avg_unique_item_count: 1,
                avg_facing_count: 1,
                avg_shelf_space: 1,
                avg_shelf_share: 1,
                avg_sales_share: 1,
              },
            },
          }}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });
  });

  describe("Data Transformation", () => {
    it("transforms subcategory metrics, including lift values", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByTestId("ag-grid")).toHaveTextContent("rows:1");
      expect(mockGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          rowData: [
            expect.objectContaining({
              subcategory: "HAIR",
              before_sales: 10,
              before_item_count: 1,
              before_facings: 1,
              before_shelf_space: 1,
              before_shelf_share: 1,
              before_sales_share: 1,
              after_sales: 15,
              after_item_count: 2,
              after_facings: 2,
              after_shelf_space: 3,
              after_shelf_share: 2,
              after_sales_share: 0.5,
              sales_lift: 5,
              sales_lift_percent: 50,
              shelf_space_lift: 2,
              shelf_space_lift_percent: 200,
            }),
          ],
        })
      );
    });

    it("converts subcategory names to uppercase", () => {
      const data = {
        ...makeSubcategoryData(),
        Skin: {
          before: {
            avg_sales: 20,
            avg_unique_item_count: 3,
            avg_facing_count: 3,
            avg_shelf_space: 5,
            avg_shelf_share: 0.5,
            avg_sales_share: 0.5,
          },
          after: {
            avg_sales: 30,
            avg_unique_item_count: 4,
            avg_facing_count: 4,
            avg_shelf_space: 7,
            avg_shelf_share: 0.6,
            avg_sales_share: 0.6,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["Hair", "Skin"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData).toHaveLength(2);
      expect(callArgs.rowData[0].subcategory).toBe("HAIR");
      expect(callArgs.rowData[1].subcategory).toBe("SKIN");
    });

    it("handles multiple subcategories", () => {
      const data = {
        ...makeSubcategoryData(),
        Skin: {
          before: {
            avg_sales: 20,
            avg_unique_item_count: 3,
            avg_facing_count: 3,
            avg_shelf_space: 5,
            avg_shelf_share: 0.5,
            avg_sales_share: 0.5,
          },
          after: {
            avg_sales: 30,
            avg_unique_item_count: 4,
            avg_facing_count: 4,
            avg_shelf_space: 7,
            avg_shelf_share: 0.6,
            avg_sales_share: 0.6,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["Hair", "Skin"]}
        />
      );

      expect(screen.getByTestId("ag-grid")).toHaveTextContent("rows:2");
      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData).toHaveLength(2);
      expect(callArgs.rowData[0].subcategory).toBe("HAIR");
      expect(callArgs.rowData[1].subcategory).toBe("SKIN");
    });

    it("skips subcategories that don't exist in data", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair", "NonExistent"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData).toHaveLength(1);
      expect(callArgs.rowData[0].subcategory).toBe("HAIR");
    });

    it("handles zero values correctly", () => {
      const data = {
        ZeroTest: {
          before: {
            avg_sales: 0,
            avg_unique_item_count: 0,
            avg_facing_count: 0,
            avg_shelf_space: 0,
            avg_shelf_share: 0,
            avg_sales_share: 0,
          },
          after: {
            avg_sales: 0,
            avg_unique_item_count: 0,
            avg_facing_count: 0,
            avg_shelf_space: 0,
            avg_shelf_share: 0,
            avg_sales_share: 0,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["ZeroTest"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0]).toMatchObject({
        subcategory: "ZEROTEST",
        before_sales: 0,
        after_sales: 0,
        sales_lift: 0,
        sales_lift_percent: 0,
        shelf_space_lift: 0,
        shelf_space_lift_percent: 0,
      });
    });

    it("handles negative lift values", () => {
      const data = {
        NegativeLift: {
          before: {
            avg_sales: 20,
            avg_unique_item_count: 5,
            avg_facing_count: 5,
            avg_shelf_space: 10,
            avg_shelf_share: 0.5,
            avg_sales_share: 0.5,
          },
          after: {
            avg_sales: 10,
            avg_unique_item_count: 3,
            avg_facing_count: 3,
            avg_shelf_space: 5,
            avg_shelf_share: 0.3,
            avg_sales_share: 0.3,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["NegativeLift"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0]).toMatchObject({
        sales_lift: -10,
        sales_lift_percent: -50,
        shelf_space_lift: -5,
        shelf_space_lift_percent: -50,
      });
    });

    it("handles missing avg_facing_count by defaulting to 0", () => {
      const data = {
        NoFacings: {
          before: {
            avg_sales: 10,
            avg_unique_item_count: 1,
            avg_shelf_space: 1,
            avg_shelf_share: 1,
            avg_sales_share: 1,
          },
          after: {
            avg_sales: 15,
            avg_unique_item_count: 2,
            avg_shelf_space: 3,
            avg_shelf_share: 2,
            avg_sales_share: 0.5,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["NoFacings"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0].before_facings).toBe(0);
      expect(callArgs.rowData[0].after_facings).toBe(0);
    });

    it("handles zero division when before sales is zero", () => {
      const data = {
        ZeroBefore: {
          before: {
            avg_sales: 0,
            avg_unique_item_count: 1,
            avg_facing_count: 1,
            avg_shelf_space: 0,
            avg_shelf_share: 0,
            avg_sales_share: 0,
          },
          after: {
            avg_sales: 10,
            avg_unique_item_count: 2,
            avg_facing_count: 2,
            avg_shelf_space: 5,
            avg_shelf_share: 0.5,
            avg_sales_share: 0.5,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["ZeroBefore"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0].sales_lift_percent).toBe(0);
      expect(callArgs.rowData[0].shelf_space_lift_percent).toBe(0);
    });

    it("handles decimal values correctly", () => {
      const data = {
        Decimals: {
          before: {
            avg_sales: 10.123,
            avg_unique_item_count: 1,
            avg_facing_count: 1,
            avg_shelf_space: 1.456,
            avg_shelf_share: 0.123,
            avg_sales_share: 0.456,
          },
          after: {
            avg_sales: 15.789,
            avg_unique_item_count: 2,
            avg_facing_count: 2,
            avg_shelf_space: 3.789,
            avg_shelf_share: 0.234,
            avg_sales_share: 0.567,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["Decimals"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0].before_sales).toBe(10.123);
      expect(callArgs.rowData[0].after_sales).toBe(15.789);
      expect(callArgs.rowData[0].sales_lift).toBeCloseTo(5.666);
    });
  });

  describe("Grid Configuration", () => {
    it("passes correct column definitions to grid", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.columnDefs).toBeDefined();
      expect(Array.isArray(callArgs.columnDefs)).toBe(true);
      expect(callArgs.columnDefs.length).toBe(4); // Empty header, Before, After, Lift
    });

    it("includes valueFormatter functions in column definitions", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      const columnDefs = callArgs.columnDefs;

      // Check Before section columns
      const beforeSection = columnDefs.find((col) => col.headerName === "Before");
      expect(beforeSection).toBeDefined();
      expect(beforeSection.children).toBeDefined();

      const beforeSalesCol = beforeSection.children.find(
        (col) => col.field === "before_sales"
      );
      expect(beforeSalesCol.valueFormatter).toBeDefined();
      expect(typeof beforeSalesCol.valueFormatter).toBe("function");
      expect(beforeSalesCol.valueFormatter({ value: 10.5 })).toBe("£ 10.5");
      expect(beforeSalesCol.valueFormatter({ value: null })).toBe("£ 0.0");
      expect(beforeSalesCol.valueFormatter({ value: 0 })).toBe("£ 0.0");

      const beforeShelfSpaceCol = beforeSection.children.find(
        (col) => col.field === "before_shelf_space"
      );
      expect(beforeShelfSpaceCol.valueFormatter).toBeDefined();
      expect(beforeShelfSpaceCol.valueFormatter({ value: 5.5 })).toBe("5.5");
      expect(beforeShelfSpaceCol.valueFormatter({ value: null })).toBe("0.0");

      const beforeShelfShareCol = beforeSection.children.find(
        (col) => col.field === "before_shelf_share"
      );
      expect(beforeShelfShareCol.valueFormatter).toBeDefined();
      expect(beforeShelfShareCol.valueFormatter({ value: 0.5 })).toBe("0.5%");
      expect(beforeShelfShareCol.valueFormatter({ value: null })).toBe("0.0%");

      const beforeSalesShareCol = beforeSection.children.find(
        (col) => col.field === "before_sales_share"
      );
      expect(beforeSalesShareCol.valueFormatter).toBeDefined();
      expect(beforeSalesShareCol.valueFormatter({ value: 0.8 })).toBe("0.8%");
      expect(beforeSalesShareCol.valueFormatter({ value: null })).toBe("0.0%");
      expect(beforeSalesShareCol.valueFormatter({ value: 0 })).toBe("0.0%");

      // Check After section columns
      const afterSection = columnDefs.find((col) => col.headerName === "After");
      expect(afterSection).toBeDefined();
      const afterSalesCol = afterSection.children.find(
        (col) => col.field === "after_sales"
      );
      expect(afterSalesCol.valueFormatter).toBeDefined();
      expect(afterSalesCol.valueFormatter({ value: 15.5 })).toBe("£ 15.5");
      expect(afterSalesCol.valueFormatter({ value: null })).toBe("£ 0.0");
      expect(afterSalesCol.valueFormatter({ value: 0 })).toBe("£ 0.0");

      const afterShelfSpaceCol = afterSection.children.find(
        (col) => col.field === "after_shelf_space"
      );
      expect(afterShelfSpaceCol.valueFormatter).toBeDefined();
      expect(afterShelfSpaceCol.valueFormatter({ value: 7.5 })).toBe("7.5");
      expect(afterShelfSpaceCol.valueFormatter({ value: null })).toBe("0.0");

      const afterShelfShareCol = afterSection.children.find(
        (col) => col.field === "after_shelf_share"
      );
      expect(afterShelfShareCol.valueFormatter).toBeDefined();
      expect(afterShelfShareCol.valueFormatter({ value: 0.6 })).toBe("0.6%");
      expect(afterShelfShareCol.valueFormatter({ value: null })).toBe("0.0%");

      const afterSalesShareCol = afterSection.children.find(
        (col) => col.field === "after_sales_share"
      );
      expect(afterSalesShareCol.valueFormatter).toBeDefined();
      expect(afterSalesShareCol.valueFormatter({ value: 0.7 })).toBe("0.7%");
      expect(afterSalesShareCol.valueFormatter({ value: null })).toBe("0.0%");

      // Check Lift section columns
      const liftSection = columnDefs.find((col) => col.headerName === "Lift");
      expect(liftSection).toBeDefined();

      const shelfSpaceLiftCol = liftSection.children.find(
        (col) => col.field === "shelf_space_lift"
      );
      expect(shelfSpaceLiftCol.valueFormatter).toBeDefined();
      expect(shelfSpaceLiftCol.valueFormatter({ value: 2.5 })).toBe("2.5");
      expect(shelfSpaceLiftCol.valueFormatter({ value: null })).toBe("0.0");

      const shelfSpaceLiftPercentCol = liftSection.children.find(
        (col) => col.field === "shelf_space_lift_percent"
      );
      expect(shelfSpaceLiftPercentCol.valueFormatter).toBeDefined();
      expect(shelfSpaceLiftPercentCol.valueFormatter({ value: 50 })).toBe(
        "50.0%"
      );
      expect(shelfSpaceLiftPercentCol.valueFormatter({ value: null })).toBe(
        "0.0%"
      );

      const salesLiftCol = liftSection.children.find(
        (col) => col.field === "sales_lift"
      );
      expect(salesLiftCol.valueFormatter).toBeDefined();
      expect(salesLiftCol.valueFormatter({ value: 5.5 })).toBe("£ 5.5");
      expect(salesLiftCol.valueFormatter({ value: null })).toBe("£ 0");
      expect(salesLiftCol.valueFormatter({ value: undefined })).toBe("£ 0");

      const salesLiftPercentCol = liftSection.children.find(
        (col) => col.field === "sales_lift_percent"
      );
      expect(salesLiftPercentCol.valueFormatter).toBeDefined();
      expect(salesLiftPercentCol.valueFormatter({ value: 25.5 })).toBe(
        "25.5%"
      );
      expect(salesLiftPercentCol.valueFormatter({ value: null })).toBe("0.0%");
    });

    it("passes correct default column definition to grid", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.defaultColDef).toMatchObject({
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
        headerHeight: 60,
        suppressHorizontalScroll: false,
      });
    });

    it("passes correct grid props", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.animateRows).toBe(true);
      expect(callArgs.headerHeight).toBe(60);
      expect(callArgs.suppressColumnVirtualisation).toBe(false);
      expect(callArgs.suppressRowVirtualisation).toBe(false);
      expect(callArgs.suppressHorizontalScroll).toBe(false);
      expect(callArgs.enableRangeSelection).toBe(true);
      expect(callArgs.enableCharts).toBe(true);
      expect(callArgs.suppressColumnMove).toBe(true);
      expect(callArgs.suppressDragLeaveHidesColumns).toBe(true);
      expect(callArgs.allowMoveColumns).toBe(false);
      expect(callArgs.suppressMenuHide).toBe(true);
      expect(callArgs.suppressSizeToFit).toBe(true);
      expect(callArgs.domLayout).toBe("normal");
    });

    it("calls onGridReady callback", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const readyButton = screen.getByTestId("trigger-grid-ready");
      fireEvent.click(readyButton);

      // Should not throw, callback should be defined
      expect(mockGrid).toHaveBeenCalled();
    });
  });

  describe("Grid Error Handling", () => {
    it("renders fallback table when grid error occurs", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const errorButton = screen.getByTestId("trigger-grid-error");
      fireEvent.click(errorButton);

      // Should show fallback table - use getAllByText since "Subcategory" appears multiple times
      expect(screen.getAllByText("Subcategory").length).toBeGreaterThan(0);
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
      expect(screen.getByText("Lift")).toBeInTheDocument();

      // Check table headers - use getAllByText for headers that appear multiple times
      expect(screen.getAllByText("Sales (£)").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Items").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Facings").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Shelf Space (cm)").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Shelf Share").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Sales Share").length).toBeGreaterThan(0);
      expect(screen.getByText("Shelf Space Lift (cm)")).toBeInTheDocument();
      expect(screen.getByText("Shelf Space Lift (%)")).toBeInTheDocument();
      expect(screen.getByText("Sales Lift (£)")).toBeInTheDocument();
      expect(screen.getByText("Sales Lift (%)")).toBeInTheDocument();
    });

    it("displays correct data in fallback table", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const errorButton = screen.getByTestId("trigger-grid-error");
      fireEvent.click(errorButton);

      // Check that data is rendered in table
      expect(screen.getByText("HAIR")).toBeInTheDocument();
      // Check for formatted values in table cells
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    it("handles multiple rows in fallback table", () => {
      const data = {
        ...makeSubcategoryData(),
        Skin: {
          before: {
            avg_sales: 20,
            avg_unique_item_count: 3,
            avg_facing_count: 3,
            avg_shelf_space: 5,
            avg_shelf_share: 0.5,
            avg_sales_share: 0.5,
          },
          after: {
            avg_sales: 30,
            avg_unique_item_count: 4,
            avg_facing_count: 4,
            avg_shelf_space: 7,
            avg_shelf_share: 0.6,
            avg_sales_share: 0.6,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["Hair", "Skin"]}
        />
      );

      const errorButton = screen.getByTestId("trigger-grid-error");
      fireEvent.click(errorButton);

      // Both subcategories should be in the table
      expect(screen.getByText("HAIR")).toBeInTheDocument();
      expect(screen.getByText("SKIN")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles null subcategoryData", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={null}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });

    it("handles undefined subcategoryData", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={undefined}
          selectedSubcategories={["Hair"]}
        />
      );

      expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });

    it("handles empty string subcategory names", () => {
      render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["", "Hair"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      // Should only process valid subcategories
      expect(callArgs.rowData.length).toBeGreaterThanOrEqual(1);
    });

    it("handles very large numbers", () => {
      const data = {
        LargeNumbers: {
          before: {
            avg_sales: 999999999.99,
            avg_unique_item_count: 1000,
            avg_facing_count: 500,
            avg_shelf_space: 10000.5,
            avg_shelf_share: 0.9,
            avg_sales_share: 0.9,
          },
          after: {
            avg_sales: 1999999999.99,
            avg_unique_item_count: 2000,
            avg_facing_count: 1000,
            avg_shelf_space: 20000.5,
            avg_shelf_share: 0.95,
            avg_sales_share: 0.95,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["LargeNumbers"]}
        />
      );

      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData[0].before_sales).toBe(999999999.99);
      expect(callArgs.rowData[0].after_sales).toBe(1999999999.99);
      expect(callArgs.rowData[0].sales_lift).toBe(1000000000);
    });

    it("handles subcategory with only partial before data", () => {
      const data = {
        PartialBefore: {
          before: {
            avg_sales: 10,
            // Missing other fields
          },
          after: {
            avg_sales: 15,
            avg_unique_item_count: 2,
            avg_facing_count: 2,
            avg_shelf_space: 3,
            avg_shelf_share: 2,
            avg_sales_share: 0.5,
          },
        },
      };

      render(
        <SubcategorySchematicView
          subcategoryData={data}
          selectedSubcategories={["PartialBefore"]}
        />
      );

      // Should still process if before and after exist (even if incomplete)
      const callArgs = mockGrid.mock.calls[0][0];
      expect(callArgs.rowData.length).toBe(1);
      expect(callArgs.rowData[0].before_sales).toBe(10);
    });
  });

  describe("Component Structure", () => {
    it("renders grid container with correct classes", () => {
      const { container } = render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const gridContainer = container.querySelector(".ag-theme-quartz");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass("w-full", "rounded-xl", "border");
    });

    it("renders wrapper div with correct classes", () => {
      const { container } = render(
        <SubcategorySchematicView
          subcategoryData={makeSubcategoryData()}
          selectedSubcategories={["Hair"]}
        />
      );

      const wrapper = container.querySelector(".w-full.px-6.pb-6");
      expect(wrapper).toBeInTheDocument();
    });
  });
});
