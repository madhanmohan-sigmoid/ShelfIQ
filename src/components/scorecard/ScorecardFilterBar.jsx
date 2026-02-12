import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setClusterData,
  setFilters,
  setOriginalPlanogramId,
  setSelectedPlanogramVersionId,
  selectClusterData,
  selectFilters,
  selectSelectedTab,
  selectOriginalPlanogramId,
  selectSelectedPlanogramVersionId,
  setScorecardData,
  setBrands,
  setSubCategories,
  selectBrands,
  selectSubCategories,
  selectViewMode,
  setViewMode,
} from "../../redux/reducers/scorecardSlice";
import { selectPlanogramDetails } from "../../redux/reducers/planogramVisualizerSlice";
import {
  getAttributeScoreCard,
  getClusterData,
  getScorecardData,
} from "../../api/api";
import { Autocomplete, TextField, Box, Chip } from "@mui/material";

import Checkbox from "@mui/material/Checkbox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

import { Grid3x3, ChartNoAxesColumnDecreasing } from "lucide-react";
import bar from "../../assets/bar.svg";

const ScorecardFilterBar = () => {
  const dispatch = useDispatch();

  const filters = useSelector(selectFilters);
  const clusterData = useSelector(selectClusterData);
  const activeTab = useSelector(selectSelectedTab);
  const before_planogram_id = useSelector(selectOriginalPlanogramId);
  const after_planogram_id = useSelector(selectSelectedPlanogramVersionId);
  const availableBrands = useSelector(selectBrands);
  const availableSubCategories = useSelector(selectSubCategories);
  const viewMode = useSelector(selectViewMode);
  const planogramDetails = useSelector(selectPlanogramDetails);

  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  const getValidVersions = (cluster) =>
    cluster?.planogram_details?.planogram_versions?.filter(
      (v) => v.version_number !== 0
    ) || [];

  const resolveInitialSelection = (clusters, details) => {
    if (!clusters?.length) {
      return { selectedCluster: null, selectedVersion: null };
    }

    const clusterFromPlanogram = details?.clusterName
      ? clusters.find((c) => c.cluster_name === details.clusterName)
      : null;

    const selectedCluster = clusterFromPlanogram || clusters[0];
    const validVersions = getValidVersions(selectedCluster);

    const versionFromPlanogram =
      clusterFromPlanogram && details?.version
        ? validVersions.find((v) => v.version_number === details.version)
        : null;

    return {
      selectedCluster,
      selectedVersion: versionFromPlanogram || validVersions[0] || null,
    };
  };

  // Load cluster data initially
  useEffect(() => {
    const fetchData = async () => {
      const res = await getScorecardData(
        "8514770d-3cd3-4de4-96e4-c3055df96581"
      );
      if (!res?.data?.data) return;

      const data = res.data.data;
      dispatch(setClusterData(data));

      const { selectedCluster, selectedVersion } = resolveInitialSelection(
        data?.clusters,
        planogramDetails
      );

      if (!selectedCluster) return;

      const defaultYear = data.year || "";
      const defaultStoreIds =
        selectedCluster.stores?.map((s) => s.store_id) || [];

      dispatch(
        setFilters({
          clusterName: selectedCluster.cluster_name,
          year: defaultYear,
          version: selectedVersion?.version_number || "",
          storeIds: defaultStoreIds,
        })
      );

      if (selectedCluster.planogram_details?.planogram_id) {
        dispatch(
          setOriginalPlanogramId(selectedCluster.planogram_details.planogram_id)
        );
      }

      dispatch(
        setSelectedPlanogramVersionId(selectedVersion?.planogram_id || null)
      );
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Load scorecard data when cluster/version/tab changes
  useEffect(() => {
    const fetchScorecardData = async () => {
      if (!before_planogram_id || !after_planogram_id) {
        dispatch(setScorecardData([]));
        dispatch(setBrands([]));
        dispatch(setSubCategories([]));
        dispatch(setFilters({ brands: [], subCategories: [] }));
        return;
      }

      let res;
      if (activeTab === "brand" || activeTab === "subcategory") {
        res = await getAttributeScoreCard(
          before_planogram_id,
          after_planogram_id,
          activeTab === "brand" ? "brand" : "sub_category"
        );

        if (res?.data?.data) {
          const { subCategories, brands } = extractFilters(res.data.data);

          if (activeTab === "brand") {
            dispatch(setBrands(brands));
            dispatch(setFilters({ ...filters, brands, subCategories: [] }));
          } else {
            dispatch(setSubCategories(subCategories));
            dispatch(setBrands([]));
            dispatch(setFilters({ ...filters, subCategories, brands: [] }));
          }
        }
      } else {
        res = await getClusterData(before_planogram_id, after_planogram_id);
      }

      if (res?.data?.data) {
        dispatch(setScorecardData(res.data.data));
      }
    };

    fetchScorecardData().catch((error) => {
      console.error("Failed to fetch scorecard data", error);
      dispatch(setScorecardData([]));
      dispatch(setBrands([]));
      dispatch(setSubCategories([]));
      dispatch(setFilters({ brands: [], subCategories: [] }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    before_planogram_id,
    after_planogram_id,
    activeTab,
    dispatch,
    filters.clusterName,
  ]);

  // Helpers
  const extractFilters = (data) => {
    if (!data) return { subCategories: [], brands: [] };

    const subCategories = Object.keys(data);
    const brandSet = new Set();

    subCategories.forEach((subCat) => {
      const brands = Object.keys(data[subCat]);
      brands.forEach((b) => brandSet.add(b));
    });

    return {
      subCategories,
      brands: Array.from(brandSet),
    };
  };

  // Handlers
  const handleClusterChange = (event, value) => {
    const newCluster = clusterData?.clusters?.find(
      (c) => c.cluster_name === value
    );
    if (newCluster) {
      const validVersions =
        newCluster.planogram_details?.planogram_versions?.filter(
          (v) => v.version_number !== 0
        ) || [];
      const defaultVersion = validVersions[0]?.version_number || "";
      const defaultStoreIds = newCluster.stores?.map((s) => s.store_id) || [];

      dispatch(
        setFilters({
          ...filters,
          clusterName: value || "",
          version: defaultVersion,
          storeIds: defaultStoreIds,
          year: clusterData?.year || "",
        })
      );

      if (newCluster.planogram_details?.planogram_id) {
        dispatch(
          setOriginalPlanogramId(newCluster.planogram_details.planogram_id)
        );
      }

      const v1Planogram = validVersions.find((v) => v.version_number >= 1);
      dispatch(
        setSelectedPlanogramVersionId(v1Planogram?.planogram_id || null)
      );
    }
  };

  // Generic renderer for multi-select chips
  const renderTruncatedChips = (selected) => {
    if (!selected || selected.length === 0) return null;
    if (selected.length === 1) {
      return (
        <Chip
          key={selected[0]}
          label={selected[0].substring(0, 7)}
          size="small"
        />
      );
    }
    return (
      <Chip
        key="summary"
        label={`${selected[0].substring(0, 7)}+${selected.length - 1}`}
        size="small"
      />
    );
  };

  return (
    <Box
      display="flex"
      gap={2}
      alignItems="center"
      justifyItems="between"
      width={"100%"}
    >
      <Box display="flex" gap={2} alignItems="center" flex={1}>
        {/* Cluster */}
        <Autocomplete
          size="small"
          disableClearable
          options={clusterData?.clusters?.map((c) => c.cluster_name) || []}
          value={filters.clusterName || ""}
          onChange={handleClusterChange}
          renderInput={(params) => <TextField {...params} label="Cluster" />}
          sx={{ minWidth: 160 }}
        />

        {/* Version */}
        <Autocomplete
          size="small"
          disableClearable
          options={
            clusterData?.clusters
              ?.find((c) => c.cluster_name === filters.clusterName)
              ?.planogram_details?.planogram_versions?.filter(
                (v) => v.version_number !== 0
              )
              ?.map((v) => ({
                label: `${v.short_desc || ""} (V${v.version_number})`,
                value: v.version_number,
                planogramId: v.planogram_id,
              })) || []
          }
          value={
            clusterData?.clusters
              ?.find((c) => c.cluster_name === filters.clusterName)
              ?.planogram_details?.planogram_versions?.filter(
                (v) => v.version_number !== 0
              )
              ?.map((v) => ({
                label: `${v.short_desc || ""} (V${v.version_number})`,
                value: v.version_number,
                planogramId: v.planogram_id,
              }))
              ?.find((opt) => opt.value == filters.version) || null
          }
          onChange={(event, newValue) => {
            if (newValue) {
              dispatch(setFilters({ ...filters, version: newValue.value }));
              dispatch(setSelectedPlanogramVersionId(newValue.planogramId));
            }
          }}
          renderInput={(params) => <TextField {...params} label="Version" />}
          sx={{ minWidth: 200 }}
        />

        {/* Subcategory filter */}
        {activeTab === "subcategory" && (
          <Autocomplete
            size="small"
            multiple
            disableCloseOnSelect
            options={availableSubCategories || []}
            value={filters.subCategories || []}
            onChange={(event, value) =>
              dispatch(setFilters({ ...filters, subCategories: value }))
            }
            renderTags={renderTruncatedChips}
            renderInput={(params) => (
              <TextField {...params} label="Subcategories" />
            )}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option}
              </li>
            )}
            sx={{ minWidth: 240 }}
          />
        )}

        {/* Brand filter */}
        {activeTab === "brand" && (
          <Autocomplete
            size="small"
            multiple
            disableCloseOnSelect
            options={availableBrands || []}
            value={filters.brands || []}
            onChange={(event, value) =>
              dispatch(setFilters({ ...filters, brands: value }))
            }
            renderTags={renderTruncatedChips}
            renderInput={(params) => <TextField {...params} label="Brands" />}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option}
              </li>
            )}
            sx={{ minWidth: 240 }}
          />
        )}
      </Box>

      <Box
        display="flex"
        gap={2}
        alignItems="center"
        flex={1}
        justifyContent="flex-end"
      >
        <div className=" rounded-full border border-black flex items-center h-fit   ">
          <button
            onClick={() => dispatch(setViewMode("schematic"))}
            className={`${viewMode === "schematic" ? "bg-[#CDDCEB]" : ""
              } px-3 py-2 rounded-l-full w-12 duration-500 transition-all`}
          >
            {viewMode === "schematic" ? (
              <Grid3x3 size={24} fill="#3774B1" stroke="#CDDCEB" />
            ) : (
              <Grid3x3 />
            )}
          </button>
          <button
            onClick={() => dispatch(setViewMode("graphic"))}
            className={`${viewMode === "graphic" ? "bg-[#CDDCEB] h-full" : ""
              } px-3 py-2 rounded-r-full w-12 duration-500 transition-all`}
          >
            <div className="h-6 flex items-center justify-center">
              {viewMode === "graphic" ? (
                <div className="rotate-90">
                  <ChartNoAxesColumnDecreasing
                    size={18}
                    color="#3774B1"
                    strokeWidth={4}
                  />
                </div>
              ) : (
                <img src={bar} alt="Graphic view icon" />
              )}
            </div>
          </button>
        </div>
        {/* Year */}
        {/* <Autocomplete
          size="small"
          disableClearable
          options={
            clusterData?.years || (clusterData?.year ? [clusterData.year] : [])
          }
          value={filters.year || null}
          onChange={handleYearChange}
          getOptionLabel={String}
          renderInput={(params) => <TextField {...params} label="Year" />}
          sx={{ minWidth: 120 }}
        /> */}
      </Box>
    </Box>
  );
};

export default ScorecardFilterBar;