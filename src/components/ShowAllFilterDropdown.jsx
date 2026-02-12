import React, { useState, useRef } from "react";
import {
  Box,
  Popper,
  Paper,
  ClickAwayListener,
  IconButton,
  Typography,
  Collapse,
  Divider,
} from "@mui/material";
import { VscEye } from "react-icons/vsc";
import { AiOutlineClose } from "react-icons/ai";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFilters,
  resetFilters,
  removeFilterByValue,
} from "../redux/reducers/productDataSlice";
import { LiaBroomSolid } from "react-icons/lia";
import { IoFilter } from "react-icons/io5";

const ShowAllFilterDropdown = () => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const filters = useSelector(selectFilters);
  const dispatch = useDispatch();

  const FILTER_KEY_MAP = {
    selectedBrand: "Brand",
    selectedCategory: "Sub Category",
    selectedIntensity: "Intensity",
    selectedPlatform: "Platform",
    selectedBenchmark: "Benchmark",
    selectedNpd: "NPD",
    selectedPromoItem: "Promo Item",
    searchText: "Search",
  };

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event) => {
    if (anchorRef.current?.contains?.(event.target)) return;
    setOpen(false);
  };

  const handleRemoveFilter = (value) => {
    dispatch(removeFilterByValue(value));
  };

  const handleResetAll = () => {
    dispatch(resetFilters());
  };

  const getActiveFilters = () => {
    const allowedKeys = new Set([
      "selectedBrand",
      "selectedCategory",
      "selectedPlatform",
      "selectedIntensity",
    ]);
    const active = {};
    for (const key of Object.keys(filters)) {
      if (!allowedKeys.has(key)) continue;

      if (Array.isArray(filters[key]) && filters[key].length > 0)
        active[key] = filters[key];
    }
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <>
      <button
        className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-full px-2 py-1 border border-black"
        ref={anchorRef}
        onClick={handleToggle}
      >
        <VscEye />
        <p>Show All</p>
      </button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: 1400 }}
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
      >
        <ClickAwayListener
          onClickAway={handleClose}
          mouseEvent="onMouseDown"
          touchEvent="onTouchStart"
        >
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              borderRadius: "8px",
              overflow: "hidden",
              width: 250,
              maxHeight: 400,
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="px-1 py-2 border-b border-gray-200 font-semibold text-sm text-red-500 flex items-center gap-x-2 text-[#FF6B6B]">
              <IoFilter className="text-xl" />
              <p>All Filters </p>
            </div>
            {Object.keys(activeFilters).length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No filters applied
              </Typography>
            ) : (
              <>
                {/* Scrollable container */}
                <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
                  {Object.entries(activeFilters).map(([key, values]) => (
                    <Box key={key}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 0.5 }}
                      >
                        {FILTER_KEY_MAP[key] || key}
                      </Typography>

                      {/* Always expanded */}
                      <Collapse in={true}>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                          {values.map((val) => (
                            <Box
                              key={`${key}-${String(val)}`}
                              display="flex"
                              alignItems="center"
                              bgcolor="#f0f0f0"
                              borderRadius="16px"
                              px={2}
                              py={0.5}
                            >
                              <Typography variant="body2">{val}</Typography>
                              <IconButton
                                size="small"
                                sx={{ ml: 0.5 }}
                                aria-label={`remove filter ${val}`}
                                onClick={() => handleRemoveFilter(val)}
                              >
                                <AiOutlineClose fontSize={12} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                        <Divider />
                      </Collapse>
                    </Box>
                  ))}
                </Box>

                <button
                  className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1"
                  onClick={handleResetAll}
                >
                  <LiaBroomSolid />
                  <p>Reset All Filters</p>
                </button>
              </>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default ShowAllFilterDropdown;
