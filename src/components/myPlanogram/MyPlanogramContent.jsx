import React, { useRef, useCallback, useState } from "react";
import { useHeaderData } from "../header";
import SearchBar from "../dashboard/SearchBar";
import PlanogramTable from "../dashboard/PlanogramTable";
import { duplicatePlanogram } from "../../api/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMyPlanogramState } from "./useMyPlanogramState";

function MyPlanogramContent() {
  const {
    searchTerm,
    setSearchTerm,
    selectedPlanogramIds,
    setSelectedPlanogramIds,
  } = useMyPlanogramState();
  const navigate = useNavigate();
  const { selectedRegion, selectedRetailer, category } = useHeaderData();
  const tableRef = useRef();
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const handleResetFilters = useCallback(() => {
    if (tableRef.current) {
      tableRef.current.resetAllFilters();
    }
  }, []);

  const handleFilterChange = useCallback((value) => {
    const isActive = Array.isArray(value) ? value.length > 0 : Boolean(value);
    setHasActiveFilters(isActive);
  }, []);

  const handleSelectionChange = useCallback(
    (ids) => {
      setSelectedPlanogramIds(ids.slice(0, 1)); // Only allow 1 selection for duplicate
    },
    [setSelectedPlanogramIds]
  );

  const handleDuplicate = useCallback(async () => {
    if (selectedPlanogramIds.length !== 1) {
      toast.error("Please select exactly one planogram to duplicate");
      return;
    }

    const toastId = toast.loading("Duplicating planogram...");

    try {
      const response = await duplicatePlanogram(selectedPlanogramIds[0]);

      const newId = response?.data?.data?.record?.id;
      if (newId) {
        toast.dismiss(toastId);
        toast.success("Planogram duplicated successfully");
        navigate(`/my-planogram/${newId}`);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to duplicate planogram: Invalid response");
      }
    } catch (error) {
      console.error("Failed to duplicate planogram:", error);
      toast.dismiss(toastId);
      toast.error("Failed to duplicate planogram");
    }
  }, [selectedPlanogramIds, navigate]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-shrink-0">
        <SearchBar
          onSearchChange={setSearchTerm}
          selectedRegion={selectedRegion}
          selectedRetailer={selectedRetailer}
          category={category}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          showDuplicate={true}
          canDuplicate={selectedPlanogramIds.length === 1}
          onDuplicate={handleDuplicate}
          useOrangeTheme={true}
        />
        <PlanogramTable
          ref={tableRef}
          searchTerm={searchTerm}
          onFilterChange={handleFilterChange}
          onSelectionChange={handleSelectionChange}
          variant="myPlanogram"
        />
      </div>
    </div>
  );
}

export default MyPlanogramContent;

MyPlanogramContent.propTypes = {};
