import React, { useState } from "react";
import PropTypes from "prop-types";
import { getFallbackImage } from "../../utils/productUtils";

// NOSONAR: react-beautiful-dnd draggable handles must remain divs for drag interactions
const ProductItem = ({
  provided,
  snapshot,
  item,
  onClick,
  isViewOnly,
  dimmed,
  isViolationHighlighted,
  brandColor,
  isHovered,
  onHover,
  zoomFactor = 1,
}) => {
  const [imageError, setImageError] = useState(false);

  const getCombinedTransform = () => {
    const dragTransform = provided?.draggableProps?.style?.transform || "";
    const hoverTransform = isHovered ? " translateY(-2px)" : "";
    return dragTransform + hoverTransform;
  };

  const getBoxShadow = () => {
    if (snapshot?.isDragging) {
      return "0 8px 25px rgba(0,0,0,0.15)";
    }
    if (isHovered) {
      return "0 4px 12px rgba(0,0,0,0.1)";
    }
    return "0 2px 4px  rgba(0,0,0,0.1)";
  };

  const getZIndex = () => {
    if (snapshot?.isDragging) {
      return 1000;
    }
    if (isHovered) {
      return 10;
    }
    return 0;
  };

  const getViolationHighlightStyle = () => {
    if (!isViolationHighlighted || item?.isEmpty) return {};
    const baseShadow = getBoxShadow();
    return {
      outline: "2px solid #dc2626",
      outlineOffset: "-2px",
      boxShadow: `0 0 0 2px rgba(220, 38, 38, 0.6), ${baseShadow}`,
    };
  };

  const safeZoom = Number.isFinite(zoomFactor) ? zoomFactor : 1;
  const getBaseStyle = () => ({
    width: isViewOnly ? "100%" : item.width * safeZoom,
    height: isViewOnly ? "100%" : item.height * safeZoom,
    backgroundColor: brandColor || "#ffffff",
    borderStyle: item?.isEmpty ? "none" : "solid",
    borderColor: "#e0e0e0",
    borderWidth: item?.isEmpty ? 0 : "0.01px",
    borderBottomWidth: 0,
    boxShadow: getBoxShadow(),
    zIndex: getZIndex(),
    ...getViolationHighlightStyle(),
  });

  const getDimStyle = () => {
    if (!dimmed) {
      return {};
    }
    return {
      opacity: 0.3,
      filter: "grayscale(80%)",
      pointerEvents: "none",
    };
  };

  const getImageStyle = () => {
    const style = {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      mixBlendMode: brandColor ? "multiply" : "normal",
      position: isViewOnly ? "absolute" : "relative",
      imageRendering: "crisp-edges",
    };
    if (isViewOnly) {
      style.top = 0;
      style.left = 0;
    }
    return style;
  };

  const getFallbackDivStyle = () => {
    const style = {
      backgroundColor: brandColor || "white",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      position: isViewOnly ? "absolute" : "relative",
    };
    if (isViewOnly) {
      style.top = 0;
      style.left = 0;
    }
    return style;
  };

  const renderContent = () => {
    const imageStyle = getImageStyle();
    const fallbackImage = getFallbackImage(item);

    if (!imageError && item.image_url) {
      return (
        <img
          src={item.image_url}
          alt={item.name || "product"}
          style={imageStyle}
          onError={() => setImageError(true)}
          draggable={false}
        />
      );
    }

    if (fallbackImage) {
      return (
        <img
          src={fallbackImage}
          alt="fallback"
          style={imageStyle}
          draggable={false}
        />
      );
    }

    return <div style={getFallbackDivStyle()} />;
  };

  const baseClass =
    "flex items-center justify-center overflow-hidden relative cursor-pointer  ";

  const handleMouseEnter = () => {
    onHover?.(item.product_id);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  const handleKeyDown = (e) => {
    if (dimmed) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const getAriaLabel = () => {
    if (item?.isEmpty) return "Empty slot";
    if (item?.name) return `Select product: ${item.name}`;
    return "Select product";
  };
  const ariaLabel = getAriaLabel();
  const isInteractive = !dimmed;
  const tabIndex = isInteractive ? 0 : -1;

  if (!provided) {
    return (
      <div
        className={baseClass}
        style={{
          ...getBaseStyle(),
          ...getDimStyle(),
          transform: isHovered ? "scale(1.1)" : "scale(1)",
        }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={tabIndex}
        role="button"
        aria-label={ariaLabel}
        aria-disabled={!isInteractive}
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={baseClass}
      style={{
        ...getBaseStyle(),
        ...provided.draggableProps.style,
        ...getDimStyle(),
        transform: getCombinedTransform(),
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={tabIndex}
      role="button"
      aria-label={ariaLabel}
      aria-disabled={!isInteractive}
    >
      {renderContent()}
    </div>
  );
};

export default React.memo(ProductItem);

ProductItem.propTypes = {
  provided: PropTypes.object,
  snapshot: PropTypes.object,
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  isViewOnly: PropTypes.bool.isRequired,
  dimmed: PropTypes.bool,
  isViolationHighlighted: PropTypes.bool,
  brandColor: PropTypes.string,
  isHovered: PropTypes.bool.isRequired,
  onHover: PropTypes.func.isRequired,
  zoomFactor: PropTypes.number,
};