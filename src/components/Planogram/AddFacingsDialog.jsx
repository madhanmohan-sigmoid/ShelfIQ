import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { Minus, Plus } from "lucide-react";
import PropTypes from "prop-types";

const clampInt = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
};

const AddFacingsDialog = ({ open, onClose, productName, maxAdd = 20 }) => {
  const [facingsWideToAdd, setFacingsWideToAdd] = useState(1);

  useEffect(() => {
    if (!open) return;
    setFacingsWideToAdd(1);
  }, [open]);

  const handleConfirm = () => {
    const wide = clampInt(facingsWideToAdd, 0, maxAdd);
    if (wide < 1) return;
    onClose({ facingsWide: wide, facingsHigh: 0 });
  };

  const handleCancel = () => {
    onClose(null);
  };

  const canConfirm = facingsWideToAdd >= 1;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Facings
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {productName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Select number of facings to add (at least 1)
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1.5, fontWeight: 600, color: "text.primary" }}
            >
              Width (to the right)
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
                onClick={() =>
                  setFacingsWideToAdd((prev) => Math.max(0, prev - 1))
                }
                disabled={facingsWideToAdd <= 0}
                sx={{
                  border: "1px solid #e0e0e0",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                <Minus size={20} />
              </IconButton>
              <TextField
                type="number"
                value={facingsWideToAdd}
                onChange={(e) =>
                  setFacingsWideToAdd(clampInt(e.target.value, 0, maxAdd))
                }
                inputProps={{
                  min: 0,
                  max: maxAdd,
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
                onClick={() =>
                  setFacingsWideToAdd((prev) => Math.min(maxAdd, prev + 1))
                }
                disabled={facingsWideToAdd >= maxAdd}
                sx={{
                  border: "1px solid #e0e0e0",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                <Plus size={20} />
              </IconButton>
            </Box>
          </Box>
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
          Add Facings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFacingsDialog;

AddFacingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productName: PropTypes.string.isRequired,
  maxAdd: PropTypes.number,
};

