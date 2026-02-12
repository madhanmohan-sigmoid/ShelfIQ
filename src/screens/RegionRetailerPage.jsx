import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  selectSelectedRegion,
  selectSelectedRetailer,
  selectSelectedCategory,
  selectSelectedCountry,
  setSelectedRegion,
  setSelectedRetailer,
  setSelectedCategory,
  setSelectedCountry,
  setRegionRetailerCategoryMappings,
  setLoading,
  setError,
  selectRegionRetailerCategoryMappings,
  selectMappingsLoading,
} from "../redux/reducers/regionRetailerSlice";
import { selectUser } from "../redux/reducers/authSlice";
import { getRegionRetailerCategoryMappings } from "../api/api";
import {
  WorldMap,
  RetailerSelector,
  CategorySelector,
} from "../components/regionRetailerPage/index";

const REGION_HEX = {
  EMEA: "#FFB000",
  "North America": "#D3BDF2",
  APAC: "#FFAE80",
  LATAM: "#00B097",
  retailer: "#BCD530",
};

// Map API region names to display names
const REGION_NAME_MAP = {
  EMEA: "EMEA",
  NA: "North America",
  APAC: "APAC",
  LATAM: "LATAM",
  CIS: "CIS",
  ANZ: "ANZ",
  AMER: "AMER",
};

// Reverse map for lookup
const DISPLAY_TO_API_MAP = {
  "EMEA": "EMEA",
  "North America": "NA",
  "APAC": "APAC",
  "LATAM": "LATAM",
  "CIS": "CIS",
  "ANZ": "ANZ",
  "AMER": "AMER",
};

function RegionRetailerPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const mappings = useSelector(selectRegionRetailerCategoryMappings);
  const loading = useSelector(selectMappingsLoading);
  const selectedRegion = useSelector(selectSelectedRegion);
  const selectedRetailer = useSelector(selectSelectedRetailer);
  const selectedCategory = useSelector(selectSelectedCategory);
  const selectedCountry = useSelector(selectSelectedCountry);
  const user = useSelector(selectUser);

  // local UI state (keeps track of an externally-managed "view all" flag)
  const [viewAllSelected, setViewAllSelected] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Get user's access groups (dev environment for now)
  const userAccessGroups = useMemo(() => {
    if (!user?.access_groups?.dev?.region_info) return null;
    return user.access_groups.dev.region_info;
  }, [user]);

  // Helper function to check if a region is allowed
  const isRegionAllowed = (regionName) => {
    if (!userAccessGroups) return true; // If no access groups, allow all (fallback)
    const apiRegionName = DISPLAY_TO_API_MAP[regionName] || regionName;
    return userAccessGroups.some((r) => r.name === apiRegionName);
  };

  // Helper function to check if a retailer is allowed
  const isRetailerAllowed = (retailerId, regionName) => {
    if (!userAccessGroups) return true; // If no access groups, allow all (fallback)
    const apiRegionName = DISPLAY_TO_API_MAP[regionName] || regionName;
    const allowedRegion = userAccessGroups.find((r) => r.name === apiRegionName);
    if (!allowedRegion) return false;
    return allowedRegion.retailers?.some((ret) => ret.id === retailerId) || false;
  };

  // Helper function to check if a category is allowed
  const isCategoryAllowed = (categoryId, retailerId, regionName) => {
    if (!userAccessGroups) return true; // If no access groups, allow all (fallback)
    const apiRegionName = DISPLAY_TO_API_MAP[regionName] || regionName;
    const allowedRegion = userAccessGroups.find((r) => r.name === apiRegionName);
    if (!allowedRegion) return false;
    const allowedRetailer = allowedRegion.retailers?.find((ret) => ret.id === retailerId);
    if (!allowedRetailer) return false;
    return allowedRetailer.categories?.some((cat) => cat.id === categoryId) || false;
  };

  // Fetch API data on mount
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        dispatch(setLoading(true));
        const response = await getRegionRetailerCategoryMappings();
        // Handle both possible response structures
        const regionInfo = response.data?.data?.region_info || response.data?.region_info || response.data;
        if (regionInfo && Array.isArray(regionInfo)) {
          dispatch(setRegionRetailerCategoryMappings(regionInfo));
        } else {
          console.warn("Unexpected API response structure:", response.data);
          dispatch(setError("Unexpected response structure"));
        }
      } catch (error) {
        console.error("Error fetching region-retailer-category mappings:", error);
        dispatch(setError(error.message || "Failed to fetch mappings"));
      }
    };

    if (!mappings) {
      fetchMappings();
    }
  }, [dispatch, mappings]);

  // Get regions from API data - memoize this to prevent unnecessary recalculations
  const regions = useMemo(() => {
    if (!mappings) return [];
    return mappings
      .map((region) => ({
        ...region,
        displayName: REGION_NAME_MAP[region.name] || region.name,
      }))
      .sort((a, b) => {
        // Maintain order: EMEA, North America, APAC, LATAM, then others
        const order = ["EMEA", "North America", "APAC", "LATAM"];
        const aIndex = order.indexOf(a.displayName);
        const bIndex = order.indexOf(b.displayName);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [mappings]);

  // Get retailers for selected region
  const getRetailersForRegion = (regionDisplayName) => {
    if (!mappings || !regionDisplayName) return [];
    const apiRegionName = DISPLAY_TO_API_MAP[regionDisplayName] || regionDisplayName;
    const region = mappings.find((r) => r.name === apiRegionName);
    return region?.retailers || [];
  };

  // Get categories for selected retailer
  const getCategoriesForRetailer = (retailer) => {
    if (!retailer || !mappings) return [];
    const region = mappings.find((r) =>
      r.retailers?.some((ret) => ret.id === retailer.id)
    );
    if (!region) return [];
    const retailerData = region.retailers.find((ret) => ret.id === retailer.id);
    return retailerData?.categories || [];
  };

  const retailers = selectedRegion ? getRetailersForRegion(selectedRegion) : [];
  const categories = selectedRetailer ? getCategoriesForRetailer(selectedRetailer) : [];

  // Set default region EMEA after mappings load - FIXED: removed regions from deps, use mappings only
  useEffect(() => {
    if (mappings && mappings.length > 0 && !selectedRegion) {
      // Calculate regions inline here to avoid dependency issues
      const calculatedRegions = mappings
        .map((region) => ({
          ...region,
          displayName: REGION_NAME_MAP[region.name] || region.name,
        }));
      
      const defaultRegion = calculatedRegions.find((r) => r.displayName === "EMEA");
      if (defaultRegion) {
        dispatch(setSelectedRegion(defaultRegion.displayName));
      } else if (calculatedRegions.length > 0) {
        dispatch(setSelectedRegion(calculatedRegions[0].displayName));
      }
    }
  }, [mappings, selectedRegion, dispatch]); // Removed 'regions' from deps

  // Note: setSelectedRegion reducer already clears retailer/category, so we don't need a separate effect

  // Helper functions for URL preselection logic
  const findAndSelectRegion = (selectedValue, calculatedRegions) => {
    const region = calculatedRegions.find(
      (r) =>
        r.displayName === selectedValue ||
        r.name === selectedValue ||
        REGION_NAME_MAP[selectedValue] === r.displayName
    );
    if (region) {
      dispatch(setSelectedRegion(region.displayName));
      return true;
    }
    return false;
  };

  const findAndSelectRetailer = (selectedValue, mappings) => {
    for (const regionData of mappings) {
      const retailer = regionData.retailers?.find(
        (ret) =>
          ret.name.toLowerCase() === selectedValue.toLowerCase() ||
          ret.name === selectedValue
      );
      if (retailer) {
        const regionDisplayName = REGION_NAME_MAP[regionData.name] || regionData.name;
        dispatch(setSelectedRegion(regionDisplayName));
        setTimeout(() => {
          dispatch(setSelectedRetailer(retailer));
        }, 120);
        return true;
      }
    }
    return false;
  };

  const findAndSelectCategory = (selectedValue, mappings) => {
    for (const regionData of mappings) {
      for (const retailer of regionData.retailers || []) {
        const category = retailer.categories?.find(
          (cat) =>
            cat.name.toLowerCase() === selectedValue.toLowerCase() ||
            cat.name === selectedValue
        );
        if (category) {
          const regionDisplayName = REGION_NAME_MAP[regionData.name] || regionData.name;
          dispatch(setSelectedRegion(regionDisplayName));
          setTimeout(() => {
            dispatch(setSelectedRetailer(retailer));
            if (category.is_active) {
              dispatch(setSelectedCategory(category));
            }
          }, 120);
          return true;
        }
      }
    }
    return false;
  };

  // URL preselection logic - FIXED: only run once when mappings load, not on every regions change
  useEffect(() => {
    const selectedValue = searchParams.get("selected");
    if (!selectedValue || !mappings || mappings.length === 0) return;

    // Calculate regions inline to avoid dependency on computed regions array
    const calculatedRegions = mappings
      .map((region) => ({
        ...region,
        displayName: REGION_NAME_MAP[region.name] || region.name,
      }));

    // Try to find and select region, retailer, or category
    if (findAndSelectRegion(selectedValue, calculatedRegions)) return;
    if (findAndSelectRetailer(selectedValue, mappings)) return;
    findAndSelectCategory(selectedValue, mappings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, dispatch, mappings]); // Removed 'regions' from deps

  const handleRegionSelect = (region) => {
    // Check RBAC before allowing selection
    if (userAccessGroups && !isRegionAllowed(region)) {
      return; // Don't allow selection if not in access groups
    }
    dispatch(setSelectedRegion(region));
    dispatch(setSelectedCountry(null));
    setViewAllSelected(false);
  };

  const handleCountrySelect = (country) => {
    dispatch(setSelectedCountry(country));
  };

  const handleRetailerSelect = (retailer) => {
    // Check RBAC before allowing selection
    if (userAccessGroups && !isRetailerAllowed(retailer.id, selectedRegion)) {
      return; // Don't allow selection if not in access groups
    }
    setViewAllSelected(false);
    dispatch(setSelectedRetailer(retailer));
  };

  const handleCategorySelect = (category) => {
    // Check RBAC before allowing selection
    if (userAccessGroups && !isCategoryAllowed(category.id, selectedRetailer?.id, selectedRegion)) {
      return; // Don't allow selection if not in access groups
    }
    dispatch(setSelectedCategory(category));
  };

  const chosen = selectedRetailer ? "retailer" : selectedRegion || "EMEA";

  const leftBackground = REGION_HEX[chosen] || REGION_HEX.retailer;

  // build right tint from hex
  const rightTint = (() => {
    const hex = REGION_HEX[chosen] || REGION_HEX.retailer || "#BCD530";
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},0.12)`;
  })();

  // Provide viewAll config to RetailerSelector so the existing button can be positioned/styled
  const viewAllConfig = {
    position: "right", // RetailerSelector should place the existing View All to the right when using this prop
    regionColor: REGION_HEX[chosen] || REGION_HEX.default,
    active: viewAllSelected,
    onToggle: (active) => {
      // callback RetailerSelector may call to toggle view-all state
      setViewAllSelected(Boolean(active));
      if (active) {
        dispatch(setSelectedRetailer(null)); // keep behaviour: clear retailer when View All is active
      }
    },
  };

  return (
    <div className="flex flex-col items-center w-full h-full font-sans">
      {/* Main container with responsive layout */}
      <div className="flex flex-col lg:flex-row px-4 sm:px-6 lg:px-8 xl:px-0 w-full max-w-7xl lg:h-[85vh] mx-auto mt-4 sm:mt-6 gap-4 sm:gap-6 pb-4 lg:pb-0">
        {/* LEFT PANEL */}
        <div
          className="w-full lg:w-1/2 flex flex-col p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-md overflow-y-auto"
          style={{ minHeight: "50vh", background: leftBackground }}
        >
          {/* Inline region buttons (ordered) */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#111]">
              Select Your Region
            </h3>

            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
              {(() => {
                if (loading) {
                  return <div className="text-gray-600">Loading regions...</div>;
                }
                if (regions.length > 0) {
                  return regions.map((region) => {
                    const regionDisplayName = region.displayName;
                    const isSelected = regionDisplayName === selectedRegion;
                    const isHovered = hoveredRegion === regionDisplayName;
                    const hasAccess = isRegionAllowed(regionDisplayName);
                    const showBlack = (isSelected || isHovered) && hasAccess;
                    
                    let buttonBg;
                    if (showBlack) {
                      buttonBg = "#111111";
                    } else if (hasAccess) {
                      buttonBg = "transparent";
                    } else {
                      buttonBg = "rgba(0,0,0,0.05)";
                    }
                    
                    let textColor;
                    if (showBlack) {
                      textColor = "#ffffff";
                    } else if (hasAccess) {
                      textColor = "#111111";
                    } else {
                      textColor = "#999999";
                    }
                    
                    let borderColor;
                    if (showBlack) {
                      borderColor = "#111111";
                    } else if (hasAccess) {
                      borderColor = "rgba(0,0,0,0.18)";
                    } else {
                      borderColor = "rgba(0,0,0,0.1)";
                    }

                    return (
                      <div key={region.id} className="relative">
                        <button
                          onClick={() => handleRegionSelect(regionDisplayName)}
                          onMouseEnter={() => hasAccess && setHoveredRegion(regionDisplayName)}
                          onMouseLeave={() => setHoveredRegion(null)}
                          disabled={!hasAccess}
                          className={`rounded-full px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base font-bold transition-all ${
                            hasAccess ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                          }`}
                          style={{
                            background: buttonBg,
                            color: textColor,
                            border: `1.5px solid ${borderColor}`,
                          }}
                        >
                          {regionDisplayName}
                        </button>
                        {!hasAccess && (
                          <span
                            className="absolute -top-1 -right-1 bg-[#9E9E9E] text-white text-[8px] font-medium px-1 rounded opacity-60"
                            style={{
                              borderTopRightRadius: "12px",
                              borderBottomLeftRadius: "12px",
                            }}
                          >
                            No Access
                          </span>
                        )}
                      </div>
                    );
                  });
                }
                return <div className="text-gray-600">No regions available.</div>;
              })()}
            </div>
          </div>

          <div className="border-t border-black/10 my-3 sm:my-4" />

          {/* RetailerSelector - pass viewAllConfig so it can render the existing "View All" right-aligned + styled */}
          {selectedRegion && (
            <div>
              <RetailerSelector
                selectedRegion={selectedRegion}
                selectedRetailer={selectedRetailer}
                retailers={retailers}
                onRetailerSelect={handleRetailerSelect}
                regionColors={REGION_HEX}
                viewAllConfig={viewAllConfig}
                isRetailerAllowed={isRetailerAllowed}
                userAccessGroups={userAccessGroups}
              />
            </div>
          )}

          {/* Category selector (only visible when a retailer is chosen) */}
          {selectedRetailer && (
            <>
              <div className="border-t border-black/10 my-3 sm:my-4" />
              <CategorySelector
                selectedRetailer={selectedRetailer}
                selectedCategory={selectedCategory}
                categories={categories}
                onCategorySelect={handleCategorySelect}
                selectedRegion={selectedRegion}
                isCategoryAllowed={isCategoryAllowed}
                userAccessGroups={userAccessGroups}
              />
            </>
          )}
        </div>

        {/* RIGHT PANEL (map) */}
        <div
          className="w-full lg:w-1/2 flex items-center justify-center rounded-2xl sm:rounded-3xl shadow-md overflow-hidden border border-gray-200 p-3 sm:p-4"
          style={{ background: rightTint, minHeight: "50vh" }}
        >
          <div className="w-full h-full">
            <WorldMap
              selectedRegion={selectedRegion}
              selectedCountry={selectedCountry}
              selectedRetailer={selectedRetailer}
              onRegionSelect={handleRegionSelect}
              onCountrySelect={handleCountrySelect}
              regionColors={REGION_HEX}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegionRetailerPage;
