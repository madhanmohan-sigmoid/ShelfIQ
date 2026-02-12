import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ColumnVisibilityMenu from "../ColumnVisibilityMenu";

const baseColumns = [
  { field: "first", headerName: "First Column" },
  { field: "second", headerName: "Second Column" },
];

const anchorPosition = { top: 120, left: 60 };

const createGridApi = (visibleMap) => {
  const map = visibleMap || { first: true, second: false };
  return {
    getColumn: jest.fn((field) => ({
      isVisible: () => (field in map ? map[field] : true),
    })),
    setColumnVisible: jest.fn(),
  };
};

const renderMenu = (props = {}) => {
  const defaultProps = {
    anchorPosition,
    open: true,
    onClose: jest.fn(),
    columns: baseColumns,
    gridApi: createGridApi(),
  };

  return {
    ...render(<ColumnVisibilityMenu {...defaultProps} {...props} />),
    props: { ...defaultProps, ...props },
  };
};

describe("ColumnVisibilityMenu", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when menu is closed", () => {
    render(
      <ColumnVisibilityMenu
        anchorPosition={anchorPosition}
        open={false}
        onClose={jest.fn()}
        columns={baseColumns}
        gridApi={createGridApi()}
      />
    );

    expect(
      screen.queryByPlaceholderText(/search columns/i)
    ).not.toBeInTheDocument();
  });

  it("focuses the search input shortly after opening", () => {
    jest.useFakeTimers();
    renderMenu();

    const searchInput = screen.getByPlaceholderText(/search columns/i);
    act(() => {
      jest.runAllTimers();
    });

    expect(document.activeElement).toBe(searchInput);
    jest.useRealTimers();
  });

  it("filters the list of columns based on the search query", () => {
    renderMenu();

    const searchInput = screen.getByPlaceholderText(/search columns/i);
    fireEvent.change(searchInput, { target: { value: "second" } });

    expect(screen.getByText(/second column/i)).toBeInTheDocument();
    expect(screen.queryByText(/first column/i)).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "missing" } });
    expect(screen.getByText(/no columns found/i)).toBeInTheDocument();
  });

  it("toggles individual column visibility and calls gridApi", () => {
    const gridApi = createGridApi({ first: true, second: true });
    renderMenu({ gridApi });

    fireEvent.click(
      screen.getByRole("button", { name: /first column/i })
    );
    expect(gridApi.setColumnVisible).toHaveBeenCalledWith("first", false);
  });

  it("resets all columns to visible state", () => {
    const gridApi = createGridApi({ first: false, second: false });
    renderMenu({ gridApi });

    fireEvent.click(
      screen.getByRole("button", { name: /first column/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(gridApi.setColumnVisible).toHaveBeenCalledWith("first", true);
    expect(gridApi.setColumnVisible).toHaveBeenCalledWith("second", true);
  });

  it("invokes onClose when close button is clicked", () => {
    const onClose = jest.fn();
    renderMenu({ onClose });

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("invokes onClose when clicking outside the menu", () => {
    const onClose = jest.fn();
    renderMenu({ onClose });

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});


