import React from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const LEGEND_ITEMS = [
  {
    label: "Added",
    description: "Appears only in the newer planogram",
    color: "#73C6BA",
  },
  {
    label: "Removed",
    description: "Present only in the older planogram",
    color: "#CA1432",
  },
];

function Legend() {
  return (
    <div className="relative group">
      {/* Icon Button */}
      <button
        className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Show color legend"
      >
        <InfoOutlinedIcon fontSize="medium" className="text-yellow-300" />
      </button>

      {/* Popover */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
        {/* Arrow */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1">
          <div className="w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4 tracking-wide">
          Legend
        </h3>
        <div className="space-y-4">
          {LEGEND_ITEMS.map(({ label, description, color }) => (
            <div key={label} className="flex items-start gap-3 group/item">
              <div
                className="w-5 h-5 rounded flex-shrink-0 mt-0.5 border border-gray-300 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                  {label}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Legend