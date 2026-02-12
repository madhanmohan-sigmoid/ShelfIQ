import { AgGridReact } from "ag-grid-react";
import "../../App.css";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { ModuleRegistry, ClientSideRowModelModule } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAllPlanograms, getMyPlanograms } from "../../api/api";
import MultiFilter from "../MultiFilter";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const isNumericSearch = (term) => /^\d+$/.test(term);

const isDateSearch = (term) => {
  // Match patterns like "5 apr", "5 april", "apr 5", "april 5"
  const datePattern = /^(\d{1,2}\s+[a-z]{3,}|[a-z]{3,}\s+\d{1,2})$/i;
  return datePattern.test(term);
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  // Get both short and full month names for flexible matching
  const shortMonth = date
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();
  const fullMonth = date
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();
  const day = date.getDate();
  return `${day} ${shortMonth} ${fullMonth}`; // Include both formats for matching
};

const dateContainsAllParts = (dateValue, parts) => {
  const normalizedDate = normalizeDate(dateValue);
  for (const part of parts) {
    if (!normalizedDate.includes(part.toLowerCase())) {
      return false;
    }
  }
  return true;
};

const hasMatchingDate = (row, parts) => {
  const dates = [row.dateCreated, row.dateModified];
  for (const date of dates) {
    if (dateContainsAllParts(date, parts)) {
      return true;
    }
  }
  return false;
};

const createRowMatcher = (searchValue) => {
  const normalizedTerm = (searchValue ?? "").toLowerCase().trim();
  const normalizeValue = (v) => String(v ?? "").toLowerCase();

  if (!normalizedTerm) {
    return () => true;
  }

  if (isNumericSearch(normalizedTerm)) {
    return (row) =>
      String(row.bays) === normalizedTerm ||
      String(row.shelvesCount) === normalizedTerm;
  }

  if (isDateSearch(normalizedTerm)) {
    const searchParts = normalizedTerm.split(/\s+/);
    return (row) => hasMatchingDate(row, searchParts);
  }

  const textColumns = [
    "planogramId",
    "projectName",
    "category",
    "clusterName",
    "version",
    "rangeReviewName",
  ];

  return (row) =>
    textColumns.some((col) =>
      normalizeValue(row[col]).includes(normalizedTerm)
    );
};

const pushSortedChildren = (target, children, extraProps = {}) => {
  const sortedChildren = [...children].sort(
    (a, b) => (a.version || 0) - (b.version || 0)
  );
  for (const child of sortedChildren) {
    target.push({ ...child, __isChild: true, ...extraProps });
  }
};

const handleClusterWithoutSearch = (
  rowsForDisplay,
  parentRow,
  childRows,
  expandedClusters,
  clusterName
) => {
  rowsForDisplay.push({ ...parentRow, __isParent: true });
  if (expandedClusters.has(clusterName)) {
    pushSortedChildren(rowsForDisplay, childRows);
  }
};

const handleClusterWithSearch = (
  rowsForDisplay,
  parentRow,
  childRows,
  expandedClusters,
  clusterName,
  rowMatches
) => {
  const parentMatches = rowMatches(parentRow);
  const matchedChildren = childRows.filter(rowMatches);

  if (!parentMatches && matchedChildren.length === 0) {
    return;
  }

  rowsForDisplay.push({
    ...parentRow,
    __isParent: true,
    __matched: parentMatches,
  });

  if (expandedClusters.has(clusterName)) {
    pushSortedChildren(rowsForDisplay, matchedChildren, { __matched: true });
  }
};

