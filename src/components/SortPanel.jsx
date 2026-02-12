import React from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { BsSortAlphaDown, BsSortAlphaUp } from "react-icons/bs";
import PropTypes from "prop-types";

const SortPanel = ({ sortBy, onSortChange }) => {
  const fieldOptions = [
    { value: "name", label: "Name" },
    { value: "id", label: "ID" },
    { value: "price", label: "Price" },
    { value: "sales", label: "Sales" },
    { value: "volume", label: "Volume" },
  ];

  const directionOptions = [
    { value: "asc", label: "Ascending", icon: <BsSortAlphaDown /> },
    { value: "desc", label: "Descending", icon: <BsSortAlphaUp /> },
  ];

  const [currentField, currentDirection] = sortBy.split("-");

  const handleFieldChange = (field) => {
    onSortChange(`${field}-${currentDirection || "asc"}`);
  };

  const handleDirectionChange = (dir) => {
    onSortChange(`${currentField || "name"}-${dir}`);
  };

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden">
      {/* Title */}
      <div className="px-4 py-2 border-b border-gray-200 font-semibold text-sm text-red-500 flex items-center gap-x-2 text-[#FF6B6B]">
        <BiSortAlt2 className="text-xl" />
        <p>Sort By</p>
      </div>

      {/* Fields */}
      <ul>
        {fieldOptions.map((option) => {
          const isSelected = currentField === option.value;
          return (
            <li key={option.value}>
              <button
                onClick={() => handleFieldChange(option.value)}
                className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
              >
               
                <span
                  className={`w-4 h-4 mr-2 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected
                      ? "border-black bg-black"
                      : "border-gray-400 bg-white"
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                </span>

                <span
                  className={`text-sm ${
                    isSelected ? "text-black font-bold" : "text-black font-normal"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-200" />

      {/* Directions */}
      <ul>
        {directionOptions.map((option) => {
          const isSelected = currentDirection === option.value;
          return (
            <li key={option.value}>
              <button
                onClick={() => handleDirectionChange(option.value)}
                className="flex items-center gap-x-3 w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-100"
              >
                <span
                  className={`text-xl ${isSelected ? "text-black font-bold" : "text-gray-400"}`}
                >
                  {option.icon}
                </span>
                <span
                  className={`text-sm ${isSelected ? "text-black font-bold" : "text-black font-normal"}`}
                >
                  {option.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SortPanel;

SortPanel.propTypes = {
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
};
