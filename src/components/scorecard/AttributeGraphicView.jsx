import React from "react";
import PropTypes from "prop-types";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSelector } from "react-redux";
import { selectFilteredScorecardData } from "../../redux/reducers/scorecardSlice";

const AttributeGraphicView = ({ attributeKey }) => {
  const data = useSelector(selectFilteredScorecardData);

  const accordianData = [
    {
      title: "Sales Amount (£)",
      beforeKey: "before_sales",
      afterKey: "after_sales",
      type: "currency",
    },
    {
      title: "Item Count",
      beforeKey: "before_item_count",
      afterKey: "after_item_count",
      type: "number",
    },
    {
      title: "Facings",
      beforeKey: "before_facings",
      afterKey: "after_facings",
      type: "number",
    },
    {
      title: "Shelf Space",
      beforeKey: "before_shelf_space",
      afterKey: "after_shelf_space",
      type: "number",
    },
    {
      title: "Shelf Share %",
      beforeKey: "before_shelf_share",
      afterKey: "after_shelf_share",
      type: "percent",
    },
    {
      title: "Sales Share %",
      beforeKey: "before_sales_share",
      afterKey: "after_sales_share",
      type: "percent",
    },
  ];

  const formatValue = (val, type) => {
    if (!val || val === 0) return ""; // hide zero
    if (type === "currency") return `£ ${val.toFixed(2)}`;
    if (type === "percent") return `${val.toFixed(2)}%`;
    return val.toFixed(2);
  };

  const groupBySubcategory = (data) => {
    return data.reduce((acc, item) => {
      const subcat = item.subcategory || "UNKNOWN";
      if (!acc[subcat]) acc[subcat] = [];
      acc[subcat].push(item);
      return acc;
    }, {});
  };

  return (
    <Box className="flex flex-col h-full w-full">
      {accordianData.map((metric, idx) => {
        if (attributeKey === "brand") {
          const grouped = groupBySubcategory(data);

          return (
            <Accordion key={metric.beforeKey} defaultExpanded={idx === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">{metric.title}</Typography>
              </AccordionSummary>

              <AccordionDetails>
                {Object.entries(grouped).map(([subcat, brands]) => {
                  const subcatMax = Math.max(
                    ...brands.map((d) =>
                      Math.max(
                        d[metric.beforeKey] ?? 0,
                        d[metric.afterKey] ?? 0
                      )
                    ),
                    1
                  );

                  return (
                    <Accordion key={subcat} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight="bold" className="text-blue-600">
                          {subcat.toUpperCase()}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <div className="w-full flex justify-end mb-2">
                          After
                        </div>
                        <div className="flex flex-col space-y-3 w-full">
                          {brands.map((attribute) => {
                            let beforeVal = attribute[metric.beforeKey] ?? 0;
                            let afterVal = attribute[metric.afterKey] ?? 0;
                            let diff = afterVal - beforeVal;

                            beforeVal = Number.parseFloat(beforeVal.toFixed(2));
                            afterVal = Number.parseFloat(afterVal.toFixed(2));
                            diff = Number.parseFloat(diff.toFixed(2));

                            const isPositive = diff >= 0;
                            const beforeWidth = (beforeVal / subcatMax) * 100;

                            const brandIdentifier =
                              attribute.brand ??
                              attribute.brand_id ??
                              attribute.brandId ??
                              attribute.sku ??
                              attribute.id ??
                              attribute.upc ??
                              attribute.gtin ??
                              attribute.ean ??
                              attribute.name ??
                              "unknown";

                            return (
                              <div
                                key={`${metric.beforeKey}-${subcat}-${brandIdentifier}`}
                                className="grid grid-cols-12 items-center gap-2 w-full border-b pb-3"
                              >
                                {/* Brand */}
                                <Typography className="font-medium text-sm col-span-2 truncate">
                                  {attribute.brand?.toUpperCase() || "UNKNOWN"}
                                </Typography>

                                {/* Bar Section */}
                                <div className="col-span-8 flex items-center relative truncate whitespace-nowrap">
                                  <Tooltip
                                    title={formatValue(beforeVal, metric.type)}
                                    arrow
                                    placement="top"
                                  >
                                    <div
                                      className="h-6 rounded-l-2xl rounded-r-full relative"
                                      style={{
                                        width: `${beforeWidth}%`,
                                        backgroundColor: "#3774B1",
                                      }}
                                    >
                                      {/* Before Value inside bar */}
                                      {beforeVal !== 0 && beforeWidth > 5 && (
                                        <span
                                          className={`absolute top-1/2 -translate-y-1/2 text-[11px] w-fit font-medium text-white ${
                                            isPositive
                                              ? "right-2"
                                              : "right-[3.6rem]"
                                          }`}
                                        >
                                          {formatValue(beforeVal, metric.type)}
                                        </span>
                                      )}

                                      {/* Negative Diff inside bar */}
                                      {!isPositive && diff !== 0 && (
                                        <span
                                          className="absolute right-0 text-[11px] top-1/2 -translate-y-1/2 px-0.5 py-1 rounded-r-full font-semibold"
                                          style={{
                                            backgroundColor: "#FF782C",
                                            color: "#000",
                                          }}
                                        >
                                          {formatValue(diff, metric.type)}
                                        </span>
                                      )}
                                    </div>
                                  </Tooltip>

                                  {/* Positive Diff always right of blue bar */}
                                  {isPositive && diff !== 0 && (
                                    <span
                                      className=" px-2 py-1 rounded-full text-[11px] font-semibold"
                                      style={{
                                        backgroundColor: "#BCD530",
                                        color: "#000",
                                      }}
                                    >
                                      +{formatValue(diff, metric.type)}
                                    </span>
                                  )}
                                </div>

                                {/* After Value */}
                                <div className="col-span-2 text-right font-semibold text-sm">
                                  {afterVal !== 0 &&
                                    formatValue(afterVal, metric.type)}
                                </div>
                              </div>
                            );
                          })}
                          {/* Legend at the bottom */}
                          <div className="flex justify-center items-center mt-3 gap-x-4">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#3774B1]" />
                              <span className="text-xs">Before</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#BCD530]" />
                              <span className="text-xs">+ve Lift</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#FF782C]" />
                              <span className="text-xs">-ve Lift</span>
                            </div>
                          </div>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          );
        } else {
          const globalMax = Math.max(
            ...data.map((d) =>
              Math.max(d[metric.beforeKey] ?? 0, d[metric.afterKey] ?? 0)
            ),
            1
          );

          return (
            <Accordion key={metric.beforeKey} defaultExpanded={idx === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">{metric.title}</Typography>
              </AccordionSummary>

              <AccordionDetails>
                <div className="w-full flex justify-end mb-2">After</div>
                <div className="flex flex-col space-y-3 w-full">
                  {data.map((attribute) => {
                    let beforeVal = attribute[metric.beforeKey] ?? 0;
                    let afterVal = attribute[metric.afterKey] ?? 0;
                    let diff = afterVal - beforeVal;

                    beforeVal = Number.parseFloat(beforeVal.toFixed(2));
                    afterVal = Number.parseFloat(afterVal.toFixed(2));
                    diff = Number.parseFloat(diff.toFixed(2));

                    const isPositive = diff >= 0;
                    const beforeWidth = (beforeVal / globalMax) * 100;

                    const attributeIdentifier =
                      attribute[attributeKey] ??
                      attribute.id ??
                      attribute.sku ??
                      attribute.brand ??
                      attribute.subcategory ??
                      "unknown";

                    return (
                      <div
                        key={`${metric.beforeKey}-${attributeIdentifier}`}
                        className="grid grid-cols-12 items-center gap-2 w-full border-b pb-3"
                      >
                        {/* Subcategory */}
                        <Typography className="font-medium text-sm col-span-2 truncate">
                          {attribute[attributeKey]?.toUpperCase() || "UNKNOWN"}
                        </Typography>

                        {/* Bar Section */}
                        <div className="col-span-8 flex items-center relative whitespace-nowrap">
                          <Tooltip
                            title={formatValue(beforeVal, metric.type)}
                            arrow
                            placement="top"
                          >
                            <div
                              className="h-6 rounded-l-2xl rounded-r-full relative"
                              style={{
                                width: `${beforeWidth}%`,
                                backgroundColor: "#3774B1",
                              }}
                            >
                              {/* Before Value inside bar */}
                              {beforeVal !== 0 && beforeWidth > 5 && (
                                <span
                                  className={`absolute top-1/2 -translate-y-1/2 text-[11px] font-medium text-white ${
                                    isPositive ? "right-2" : "right-[3.6rem]"
                                  }`}
                                >
                                  {formatValue(beforeVal, metric.type)}
                                </span>
                              )}

                              {/* Negative Diff inside bar */}
                              {!isPositive && diff !== 0 && (
                                <span
                                  className="absolute right-0 text-[11px] top-1/2 -translate-y-1/2 px-0.5 py-1 rounded-r-full font-semibold"
                                  style={{
                                    backgroundColor: "#FF782C",
                                    color: "#000",
                                  }}
                                >
                                  {formatValue(diff, metric.type)}
                                </span>
                              )}
                            </div>
                          </Tooltip>

                          {/* Positive Diff always right of blue bar */}
                          {isPositive && diff !== 0 && (
                            <span
                              className=" px-2 py-1 rounded-full text-[11px] font-semibold"
                              style={{
                                backgroundColor: "#BCD530",
                                color: "#000",
                              }}
                            >
                              +{formatValue(diff, metric.type)}
                            </span>
                          )}
                        </div>

                        {/* After Value */}
                        <div className="col-span-2 text-right font-semibold text-sm">
                          {afterVal !== 0 && formatValue(afterVal, metric.type)}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-center items-center mt-3 gap-x-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-[#3774B1]" />
                      <span className="text-xs">Before</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-[#BCD530]" />
                      <span className="text-xs">+ve Lift</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-[#FF782C]" />
                      <span className="text-xs">-ve Lift</span>
                    </div>
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
          );
        }
      })}
    </Box>
  );
};

export default AttributeGraphicView;

AttributeGraphicView.propTypes = {
  attributeKey: PropTypes.oneOf(["brand", "subcategory"]).isRequired,
};