const buildRowsForDisplay = (
  originalData,
  expandedClusters,
  searchValue,
  rowMatches
) => {
  const rowsForDisplay = [];
  const clustersMap = originalData.reduce((acc, row) => {
    const key = row.clusterName || "N/A";
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const hasSearch = Boolean(searchValue);

  for (const [clusterName, rows] of Object.entries(clustersMap)) {
    const parentRow = rows.find((r) => r.version === 0) || rows[0];
    const childRows = rows.filter((r) => r.id !== parentRow.id);

    if (!hasSearch) {
      handleClusterWithoutSearch(
        rowsForDisplay,
        parentRow,
        childRows,
        expandedClusters,
        clusterName
      );
      continue;
    }

    handleClusterWithSearch(
      rowsForDisplay,
      parentRow,
      childRows,
      expandedClusters,
      clusterName,
      rowMatches
    );
  }

  return rowsForDisplay;
};

const formatDateToUS = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate(); // No leading zero
  const month = date.toLocaleString("en-US", { month: "short" }); // Jun (proper case)
  const year = date.getFullYear();
  return `${day} ${month} ${year}`; // e.g., 7 Jun 2025
};

const ExpandCollapseRenderer = (props) => {
  const data = props?.data || {};
  const id = data.planogramId ?? "";
  const isParent = !!data.__isParent;
  if (!isParent) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          margin: 28,
        }}
      >
        <span>{id}</span>
      </div>
    );
  }

  const clusterName = data.clusterName || "N/A";
  const expandedClusters =
    props?.context?.expandedClusters ??
    new Set(clusterName ? [clusterName] : []);
  const onToggleCluster = props?.context?.onToggleCluster;
  const rowMeta =
    props?.row || props?.node?.data || props?.data || Object.create(null);
  const isExpanded =
    expandedClusters.has(clusterName) || !!rowMeta.__forceExpandedBySearch;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCluster?.(clusterName);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      <button
        className="expand-collapse-btn"
        aria-label={isExpanded ? "Collapse" : "Expand"}
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          marginRight: 8,
          cursor: "pointer",
          background: "transparent",
          border: "none",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transition: "transform 120ms ease",
            transform: isExpanded ? "rotate(180deg)" : "rotate(270deg)",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="#6B7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span>{id}</span>
    </div>
  );
};

ExpandCollapseRenderer.propTypes = {
  data: PropTypes.object,
  row: PropTypes.object,
  node: PropTypes.object,
  context: PropTypes.shape({
    expandedClusters: PropTypes.instanceOf(Set),
    onToggleCluster: PropTypes.func,
  }),
};

// 1. Add StatusPill and StatusCellRenderer (copied from MyPlanogramTable):
function StatusPill({ status }) {
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return { backgroundColor: "#CDDCEB", color: "#000000" };
      case "cloned":
        return { backgroundColor: "#FFF8E7", color: "#000000" };
      case "published":
        return { backgroundColor: "#FAE7EA", color: "#000000" };
      default:
        return { backgroundColor: "#CDDCEB", color: "#000000" };
    }
  };

  const style = getStatusStyle(status);
  return (
    <div
      style={{
        ...style,
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "500",
        textAlign: "center",
        display: "inline-block",
        minWidth: "50px",
        height: "20px",
        lineHeight: "16px",
        verticalAlign: "middle",
      }}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
        "Draft"}
    </div>
  );
}
StatusPill.propTypes = {
  status: PropTypes.string,
};
function StatusCellRenderer({ value }) {
  return <StatusPill status={value} />;
}
StatusCellRenderer.propTypes = {
  value: PropTypes.string,
};

