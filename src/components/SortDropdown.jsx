import React, { useState, useRef } from "react";
import { Popper, Paper, ClickAwayListener } from "@mui/material";
import SortPanel from "./SortPanel";
import { BiSortAlt2 } from "react-icons/bi";
import PropTypes from "prop-types";

const SortDropdown = ({ sortBy, onSortChange }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current?.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleSortChange = (newSortBy) => {
    onSortChange(newSortBy);
    setOpen(false);
  };

  return (
    <>
      <button
        className="flex items-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1"
        ref={anchorRef}
        onClick={handleToggle}
      >
        <BiSortAlt2 className="text-xl font-normal" />
        <p>Sort By</p>
      </button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1400 }}
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              borderRadius: "8px",
              overflow: "hidden",
              minWidth: 180,
            }}
          >
            <SortPanel sortBy={sortBy} onSortChange={handleSortChange} />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default SortDropdown;

SortDropdown.propTypes = {
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
};
