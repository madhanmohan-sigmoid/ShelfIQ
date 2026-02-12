import { Skeleton } from "@mui/material";
import React from "react";
import ConstructionIcon from "@mui/icons-material/Construction";
import PropTypes from "prop-types";

const FullScreenPlanogramLoader = ({ isOrangeTheme = false }) => {
  return (
    <div
      data-testid="fullscreen-planogram-loader"
      className="fixed inset-0 z-[200000] bg-white flex flex-col p-5 gap-4 cursor-wait"
    >
      {/* Planogram bay skeleton */}
      <div className="flex flex-1 items-center justify-center gap-1 overflow-hidden relative mt-[250px]">
        <Skeleton
          variant="rectangular"
          width="calc(100vw - 5vw)"
          height={400}
          animation="wave"
          sx={{ borderRadius: "5px" }}
          data-testid="planogram-skeleton"
        />

        {/* Overlay Text and Icon */}
        <div className="absolute text-container w-full h-full flex items-center justify-center">
          <div className="flex items-center gap-2 shimmer-text-container">
            <ConstructionIcon
              fontSize="large"
              className="text-yellow-700 animate-bounce"
            />
            <h1
              className="shimmer-text text-3xl font-bold tracking-wide"
              style={{ color: isOrangeTheme ? "#FF782C" : "#FFB000" }}
            >
              LET&apos;S PLAN IT TOGETHER
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-center gap-2.5 mt-4">
        {["search", "filter", "sort", "save", "download", "share"].map(
          (action) => (
            <Skeleton
              key={`planogram-action-${action}`}
              variant="rectangular"
              width={37}
              height={40}
              sx={{ borderRadius: "5px" }}
              data-testid="planogram-button-skeleton"
            />
          )
        )}
      </div>
    </div>
  );
};

FullScreenPlanogramLoader.propTypes = {
  isOrangeTheme: PropTypes.bool,
};

export default FullScreenPlanogramLoader;
