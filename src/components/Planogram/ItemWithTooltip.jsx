import React, { useId, useState } from "react";
import PropTypes from "prop-types";

const ItemWithTooltip = ({ item, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();

  const show = () => setShowTooltip(true);
  const hide = () => setShowTooltip(false);

  return (
    <button
      type="button"
      aria-haspopup="true"
      aria-expanded={showTooltip}
      aria-describedby={showTooltip ? tooltipId : undefined}
      className="relative inline-block bg-transparent border-0 p-0 text-left"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={show}
      onTouchEnd={hide}
    >
      {children}
      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 bg-white text-gray-800 px-4 py-3 rounded-lg text-xs leading-relaxed text-left z-[1000000] shadow-xl border border-gray-200 pointer-events-none min-w-[200px] max-w-[250px] transition-opacity duration-200 ease-in-out opacity-100"
        >
          <div className="font-semibold mb-2 text-sm text-gray-900">
            {item.name}
          </div>
          <div className="text-[11px] text-gray-500 mb-1.5">
            Brand: {item.brand}
          </div>
          {item.description && (
            <div className="mb-2 text-[11px] text-gray-600 leading-snug">
              {item.description}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-2 text-[10px] text-gray-400">
            <div>
              Dimensions: {item.width} x {item.height} {item.dimensionUom}
            </div>
            <div>Facings: {item.total_facings}</div>
            <div>Linear: {item.linear} cm</div>
            <div>Orientation: {item.orientation}°</div>
          </div>
          <div className="text-[10px] text-gray-400">ID: {item.id}</div>
          <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-b-[6px] border-b-white" />
        </div>
      )}
    </button>
  );
};

export default React.memo(ItemWithTooltip);

ItemWithTooltip.propTypes = {
  item: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};
