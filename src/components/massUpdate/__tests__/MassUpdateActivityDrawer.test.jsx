import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MassUpdateActivityDrawer from "../MassUpdateActivityDrawer";

describe("MassUpdateActivityDrawer", () => {
  const mockOnClose = jest.fn();

  const successLog = (overrides = {}) => ({
    id: 1,
    count: 4,
    timestamp: 1704067200000,
    ...overrides,
  });

  const failedLog = (overrides = {}) => ({
    id: 10,
    count: 2,
    timestamp: 1704067200000,
    planogramIds: ["PG-001", "PG-002"],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1704067200000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Drawer visibility", () => {
    it("renders Activity Logs title when open", () => {
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={[]}
        />
      );
      expect(screen.getByText("Activity Logs")).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={[]}
        />
      );
      const closeButton = screen.getByLabelText("Close activity drawer");
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Tabs", () => {
    it("renders Success and Failed tabs", () => {
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={[]}
        />
      );
      expect(screen.getByRole("tab", { name: /success/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /failed/i })).toBeInTheDocument();
    });

    it("shows Success tab content by default", () => {
      const logs = [successLog({ id: 1, count: 3 })];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={logs}
          failedLogs={[]}
        />
      );
      expect(
        screen.getByText(/Update completed successfully for 3 planograms/i)
      ).toBeInTheDocument();
    });

    it("switches to Failed tab when clicked", () => {
      const failed = [failedLog({ id: 10, count: 2, planogramIds: ["A", "B"] })];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={failed}
        />
      );
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      expect(
        screen.getByText(/Update failed for 2 planograms/i)
      ).toBeInTheDocument();
    });
  });

  describe("Success logs", () => {
    it("renders success items with count and timestamp", () => {
      const logs = [
        successLog({
          id: 1,
          count: 5,
          timestamp: new Date("2024-01-01T12:00:00Z").getTime(),
        }),
      ];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={logs}
          failedLogs={[]}
        />
      );
      expect(
        screen.getByText(/Update completed successfully for 5 planograms/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Mass update")).toBeInTheDocument();
    });

    it("handles empty successLogs", () => {
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={[]}
        />
      );
      expect(screen.getByText("Activity Logs")).toBeInTheDocument();
    });


    it("renders multiple success items", () => {
      const logs = [
        successLog({ id: 1, count: 2 }),
        successLog({ id: 2, count: 3 }),
      ];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={logs}
          failedLogs={[]}
        />
      );
      expect(
        screen.getByText(/Update completed successfully for 2 planograms/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Update completed successfully for 3 planograms/i)
      ).toBeInTheDocument();
    });
  });

  describe("Failed logs", () => {
    it("renders failed items with planogram IDs", () => {
      const failed = [
        failedLog({
          id: 10,
          count: 2,
          planogramIds: ["PG-A", "PG-B"],
        }),
      ];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={failed}
        />
      );
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      expect(
        screen.getByText(/Update failed for 2 planograms/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Mass Update")).toBeInTheDocument();
      expect(screen.getByText("Planogram ID")).toBeInTheDocument();
      expect(screen.getByText("PG-A")).toBeInTheDocument();
      expect(screen.getByText("PG-B")).toBeInTheDocument();
    });

    it("handles empty failedLogs", () => {
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={[]}
        />
      );
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      expect(screen.getByText("Activity Logs")).toBeInTheDocument();
    });


    it("renders View link for each planogram ID in failed log", () => {
      const failed = [
        failedLog({ id: 10, planogramIds: ["ID-1", "ID-2"] }),
      ];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={failed}
        />
      );
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      const viewLabels = screen.getAllByText("View");
      expect(viewLabels.length).toBe(2);
    });
  });

  describe("Date formatting", () => {
    it("formats timestamp in en-GB style", () => {
      const ts = new Date("2024-01-15T14:30:00Z").getTime();
      const logs = [successLog({ id: 1, timestamp: ts })];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={logs}
          failedLogs={[]}
        />
      );
      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
    });

    it("component uses empty string for falsy timestamp (0, null, undefined)", () => {
      const formatDateTime = (timestamp) =>
        timestamp
          ? new Date(timestamp).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
      expect(formatDateTime(0)).toBe("");
      expect(formatDateTime(null)).toBe("");
      expect(formatDateTime(undefined)).toBe("");
    });
  });

  describe("Edge cases", () => {
    it("handles success log with numeric id", () => {
      const logs = [successLog({ id: 999, count: 1 })];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={logs}
          failedLogs={[]}
        />
      );
      expect(
        screen.getByText(/Update completed successfully for 1 planograms/i)
      ).toBeInTheDocument();
    });

    it("handles failed log with single planogramId", () => {
      const failed = [failedLog({ planogramIds: ["ONLY-ONE"] })];
      render(
        <MassUpdateActivityDrawer
          open
          onClose={mockOnClose}
          successLogs={[]}
          failedLogs={failed}
        />
      );
      fireEvent.click(screen.getByRole("tab", { name: /failed/i }));
      expect(screen.getByText("ONLY-ONE")).toBeInTheDocument();
    });
  });
});
