import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MassUpdateModeModal from "../MassUpdateModeModal";

describe("MassUpdateModeModal", () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) =>
    render(<MassUpdateModeModal {...defaultProps} {...props} />);

  describe("visibility", () => {
    it("renders dialog when open is true", () => {
      renderModal();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Choose Mass Update Mode")).toBeInTheDocument();
    });

    it("does not render dialog content when open is false", () => {
      renderModal({ open: false });
      expect(screen.queryByText("Choose Mass Update Mode")).not.toBeInTheDocument();
    });
  });

  describe("title and options", () => {
    it("displays dialog title", () => {
      renderModal();
      expect(
        screen.getByRole("heading", { name: /choose mass update mode/i })
      ).toBeInTheDocument();
    });

    it("displays Edit option with description", () => {
      renderModal();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(
        screen.getByText(/apply manual changes across multiple selected planograms/i)
      ).toBeInTheDocument();
    });

    it("displays Optimize option with description", () => {
      renderModal();
      expect(screen.getByText("Optimize")).toBeInTheDocument();
      expect(
        screen.getByText(/apply the current planogram's optimizations to multiple selected planograms/i)
      ).toBeInTheDocument();
    });
  });

  describe("mode selection", () => {
    it("selecting Edit option sets edit mode", () => {
      renderModal();
      const editButton = screen.getByRole("button", { name: /edit/i }).closest("button");
      expect(editButton).toBeInTheDocument();
      fireEvent.click(editButton);
      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
    });

    it("selecting Optimize option sets optimize mode", () => {
      renderModal();
      const optimizeButton = screen
        .getByRole("button", { name: /optimize/i })
        .closest("button");
      expect(optimizeButton).toBeInTheDocument();
      fireEvent.click(optimizeButton);
      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
    });

    it("Next button is disabled when no mode is selected", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });
  });

  describe("Cancel button", () => {
    it("calls onClose when Cancel is clicked", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("resets selected mode when Cancel is clicked after selecting a mode", () => {
      renderModal();
      const editButton = screen.getByRole("button", { name: /edit/i }).closest("button");
      fireEvent.click(editButton);
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      renderModal(); // Re-open; Next should be disabled again if state was reset
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });
  });

  describe("Next button and confirm", () => {
    it("calls onConfirm with 'edit' when Edit is selected and Next is clicked", () => {
      renderModal();
      const editButton = screen.getByRole("button", { name: /edit/i }).closest("button");
      fireEvent.click(editButton);
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith("edit");
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onConfirm with 'optimize' when Optimize is selected and Next is clicked", () => {
      renderModal();
      const optimizeButton = screen
        .getByRole("button", { name: /optimize/i })
        .closest("button");
      fireEvent.click(optimizeButton);
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(defaultProps.onConfirm).toHaveBeenCalledWith("optimize");
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onConfirm when Next is clicked without selecting a mode", () => {
      renderModal();
      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
      fireEvent.click(nextButton);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("dialog close", () => {
    it("calls onClose when dialog is closed via backdrop", () => {
      renderModal();
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
