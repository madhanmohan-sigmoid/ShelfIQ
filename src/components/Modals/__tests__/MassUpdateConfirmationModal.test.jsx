import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MassUpdateConfirmationModal from "../MassUpdateConfirmationModal";

describe("MassUpdateConfirmationModal", () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(<MassUpdateConfirmationModal {...defaultProps} {...props} />);

  describe("visibility", () => {
    it("renders dialog when open is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Apply Mass Update")).toBeInTheDocument();
    });

    it("does not show dialog content when open is false", () => {
      renderModal({ open: false });
      expect(screen.queryByText("Apply Mass Update")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("displays dialog title with Apply Mass Update", () => {
      renderModal();
      expect(
        screen.getByRole("heading", { name: /apply mass update/i })
      ).toBeInTheDocument();
    });

    it("displays confirmation message", () => {
      renderModal();
      expect(
        screen.getByText(
          /are you sure you want to apply mass update to the selected planograms/i
        )
      ).toBeInTheDocument();
    });

    it("renders Cancel and Confirm buttons", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    });
  });

  describe("Cancel button", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("Confirm button", () => {
    it("calls onConfirm then onClose when Confirm is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onConfirm before onClose when Confirm is clicked", () => {
      const callOrder = [];
      renderModal({
        onConfirm: () => callOrder.push("confirm"),
        onClose: () => callOrder.push("close"),
      });
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
      expect(callOrder).toEqual(["confirm", "close"]);
    });
  });

  describe("dialog close", () => {
    it("calls onClose when dialog is closed via Escape", () => {
      renderModal();
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
