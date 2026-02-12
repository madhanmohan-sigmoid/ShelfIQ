import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Edit, Zap } from "lucide-react";

const MassUpdateModeModal = ({ open, onClose, onConfirm }) => {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleConfirm = () => {
    if (selectedMode) {
      onConfirm(selectedMode);
      onClose();
      setSelectedMode(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedMode(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="mass-update-mode-dialog-title"
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 6,
            fontFamily:
              'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            "& *": {
              fontFamily:
                'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
          },
        },
      }}
    >
      <DialogTitle
        id="mass-update-mode-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: "1.5rem",
          textAlign: "center",
          pt: 4,
        }}
      >
        Choose Mass Update Mode
      </DialogTitle>

      <DialogContent>
        <div className="flex gap-4 py-4">
          {/* Edit Option */}
          <button
            onClick={() => setSelectedMode("edit")}
            className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 ${
              selectedMode === "edit"
                ? "border-[#BCD530] bg-[#F5F8E8] shadow-lg"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                selectedMode === "edit"
                  ? "bg-[#BCD530]"
                  : "bg-gray-100"
              }`}
            >
              <Edit
                size={32}
                className={selectedMode === "edit" ? "text-black" : "text-gray-600"}
              />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold mb-1">Edit</div>
              <div className="text-sm text-gray-600">
                Apply manual changes across multiple selected planograms
              </div>
            </div>
          </button>

          {/* Optimize Option */}
          <button
            onClick={() => setSelectedMode("optimize")}
            className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 ${
              selectedMode === "optimize"
                ? "border-[#BCD530] bg-[#F5F8E8] shadow-lg"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                selectedMode === "optimize"
                  ? "bg-[#BCD530]"
                  : "bg-gray-100"
              }`}
            >
              <Zap
                size={32}
                className={selectedMode === "optimize" ? "text-black" : "text-gray-600"}
              />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold mb-1">Optimize</div>
              <div className="text-sm text-gray-600">
                Apply the current planogram&apos;s optimizations to multiple selected planograms
              </div>
            </div>
          </button>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, justifyContent: "center" }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: "#000000",
            color: "#000000",
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 4,
            py: 1.5,
            borderRadius: "50px",
            "&:hover": {
              borderColor: "#000000",
              backgroundColor: "#f0f0f0",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedMode}
          variant="contained"
          sx={{
            backgroundColor: selectedMode ? "#BCD530" : "#E5E7EB",
            color: selectedMode ? "#000000" : "#9CA3AF",
            fontWeight: 600,
            fontSize: "0.875rem",
            px: 4,
            py: 1.5,
            borderRadius: "50px",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: selectedMode ? "#A8C020" : "#E5E7EB",
              boxShadow: "none",
            },
            "&:disabled": {
              backgroundColor: "#E5E7EB",
              color: "#9CA3AF",
            },
          }}
        >
          Next
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MassUpdateModeModal;

MassUpdateModeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
