import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import { Minus, Plus } from "lucide-react";
import PropTypes from "prop-types";

const SelectiveFacingsDialog = ({
  open,
  onClose,
  maxFacingsWide,
  maxFacingsHigh,
  productName,
}) => {
  const [facingsWideToRemove, setFacingsWideToRemove] = useState(0);
  const [facingsHighToRemove, setFacingsHighToRemove] = useState(0);

  const hasWide = maxFacingsWide > 1;
  const hasHigh = maxFacingsHigh > 1;

  useEffect(() => {
    if (open) {
      setFacingsWideToRemove(hasWide ? 1 : 0);
      setFacingsHighToRemove(hasHigh ? 1 : 0);
    }
  }, [open, hasWide, hasHigh]);

  const handleDecreaseWide = () => {
    setFacingsWideToRemove((prev) => Math.max(0, prev - 1));
  };

  const handleIncreaseWide = () => {
    setFacingsWideToRemove((prev) => Math.min(maxFacingsWide - 1, prev + 1));
  };

  const handleInputChangeWide = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value < maxFacingsWide) {
      setFacingsWideToRemove(value);
    }
  };

  const handleDecreaseHigh = () => {
    setFacingsHighToRemove((prev) => Math.max(0, prev - 1));
  };

  const handleIncreaseHigh = () => {
    setFacingsHighToRemove((prev) => Math.min(maxFacingsHigh - 1, prev + 1));
  };

  const handleInputChangeHigh = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value < maxFacingsHigh) {
      setFacingsHighToRemove(value);
    }
  };

  const handleConfirm = () => {
    if (
      (facingsWideToRemove > 0 && facingsWideToRemove < maxFacingsWide) ||
      (facingsHighToRemove > 0 && facingsHighToRemove < maxFacingsHigh)
    ) {
      onClose({
        facingsWide: facingsWideToRemove,
        facingsHigh: facingsHighToRemove,
      });
    }
  };

  const handleCancel = () => {
    onClose({ facingsWide: 0, facingsHigh: 0 });
  };

  const totalToRemove = facingsWideToRemove + facingsHighToRemove;
  const canConfirm = totalToRemove > 0;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Remove Selective Facings
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {productName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Select number of facings to remove
          </Typography>

          {hasWide && (
            <Box sx={{ mb: hasHigh ? 3 : 0 }}>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, fontWeight: 600, color: "text.primary" }}
              >
                Width (from right): {maxFacingsWide} facings
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <IconButton
                  onClick={handleDecreaseWide}
                  disabled={facingsWideToRemove <= 0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <Minus size={20} />
                </IconButton>
                <TextField
                  type="number"
                  value={facingsWideToRemove}
                  onChange={handleInputChangeWide}
                  inputProps={{
                    min: 0,
                    max: maxFacingsWide - 1,
                    style: { textAlign: "center", fontSize: "18px" },
                  }}
                  sx={{
                    width: 100,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#e0e0e0",
                      },
                    },
                  }}
                />
                <IconButton
                  onClick={handleIncreaseWide}
                  disabled={facingsWideToRemove >= maxFacingsWide - 1}
                  sx={{
                    border: "1px solid #e0e0e0",
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <Plus size={20} />
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                sx={{ mt: 1, display: "block", textAlign: "center", color: "text.secondary" }}
              >
                Removing {facingsWideToRemove} of {maxFacingsWide} facings wide
              </Typography>
            </Box>
          )}

          {hasWide && hasHigh && <Divider sx={{ my: 2 }} />}

          {hasHigh && (
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, fontWeight: 600, color: "text.primary" }}
              >
                Height (from top): {maxFacingsHigh} facings
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <IconButton
                  onClick={handleDecreaseHigh}
                  disabled={facingsHighToRemove <= 0}
                  sx={{
                    border: "1px solid #e0e0e0",
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <Minus size={20} />
                </IconButton>
                <TextField
                  type="number"
                  value={facingsHighToRemove}
                  onChange={handleInputChangeHigh}
                  inputProps={{
                    min: 0,
                    max: maxFacingsHigh - 1,
                    style: { textAlign: "center", fontSize: "18px" },
                  }}
                  sx={{
                    width: 100,
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: "#e0e0e0",
                      },
                    },
                  }}
                />
                <IconButton
                  onClick={handleIncreaseHigh}
                  disabled={facingsHighToRemove >= maxFacingsHigh - 1}
                  sx={{
                    border: "1px solid #e0e0e0",
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                >
                  <Plus size={20} />
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                sx={{ mt: 1, display: "block", textAlign: "center", color: "text.secondary" }}
              >
                Removing {facingsHighToRemove} of {maxFacingsHigh} facings high
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!canConfirm}
          sx={{ bgcolor: "#FF782C", "&:hover": { bgcolor: "#e6691f" } }}
        >
          Remove Facings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectiveFacingsDialog;

SelectiveFacingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  maxFacingsWide: PropTypes.number.isRequired,
  maxFacingsHigh: PropTypes.number.isRequired,
  productName: PropTypes.string.isRequired,
};
