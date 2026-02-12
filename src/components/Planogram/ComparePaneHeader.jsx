import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import { getAllPlanograms } from "../../api/api";
import PropTypes from "prop-types";

export default function ComparePaneHeader({
  planogramId,
  onVersionChange,
  // paneId,
  otherPanePlanogramId,
}) {
  const [clusterVersions, setClusterVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(planogramId);
  const [planogramInfo, setPlanogramInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch cluster versions for this planogram
  useEffect(() => {
    const fetchClusterVersions = async () => {
      setLoading(true);
      try {
        const res = await getAllPlanograms();
        const apiData = res.data.data;

        // Find the current planogram to get cluster info
        const currentPlanogram = apiData.records.find(
          (item) => item.id === planogramId
        );
        if (!currentPlanogram) {
          console.warn(`No planogram found for id: ${planogramId}`);
          setLoading(false);
          return;
        }

        setPlanogramInfo({
          planogramId: currentPlanogram.planogramId,
          clusterName: currentPlanogram.clusterInfo?.name || "N/A",
          clusterId: currentPlanogram.clusterInfo?.id,
        });

        // Find all versions in the same cluster
        const clusterId = currentPlanogram.clusterInfo?.id;
        if (clusterId) {
          const clusterPlanograms = apiData.records.filter(
            (item) => item.clusterInfo?.id === clusterId
          );

          const versions = clusterPlanograms.map((item) => ({
            id: item.id,
            planogramId: item.planogramId,
            version: item.versionId || 0,
            shortDesc: item.short_desc,
            clusterName: item.clusterInfo?.name || "N/A",
            dateCreated: item.createdDate,
            dateModified: item.lastModifiedDate,
            category: item.productCategoryInfo?.name || "N/A",
            rangeReviewName: item.rangeReviewInfo?.name || "N/A",
            bays: item.numberOfBays,
            shelvesCount: item.numberOfShelves,
          }));

          // Sort by version
          versions.sort((a, b) => a.version - b.version);
          setClusterVersions(versions);
        }
      } catch (error) {
        console.error("Error fetching cluster versions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusterVersions();
  }, [planogramId]);

  const handleVersionChange = (event) => {
    const newVersionId = event.target.value;
    const selectedVersionData = clusterVersions.find(
      (v) => v.id === newVersionId
    );

    setSelectedVersion(newVersionId);

    if (onVersionChange && selectedVersionData) {
      onVersionChange(newVersionId, selectedVersionData);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 56,
          maxHeight: 56,
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Loading versions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 56,
        maxHeight: 56,
        fontFamily:
          'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: "#374151",
            fontSize: "0.9rem",
          }}
        >
          {planogramInfo?.planogramId || "Loading..."}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: "0.8rem",
          }}
        >
          ({planogramInfo?.clusterName})
        </Typography>
      </Box>

      {clusterVersions.length > 1 && (
        <Select
          value={selectedVersion}
          onChange={handleVersionChange}
          size="small"
          sx={{
            minWidth: 180,
            "& .MuiSelect-select": {
              fontSize: "0.875rem",
            },
          }}
        >
          {clusterVersions.map((version) => {
            const isDisabled = version.id === otherPanePlanogramId;
            const shortDescription = version.shortDesc || "";
            const versionLabel =
              version.version === 0
                ? "Original"
                : `${shortDescription} (V${version.version})`;
            return (
              <MenuItem
                key={version.id}
                value={version.id}
                disabled={isDisabled}
                sx={{
                  ...(isDisabled && {
                    opacity: 0.5,
                    cursor: "not-allowed",
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                  }),
                }}
              >
                {versionLabel}
                {isDisabled && " (Selected in other pane)"}
              </MenuItem>
            );
          })}
        </Select>
      )}

      {/* Show single version if no alternatives */}
      {clusterVersions.length === 1 && (
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          {clusterVersions[0].version === 0
            ? "Original"
            : `V${clusterVersions[0].version}`}
        </Typography>
      )}
    </Box>
  );
}

ComparePaneHeader.propTypes = {
  planogramId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onVersionChange: PropTypes.func,
  otherPanePlanogramId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};
