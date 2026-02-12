import React, { useState } from "react";
import {
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { Trash2, Eye, ChevronRight, RotateCw, Plus } from "lucide-react";
import SelectiveFacingsDialog from "./SelectiveFacingsDialog";
import AddFacingsDialog from "./AddFacingsDialog";
import PropTypes from "prop-types";

const ProductContextMenu = ({
  anchorEl,
  open,
  onClose,
  product,
  onViewDetails,
  onRemoveAll,
  onRemoveSelective,
  onAddFacings,
  onClickToPlace,
  onChangeOrientation,
  facingsWide = 1,
  facingsHigh = 1,
}) => {
  const [selectiveDialogOpen, setSelectiveDialogOpen] = useState(false);
  const [addFacingsDialogOpen, setAddFacingsDialogOpen] = useState(false);

  const handleRemoveSelectiveClick = () => {
    setSelectiveDialogOpen(true);
  };

  const handleSelectiveDialogClose = (result) => {
    setSelectiveDialogOpen(false);
    if (result && (result.facingsWide > 0 || result.facingsHigh > 0)) {
      onRemoveSelective(result);
    }
    onClose();
  };

  const handleAddFacingsClick = () => {
    setAddFacingsDialogOpen(true);
  };

  const handleAddFacingsDialogClose = (result) => {
    setAddFacingsDialogOpen(false);
    if (result && (result.facingsWide > 0 || result.facingsHigh > 0)) {
      onAddFacings?.(result);
    }
    onClose();
  };

  const handleRemoveAll = () => {
    onRemoveAll();
    onClose();
  };

  const handleViewDetails = () => {
    onViewDetails();
    onClose();
  };

  const handleChangeOrientation = () => {
    onChangeOrientation?.();
    onClose();
  };

  const canRemoveSelective = facingsWide > 1 || facingsHigh > 1;

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <Eye size={18} />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {onClickToPlace && (
          <MenuItem
            onClick={() => {
              onClickToPlace();
              onClose();
            }}
          >
            <ListItemIcon>
              <ChevronRight size={18} />
            </ListItemIcon>
            <ListItemText>Click to place</ListItemText>
          </MenuItem>
        )}
        {onChangeOrientation && (
          <MenuItem onClick={handleChangeOrientation}>
            <ListItemIcon>
              <RotateCw size={18} />
            </ListItemIcon>
            <ListItemText>Change orientation</ListItemText>
          </MenuItem>
        )}
        {onAddFacings && (
          <MenuItem onClick={handleAddFacingsClick}>
            <ListItemIcon>
              <Plus size={18} />
            </ListItemIcon>
            <ListItemText>Add Facings</ListItemText>
            <ChevronRight size={16} style={{ marginLeft: "auto" }} />
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleRemoveAll}>
          <ListItemIcon>
            <Trash2 size={18} />
          </ListItemIcon>
          <ListItemText>Remove All</ListItemText>
        </MenuItem>
        {canRemoveSelective && (
          <MenuItem onClick={handleRemoveSelectiveClick}>
            <ListItemIcon>
              <Trash2 size={18} />
            </ListItemIcon>
            <ListItemText>Remove Selective Facings</ListItemText>
            <ChevronRight size={16} style={{ marginLeft: "auto" }} />
          </MenuItem>
        )}
      </Menu>
      {selectiveDialogOpen && (
        <SelectiveFacingsDialog
          open={selectiveDialogOpen}
          onClose={handleSelectiveDialogClose}
          maxFacingsWide={facingsWide || 1}
          maxFacingsHigh={facingsHigh || 1}
          productName={product?.name || "Product"}
        />
      )}
      {addFacingsDialogOpen && (
        <AddFacingsDialog
          open={addFacingsDialogOpen}
          onClose={handleAddFacingsDialogClose}
          productName={product?.name || "Product"}
        />
      )}
    </>
  );
};

ProductContextMenu.propTypes = {
  anchorEl: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.instanceOf(Element),
  ]),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
  onViewDetails: PropTypes.func.isRequired,
  onRemoveAll: PropTypes.func.isRequired,
  onRemoveSelective: PropTypes.func.isRequired,
  onAddFacings: PropTypes.func,
  onClickToPlace: PropTypes.func,
  onChangeOrientation: PropTypes.func,
  facingsWide: PropTypes.number,
  facingsHigh: PropTypes.number,
};

export default ProductContextMenu;

