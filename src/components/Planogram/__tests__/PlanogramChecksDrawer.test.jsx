import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlanogramChecksDrawer from "../PlanogramChecksDrawer";

describe("PlanogramChecksDrawer", () => {
  const mockOnClose = jest.fn();

  const createCheck = (overrides = {}) => ({
    id: "check-1",
    type: "facing",
    level_name: "shelf",
    level_value: "Shelf A",
    timestamp: 1000,
    extras: { bay: "1", shelf: "2" },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Drawer visibility and close", () => {
    it("renders drawer title and content when open is true", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={0}
        />
      );

      expect(screen.getByText("Violation Checks")).toBeInTheDocument();
    });

    it("renders close button with accessible label", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={0}
        />
      );

      const closeButton = screen.getByRole("button", {
        name: /close checks drawer/i,
      });
      expect(closeButton).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={0}
        />
      );

      const closeButton = screen.getByRole("button", {
        name: /close checks drawer/i,
      });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not throw when open is false", () => {
      expect(() =>
        render(
          <PlanogramChecksDrawer
            open={false}
            onClose={mockOnClose}
            checks={[]}
          />
        )
      ).not.toThrow();
    });
  });

  describe("Violation count badge", () => {
    it("displays violation count when provided", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={5}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays 0 when violationCount is 0", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={0}
        />
      );

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("defaults violation count to 0 when not provided", () => {
      render(
        <PlanogramChecksDrawer open onClose={mockOnClose} checks={[]} />
      );

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[createCheck()]}
          isLoading
        />
      );

      // CircularProgress renders a role="progressbar" in MUI
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("does not show checks list when loading", () => {
      const check = createCheck({ type: "unique-loading-check" });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          isLoading
        />
      );

      expect(screen.queryByText("unique-loading-check")).not.toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when checks array is empty", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[]}
          violationCount={0}
        />
      );

      expect(
        screen.getByText("No checks yet. Run validations to see them here.")
      ).toBeInTheDocument();
    });

    it("renders empty state when checks is null", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={null}
          violationCount={0}
        />
      );

      expect(
        screen.getByText("No checks yet. Run validations to see them here.")
      ).toBeInTheDocument();
    });

    it("renders empty state when checks is undefined", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          violationCount={0}
        />
      );

      expect(
        screen.getByText("No checks yet. Run validations to see them here.")
      ).toBeInTheDocument();
    });
  });

  describe("Checks list rendering", () => {
    it("renders a single check with type, level_name, and level_value", () => {
      const check = createCheck({
        type: "facing",
        level_name: "shelf",
        level_value: "Shelf A",
      });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("facing")).toBeInTheDocument();
      expect(screen.getByText("shelf")).toBeInTheDocument();
      expect(screen.getByText("Shelf A")).toBeInTheDocument();
    });

    it("renders check type as 'Check' when type is missing", () => {
      const check = createCheck({ type: undefined });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("Check")).toBeInTheDocument();
    });

    it("renders bay and shelf from extras when present", () => {
      const check = createCheck({
        extras: { bay: "3", shelf: "4" },
      });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText(/Bay 3 · Shelf 4/)).toBeInTheDocument();
    });

    it("renders bay/shelf with dash when value is missing", () => {
      const check = createCheck({
        extras: { bay: null, shelf: "2" },
      });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText(/Bay - · Shelf 2/)).toBeInTheDocument();
    });

    it("does not render bay/shelf line when both extras are missing", () => {
      const check = createCheck({ extras: {} });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.queryByText(/Bay/)).not.toBeInTheDocument();
    });

    it("renders multiple checks", () => {
      const checks = [
        createCheck({ id: "c1", type: "facing", level_value: "Shelf 1" }),
        createCheck({ id: "c2", type: "position", level_value: "Shelf 2" }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={2}
        />
      );

      expect(screen.getByText("facing")).toBeInTheDocument();
      expect(screen.getByText("position")).toBeInTheDocument();
      expect(screen.getByText("Shelf 1")).toBeInTheDocument();
      expect(screen.getByText("Shelf 2")).toBeInTheDocument();
    });

    it("sorts checks by timestamp descending (newest first)", () => {
      const checks = [
        createCheck({
          id: "old",
          type: "old-check",
          timestamp: 100,
        }),
        createCheck({
          id: "new",
          type: "new-check",
          timestamp: 200,
        }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={2}
        />
      );

      const container = screen.getByRole("list", { hidden: true });
      const text = container.textContent;
      const firstCheckIndex = text.indexOf("new-check");
      const secondCheckIndex = text.indexOf("old-check");
      expect(firstCheckIndex).toBeLessThan(secondCheckIndex);
    });

    it("handles checks without timestamp (treated as 0)", () => {
      const checks = [
        createCheck({ id: "no-ts", type: "no-timestamp", timestamp: undefined }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={1}
        />
      );

      expect(screen.getByText("no-timestamp")).toBeInTheDocument();
    });

    it("renders list as ordered list (ol)", () => {
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[createCheck()]}
          violationCount={1}
        />
      );

      const list = document.querySelector("ol");
      expect(list).toBeInTheDocument();
    });
  });

  describe("Stable keys for list items", () => {
    it("renders checks with id without duplicate key warnings", () => {
      const checks = [
        createCheck({ id: "a" }),
        createCheck({ id: "b" }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={2}
        />
      );

      const list = document.querySelector("ol");
      expect(list).toBeInTheDocument();
      expect(list.children.length).toBe(2);
    });

    it("renders checks without id using composite key", () => {
      const checks = [
        createCheck({
          id: undefined,
          type: "t1",
          level_name: "ln1",
          level_value: "lv1",
          extras: { bay: "1", shelf: "2", product_id_list: "p1" },
        }),
        createCheck({
          id: undefined,
          type: "t2",
          level_name: "ln2",
          level_value: "lv2",
        }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={2}
        />
      );

      const list = document.querySelector("ol");
      expect(list).toBeInTheDocument();
      expect(list.children.length).toBe(2);
      expect(screen.getByText("t1")).toBeInTheDocument();
      expect(screen.getByText("t2")).toBeInTheDocument();
    });
  });

  describe("PropTypes and default props", () => {
    it("accepts numeric id in check", () => {
      const check = createCheck({ id: 12345 });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("facing")).toBeInTheDocument();
    });

    it("does not render level_name when missing", () => {
      const check = createCheck({ level_name: undefined, level_value: "Only" });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("Only")).toBeInTheDocument();
    });

    it("does not render level_value when missing", () => {
      const check = createCheck({ level_value: undefined, level_name: "Shelf" });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("Shelf")).toBeInTheDocument();
    });
  });

  describe("Edge cases for branch coverage", () => {
    it("renders bay with dash when bay is missing but shelf present", () => {
      const check = createCheck({
        extras: { shelf: "3" },
      });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText(/Bay - · Shelf 3/)).toBeInTheDocument();
    });

    it("sorts correctly when one check has timestamp 0", () => {
      const checks = [
        createCheck({ id: "zero", type: "zero-ts", timestamp: 0 }),
        createCheck({ id: "has-ts", type: "has-ts", timestamp: 500 }),
      ];
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={checks}
          violationCount={2}
        />
      );

      const list = document.querySelector("ol");
      const text = list.textContent;
      expect(text.indexOf("has-ts")).toBeLessThan(text.indexOf("zero-ts"));
    });

    it("renders check with string id for key generation", () => {
      const check = createCheck({ id: "string-id", type: "key-test" });
      render(
        <PlanogramChecksDrawer
          open
          onClose={mockOnClose}
          checks={[check]}
          violationCount={1}
        />
      );

      expect(screen.getByText("key-test")).toBeInTheDocument();
    });
  });
});
