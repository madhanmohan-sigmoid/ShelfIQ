import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DuplicateSuccessModal = ({ open, onClose, clonedName, duplicatedId }) => {
  const navigate = useNavigate();

  const handleGoToMyPlanograms = () => {
    if (duplicatedId) {
      navigate(`/my-planogram/${duplicatedId}`, {
        state: { fromDuplicateModal: true },
      });
    } else {
      navigate("/my-planogram");
    }
    onClose();
  };

  const handleStayHere = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="duplicate-success-dialog-title"
      aria-describedby="duplicate-success-dialog-description"
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
        id="duplicate-success-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontWeight: 600,
          pb: 2,
        }}
      >
        <CheckCircle size={24} />
        Planogram Duplicated Successfully!
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="duplicate-success-dialog-description"
          sx={{
            color: "#374151",
          }}
        >
          Your copy has been created and saved to &ldquo;My Planograms&rdquo; as{" "}
          <Typography
            component="span"
            sx={{ fontWeight: 600, color: "#FFB000" }}
          >
            {clonedName}
          </Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleStayHere}
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
          Stay Here
        </Button>
        <Button
          onClick={handleGoToMyPlanograms}
          variant="outlined"
          autoFocus
          startIcon={<ArrowRight size={16} />}
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
          Go to My Planograms
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateSuccessModal;

DuplicateSuccessModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  clonedName: PropTypes.string,
  duplicatedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
