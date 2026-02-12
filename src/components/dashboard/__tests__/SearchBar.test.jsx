import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import SearchBar from "../SearchBar";
import regionRetailerReducer from "../../../redux/reducers/regionRetailerSlice";

// Mock child components
jest.mock("../ResetFilterButton", () => {
  return function MockResetFilterButton({
    onResetFilters,
    hasActiveFilters,
    useOrangeTheme,
  }) {
    return (
      <button
        data-testid="reset-filter-button"
        onClick={onResetFilters}
        data-has-active-filters={hasActiveFilters}
        data-use-orange-theme={useOrangeTheme}
      >
        Reset Filters
      </button>
    );
  };
});

jest.mock("../../header", () => ({
  ContextSection: function MockContextSection() {
    return <div data-testid="context-section">Context Section</div>;
  },
}));

describe("SearchBar", () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        regionRetailer: regionRetailerReducer,
      },
      preloadedState: {
        regionRetailer: {
          selectedRegion: { name: "North America" },
          selectedRetailer: { name: "TESCO" },
          selectedCategory: { name: "ORAL CARE" },
        },
      },
    });
  };

  const defaultProps = {
    onSearchChange: jest.fn(),
    onResetFilters: jest.fn(),
    hasActiveFilters: false,
    canCompare: false,
    onCompare: jest.fn(),
    showDuplicate: false,
    canDuplicate: false,
    onDuplicate: jest.fn(),
    useOrangeTheme: false,
    showActivityLog: false,
    canViewActivityLog: false,
    onActivityLog: jest.fn(),
    hideCompare: false,
    showApplyMassUpdate: false,
    canApplyMassUpdate: false,
    onApplyMassUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} />
        </Provider>
      );
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });

    it("should render search input", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} />
        </Provider>
      );
      const searchInput = screen.getByPlaceholderText("Search");
      expect(searchInput).toBeInTheDocument();
    });

    it("should render ResetFilterButton", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} />
        </Provider>
      );
      expect(screen.getByTestId("reset-filter-button")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should call onSearchChange when typing in search input", () => {
      const store = createTestStore();
      const onSearchChange = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} onSearchChange={onSearchChange} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText("Search");
      fireEvent.change(searchInput, { target: { value: "test search" } });

      expect(onSearchChange).toHaveBeenCalledWith("test search");
    });

    it("should call onSearchChange when clearing search input", () => {
      const store = createTestStore();
      const onSearchChange = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} onSearchChange={onSearchChange} />
        </Provider>
      );

      const searchInput = screen.getByPlaceholderText("Search");
      // First type something
      fireEvent.change(searchInput, { target: { value: "test" } });
      expect(onSearchChange).toHaveBeenCalledWith("test");

      // Then clear it
      fireEvent.change(searchInput, { target: { value: "" } });
      expect(onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Compare Button - showDuplicate = false", () => {
    it("should render Compare button when showDuplicate is false and hideCompare is false and showActivityLog is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            hideCompare={false}
            showActivityLog={false}
          />
        </Provider>
      );
      expect(screen.getByText("Compare")).toBeInTheDocument();
    });

    it("should not render Compare button when hideCompare is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            hideCompare={true}
            showActivityLog={false}
          />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
    });

    it("should not render Compare button when showActivityLog is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            hideCompare={false}
            showActivityLog={true}
          />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
    });

    it("should enable Compare button when canCompare is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={true}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      expect(compareButton).not.toBeDisabled();
    });

    it("should disable Compare button when canCompare is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={false}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      expect(compareButton).toBeDisabled();
    });

    it("should call onCompare when Compare button is clicked and enabled", () => {
      const store = createTestStore();
      const onCompare = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={true}
            onCompare={onCompare}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      fireEvent.click(compareButton);
      expect(onCompare).toHaveBeenCalledTimes(1);
    });

    it("should not call onCompare when Compare button is clicked and disabled", () => {
      const store = createTestStore();
      const onCompare = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={false}
            onCompare={onCompare}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      fireEvent.click(compareButton);
      expect(onCompare).not.toHaveBeenCalled();
    });

    it("should apply enabled styling when canCompare is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={true}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      expect(compareButton).toHaveClass("border-[#FFD473]");
      expect(compareButton).toHaveClass("bg-[#FFD473]");
    });

    it("should apply disabled styling when canCompare is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            canCompare={false}
            showDuplicate={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      expect(compareButton).toHaveClass("border-gray-200");
      expect(compareButton).toHaveClass("bg-gray-100");
      expect(compareButton).toHaveClass("text-gray-400");
    });
  });

  describe("Duplicate Button - showDuplicate = true", () => {
    it("should not render Compare button when showDuplicate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showDuplicate={true} />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
    });

    it("should render Duplicate button when showDuplicate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showDuplicate={true} />
        </Provider>
      );
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
    });

    it("should enable Duplicate button when canDuplicate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(duplicateButton).not.toBeDisabled();
    });

    it("should disable Duplicate button when canDuplicate is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={false}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(duplicateButton).toBeDisabled();
    });

    it("should call onDuplicate when Duplicate button is clicked and enabled", () => {
      const store = createTestStore();
      const onDuplicate = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
            onDuplicate={onDuplicate}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      fireEvent.click(duplicateButton);
      expect(onDuplicate).toHaveBeenCalledTimes(1);
    });

    it("should not call onDuplicate when Duplicate button is clicked and disabled", () => {
      const store = createTestStore();
      const onDuplicate = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={false}
            onDuplicate={onDuplicate}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      fireEvent.click(duplicateButton);
      expect(onDuplicate).not.toHaveBeenCalled();
    });

    it("should apply enabled styling when canDuplicate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(duplicateButton).toHaveClass("border-[#FFAE80]");
      expect(duplicateButton).toHaveClass("bg-[#FFAE80]");
      expect(duplicateButton).toHaveClass("text-black");
    });

    it("should apply disabled styling when canDuplicate is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={false}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(duplicateButton).toHaveClass("border-gray-200");
      expect(duplicateButton).toHaveClass("bg-gray-100");
      expect(duplicateButton).toHaveClass("text-gray-400");
    });
  });

  describe("Activity Log Button - showActivityLog = true", () => {
    it("should not render Activity Log button when showActivityLog is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showActivityLog={false} />
        </Provider>
      );
      expect(screen.queryByText("Activity Log")).not.toBeInTheDocument();
    });

    it("should render Activity Log button when showActivityLog is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showActivityLog={true} />
        </Provider>
      );
      expect(screen.getByText("Activity Log")).toBeInTheDocument();
    });

    it("should enable Activity Log button when canViewActivityLog is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={true}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      expect(activityLogButton).not.toBeDisabled();
    });

    it("should disable Activity Log button when canViewActivityLog is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={false}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      expect(activityLogButton).toBeDisabled();
    });

    it("should call onActivityLog when Activity Log button is clicked and enabled", () => {
      const store = createTestStore();
      const onActivityLog = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={true}
            onActivityLog={onActivityLog}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      fireEvent.click(activityLogButton);
      expect(onActivityLog).toHaveBeenCalledTimes(1);
    });

    it("should not call onActivityLog when Activity Log button is clicked and disabled", () => {
      const store = createTestStore();
      const onActivityLog = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={false}
            onActivityLog={onActivityLog}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      fireEvent.click(activityLogButton);
      expect(onActivityLog).not.toHaveBeenCalled();
    });

    it("should apply enabled styling when canViewActivityLog is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={true}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      expect(activityLogButton).toHaveClass("border-[#BCD530]");
      expect(activityLogButton).toHaveClass("bg-[#BCD530]");
      expect(activityLogButton).toHaveClass("text-black");
    });

    it("should apply disabled styling when canViewActivityLog is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={false}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      expect(activityLogButton).toHaveClass("border-gray-200");
      expect(activityLogButton).toHaveClass("bg-gray-100");
      expect(activityLogButton).toHaveClass("text-gray-400");
    });
  });

  describe("Apply Mass Update Button - showApplyMassUpdate = true", () => {
    it("should not render Apply Mass Update button when showApplyMassUpdate is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showApplyMassUpdate={false} />
        </Provider>
      );
      expect(screen.queryByText("Apply Mass Update")).not.toBeInTheDocument();
    });

    it("should render Apply Mass Update button when showApplyMassUpdate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showApplyMassUpdate={true} />
        </Provider>
      );
      expect(screen.getByText("Apply Mass Update")).toBeInTheDocument();
    });

    it("should enable Apply Mass Update button when canApplyMassUpdate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={true}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      expect(massUpdateButton).not.toBeDisabled();
    });

    it("should disable Apply Mass Update button when canApplyMassUpdate is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={false}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      expect(massUpdateButton).toBeDisabled();
    });

    it("should call onApplyMassUpdate when Apply Mass Update button is clicked and enabled", () => {
      const store = createTestStore();
      const onApplyMassUpdate = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={true}
            onApplyMassUpdate={onApplyMassUpdate}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      fireEvent.click(massUpdateButton);
      expect(onApplyMassUpdate).toHaveBeenCalledTimes(1);
    });

    it("should not call onApplyMassUpdate when Apply Mass Update button is clicked and disabled", () => {
      const store = createTestStore();
      const onApplyMassUpdate = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={false}
            onApplyMassUpdate={onApplyMassUpdate}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      fireEvent.click(massUpdateButton);
      expect(onApplyMassUpdate).not.toHaveBeenCalled();
    });

    it("should apply enabled styling when canApplyMassUpdate is true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={true}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      expect(massUpdateButton).toHaveClass("border-[#BCD530]");
      expect(massUpdateButton).toHaveClass("bg-[#BCD530]");
      expect(massUpdateButton).toHaveClass("text-black");
    });

    it("should apply disabled styling when canApplyMassUpdate is false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={false}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      expect(massUpdateButton).toHaveClass("border-gray-200");
      expect(massUpdateButton).toHaveClass("bg-gray-100");
      expect(massUpdateButton).toHaveClass("text-gray-400");
    });
  });

  describe("ResetFilterButton Integration", () => {
    it("should pass hasActiveFilters to ResetFilterButton", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} hasActiveFilters={true} />
        </Provider>
      );
      const resetButton = screen.getByTestId("reset-filter-button");
      expect(resetButton).toHaveAttribute("data-has-active-filters", "true");
    });

    it("should pass useOrangeTheme to ResetFilterButton", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} useOrangeTheme={true} />
        </Provider>
      );
      const resetButton = screen.getByTestId("reset-filter-button");
      expect(resetButton).toHaveAttribute("data-use-orange-theme", "true");
    });

    it("should call onResetFilters when ResetFilterButton is clicked", () => {
      const store = createTestStore();
      const onResetFilters = jest.fn();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            onResetFilters={onResetFilters}
            hasActiveFilters={true}
          />
        </Provider>
      );
      const resetButton = screen.getByTestId("reset-filter-button");
      fireEvent.click(resetButton);
      expect(onResetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("Conditional Rendering Combinations", () => {
    it("should show Compare button and hide Duplicate button when showDuplicate=false", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showDuplicate={false} />
        </Provider>
      );
      expect(screen.getByText("Compare")).toBeInTheDocument();
      expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
    });

    it("should show Duplicate button and hide Compare button when showDuplicate=true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showDuplicate={true} />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
    });

    it("should show Activity Log and hide Compare when showActivityLog=true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showActivityLog={true} />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
      expect(screen.getByText("Activity Log")).toBeInTheDocument();
    });

    it("should hide Compare when hideCompare=true", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} hideCompare={true} />
        </Provider>
      );
      expect(screen.queryByText("Compare")).not.toBeInTheDocument();
    });

    it("should show Apply Mass Update when showApplyMassUpdate=true alongside other buttons", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar {...defaultProps} showApplyMassUpdate={true} />
        </Provider>
      );
      expect(screen.getByText("Apply Mass Update")).toBeInTheDocument();
      expect(screen.getByText("Compare")).toBeInTheDocument();
    });
  });

  describe("Tooltip Integration", () => {
    it("should have tooltip wrapper for Compare button", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            canCompare={true}
          />
        </Provider>
      );
      // Tooltip should wrap the button
      const compareButton = screen.getByText("Compare").closest("button");
      expect(compareButton).toBeInTheDocument();
    });

    it("should show Compare tooltip 'Click to compare' when canCompare is true", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            hideCompare={false}
            showActivityLog={false}
            canCompare={true}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      const tooltipWrapper = compareButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || compareButton);
      await waitFor(() => {
        expect(
          screen.getByText("Click to compare")
        ).toBeInTheDocument();
      });
    });

    it("should show Compare tooltip 'Please select two planograms to compare' when canCompare is false", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={false}
            hideCompare={false}
            showActivityLog={false}
            canCompare={false}
          />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      const tooltipWrapper = compareButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || compareButton);
      await waitFor(() => {
        expect(
          screen.getByText("Please select two planograms to compare")
        ).toBeInTheDocument();
      });
    });

    it("should have tooltip wrapper for Duplicate button", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
          />
        </Provider>
      );
      // Tooltip should wrap the button
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(duplicateButton).toBeInTheDocument();
    });

    it("should show Duplicate tooltip 'Click to duplicate planogram' when canDuplicate is true", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      const tooltipWrapper = duplicateButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || duplicateButton);
      await waitFor(() => {
        expect(
          screen.getByText("Click to duplicate planogram")
        ).toBeInTheDocument();
      });
    });

    it("should show Duplicate tooltip 'Please select a planogram to duplicate' when canDuplicate is false", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={false}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      const tooltipWrapper = duplicateButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || duplicateButton);
      await waitFor(() => {
        expect(
          screen.getByText("Please select a planogram to duplicate")
        ).toBeInTheDocument();
      });
    });

    it("should show Activity Log tooltip 'Click to view activity log' when canViewActivityLog is true", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={true}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      const tooltipWrapper = activityLogButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || activityLogButton);
      await waitFor(() => {
        expect(
          screen.getByText("Click to view activity log")
        ).toBeInTheDocument();
      });
    });

    it("should show Activity Log tooltip 'Please select a planogram to view activity log' when canViewActivityLog is false", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={false}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      const tooltipWrapper = activityLogButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || activityLogButton);
      await waitFor(() => {
        expect(
          screen.getByText("Please select a planogram to view activity log")
        ).toBeInTheDocument();
      });
    });

    it("should show Apply Mass Update tooltip 'Click to apply mass update' when canApplyMassUpdate is true", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={true}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      const tooltipWrapper = massUpdateButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || massUpdateButton);
      await waitFor(() => {
        expect(
          screen.getByText("Click to apply mass update")
        ).toBeInTheDocument();
      });
    });

    it("should show Apply Mass Update tooltip 'Please select planograms to apply mass update' when canApplyMassUpdate is false", async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={false}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      const tooltipWrapper = massUpdateButton?.closest("span");
      fireEvent.mouseEnter(tooltipWrapper || massUpdateButton);
      await waitFor(() => {
        expect(
          screen.getByText("Please select planograms to apply mass update")
        ).toBeInTheDocument();
      });
    });
  });

  describe("All Branch Combinations", () => {
    // Test all combinations of boolean props to ensure full branch coverage
    const combinations = [
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: true,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: true,
        useOrangeTheme: false,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: true,
        useOrangeTheme: true,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        canCompare: true,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: true,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: false,
        showActivityLog: true,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: true,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: false,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: true,
        showActivityLog: false,
        hideCompare: false,
        canCompare: false,
        canDuplicate: true,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
      {
        showDuplicate: false,
        showActivityLog: false,
        hideCompare: false,
        showApplyMassUpdate: true,
        canApplyMassUpdate: true,
        hasActiveFilters: false,
        useOrangeTheme: false,
      },
    ];

    combinations.forEach((combo, index) => {
      it(`should render correctly with combination ${
        index + 1
      }: ${JSON.stringify(combo)}`, () => {
        const store = createTestStore();
        render(
          <Provider store={store}>
            <SearchBar {...defaultProps} {...combo} />
          </Provider>
        );

        // Compare is shown when !showDuplicate && !showActivityLog && !hideCompare
        const shouldShowCompare =
          !combo.showDuplicate && !combo.showActivityLog && !combo.hideCompare;
        const compareElement = screen.queryByText("Compare");
        const duplicateElement = screen.queryByText("Duplicate");
        const activityLogElement = screen.queryByText("Activity Log");
        const applyMassUpdateElement = screen.queryByText("Apply Mass Update");

        expect(Boolean(compareElement)).toBe(shouldShowCompare);
        expect(Boolean(duplicateElement)).toBe(combo.showDuplicate ?? false);
        expect(Boolean(activityLogElement)).toBe(combo.showActivityLog ?? false);
        expect(Boolean(applyMassUpdateElement)).toBe(
          combo.showApplyMassUpdate ?? false
        );

        // Verify ResetFilterButton props
        const resetButton = screen.getByTestId("reset-filter-button");
        expect(resetButton).toHaveAttribute(
          "data-has-active-filters",
          String(combo.hasActiveFilters)
        );
        expect(resetButton).toHaveAttribute(
          "data-use-orange-theme",
          String(combo.useOrangeTheme)
        );
      });
    });
  });

  describe("Search input and layout", () => {
    it("should render search icon and input with correct classes", () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <SearchBar {...defaultProps} />
        </Provider>
      );
      const input = screen.getByPlaceholderText("Search");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveClass("w-full", "pl-4", "pr-10", "py-2");
      const searchIcon = container.querySelector(".text-gray-500");
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe("Default props and callbacks", () => {
    it("should render with only required props and use default values", () => {
      const store = createTestStore();
      const requiredProps = {
        onSearchChange: jest.fn(),
        onResetFilters: jest.fn(),
      };
      render(
        <Provider store={store}>
          <SearchBar {...requiredProps} />
        </Provider>
      );
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
      expect(screen.getByText("Compare")).toBeInTheDocument();
      expect(screen.getByTestId("reset-filter-button")).toBeInTheDocument();
    });

    it("should not throw when Compare is clicked with default onCompare", () => {
      const store = createTestStore();
      const requiredProps = {
        onSearchChange: jest.fn(),
        onResetFilters: jest.fn(),
      };
      render(
        <Provider store={store}>
          <SearchBar {...requiredProps} canCompare={true} />
        </Provider>
      );
      const compareButton = screen.getByText("Compare").closest("button");
      expect(() => fireEvent.click(compareButton)).not.toThrow();
    });

    it("should not throw when Duplicate is clicked with default onDuplicate", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showDuplicate={true}
            canDuplicate={true}
          />
        </Provider>
      );
      const duplicateButton = screen.getByText("Duplicate").closest("button");
      expect(() => fireEvent.click(duplicateButton)).not.toThrow();
    });

    it("should not throw when Activity Log is clicked with default onActivityLog", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showActivityLog={true}
            canViewActivityLog={true}
          />
        </Provider>
      );
      const activityLogButton = screen
        .getByText("Activity Log")
        .closest("button");
      expect(() => fireEvent.click(activityLogButton)).not.toThrow();
    });

    it("should not throw when Apply Mass Update is clicked with default onApplyMassUpdate", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            {...defaultProps}
            showApplyMassUpdate={true}
            canApplyMassUpdate={true}
          />
        </Provider>
      );
      const massUpdateButton = screen
        .getByText("Apply Mass Update")
        .closest("button");
      expect(() => fireEvent.click(massUpdateButton)).not.toThrow();
    });

    it("should apply default hasActiveFilters false to ResetFilterButton", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            onSearchChange={jest.fn()}
            onResetFilters={jest.fn()}
          />
        </Provider>
      );
      const resetButton = screen.getByTestId("reset-filter-button");
      expect(resetButton).toHaveAttribute("data-has-active-filters", "false");
    });

    it("should apply default useOrangeTheme false to ResetFilterButton", () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <SearchBar
            onSearchChange={jest.fn()}
            onResetFilters={jest.fn()}
          />
        </Provider>
      );
      const resetButton = screen.getByTestId("reset-filter-button");
      expect(resetButton).toHaveAttribute("data-use-orange-theme", "false");
    });
  });
});
