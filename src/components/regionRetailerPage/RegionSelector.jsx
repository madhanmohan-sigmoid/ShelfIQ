import React from "react";
import PropTypes from "prop-types";

const REGIONS = [
  { name: "North America" },
  { name: "APAC" },
  { name: "EMEA" },
  { name: "LATAM" }
];

const RegionSelector = ({ selectedRegion, onRegionSelect }) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-medium text-center mt-6 mb-2">Select Your Region</h2>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {REGIONS.map((region) => (
          <button
            key={region.name}
            onClick={() => onRegionSelect(region.name)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
              selectedRegion === region.name
                ? "bg-[#00B097] text-white border-[#00B097]"
                : "bg-white text-gray-800 border-gray-300 hover:border-[#00B097] hover:bg-[#f0fdfa]"
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionSelector; 

RegionSelector.propTypes = {
  selectedRegion: PropTypes.string,
  onRegionSelect: PropTypes.func.isRequired,
};