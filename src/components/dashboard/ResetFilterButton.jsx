import React from "react";
import { FaFilter } from "react-icons/fa";
import PropTypes from "prop-types";

const ResetFilterButton = ({
  onResetFilters,
  hasActiveFilters = false,
  useOrangeTheme = false,
}) => {
  const baseClasses =
    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200";

  let stateClasses = "border-gray-300 text-gray-400 cursor-not-allowed bg-white";

  if (hasActiveFilters) {
    stateClasses = useOrangeTheme
      ? "border-[#FFAE80] bg-[#FFAE80] text-black hover:scale-105 hover:shadow-md"
      : "border-[#FFD473] bg-[#FFD473] text-black hover:scale-105 hover:shadow-md";
  }

  return (
    <button
      onClick={onResetFilters}
      disabled={!hasActiveFilters}
      className={`${baseClasses} ${stateClasses}`}
    >
      <FaFilter className="w-4 h-4" />
      <span className="text-sm font-medium">Reset Filters</span>
    </button>
  );
};

ResetFilterButton.propTypes = {
  onResetFilters: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool,
  useOrangeTheme: PropTypes.bool,
};

export default ResetFilterButton;
