import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MassUpdateStatusModal from "../MassUpdateStatusModal";

describe("MassUpdateStatusModal", () => {
  const defaultProps = {
    open: true,
    isRunning: false,
    successCount: 5,
    failedCount: 2,
    onClose: jest.fn(),
    onGoToDashboard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(<MassUpdateStatusModal {...defaultProps} {...props} />);

  describe("visibility", () => {
    it("renders dialog when open is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Mass Update")).toBeInTheDocument();
    });

    it("does not show dialog content when open is false", () => {
      renderModal({ open: false });
      expect(screen.queryByText("Mass Update")).not.toBeInTheDocument();
    });
  });

  describe("running state", () => {
    it("shows loading spinner and message when isRunning is true", () => {
      renderModal({ isRunning: true });
      expect(screen.getByText("Running mass update")).toBeInTheDocument();
      expect(screen.queryByText("Mass update has been completed successfully!")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ok/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /go to dashboard/i })).not.toBeInTheDocument();
    });

    it("does not show action buttons when isRunning is true", () => {
      renderModal({ isRunning: true });
      expect(screen.queryByRole("button", { name: /ok/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /go to dashboard/i })).not.toBeInTheDocument();
    });
  });

  describe("completed state", () => {
    it("shows success message and report when isRunning is false", () => {
      renderModal({ isRunning: false, successCount: 5, failedCount: 2 });
      expect(
        screen.getByText("Mass update has been completed successfully!")
      ).toBeInTheDocument();
      expect(screen.getByText("Here is the report")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("displays success and failed counts correctly", () => {
      renderModal({ isRunning: false, successCount: 10, failedCount: 0 });
      const successElements = screen.getAllByText("10");
      expect(successElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("shows activity log hint", () => {
      renderModal({ isRunning: false });
      expect(
        screen.getByText(/refer to the activity log for successful and failed planograms/i)
      ).toBeInTheDocument();
    });

    it("shows OK and Go to Dashboard buttons when not running", () => {
      renderModal({ isRunning: false });
      expect(screen.getByRole("button", { name: /ok/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go to dashboard/i })
      ).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("calls onClose when OK is clicked", () => {
      renderModal({ isRunning: false });
      fireEvent.click(screen.getByRole("button", { name: /ok/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onGoToDashboard when Go to Dashboard is clicked", () => {
      renderModal({ isRunning: false });
      fireEvent.click(screen.getByRole("button", { name: /go to dashboard/i }));
      expect(defaultProps.onGoToDashboard).toHaveBeenCalledTimes(1);
    });
  });

  describe("dialog close", () => {
    it("calls onClose when dialog is closed via Escape", () => {
      renderModal({ isRunning: false });
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
