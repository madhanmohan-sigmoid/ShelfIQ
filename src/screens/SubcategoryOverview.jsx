import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFilters,
  selectScorecardData,
  selectViewMode,
  setFilteredScorecardData,
} from "../redux/reducers/scorecardSlice";
import TableView from "../components/scorecard/TableView";
import AttributeGraphicView from "../components/scorecard/AttributeGraphicView";

const SubcategoryOverview = () => {
  const dispatch = useDispatch();
  const scorecardData = useSelector(selectScorecardData);
  const filters = useSelector(selectFilters);
  const viewMode = useSelector(selectViewMode)

  useEffect(() => {
    try {
      if (
        !scorecardData ||
        typeof scorecardData !== "object" ||
        Object.keys(scorecardData).length === 0
      ) {
        dispatch(setFilteredScorecardData([]));
        return;
      }

      const selectedSubcategories = Array.isArray(filters?.subCategories)
        ? filters.subCategories
        : [];

      if (selectedSubcategories.length === 0) {
        dispatch(setFilteredScorecardData([]));
        return;
      }

      const transformedData = [];

      selectedSubcategories.forEach((subcategoryName) => {
        if (!subcategoryName) return;

        const subcategoryKey = subcategoryName.toLowerCase().replace(/\s+/g, "");
        const subcategoryInfo =
          scorecardData[subcategoryName.toLowerCase()] ||
          scorecardData[subcategoryName] ||
          scorecardData[subcategoryKey];

        if (!subcategoryInfo?.before || !subcategoryInfo?.after) return;

        const beforeSales = Number(subcategoryInfo.before.avg_sales) || 0;
        const afterSales = Number(subcategoryInfo.after.avg_sales) || 0;
        const beforeSpace = Number(subcategoryInfo.before.avg_shelf_space) || 0;
        const afterSpace = Number(subcategoryInfo.after.avg_shelf_space) || 0;

        const salesLift = afterSales - beforeSales;
        const salesLiftPercent =
          beforeSales > 0 ? (salesLift / beforeSales) * 100 : 0;

        const shelfSpaceLift = afterSpace - beforeSpace;
        const shelfSpaceLiftPercent =
          beforeSpace > 0 ? (shelfSpaceLift / beforeSpace) * 100 : 0;

        transformedData.push({
          subcategory: subcategoryName?.toUpperCase() || "UNKNOWN",

          // Before data
          before_sales: beforeSales,
          before_item_count: subcategoryInfo.before.avg_unique_item_count ?? 0,
          before_facings: subcategoryInfo.before.avg_facing_count ?? 0,
          before_shelf_space: beforeSpace,
          before_shelf_share: subcategoryInfo.before.avg_shelf_share ?? 0,
          before_sales_share: subcategoryInfo.before.avg_sales_share ?? 0,

          // After data
          after_sales: afterSales,
          after_item_count: subcategoryInfo.after.avg_unique_item_count ?? 0,
          after_facings: subcategoryInfo.after.avg_facing_count ?? 0,
          after_shelf_space: afterSpace,
          after_shelf_share: subcategoryInfo.after.avg_shelf_share ?? 0,
          after_sales_share: subcategoryInfo.after.avg_sales_share ?? 0,

          // Lifts
          shelf_space_lift: shelfSpaceLift,
          shelf_space_lift_percent: shelfSpaceLiftPercent,
          sales_lift: salesLift,
          sales_lift_percent: salesLiftPercent,
        });
      });

      dispatch(setFilteredScorecardData(transformedData));
    } catch (error) {
      console.error("Error while transforming subcategory data:", error);
      dispatch(setFilteredScorecardData([])); 
    }
  }, [scorecardData, filters, dispatch]);

   return (
    <>
    {
      viewMode === 'schematic' ? (<TableView/>) : <AttributeGraphicView attributeKey={"subcategory"}/>
    }
    </>
  )
};

export default SubcategoryOverview;
