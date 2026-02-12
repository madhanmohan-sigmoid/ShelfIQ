import React from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { Save } from "lucide-react";

const SaveConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  planogramName = "this planogram",
  status = "cloned", // new default value if not sent explicitly
}) => {
  const violations =
    useSelector((state) => state.planogramVisualizerData.violations) || [];
  const hasViolations = violations.length > 0;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const showDraftMessage = (status === "cloned");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="save-confirmation-dialog-title"
      aria-describedby="save-confirmation-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 6,
          fontFamily:
            'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          "& *": {
            fontFamily:
              'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        },
      }}
    >
      <DialogTitle
        id="save-confirmation-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: "#000000",
          fontWeight: 600,
          fontSize: "1.25rem",
          pb: 2,
        }}
      >
        <Save size={24} />
        Save Planogram
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="save-confirmation-dialog-description"
          sx={{
            textAlign: "left",
            color: "#374151",
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        >
          {showDraftMessage ? (
            <>
              Are you sure you want to save{" "}
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "#FF782C" }}
              >
                {planogramName}
              </Typography>{" "}
              as a draft
              {hasViolations && (
                <Typography
                  component="span"
                  sx={{ color: "#DC2626", fontWeight: 600, ml: 0.5 }}
                >
                  (It contains violations)
                </Typography>
              )}?
              <br />
              <br />
              This will save your current changes and keep the planogram in draft
              status.
            </>
          ) : (
            <>
              Are you sure you want to save and update{" "}
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: "#FF782C" }}
              >
                {planogramName}
              </Typography>
              ?
              <br />
              <br />
              This will save your current changes and update the planogram.
            </>
          )}
        </DialogContentText>
      </DialogContent>

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
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="outlined"
          autoFocus
          startIcon={<Save size={16} />}
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveConfirmationModal;

SaveConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  planogramName: PropTypes.string,
  status: PropTypes.string, // add prop type
};

SaveConfirmationModal.defaultProps = {
  status: "cloned",
};
