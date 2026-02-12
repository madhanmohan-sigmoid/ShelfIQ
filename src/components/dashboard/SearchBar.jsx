import { FaSearch } from "react-icons/fa";
import ResetFilterButton from "./ResetFilterButton";
import { MdCompareArrows } from "react-icons/md";
import { Copy, ScrollText, FileEdit } from "lucide-react";
import { Tooltip } from "@mui/material";
import PropTypes from "prop-types";

function SearchBar({
  onSearchChange,
  onResetFilters,
  hasActiveFilters = false,
  canCompare = false,
  onCompare = () => {},
  showDuplicate = false,
  canDuplicate = false,
  onDuplicate = () => {},
  useOrangeTheme = false,
  showActivityLog = false,
  canViewActivityLog = false,
  onActivityLog = () => {},
  hideCompare = false,
  showApplyMassUpdate = false,
  canApplyMassUpdate = false,
  onApplyMassUpdate = () => {},
}) {
  return (
    <div className="flex w-full items-center justify-between py-4 px-6 gap-4">
      <div className="flex flex-grow max-w-xl w-full min-w-[400px] items-center gap-3">
        <div className="relative flex-grow">
          <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-4 pr-10 py-2 border border-gray-300 text-sm bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFEBBF]"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {!showDuplicate && !showActivityLog && !hideCompare && (
          <Tooltip
            title={
              canCompare
                ? "Click to compare"
                : "Please select two planograms to compare"
            }
            arrow
          >
            <span>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  canCompare
                    ? "border-[#FFD473] bg-[#FFD473] text-black focus:ring-[#FFEBBF] hover:scale-105 hover:shadow-md"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                type="button"
                disabled={!canCompare}
                onClick={onCompare}
              >
                <MdCompareArrows className="w-4 h-4" />
                <span className="text-sm font-medium">Compare</span>
              </button>
            </span>
          </Tooltip>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-3">
        {showDuplicate && (
          <Tooltip
            title={
              canDuplicate
                ? "Click to duplicate planogram"
                : "Please select a planogram to duplicate"
            }
            arrow
          >
            <span>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  canDuplicate
                    ? "border-[#FFAE80] bg-[#FFAE80] text-black focus:ring-[#FFAE80] hover:scale-105 hover:shadow-md"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                type="button"
                disabled={!canDuplicate}
                onClick={onDuplicate}
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Duplicate</span>
              </button>
            </span>
          </Tooltip>
        )}
        {showActivityLog && (
          <Tooltip
            title={
              canViewActivityLog
                ? "Click to view activity log"
                : "Please select a planogram to view activity log"
            }
            arrow
          >
            <span>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  canViewActivityLog
                    ? "border-[#BCD530] bg-[#BCD530] text-black focus:ring-[#BCD530] hover:scale-105 hover:shadow-md"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                type="button"
                disabled={!canViewActivityLog}
                onClick={onActivityLog}
              >
                <ScrollText className="w-4 h-4" />
                <span className="text-sm font-medium">Activity Log</span>
              </button>
            </span>
          </Tooltip>
        )}
        {showApplyMassUpdate && (
          <Tooltip
            title={
              canApplyMassUpdate
                ? "Click to apply mass update"
                : "Please select planograms to apply mass update"
            }
            arrow
          >
            <span>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  canApplyMassUpdate
                    ? "border-[#BCD530] bg-[#BCD530] text-black focus:ring-[#BCD530] hover:scale-105 hover:shadow-md"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                type="button"
                disabled={!canApplyMassUpdate}
                onClick={onApplyMassUpdate}
              >
                <FileEdit className="w-4 h-4" />
                <span className="text-sm font-medium">Apply Mass Update</span>
              </button>
            </span>
          </Tooltip>
        )}
        <ResetFilterButton
          onResetFilters={onResetFilters}
          hasActiveFilters={hasActiveFilters}
          useOrangeTheme={useOrangeTheme}
        />
      </div>
    </div>
  );
}

SearchBar.propTypes = {
  onSearchChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool,
  canCompare: PropTypes.bool,
  onCompare: PropTypes.func,
  showDuplicate: PropTypes.bool,
  canDuplicate: PropTypes.bool,
  onDuplicate: PropTypes.func,
  useOrangeTheme: PropTypes.bool,
  showActivityLog: PropTypes.bool,
  canViewActivityLog: PropTypes.bool,
  onActivityLog: PropTypes.func,
  hideCompare: PropTypes.bool,
  showApplyMassUpdate: PropTypes.bool,
  canApplyMassUpdate: PropTypes.bool,
  onApplyMassUpdate: PropTypes.func,
};

export default SearchBar;