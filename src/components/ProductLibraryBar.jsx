import React, { useEffect, useMemo, useState } from "react";
import { Search } from "@mui/icons-material";
import { LiaBroomSolid } from "react-icons/lia";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFilters,
  selectViewMode,
  setViewMode,
  setSearchText,
  resetFilters,
  removeFilterByValue,
  selectAllProducts,
} from "../redux/reducers/productDataSlice";
import SortDropdown from "./SortDropdown";
import { IoCard, IoCardOutline, IoFilter } from "react-icons/io5";
import { Grid3x3 } from "lucide-react";
import FilterModal from "./Modals/FilterModal";
import ShowAllFilterDropdown from "./ShowAllFilterDropdown";
import Fuse from "fuse.js";
import PropTypes from "prop-types";

const ProductLibraryBar = ({
  onSortChange,
  sortBy,
  filterElements,
  filterPriceRange,
}) => {
  const filters = useSelector(selectFilters);
  const dispatch = useDispatch();
  const viewMode = useSelector(selectViewMode);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const products = useSelector(selectAllProducts);

  const searchQuery = (filters.searchText || "").trim();
  const listForSearch = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const nameSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return [];

    const thresholdFor = (len) => {
      if (len <= 3) return 0.45; // more forgiving for very short queries
      if (len <= 5) return 0.35; // moderate
      if (len <= 7) return 0.28; // stricter
      return 0.23; // strict for long names like e-com
    };

    const baseOptions = {
      includeScore: true,
      isCaseSensitive: false,
      ignoreLocation: true,
      minMatchCharLength: 2,
      threshold: thresholdFor(q.length),
      shouldSort: true,
      keys: [{ name: "name", weight: 1 }],
    };

    let results = new Fuse(listForSearch, baseOptions).search(q);

    // Gentle relax if nothing matched at all
    if (results.length === 0 && q.length >= 3) {
      const relaxed = {
        ...baseOptions,
        threshold: Math.min(baseOptions.threshold + 0.05, 0.5),
      };
      results = new Fuse(listForSearch, relaxed).search(q);
    }

    const seen = new Set();
    const names = [];
    for (const r of results) {
      const n = (r?.item?.name || "").trim();
      if (!n) continue;
      const lower = n.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        names.push(n);
      }
      if (names.length >= 8) break;
    }
    return names;
  }, [listForSearch, searchQuery]);

  // Define which filters to display
  const filterKeysToCheck = [
    "selectedBrand",
    "selectedCategory",
    "selectedIntensity",
    "selectedPlatform",
  ];

  const activeFilters = filterKeysToCheck.flatMap((key) => {
    const value = filters[key];
    if (Array.isArray(value)) {
      return value.map((v) => ({ key, label: v }));
    }
    return [];
  });

  const hasActiveFilters = activeFilters.length > 0;

  const handleSortChange = (value) => {
    onSortChange(value);
    console.log("Sort changed:", value);
  };

  useEffect(() => {
    if (!hasActiveFilters && filters.searchText === "") {
      dispatch(resetFilters());
    }
  }, [filters.searchText, hasActiveFilters, dispatch]);

  return (
    <div className="w-full flex items-center justify-between">
      {/* Search bar */}
      <div className="relative bg-[#F2F2F2] rounded-full w-64 h-10 flex items-center px-3 border border-black">
        <Search className="text-black w-5 h-5 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none flex-1 text-sm text-gray-700"
          value={filters.searchText || ""}
          onChange={(e) => {
            dispatch(setSearchText(e.target.value));
            setIsSearchFocused(true);
          }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {isSearchFocused &&
          searchQuery.length >= 2 &&
          nameSuggestions.length > 0 && (
            <div className="absolute left-0 top-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto min-h-[200px]">
              {nameSuggestions.map((suggestion, idx) => (
                <button
                  key={`${suggestion}-${idx}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    dispatch(setSearchText(suggestion));
                    setIsSearchFocused(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
      </div>

      <div className="flex items-center gap-x-2">
        {/* clear filter */}
        <button
          className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1"
          onClick={() => {
            dispatch(resetFilters());
          }}
        >
          <LiaBroomSolid />
          <p>Reset Filters</p>
        </button>

        {/* show all filter */}
        <ShowAllFilterDropdown />

        {/* active filters as pill buttons */}
        {activeFilters.slice(0, 2).map((filter) => (
          <button
            key={`${filter.key}-${filter.label}`}
            className="flex items-center gap-x-1 text-sm font-medium bg-[#F2F2F2] hover:bg-[#e5e5e5] rounded-full px-3 py-1 border"
          >
            <span>{filter.label}</span>
            <button
              type="button"
              className="cursor-pointer text-gray-600 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black rounded-full p-0.5 leading-none"
              onClick={() => dispatch(removeFilterByValue(filter.label))}
            >
              ×
            </button>
          </button>
        ))}

        {/* filter button with red dot if active */}
        <button
          className="flex items-center justify-center gap-x-2 text-sm font-semibold hover:bg-[#f0f0f0] rounded-lg px-2 py-1 "
          onClick={() => setIsFilterModalOpen(true)}
        >
          <div className="relative">
            <IoFilter />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-250"></span>
            )}
          </div>
          <p>Filter</p>
        </button>

        {/* vertical line */}
        <div className="w-[1px] h-5 bg-gray-400"></div>

        {/* sort by */}
        <SortDropdown sortBy={sortBy} onSortChange={handleSortChange} />

        {/* table or card view toggler */}
        <div className="flex items-center rounded-full border border-black overflow-hidden w-max">
          {/* Grid Button */}
          <button
            data-testid="grid-view-button"
            aria-label="Grid view"
            onClick={() => dispatch(setViewMode("grid"))}
            className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
              viewMode === "grid" ? "bg-[#FFD3D3] rounded-l-full" : ""
            }`}
          >
            {viewMode === "grid" ? (
              <IoCard size={24} className="text-[#FF6B6B]" />
            ) : (
              <IoCardOutline size={24} />
            )}
          </button>

          {/* Schematic Button */}
          <button
            data-testid="schematic-view-button"
            aria-label="Schematic view"
            onClick={() => dispatch(setViewMode("schematic"))}
            className={`flex items-center justify-center px-3 py-1.5 w-12 transition-all duration-300 ${
              viewMode === "schematic" ? "bg-[#FFD3D3] rounded-r-full" : ""
            }`}
          >
            {viewMode === "schematic" ? (
              <Grid3x3 size={24} fill="#FF6B6B" stroke="#FFD3D3" />
            ) : (
              <Grid3x3 size={24} />
            )}
          </button>
        </div>
      </div>
      {isFilterModalOpen && (
        <FilterModal
          open={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filterElements={filterElements}
          filterPriceRange={filterPriceRange}
        />
      )}
    </div>
  );
};

export default ProductLibraryBar;

ProductLibraryBar.propTypes = {
  onSortChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  filterElements: PropTypes.shape({
    brands: PropTypes.arrayOf(PropTypes.string),
    subCategories: PropTypes.arrayOf(PropTypes.string),
    intensities: PropTypes.arrayOf(PropTypes.string),
    platforms: PropTypes.arrayOf(PropTypes.string),
    npds: PropTypes.arrayOf(PropTypes.number),
    benchmarks: PropTypes.arrayOf(PropTypes.number),
    promoItems: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  filterPriceRange: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
};
