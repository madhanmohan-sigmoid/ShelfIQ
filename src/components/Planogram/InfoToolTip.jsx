import React, { useState } from "react";
import { Box } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import PlanogramInfoIcon from "../../assets/PlanogramInfo.svg";
import PropTypes from "prop-types";
const InfoTooltip = ({ data }) => {
  const [hovered, setHovered] = useState(false);
  // console.log(data)
  if (!data) return null;

  const fieldLabels = {
    category: "Category",
    clusterName: "Cluster Name",
    rangeReviewName: "Range Review",
    bays: "Bays",
    shelvesCount: "Shelf Count",
    version: "Version",
    dateCreated: "Date Created",
    dateModified: "Date Last Modified",
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  return (
    <Box
      sx={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <InfoIcon sx={{ color: "#808080", ml: 1, cursor: "pointer" }} />

      {hovered && (
        <div className="absolute top-[130%] w-[540px] -translate-x-[5px] z-[200]">
          <div className="bg-white rounded-xl shadow-lg relative">
            <div className="absolute -top-2 left-[10px] w-4 h-4 transform rotate-45"></div>

            <div className="w-full rounded-t-xl flex items-center gap-x-3 p-4  border-b border-gray-200">
              <img src={PlanogramInfoIcon} alt="" className="w-5 h-5" />
              <p className="font-[500] text-[14px] text-gray-700">
                {data?.planogramId}
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-6 px-6 py-5">
              {Object.entries(fieldLabels).map(([key, label]) => {
                let value = data[key];

                if (key === "bayLength" && typeof value === "number") {
                  value = `${value} m`;
                }

                if (
                  (key === "dateCreated" || key === "dateModified") &&
                  value
                ) {
                  value = formatDate(value);
                }

                return (
                  <div
                    key={key}
                    className="flex flex-col gap-y-1 bg-[#F8F9FA] rounded-md p-3"
                  >
                    <span className="text-[13px] text-gray-500">{label}</span>
                    <span className="text-[14px] font-semibold text-black">
                      {value ?? "N/A"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default InfoTooltip;

InfoTooltip.propTypes = {
  data: PropTypes.object,
};