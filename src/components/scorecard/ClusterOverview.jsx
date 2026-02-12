import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectFilters,
  selectScorecardData,
  selectScorecardLoading,
  selectViewMode,
} from "../../redux/reducers/scorecardSlice";
import KPIComparisonTable from "./KPIComparisonTable";
import {
  filterKPIDataBySelection,
  filterSubcategoryBrandData,
  filterScorecardDataWithLift,
  filterScorecardDataByProductView,
} from "../../utils/scorecardFilterUtils";
import ClusterGraphicViewNew from "./ClusterGraphicView";
import SubcategoryClusterGraphicView from "./SubcategoryClusterGraphicView";

const ClusterOverview = () => {
  const [loading] = useState(false);
  const [error] = useState(null);
  const scorecardData = useSelector(selectScorecardData);
  const scorecardLoading = useSelector(selectScorecardLoading);
  const viewMode = useSelector(selectViewMode);
  const filters = useSelector(selectFilters);

  const currentView = filters?.scorecardView || "Category Overview";
  const isSubCategoryOverview = currentView === "Performance Overview";

  const filteredClusterData = useMemo(() => {
    const baseFiltered = (() => {
      if (!isSubCategoryOverview) {
        return filterKPIDataBySelection(scorecardData, filters?.kpi);
      }

      // For Performance Overview (DS module), KPI filtering should apply at the metric layer:
      // categoryKey -> metricKey -> groupKey (subcat/brand).
      const kpiFiltered = filterKPIDataBySelection(scorecardData, filters?.kpi);

      return filterSubcategoryBrandData(
        kpiFiltered,
        filters?.subCategoryFilter,
        filters?.brandFilter,
        {
          hierarchy_1: filters?.hierarchy_1,
          hierarchy_2: filters?.hierarchy_2,
          hierarchy2Filter: filters?.hierarchy2Filter,
        }
      );
    })();

    // Apply Product View filter
    const productViewFiltered = filterScorecardDataByProductView(
      baseFiltered,
      filters?.productView,
      isSubCategoryOverview ? "Performance Overview" : "Category Overview"
    );

    if (!filters?.showLiftKPIs) return productViewFiltered;

    return filterScorecardDataWithLift(
      productViewFiltered,
      isSubCategoryOverview ? "Performance Overview" : "Category Overview"
    );
  }, [
    scorecardData,
    filters?.kpi,
    filters?.subCategoryFilter,
    filters?.brandFilter,
    filters?.productView,
    filters?.showLiftKPIs,
    isSubCategoryOverview,
  ]);

  // Loading State
  if (loading || scorecardLoading) {
    return (
      <div className="flex flex-col h-full w-full  px-6 py-4">
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading scorecard data...
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col h-full w-full  px-6 py-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Cluster Overview
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-red-500">
          <h4 className="text-lg font-medium mb-2">Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // No Data State
  let hasData = false;

  if (isSubCategoryOverview) {
    // For Performance Overview, scorecardData is expected to be an object
    // keyed by subcategory (e.g., "toothpaste"), each with before/after.
    hasData =
      scorecardData &&
      typeof scorecardData === "object" &&
      Object.keys(scorecardData).length > 0;
  } else {
    const beforeData = scorecardData?.before;
    const afterData = scorecardData?.after;
    hasData = !!beforeData && !!afterData;
  }

  if (!hasData) {
    return (
      <div className="flex flex-col h-full w-full  px-6 py-4">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <h4 className="text-lg font-medium mb-2">No Data Available</h4>
          <p>No cluster data available. Please check your selection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full py-4 ">
      {/* Header */}

      {/* Scrollable Content that takes remaining space */}
      <div className="flex-1 overflow-auto ">
        {(() => {
          if (viewMode === "schematic") {
            return (
              <div className="">
                <div className="">
                  <KPIComparisonTable
                    view={currentView}
                    data={filteredClusterData || scorecardData}
                  />
                </div>
              </div>
            );
          }

          if (isSubCategoryOverview) {
            return (
              <SubcategoryClusterGraphicView
                data={filteredClusterData || scorecardData}
              />
            );
          }

          return (
            <ClusterGraphicViewNew
              data={filteredClusterData || scorecardData}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default ClusterOverview;
