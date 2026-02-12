// src/components/header/components/ContextSection.jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import GlobeIcon from "../../../assets/Globe Surface.svg";
import BuildingIcon from "../../../assets/Building Shop.svg";
import DockIcon from "../../../assets/Extended Dock.svg";

// ---- Reusable mini component for each chip
function Pill({ icon, alt, label, value, onClick, clickable }) {
  const isInteractive = clickable && !!value;
  const baseClassName = `flex items-center gap-2 px-4 py-2 rounded-full bg-white ${
    isInteractive ? "cursor-pointer hover:bg-gray-100" : ""
  }`;

  const content = (
    <>
      <img src={icon} alt={alt} className="w-6 h-6" />
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] text-gray-500">{label}</span>
        <span className="text-[10px] font-bold text-gray-800 uppercase pt-0.5">
          {value || "-"}
        </span>
      </div>
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        className={`${baseClassName} border-0 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        onClick={() => onClick(value)}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}

Pill.propTypes = {
  icon: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onClick: PropTypes.func.isRequired,
  clickable: PropTypes.bool,
};

const Separator = () => <div className="w-px h-6 bg-gray-200" />;

function ContextSection({
  selectedRegion,
  selectedRetailer,
  category,
  clickable = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  // ---- State for context values
  const [contextValues, setContextValues] = useState({
    region: selectedRegion || "",
    retailer: selectedRetailer || "",
    category: category || "",
  });

  // ---- Load values from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("contextValues");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContextValues((prev) => ({
          region: prev.region || parsed.region || "",
          retailer: prev.retailer || parsed.retailer || "",
          category: prev.category || parsed.category || "",
        }));
      } catch {
        // ignore bad JSON
      }
    }
  }, []);

  // ---- Save values to localStorage whenever props change
  useEffect(() => {
    const valuesToStore = {
      region: selectedRegion || contextValues.region || "",
      retailer: selectedRetailer || contextValues.retailer || "",
      category: category || contextValues.category || "",
    };

    // Only persist if at least one value exists
    if (
      valuesToStore.region ||
      valuesToStore.retailer ||
      valuesToStore.category
    ) {
      localStorage.setItem("contextValues", JSON.stringify(valuesToStore));
      setContextValues(valuesToStore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, selectedRetailer, category]);

  // ---- Hide on pages where you don’t want the context bar (optional)
  const isPath = (path) => location.pathname.startsWith(path);
  // Example rule from your screenshots: hide on /region page
  if (isPath("/region")) return null;

  // ---- Hide if there’s no context yet
  if (
    !contextValues.region &&
    !contextValues.retailer &&
    !contextValues.category
  )
    return null;

  // ---- Click handler (navigate with the selected value as query)
  const handleClick = (value) => {
    if (!clickable) return;
    navigate(`/region?selected=${encodeURIComponent(value || "")}`);
  };

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm w-fit">
      <Pill
        icon={GlobeIcon}
        alt="Region"
        label="Region"
        value={contextValues.region}
        onClick={handleClick}
        clickable={clickable}
      />
      <Separator />
      <Pill
        icon={BuildingIcon}
        alt="Retailer"
        label="Retailer"
        value={contextValues.retailer}
        onClick={handleClick}
        clickable={clickable}
      />
      <Separator />
      <Pill
        icon={DockIcon}
        alt="Category"
        label="Category"
        value={contextValues.category}
        onClick={handleClick}
        clickable={clickable}
      />
    </div>
  );
}

ContextSection.propTypes = {
  selectedRegion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedRetailer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  category: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  clickable: PropTypes.bool,
};

export default ContextSection;