const PlanogramTable = forwardRef(
  (
    {
      searchTerm,
      onFilterChange,
      onSelectionChange,
      variant = "dashboard", // New: can be 'dashboard' or 'myPlanogram'
      referencePlanogramId,
      fetchPlanograms,
      rowSelection,
      customNav,
      ...rest
    },
    ref
  ) => {
    const gridRef = useRef();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const [rowData, setRowData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [expandedClusters, setExpandedClusters] = useState(new Set());
    const handleToggleCluster = useCallback((clusterName = "N/A") => {
      const safeName = clusterName || "N/A";
      setExpandedClusters((prev) => {
        const next = new Set(prev);
        if (next.has(safeName)) next.delete(safeName);
        else next.add(safeName);
        return next;
      });
    }, []);

    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    const gridContext = useMemo(
      () => ({
        expandedClusters,
        onToggleCluster: handleToggleCluster,
      }),
      [expandedClusters, handleToggleCluster]
    );

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      resetAllFilters: () => {
        if (gridRef.current?.api) {
          gridRef.current.api.setFilterModel(null);
          setHasActiveFilters(false);
        }
      },
      hasActiveFilters: () => hasActiveFilters,
    }));

    // Check if filters are active
    const checkActiveFilters = () => {
      if (gridRef.current?.api) {
        const filterModel = gridRef.current.api.getFilterModel();
        const hasFilters = Object.keys(filterModel).length > 0;
        setHasActiveFilters(hasFilters);
        if (onFilterChange) {
          onFilterChange(hasFilters);
        }
      }
    };

    // Data fetching logic - decide API based on variant/prop
    useEffect(() => {
      let fetchFn;
      let fetchParams = [];
      if (fetchPlanograms) {
        fetchFn = fetchPlanograms;
      } else if (
        variant === "myPlanogram" ||
        variant === "massUpdate" ||
        variant === "massUpdateBulk"
      ) {
        fetchFn = getMyPlanograms;
        if (user?.email) {
          fetchParams = [user.email];
        } else {
          console.warn("User email not available for getMyPlanograms");
          setIsLoading(false);
          return;
        }
      } else {
        fetchFn = getAllPlanograms;
      }
      setIsLoading(true);
      fetchFn(...fetchParams)
        .then((res) => {
          const apiData = res.data.data;
          const isMyPlan =
            variant === "myPlanogram" ||
            variant === "massUpdate" ||
            variant === "massUpdateBulk";
          // Uniform transform
          const transformed = apiData.records.map((item) => {
            const shortDesc = item.short_desc || "";
            let versionText = "Original";
            if (item.versionId != 0) {
              versionText = `${shortDesc} V${item.versionId}`;
            }
            const baseObj = {
              planogramId: item.planogramId,
              id: item.id,
              projectName: `Planogram ${item.id.slice(0, 4)}`,
              dateCreated: item.createdDate,
              dateModified: item.lastModifiedDate,
              category: item.productCategoryInfo?.name || "N/A",
              clusterId: item.clusterInfo?.id,
              clusterName: item.clusterInfo?.name || "N/A",
              version: versionText,
              rangeReviewName: item.rangeReviewInfo?.name || "N/A",
              bays: item.numberOfBays,
              shelvesCount: item.numberOfShelves,
            };
            if (isMyPlan) baseObj.status = item.status || "draft";
            return baseObj;
          });
          setRowData(transformed);
          setOriginalData(transformed);
          const allClusterNames = [
            ...new Set(transformed.map((item) => item.clusterName || "N/A")),
          ];
          setExpandedClusters(new Set(allClusterNames));
        })
        .catch((err) => {
          console.error(
            variant === "myPlanogram" ||
              variant === "massUpdate" ||
              variant === "massUpdateBulk"
              ? "my planograms"
              : "planograms",
            err
          );
          toast.error(
            variant === "myPlanogram" ||
              variant === "massUpdate" ||
              variant === "massUpdateBulk"
              ? "Failed to load my planograms"
              : "Error fetching planograms"
          );
        })
        .finally(() => setIsLoading(false));
    }, [variant, fetchPlanograms, user?.email]);

    useEffect(() => {
      const normalizedSearch = (searchTerm ?? "").toLowerCase().trim();
      const rowMatches = createRowMatcher(normalizedSearch);

      // Step 2 (massUpdateBulk): show same list as Step 1, but hide 'published'
      // planograms (keep the reference planogram visible for context).
      const filteredOriginalData =
        variant === "massUpdateBulk"
          ? originalData.filter((row) => {
              const status = String(row?.status ?? "").toLowerCase();
              if (row?.id && referencePlanogramId && row.id === referencePlanogramId) {
                return true;
              }
              return status !== "published";
            })
          : originalData;

      const rowsForDisplay = buildRowsForDisplay(
        filteredOriginalData,
        expandedClusters,
        normalizedSearch,
        rowMatches
      );

      setRowData(rowsForDisplay);
    }, [searchTerm, originalData, expandedClusters, variant, referencePlanogramId]);

    // Selection mode for AG Grid (calculate before columnDefs)
      const agRowSelection = useMemo(() => {
      // Disable selection completely for massUpdate variant
      if (variant === "massUpdate") {
        return undefined;
      }

      if (!rowSelection) {
          if (variant === "myPlanogram") {
            return { mode: "singleRow" };
          }
          if (variant === "massUpdateBulk") {
            return { mode: "multiRow" };
          }
          return { mode: "multiRow" };
      }

      if (typeof rowSelection === "string") {
        const normalized = rowSelection.toLowerCase();
        if (normalized === "single" || normalized === "singlerow") {
          return { mode: "singleRow" };
        }
        if (
          normalized === "multiple" ||
          normalized === "multirow" ||
          normalized === "multi"
        ) {
          return { mode: "multiRow" };
        }
      }

      return rowSelection;
    }, [rowSelection, variant]);

    const isRowSelectable = useCallback(
      (node) => {
        const d = node?.data;
        if (!d) return false;
        // Step 2: reference planogram should be visible but not selectable
        if (variant === "massUpdateBulk" && referencePlanogramId && d.id === referencePlanogramId) {
          return false;
        }
        // Extra guard: published planograms shouldn't be selectable
        return String(d.status ?? "").toLowerCase() !== "published";
      },
      [variant, referencePlanogramId]
    );

    // columnDefs merge: use status column if myPlanogram
    const columnDefs = useMemo(() => {
      const columns = [];
      // REMOVE: Do NOT add a manual checkbox column
      columns.push(
        {
          field: "planogramId",
          headerName: "Planogram Id",
          flex: 2.5,
          filter: MultiFilter,
          cellStyle: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          },
          cellRenderer: ExpandCollapseRenderer,
        },
        {
          field: "version",
          headerName: "Version",
          valueFormatter: (params) =>
            params.value === 0 ? "Original" : params.value,
          filter: MultiFilter,
        }
      );
      if (variant === "myPlanogram" || variant === "massUpdate") {
        columns.push({
          field: "status",
          headerName: "Status",
          width: 120,
          minWidth: 120,
          maxWidth: 120,
          cellRenderer: StatusCellRenderer,
          cellStyle: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "default",
          },
          filter: MultiFilter,
        });
      }
      columns.push(
        {
          field: "rangeReviewName",
          headerName: "Range Review Name",
          flex: 1.5,
          filter: MultiFilter,
          headerClass: "range-review-header",
        },
        {
          field: "clusterName",
          headerName: "Cluster Name",
          sortable: false,
          filter: MultiFilter,
        },
        { field: "bays", headerName: "Bays (#)" },
        { field: "shelvesCount", headerName: "Shelves (#)" },
        {
          field: "dateCreated",
          headerName: "Date Created",
          sortable: true,
          filter: false,
          valueFormatter: (params) => formatDateToUS(params.value),
        },
        {
          field: "dateModified",
          headerName: "Date Last Modified",
          sortable: true,
          filter: false,
          flex: 1.5,
          valueFormatter: (params) => formatDateToUS(params.value),
        }
      );
      return columns;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variant, expandedClusters, searchTerm, agRowSelection]);

    // Nav handler based on variant
    let handleRowNavigation;
    if (customNav) {
      handleRowNavigation = customNav;
    } else {
      handleRowNavigation = (event) => {
        const data = event.data;
        if (!data) return;
        if (variant === "myPlanogram") {
          navigate(`/my-planogram/${data.id}`, { state: { rowData: data } });
        } else if (variant === "massUpdate" || variant === "massUpdateBulk") {
          // For mass update variants, don't navigate on row click
          return;
        } else {
          navigate(`/planogram?id=${data.id}`, { state: { rowData: data } });
        }
      };
    }

    const suppressRowClickSelection =
      variant === "myPlanogram" || variant === "massUpdate";

    // MyPlanogram only: enforce single-select
    // Dashboard: enforce compare rules
    // Dashboard: allow 2, same cluster, no dup version, etc
    // MyPlanogram: just forwards single id selected
    const handleRowSelected = (event) => {
      const api = event.api;
      const selectedNodes = api.getSelectedNodes();
      if (variant === "myPlanogram") {
        const ids = selectedNodes.map((n) => n.data?.id).filter(Boolean);
        onSelectionChange?.(ids);
        return;
      }
      if (variant === "massUpdateBulk") {
        const ids = selectedNodes
          .map((n) => n.data?.id)
          .filter((id) => Boolean(id) && id !== referencePlanogramId);
        onSelectionChange?.(ids);
        return;
      }
      // Dashboard mode logic copied from original
      console.log("Row selected:", {
        selectedCount: selectedNodes.length,
        currentRow: {
          id: event.node.data?.id,
          planogramId: event.node.data?.planogramId,
          clusterName: event.node.data?.clusterName,
          isParent: event.node.data?.__isParent,
          isChild: event.node.data?.__isChild,
          version: event.node.data?.version,
        },
        allSelected: selectedNodes.map((n) => ({
          id: n.data?.id,
          planogramId: n.data?.planogramId,
          clusterName: n.data?.clusterName,
          isParent: n.data?.__isParent,
          isChild: n.data?.__isChild,
          version: n.data?.version,
        })),
      });

      // Check if all selected rows are from the same cluster
      if (selectedNodes.length > 1) {
        const clusters = selectedNodes.map((n) => n.data?.clusterName || "N/A");
        const firstCluster = clusters[0];
        const allSameCluster = clusters.every((c) => c === firstCluster);

        if (!allSameCluster) {
          // Deselect the current row if it's from a different cluster
          event.node.setSelected(false);
          toast.error(
            `Cannot compare planograms from different clusters. Please select planograms from "${firstCluster}" cluster only.`,
            {
              duration: 4000,
              position: "top-center",
              style: {
                background: "#fee",
                color: "#c33",
                fontWeight: "500",
              },
            }
          );
          return;
        }

        // Check if trying to select the same version twice
        const versions = selectedNodes.map((n) => n.data?.version);
        const hasDuplicateVersions = versions.length !== new Set(versions).size;

        if (hasDuplicateVersions) {
          event.node.setSelected(false);
          toast.error(
            "Cannot compare the same version. Please select a different version to compare.",
            {
              duration: 4000,
              position: "top-center",
              style: {
                background: "#fee",
                color: "#c33",
                fontWeight: "500",
              },
            }
          );
          return;
        }
      }

      if (selectedNodes.length > 2) {
        // Deselect the most recently toggled row
        event.node.setSelected(false);
        toast.error("You can only compare 2 planograms at a time.", {
          duration: 3000,
          position: "top-center",
          style: {
            background: "#fee",
            color: "#c33",
            fontWeight: "500",
          },
        });
        return;
      }
      const ids = selectedNodes.map((n) => n.data?.id).filter(Boolean);
      onSelectionChange?.(ids);
    };
    const handleSelectionChanged = () => {
      const api = gridRef.current?.api;
      if (!api) return;
      const selectedNodes = api.getSelectedNodes();
      const ids = selectedNodes
        .map((n) => n.data?.id)
        .filter((id) => Boolean(id) && id !== referencePlanogramId);

      console.log("Selection changed:", {
        selectedCount: selectedNodes.length,
        selectedIds: ids,
        selectedRows: selectedNodes.map((n) => ({
          id: n.data?.id,
          planogramId: n.data?.planogramId,
          isParent: n.data?.__isParent,
          isChild: n.data?.__isChild,
          version: n.data?.version,
        })),
      });

      onSelectionChange?.(ids);
    };

    return (
      <div className="w-full px-6 pb-6">
        <div
          className={`planogram-table ag-theme-quartz w-full h-[calc(93vh-150px)] rounded-xl border border-gray-200 shadow-lg relative overflow-hidden ${
            variant === "myPlanogram" ? "myplanogram-table" : ""
          } ${
            variant === "massUpdate" || variant === "massUpdateBulk" ? "massupdate-table" : ""
          }`}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 font-medium">
                  {variant === "myPlanogram" || variant === "massUpdate"
                    ? "Loading..."
                    : "Fetching the planograms..."}
                </p>
              </div>
            </div>
          )}
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            context={gridContext}
            {...(agRowSelection ? { rowSelection: { ...agRowSelection, headerCheckbox: false } } : {})}
            isRowSelectable={isRowSelectable}
            suppressRowClickSelection={suppressRowClickSelection}
            onGridReady={() => setTimeout(checkActiveFilters, 100)}
            onRowClicked={(params) => {
              if (params.event.target.closest(".expand-collapse-btn")) return;
              if (params.event.target.closest(".ag-selection-checkbox")) return;
              handleRowNavigation(params);
            }}
            {...(agRowSelection ? { onRowSelected: handleRowSelected } : {})}
            {...(agRowSelection ? { onSelectionChanged: handleSelectionChanged } : {})}
            onFilterChanged={checkActiveFilters}
            defaultColDef={{
              resizable: true,
              sortable: true,
              wrapHeaderText: true,
              autoHeaderHeight: true,
              flex: 1,
              minWidth: 120,
              cellStyle: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              },
              headerClass: "ag-header-center-align",
            }}
            animateRows={true}
            headerHeight={48}
            getRowClass={(params) => {
              const d = params?.data;
              if (
                variant === "massUpdateBulk" &&
                referencePlanogramId &&
                d?.id === referencePlanogramId
              ) {
                return "ag-row-reference-planogram";
              }
              return undefined;
            }}
            getRowStyle={(params) => {
              const d = params?.data;
              if (!d) return { backgroundColor: "#ffffff" };
              if (
                variant === "massUpdateBulk" &&
                referencePlanogramId &&
                d.id === referencePlanogramId
              ) {
                return {
                  backgroundColor: "#E6F7FF",
                  fontWeight: "600",
                  borderLeft: "4px solid #BCD530",
                };
              }
              if (d.version === "Original") {
                if (variant === "myPlanogram") {
                  return {
                    backgroundColor: "#FFF8F5",
                    fontWeight: "500",
                  };
                }
                if (variant === "massUpdate" || variant === "massUpdateBulk") {
                  return {
                    backgroundColor: "#F5F8E8",
                    fontWeight: "500",
                  };
                }
                return {
                  backgroundColor: "#FFF9EC",
                  fontWeight: "500",
                };
              }
              if (d.__isParent) {
                if (variant === "myPlanogram") {
                  return {
                    backgroundColor: "#FFF4ED",
                    fontWeight: "500",
                  };
                }
                if (variant === "massUpdate" || variant === "massUpdateBulk") {
                  return {
                    backgroundColor: "#F0F4DC",
                    fontWeight: "500",
                  };
                }
                return {
                  backgroundColor: "#ccf3e8",
                  fontWeight: "500",
                };
              }
              if (d.__isChild) {
                return {
                  color: "#374151",
                  backgroundColor: "#ffffff",
                };
              }
              return { backgroundColor: "#ffffff" };
            }}
            {...rest}
          />
        </div>
      </div>
    );
  }
);

PlanogramTable.displayName = "PlanogramTable";

PlanogramTable.propTypes = {
  searchTerm: PropTypes.string,
  onFilterChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  variant: PropTypes.oneOf(["dashboard", "myPlanogram", "massUpdate", "massUpdateBulk"]).isRequired,
  referencePlanogramId: PropTypes.string,
  fetchPlanograms: PropTypes.func,
  rowSelection: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      mode: PropTypes.oneOf(["singleRow", "multiRow"]).isRequired,
    }),
  ]),
  customNav: PropTypes.func,
};

export default PlanogramTable;
