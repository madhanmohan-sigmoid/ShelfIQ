import React from "react";
import { Modal, Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { IoFilter } from "react-icons/io5";
import { LiaBroomSolid } from "react-icons/lia";
import { FaCheckCircle } from "react-icons/fa";
import PropTypes from "prop-types";

const FilterModalWrapper = ({
  open,
  onClose,
  onReset,
  onApply,
  children,
  themeColor = "#FFB000", // Default to product library color
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          maxWidth: "90vw",
          maxHeight: "90vh",
          bgcolor: "background.paper",
          borderRadius: 6,
          boxShadow: 24,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between  border-b px-8 py-4">
          <div
            className="flex items-center gap-x-3 text-sm font-semibold"
            style={{ color: themeColor }}
          >
            <IoFilter size={20} />
            <p>All Filters</p>
          </div>
          <IconButton onClick={onClose} aria-label="Close filters" size="small">
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </div>

        {/* Content */}
        <div className="p-3 max-h-[60vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        <div className="flex w-full justify-between text-sm font-semibold border-t">
          <button
            onClick={onReset}
            className="w-[50%] p-4 flex items-center justify-center gap-x-3 border-r hover:bg-[#f0f0f0]"
          >
            <LiaBroomSolid size={20} />
            <p>Reset All Filters</p>
          </button>
          <button
            onClick={onApply}
            className="w-[50%] p-4 flex items-center justify-center gap-x-3 hover:bg-[#f0f0f0]"
          >
            <p>Apply</p>
            <FaCheckCircle size={16} />
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default FilterModalWrapper;

FilterModalWrapper.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  children: PropTypes.node,
  themeColor: PropTypes.string,
};
