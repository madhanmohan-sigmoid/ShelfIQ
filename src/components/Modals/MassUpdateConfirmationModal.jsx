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
import { FileEdit } from "lucide-react";

const MassUpdateConfirmationModal = ({ open, onClose, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="mass-update-confirmation-dialog-title"
      aria-describedby="mass-update-confirmation-dialog-description"
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
        id="mass-update-confirmation-dialog-title"
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
        <FileEdit size={24} />
        Apply Mass Update
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="mass-update-confirmation-dialog-description"
          sx={{
            textAlign: "left",
            color: "#374151",
            fontSize: "1rem",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to apply mass update to the selected planograms.
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
          startIcon={<FileEdit size={16} />}
          sx={{
            borderColor: "#BCD530",
            backgroundColor: "#BCD530",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "0.75rem",
            px: 2,
            py: 1,
            borderRadius: "50px",
            minWidth: "auto",
        
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MassUpdateConfirmationModal;

MassUpdateConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
