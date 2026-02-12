import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { CheckCircle } from "lucide-react";

const MassUpdateStatusModal = ({
  open,
  isRunning,
  successCount,
  failedCount,
  onClose,
  onGoToDashboard,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="mass-update-status-dialog-title"
      aria-describedby="mass-update-status-dialog-description"
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
        id="mass-update-status-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: "1.5rem",
        }}
      >
        Mass Update
      </DialogTitle>

      <DialogContent>
        {isRunning ? (
          <DialogContentText
            id="mass-update-status-dialog-description"
            sx={{
              textAlign: "center",
              color: "#374151",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              <div className="text-lg font-semibold">Running mass update</div>
            </div>
          </DialogContentText>
        ) : (
          <DialogContentText
            id="mass-update-status-dialog-description"
            sx={{
              textAlign: "center",
              color: "#111827",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            <div className="flex flex-col items-center justify-center py-4 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#CDE37A]">
                <CheckCircle className="w-10 h-10 text-[#A3C63A]" />
              </div>
              <div className="text-xl font-semibold">
                Mass update has been completed successfully!
              </div>
              <div className="text-gray-500">Here is the report</div>

              <div className="flex items-center gap-4 w-full justify-center mt-2">
                <div className="rounded-xl border border-[#E5F4E8] bg-[#EEF7F0] px-8 py-4 min-w-[150px] text-left">
                  <div className="text-sm text-gray-600">Success</div>
                  <div className="text-2xl font-semibold">{successCount}</div>
                </div>
                <div className="rounded-xl border border-[#F7E6E6] bg-[#FBECEC] px-8 py-4 min-w-[150px] text-left">
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="text-2xl font-semibold">{failedCount}</div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-2">
                Refer to the activity log for successful and failed planograms.
              </div>
            </div>
          </DialogContentText>
        )}
      </DialogContent>

      {!isRunning && (
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: "#000000",
              color: "#000000",
              fontWeight: 600,
              fontSize: "0.75rem",
              px: 2,
              py: 1,
              borderRadius: "50px",
              minWidth: "auto",
              "&:hover": {
                borderColor: "#000000",
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            OK
          </Button>
          <Button
            onClick={onGoToDashboard}
            variant="outlined"
            sx={{
              borderColor: "#000000",
              color: "#000000",
              fontWeight: 600,
              fontSize: "0.75rem",
              px: 2,
              py: 1,
              borderRadius: "50px",
              minWidth: "auto",
              "&:hover": {
                borderColor: "#000000",
                backgroundColor: "#f0f0f0",
              },
            }}
          >
            Go to Dashboard
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default MassUpdateStatusModal;

MassUpdateStatusModal.propTypes = {
  open: PropTypes.bool.isRequired,
  isRunning: PropTypes.bool.isRequired,
  successCount: PropTypes.number.isRequired,
  failedCount: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onGoToDashboard: PropTypes.func.isRequired,
};
