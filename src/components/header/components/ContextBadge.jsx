import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

function ContextBadge({ label, value, className = "", clickable = true }) {
  const navigate = useNavigate();
  
  if (!value) return null;

  const handleClick = () => {
    if (!clickable) return;
    // Pass the selected value as a URL parameter
    navigate(`/region?selected=${encodeURIComponent(value)}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600">{label}:</span>
      {clickable ? (
        <button
          type="button"
          className={`px-2 py-1 bg-[#00B097] text-white rounded-md font-medium transition-colors duration-200 cursor-pointer hover:bg-[#00947F] ${className}`}
          onClick={handleClick}
          onTouchStart={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          {value}
        </button>
      ) : (
        <span
          className={`px-2 py-1 bg-[#00B097] text-white rounded-md font-medium transition-colors duration-200 cursor-default ${className}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

ContextBadge.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  className: PropTypes.string,
  clickable: PropTypes.bool,
};

export default ContextBadge; 