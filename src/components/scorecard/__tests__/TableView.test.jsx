import React from "react";
import { render, screen } from "@testing-library/react";
import TableView from "../TableView";
import { useSelector } from "react-redux";

const mockGrid = jest.fn();

jest.mock("ag-grid-react", () => ({
  AgGridReact: (props) => {
    mockGrid(props);
    return (
      <div>
        <div data-testid="col-count">{props.columnDefs.length}</div>
        <div data-testid="row-count">{props.rowData.length}</div>
        {props.columnDefs.map((col) => (
          <span key={col.headerName}>{col.headerName}</span>
        ))}
      </div>
    );
  },
}));

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

let mockState;

describe("TableView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      scorecardData: {
        filteredScorecardData: [
          {
            subcategory: "Hair",
            brand: "BrandA",
            before_sales: 10,
            after_sales: 12,
            before_item_count: 1,
            after_item_count: 2,
            before_facings: 1,
            after_facings: 2,
            before_shelf_space: 10,
            after_shelf_space: 12,
            before_shelf_share: 5,
            after_shelf_share: 6,
            before_sales_share: 5,
            after_sales_share: 6,
            sales_lift: 2,
            sales_lift_percent: 10,
            shelf_space_lift: 2,
            shelf_space_lift_percent: 10,
          },
        ],
        selectedTab: "brand",
      },
    };
    useSelector.mockImplementation((selector) => selector(mockState));
  });

  it("renders table columns based on the active tab", () => {
    render(<TableView />);

    expect(screen.getByText(/Sub-Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Brand/i)).toBeInTheDocument();
    expect(screen.getByTestId("row-count")).toHaveTextContent("1");
  });

  it("omits the brand column when not on the brand tab", () => {
    mockState.scorecardData.selectedTab = "subcategory";
    render(<TableView />);

    expect(screen.queryByText(/^Brand$/i)).not.toBeInTheDocument();
  });

  it("provides value formatters for percentage-based columns", () => {
    render(<TableView />);

    const gridProps = mockGrid.mock.calls[0][0];
    const beforeGroup = gridProps.columnDefs.find(
      (col) => col.headerName === "Before"
    );
    const percentColumn = beforeGroup.children.find((col) =>
      col.headerName.includes("Shelf Share %")
    );

    expect(percentColumn.valueFormatter({ value: 12.3456 })).toBe("12.35%");
  });
});
