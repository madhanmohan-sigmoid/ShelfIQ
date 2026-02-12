import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectFilters,
  selectScorecardData,
  selectViewMode,
  setFilteredScorecardData,
} from "../redux/reducers/scorecardSlice";
import TableView from "../components/scorecard/TableView";
import AttributeGraphicView from "../components/scorecard/AttributeGraphicView";

const BrandOverview = () => {
  const dispatch = useDispatch();
  const brandData = useSelector(selectScorecardData);
  const filters = useSelector(selectFilters);
  const viewMode = useSelector(selectViewMode);

  useEffect(() => {
    try {
      if (!brandData || typeof brandData !== "object" || Object.keys(brandData).length === 0) {
        dispatch(setFilteredScorecardData([]));
        return;
      }

      const selectedBrands = Array.isArray(filters?.brands) ? filters.brands : [];
      if (selectedBrands.length === 0) {
        dispatch(setFilteredScorecardData([]));
        return;
      }

      const transformedData = [];

      Object.keys(brandData).forEach((categoryName) => {
        const categoryBrands = brandData[categoryName];
        if (!categoryBrands || typeof categoryBrands !== "object") return;

        Object.keys(categoryBrands).forEach((brandName) => {
          if (!selectedBrands.includes(brandName.toUpperCase())) return;

          const brandInfo = categoryBrands[brandName];
          if (!brandInfo?.before || !brandInfo?.after) return;

          const beforeSales = Number(brandInfo.before.sales) || 0;
          const afterSales = Number(brandInfo.after.sales) || 0;
          const beforeSpace = Number(brandInfo.before.total_space) || 0;
          const afterSpace = Number(brandInfo.after.total_space) || 0;

          const salesLift = afterSales - beforeSales;
          const salesLiftPercent = beforeSales > 0 ? (salesLift / beforeSales) * 100 : 0;

          const shelfSpaceLift = afterSpace - beforeSpace;
          const shelfSpaceLiftPercent = beforeSpace > 0 ? (shelfSpaceLift / beforeSpace) * 100 : 0;

          transformedData.push({
            subcategory: categoryName?.toUpperCase() || "UNKNOWN",
            brand: brandName?.toUpperCase() || "UNKNOWN",

            // Before
            before_sales: beforeSales,
            before_item_count: brandInfo.before.unique_item_count ?? 0,
            before_facings: brandInfo.before.total_facings ?? 0,
            before_shelf_space: beforeSpace,
            before_shelf_share: brandInfo.before.shelf_share ?? 0,
            before_sales_share: brandInfo.before.sales_share ?? 0,

            // After
            after_sales: afterSales,
            after_item_count: brandInfo.after.unique_item_count ?? 0,
            after_facings: brandInfo.after.total_facings ?? 0,
            after_shelf_space: afterSpace,
            after_shelf_share: brandInfo.after.shelf_share ?? 0,
            after_sales_share: brandInfo.after.sales_share ?? 0,

            // Lift
            shelf_space_lift: shelfSpaceLift,
            shelf_space_lift_percent: shelfSpaceLiftPercent,
            sales_lift: salesLift,
            sales_lift_percent: salesLiftPercent,
          });
        });
      });

      dispatch(setFilteredScorecardData(transformedData));
    } catch (error) {
      console.error("Error while transforming brand data:", error);
      dispatch(setFilteredScorecardData([])); 
    }
  }, [brandData, filters, dispatch]);

 return(
    <>
    {
      viewMode === 'schematic' ? (<TableView/>) : <AttributeGraphicView attributeKey={"brand"}/>
    }
    </>
  )
};

export default BrandOverview;