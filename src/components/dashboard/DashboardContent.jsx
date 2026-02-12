import SearchBar from "./SearchBar";
import PlanogramTable from "./PlanogramTable";
import { useHeaderData } from "../header";
import React, { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

function DashboardContent({ searchTerm, onSearchChange }) {
  const { selectedRegion, selectedRetailer, category } = useHeaderData();
  const planogramTableRef = useRef();
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  const handleResetFilters = useCallback(() => {
    if (planogramTableRef.current) {
      planogramTableRef.current.resetAllFilters();
    }
  }, []);

  const handleFilterChange = useCallback((value) => {
    // PlanogramTable may pass a boolean (from checkActiveFilters)
    // or an array of rows (from search effect). Normalize to boolean.
    const isActive =
      Array.isArray(value) ? value.length > 0 : Boolean(value);
    setHasActiveFilters(isActive);
  }, []);

  const handleSelectionChange = useCallback((ids) => {
    setSelectedIds(ids.slice(0, 2));
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedIds.length === 2) {
      const [left, right] = selectedIds;
      const url = `/compare?left=${encodeURIComponent(
        left
      )}&right=${encodeURIComponent(right)}`;
      navigate(url);
    }
  }, [selectedIds, navigate]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-shrink-0">
        <SearchBar
          onSearchChange={onSearchChange}
          selectedRegion={selectedRegion}
          selectedRetailer={selectedRetailer}
          category={category}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          canCompare={selectedIds.length === 2}
          onCompare={handleCompare}
        />
        <PlanogramTable
          ref={planogramTableRef}
          searchTerm={searchTerm}
          onFilterChange={handleFilterChange}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
}

DashboardContent.propTypes = {
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
};

export default DashboardContent;
