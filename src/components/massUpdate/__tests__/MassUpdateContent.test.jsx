import React from "react";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import MassUpdateContent from "../MassUpdateContent";
import { renderWithProviders } from "../../../screens/__tests__/testUtils";
import { runMassUpdate } from "../../../api/api";

jest.mock("../../../api/api", () => ({
  runMassUpdate: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockResetAllFilters = jest.fn();

const searchBarProps = {};
const planogramTableProps = {};
const modeModalProps = {};
const confirmModalProps = {};
const statusModalProps = {};
const activityDrawerProps = {};

jest.mock("../../dashboard/SearchBar", () => {
  const MockSearchBar = (props) => {
    Object.assign(searchBarProps, props);
    return (
      <div data-testid="search-bar">
        <button
          data-testid="search-bar-reset"
          onClick={() => props.onResetFilters?.()}
        >
          Reset
        </button>
        <button
          data-testid="search-bar-activity"
          onClick={() => props.onActivityLog?.()}
        >
          Activity
        </button>
        <button
          data-testid="search-bar-apply-mass-update"
          onClick={() => props.onApplyMassUpdate?.()}
        >
          Apply Mass Update
        </button>
      </div>
    );
  };
  return MockSearchBar;
});

jest.mock("../../dashboard/PlanogramTable", () => {
  const React = require("react");
  const MockPlanogramTable = React.forwardRef((props, ref) => {
    planogramTableProps[props.variant || "default"] = props;
    React.useImperativeHandle(ref, () => ({
      resetAllFilters: mockResetAllFilters,
    }));
    return (
      <div data-testid={`planogram-table-${props.variant || "default"}`}>
        <button
          data-testid={`table-filter-${props.variant || "default"}`}
          onClick={() => props.onFilterChange?.([ "filter1" ])}
        >
          Filter
        </button>
        <button
          data-testid={`table-row-click-${props.variant || "default"}`}
          onClick={() =>
            props.customNav?.({ data: { id: "ref-pg-1", status: "published" } })
          }
        >
          Row Click
        </button>
        <button
          data-testid={`table-selection-${props.variant || "default"}`}
          onClick={() => props.onSelectionChange?.([ "pg-a", "pg-b" ])}
        >
          Select
        </button>
      </div>
    );
  });
  MockPlanogramTable.displayName = "MockPlanogramTable";
  return MockPlanogramTable;
});

jest.mock("../../Modals/MassUpdateModeModal", () => {
  const Mock = (props) => {
    Object.assign(modeModalProps, props);
    if (!props.open) return null;
    return (
      <div data-testid="mode-modal">
        <button data-testid="mode-confirm" onClick={() => props.onConfirm?.("replace")}>
          Confirm
        </button>
        <button data-testid="mode-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  };
  return Mock;
});

jest.mock("../../Modals/MassUpdateConfirmationModal", () => {
  const Mock = (props) => {
    Object.assign(confirmModalProps, props);
    if (!props.open) return null;
    return (
      <div data-testid="confirm-modal">
        <button data-testid="confirm-confirm" onClick={props.onConfirm}>
          Confirm
        </button>
        <button data-testid="confirm-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  };
  return Mock;
});

jest.mock("../../Modals/MassUpdateStatusModal", () => {
  const Mock = (props) => {
    Object.assign(statusModalProps, props);
    if (!props.open) return null;
    return (
      <div data-testid="status-modal">
        <button data-testid="status-close" onClick={props.onClose}>
          Close
        </button>
        <button data-testid="status-dashboard" onClick={props.onGoToDashboard}>
          Dashboard
        </button>
      </div>
    );
  };
  return Mock;
});

jest.mock("../MassUpdateActivityDrawer", () => {
  const Mock = (props) => {
    Object.assign(activityDrawerProps, props);
    if (!props.open) return null;
    return (
      <div data-testid="activity-drawer">
        <button data-testid="drawer-close" onClick={props.onClose}>
          Close
        </button>
      </div>
    );
  };
  return Mock;
});

const runMassUpdateMock = runMassUpdate;
const toastError = jest.requireMock("react-hot-toast").default.error;

function resetProps() {
  for (const key of Object.keys(searchBarProps)) delete searchBarProps[key];
  for (const key of Object.keys(planogramTableProps)) delete planogramTableProps[key];
  for (const key of Object.keys(modeModalProps)) delete modeModalProps[key];
  for (const key of Object.keys(confirmModalProps)) delete confirmModalProps[key];
  for (const key of Object.keys(statusModalProps)) delete statusModalProps[key];
  for (const key of Object.keys(activityDrawerProps)) delete activityDrawerProps[key];
}

describe("MassUpdateContent", () => {
  const defaultState = {
    auth: { user: { email: "user@test.com" } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetProps();
    mockNavigate.mockClear();
    runMassUpdateMock.mockResolvedValue({
      data: {
        data: {
          passed: [ "p1", "p2" ],
          failed: [ "p3" ],
        },
      },
    });
  });

  describe("Initial render and step 1", () => {
    it("renders Mass Update title and step 1 content", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      expect(screen.getByRole("heading", { name: /mass update/i })).toBeInTheDocument();
      expect(screen.getByText("Select an Optimized Planogram")).toBeInTheDocument();
      expect(screen.getByText("Apply Mass Update to Planograms")).toBeInTheDocument();
      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
      expect(screen.getByTestId("planogram-table-massUpdate")).toBeInTheDocument();
    });

    it("step 1 SearchBar receives correct props", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      expect(searchBarProps.onSearchChange).toBeDefined();
      expect(searchBarProps.onResetFilters).toBeDefined();
      expect(searchBarProps.showActivityLog).toBe(true);
      expect(searchBarProps.canViewActivityLog).toBe(true);
      expect(searchBarProps.onActivityLog).toBeDefined();
      expect(searchBarProps.hideCompare).toBe(true);
    });

    it("step 1 PlanogramTable has variant massUpdate and customNav", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      const tableProps = planogramTableProps.massUpdate;
      expect(tableProps).toBeDefined();
      expect(tableProps.variant).toBe("massUpdate");
      expect(typeof tableProps.customNav).toBe("function");
    });
  });

  describe("Stepper and step change", () => {
    it("clicking step 1 keeps current step 1", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      const step1Button = screen.getByRole("button", {
        name: /1/i,
        exact: false,
      });
      fireEvent.click(step1Button.closest("button"));
      expect(screen.getByTestId("planogram-table-massUpdate")).toBeInTheDocument();
    });

    it("clicking step 2 without selection shows toast and stays on step 1", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      const step2Buttons = screen.getAllByText("2");
      const step2Button = step2Buttons[0].closest("button");
      fireEvent.click(step2Button);
      expect(toastError).toHaveBeenCalledWith("Please select a planogram first");
      expect(screen.getByTestId("planogram-table-massUpdate")).toBeInTheDocument();
    });

    it("row click opens mode modal and confirm moves to step 2", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      expect(screen.getByTestId("mode-modal")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("mode-confirm"));
      expect(screen.getByTestId("planogram-table-massUpdateBulk")).toBeInTheDocument();
    });

    it("after moving to step 2, clicking step 1 goes back to step 1", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      expect(screen.getByTestId("planogram-table-massUpdateBulk")).toBeInTheDocument();
      const step1Label = screen.getByText("Select an Optimized Planogram");
      fireEvent.click(step1Label.closest("button"));
      expect(screen.getByTestId("planogram-table-massUpdate")).toBeInTheDocument();
    });

    it("after selecting reference, clicking step 2 moves to step 2", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      const step2Label = screen.getByText("Apply Mass Update to Planograms");
      fireEvent.click(step2Label.closest("button"));
      expect(screen.getByTestId("planogram-table-massUpdateBulk")).toBeInTheDocument();
    });
  });

  describe("Row click step 1", () => {
    it("handleRowClickStep1 with no data does not open modal", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      const table = planogramTableProps.massUpdate;
      expect(table.customNav).toBeDefined();
      act(() => table.customNav({}));
      expect(screen.queryByTestId("mode-modal")).not.toBeInTheDocument();
    });

    it("handleRowClickStep1 with data sets id, status and opens mode modal", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      expect(modeModalProps.open).toBe(true);
    });
  });

  describe("Step 2 and Apply Mass Update", () => {
    beforeEach(() => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
    });

    it("step 2 SearchBar has showApplyMassUpdate and onApplyMassUpdate", () => {
      expect(searchBarProps.showApplyMassUpdate).toBe(true);
      expect(typeof searchBarProps.onApplyMassUpdate).toBe("function");
    });

    it("Apply Mass Update with no selection shows toast", () => {
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      expect(toastError).toHaveBeenCalledWith("Please select at least one planogram");
      expect(confirmModalProps.open).toBeFalsy();
    });

    it("selecting planograms and Apply Mass Update opens confirm modal", () => {
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    });
  });

  describe("Confirm Mass Update and API", () => {
    it("handleConfirmMassUpdate calls runMassUpdate and updates report", async () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));

      await waitFor(() => {
        expect(runMassUpdateMock).toHaveBeenCalledWith({
          reference_planogram: "ref-pg-1",
          email: "user@test.com",
          status: "published",
          planograms_list: [ "pg-a", "pg-b" ],
        });
      });

      await waitFor(() => {
        expect(statusModalProps.successCount).toBe(2);
        expect(statusModalProps.failedCount).toBe(1);
      });
    });

    it("handleConfirmMassUpdate on API error sets report to zero", async () => {
      runMassUpdateMock.mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));

      await waitFor(() => expect(runMassUpdateMock).toHaveBeenCalled());
      await waitFor(() => {
        expect(statusModalProps.successCount).toBe(0);
        expect(statusModalProps.failedCount).toBe(0);
      });

      consoleSpy.mockRestore();
    });

    it("handleConfirmMassUpdate with missing response data uses empty arrays", async () => {
      runMassUpdateMock.mockResolvedValue({ data: {} });

      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));

      await waitFor(() => expect(runMassUpdateMock).toHaveBeenCalled());
      await waitFor(() => {
        expect(statusModalProps.successCount).toBe(0);
        expect(statusModalProps.failedCount).toBe(0);
      });
    });

    it("confirm modal closes and status modal opens when confirming", async () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      expect(confirmModalProps.open).toBe(true);
      fireEvent.click(screen.getByTestId("confirm-confirm"));
      await waitFor(() => expect(statusModalProps.open).toBe(true));
    });
  });

  describe("Status modal", () => {
    it("onClose resets to step 1", async () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));
      await waitFor(() => expect(screen.getByTestId("status-modal")).toBeInTheDocument());
      fireEvent.click(screen.getByTestId("status-close"));
      await waitFor(() => {
        expect(screen.getByTestId("planogram-table-massUpdate")).toBeInTheDocument();
      });
    });

    it("onGoToDashboard navigates to /dashboard", async () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));
      await waitFor(() => expect(screen.getByTestId("status-modal")).toBeInTheDocument());
      fireEvent.click(screen.getByTestId("status-dashboard"));
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("Activity drawer", () => {
    it("opening activity log opens drawer", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      expect(screen.queryByTestId("activity-drawer")).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId("search-bar-activity"));
      expect(screen.getByTestId("activity-drawer")).toBeInTheDocument();
      expect(activityDrawerProps.open).toBe(true);
    });

    it("drawer receives successLogs and failedLogs", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("search-bar-activity"));
      expect(Array.isArray(activityDrawerProps.successLogs)).toBe(true);
      expect(activityDrawerProps.successLogs.length).toBeGreaterThan(0);
      expect(Array.isArray(activityDrawerProps.failedLogs)).toBe(true);
      expect(activityDrawerProps.failedLogs.length).toBeGreaterThan(0);
    });
  });

  describe("Filter reset", () => {
    it("step 1 reset triggers table resetAllFilters when ref is set", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("search-bar-reset"));
      expect(mockResetAllFilters).toHaveBeenCalled();
    });

    it("step 2 reset triggers table resetAllFilters", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      mockResetAllFilters.mockClear();
      fireEvent.click(screen.getByTestId("search-bar-reset"));
      expect(mockResetAllFilters).toHaveBeenCalled();
    });
  });

  describe("Filter change handlers", () => {
    it("step 1 filter change updates hasActiveFilters", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-filter-massUpdate"));
      expect(searchBarProps.hasActiveFilters).toBe(true);
    });

    it("step 2 filter change updates hasActiveFilters", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      const tableProps = planogramTableProps.massUpdateBulk;
      act(() => tableProps.onFilterChange([ "x" ]));
      expect(searchBarProps.hasActiveFilters).toBe(true);
    });
  });

  describe("User without email", () => {
    it("calls runMassUpdate with undefined email when user has no email", async () => {
      renderWithProviders(<MassUpdateContent />, {
        preloadedState: { auth: { user: {} } },
      });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      fireEvent.click(screen.getByTestId("table-selection-massUpdateBulk"));
      fireEvent.click(screen.getByTestId("search-bar-apply-mass-update"));
      fireEvent.click(screen.getByTestId("confirm-confirm"));

      await waitFor(() => {
        expect(runMassUpdateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            email: undefined,
            status: "published",
          })
        );
      });
    });
  });

  describe("Step 2 table props", () => {
    it("step 2 PlanogramTable has variant massUpdateBulk and referencePlanogramId", () => {
      renderWithProviders(<MassUpdateContent />, { preloadedState: defaultState });
      fireEvent.click(screen.getByTestId("table-row-click-massUpdate"));
      fireEvent.click(screen.getByTestId("mode-confirm"));
      const tableProps = planogramTableProps.massUpdateBulk;
      expect(tableProps.variant).toBe("massUpdateBulk");
      expect(tableProps.referencePlanogramId).toBe("ref-pg-1");
      expect(typeof tableProps.onSelectionChange).toBe("function");
    });
  });
});
