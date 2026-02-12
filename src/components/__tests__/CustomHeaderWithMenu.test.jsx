import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomHeaderWithMenu from "../CustomHeaderWithMenu";

jest.mock("../ColumnVisibilityMenu", () => {
  return jest.fn(({ open, onClose }) => {
    if (!open) return null;
    return (
      <div data-testid="column-visibility-menu">
        <button type="button" onClick={onClose}>
          Close Column Menu
        </button>
      </div>
    );
  });
});

// eslint-disable-next-line import/namespace
import ColumnVisibilityMenu from "../ColumnVisibilityMenu";

const createColumn = ({ hasFilter = false } = {}) => ({
  getColId: jest.fn(() => "test-col"),
  getColDef: jest.fn(() => (hasFilter ? { filter: true } : {})),
});

const buildProps = (overrides = {}) => {
  const column = overrides.column || createColumn({ hasFilter: true });
  return {
    displayName: "Sample Column",
    api: {
      showColumnMenuAfterButtonClick: jest.fn(),
      showColumnMenu: jest.fn(),
    },
    columnApi: {
      applyColumnState: jest.fn(),
    },
    gridApi: {
      setColumnVisible: jest.fn(),
    },
    columns: [
      { field: "first", headerName: "First" },
      { field: "second", headerName: "Second" },
    ],
    enableSorting: true,
    progressSort: jest.fn(),
    ...overrides,
    column,
  };
};

describe("CustomHeaderWithMenu", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders disabled header button when sorting is disabled", () => {
    const props = buildProps({ enableSorting: false });
    render(<CustomHeaderWithMenu {...props} />);

    const headerButton = screen.getByRole("button", {
      name: /sample column/i,
    });

    expect(headerButton).toBeDisabled();
    fireEvent.click(headerButton);
    expect(props.progressSort).not.toHaveBeenCalled();
  });

  it("invokes progressSort with correct modifier state", () => {
    const props = buildProps();
    render(<CustomHeaderWithMenu {...props} />);

    const headerButton = screen.getByRole("button", {
      name: /sample column/i,
    });

    fireEvent.click(headerButton);
    fireEvent.click(headerButton, { shiftKey: true });

    expect(props.progressSort).toHaveBeenNthCalledWith(1, false);
    expect(props.progressSort).toHaveBeenNthCalledWith(2, true);
  });

  it("falls back to columnApi.applyColumnState when progressSort is absent", () => {
    const columnApi = { applyColumnState: jest.fn() };
    const column = createColumn({ hasFilter: false });
    const props = buildProps({
      progressSort: undefined,
      columnApi,
      column,
    });

    render(<CustomHeaderWithMenu {...props} />);

    const headerButton = screen.getByRole("button", {
      name: /sample column/i,
    });
    fireEvent.click(headerButton);

    expect(columnApi.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: "test-col", sort: "asc" }],
      defaultState: { sort: null },
    });
  });

  it("opens filter menu and delegates to showColumnMenuAfterButtonClick when available", () => {
    const props = buildProps();
    render(<CustomHeaderWithMenu {...props} />);

    const optionsButton = screen.getByLabelText(/column options/i);
    fireEvent.click(optionsButton);

    const filterMenuItem = screen.getByRole("menuitem", { name: /filters/i });
    fireEvent.click(filterMenuItem);

    expect(props.api.showColumnMenuAfterButtonClick).toHaveBeenCalledWith(
      props.column,
      expect.any(HTMLElement)
    );
    expect(props.api.showColumnMenu).not.toHaveBeenCalled();
  });

  it("falls back to api.showColumnMenu when afterButtonClick helper is missing", () => {
    const props = buildProps({
      api: {
        showColumnMenuAfterButtonClick: undefined,
        showColumnMenu: jest.fn(),
      },
    });
    render(<CustomHeaderWithMenu {...props} />);

    fireEvent.click(screen.getByLabelText(/column options/i));
    fireEvent.click(screen.getByRole("menuitem", { name: /filters/i }));

    expect(props.api.showColumnMenu).toHaveBeenCalledWith(props.column);
  });

  it("opens column management menu and renders ColumnVisibilityMenu with expected props", async () => {
    const props = buildProps();
    render(<CustomHeaderWithMenu {...props} />);

    fireEvent.click(screen.getByLabelText(/column options/i));
    fireEvent.click(
      screen.getByRole("menuitem", { name: /column management/i })
    );

    const renderedMenu = screen.getByTestId("column-visibility-menu");
    expect(renderedMenu).toBeInTheDocument();

    const lastCall = ColumnVisibilityMenu.mock.calls.at(-1);
    expect(lastCall[0]).toMatchObject({
      open: true,
      columns: props.columns,
      gridApi: props.gridApi,
    });

    fireEvent.click(screen.getByText(/close column menu/i));
    await waitFor(() =>
      expect(
        screen.queryByTestId("column-visibility-menu")
      ).not.toBeInTheDocument()
    );
  });
});


