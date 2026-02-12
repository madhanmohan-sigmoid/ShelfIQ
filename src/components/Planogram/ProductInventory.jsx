import React, { useState, useMemo } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Slider,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Checkbox,
  Menu,
  MenuItem,
  Badge,
  Select,
  FormControl,
  InputLabel,
  Popover,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { IoFilter } from "react-icons/io5";
import { LiaBroomSolid } from "react-icons/lia";
import { FaCheckCircle } from "react-icons/fa";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { BiSortAlt2 } from "react-icons/bi";
import { BsSortAlphaDown, BsSortAlphaUp } from "react-icons/bs";
import { filterProducts, getFallbackImage } from "../../utils/productUtils";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { selectAllProducts } from "../../redux/reducers/productDataSlice";
import {
  selectSelectedProduct,
  setSelectedProduct,
  setProductInventorySelectedProduct,
  selectRemovedProductIds,
  setPendingPlacement,
  selectShelfLines,
} from "../../redux/reducers/planogramVisualizerSlice";
import { ListFilter, ArrowDownUp } from "lucide-react";

const ProductInventory = () => {
  const dispatch = useDispatch();
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const isFilterOpen = Boolean(filterAnchorEl);
  const unplacedItems = useSelector(selectAllProducts);
  const selectedProduct = useSelector(selectSelectedProduct);

  const PI_DEFAULT = {
    brands: [],
    subCategories: [],
    priceRange: [],
    searchText: "",
  };
  const [pi, setPi] = useState(PI_DEFAULT);
  const [draftPi, setDraftPi] = useState(PI_DEFAULT);

  const removedProductIds = useSelector(selectRemovedProductIds);
  const shelfLines = useSelector(selectShelfLines);

  // Helper: Check if product is currently on the planogram (in shelfLines)
  const isProductOnPlanogram = useMemo(() => {
    if (!shelfLines || shelfLines.length === 0) return new Set();

    const productsOnGrid = new Set();
    for (const item of shelfLines.flat(2)) {
      if (!item.isEmpty && item.tpnb) {
        productsOnGrid.add(item.tpnb);
      }
    }
    return productsOnGrid;
  }, [shelfLines]);

  // Apply isRemoved flag to products based on planogram-specific removed list
  const unplacedItemsWithRemoved = useMemo(() => {
    return unplacedItems.map((item) => ({
      ...item,
      isRemoved:
        removedProductIds.includes(item.tpnb) ||
        removedProductIds.includes(item.id),
    }));
  }, [unplacedItems, removedProductIds]);

  const brands = [
    ...new Set(
      unplacedItemsWithRemoved.map((item) => item.brand_name).filter(Boolean)
    ),
  ];

  const categories = [
    ...new Set(
      unplacedItemsWithRemoved
        .map((item) => item.subCategory_name)
        .filter(Boolean)
    ),
  ];
  const prices = unplacedItemsWithRemoved
    .map((item) => item.price)
    .filter((p) => typeof p === "number");
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [productPosition, setProductPosition] = useState("all"); // "all" | "onPlanogram" | "notOnPlanogram" | "removed"
  const [draftOnlyNotOnPlanogram, setDraftOnlyNotOnPlanogram] = useState(false);

  // Facings placement state
  const [facingsMenuAnchor, setFacingsMenuAnchor] = useState(null);
  const [selectedProductForFacings, setSelectedProductForFacings] =
    useState(null);
  const [facingsModalOpen, setFacingsModalOpen] = useState(false);
  const [facingsType, setFacingsType] = useState(null); // 'wide' | 'high'
  const [facingsValue, setFacingsValue] = useState(1);

  // Facings handlers
  const handlePlusClick = (event, item) => {
    event.stopPropagation();
    setSelectedProductForFacings(item);
    setFacingsMenuAnchor(event.currentTarget);
  };

  const handleCloseFacingsMenu = () => {
    setFacingsMenuAnchor(null);
  };

  const handleSelectFacingType = (type) => {
    setFacingsType(type);
    setFacingsValue(1); // Reset to 1
    setFacingsMenuAnchor(null);
    setFacingsModalOpen(true);
  };

  const handleCloseFacingsModal = () => {
    setFacingsModalOpen(false);
    setSelectedProductForFacings(null);
    setFacingsType(null);
    setFacingsValue(1);
  };

  const handleConfirmFacings = () => {
    if (!selectedProductForFacings || !facingsType || facingsValue < 1) {
      toast.error("Please enter a valid number of facings");
      return;
    }

    if (facingsValue > 10) {
      toast.error("Maximum 10 facings allowed");
      return;
    }

    // Activate pending placement mode
    dispatch(
      setPendingPlacement({
        active: true,
        product: selectedProductForFacings,
        facingsWide: facingsType === "wide" ? facingsValue : 1,
        facingsHigh: facingsType === "high" ? facingsValue : 1,
      })
    );

    // Close modal
    setFacingsModalOpen(false);
    // Note: Success message will show after compatible positions are calculated
  };

  const renderCustomTag = (value) => {
    if (value.length === 0) return null;
    const [first, ...rest] = value;
    const displayFirst = first.length > 4 ? `${first.slice(0, 5)}...` : first;

    return [
      <span
        key={first}
        style={{
          fontSize: "0.8rem",
          padding: "4px 8px",
          background: "#e0f7fa",
          borderRadius: 4,
          color: "#00796b",
        }}
      >
        {displayFirst}
        {rest.length > 0 ? ` +${rest.length}` : ""}
      </span>,
    ];
  };

  const filteredItems = useMemo(() => {
    return filterProducts(unplacedItemsWithRemoved, {
      selectedBrand: pi.brands,
      selectedCategory: pi.subCategories,
      priceRange:
        pi.priceRange?.length === 2
          ? { min: pi.priceRange[0], max: pi.priceRange[1] }
          : { min: 0, max: Infinity },
      searchText: (pi.searchText || "").trim(),
    });
  }, [
    unplacedItemsWithRemoved,
    pi.brands,
    pi.subCategories,
    pi.priceRange,
    pi.searchText,
  ]);

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };
  const handleOpenFilterPopover = (event) => {
    // sync draft state from current filters
    setDraftPi(pi);
    setDraftOnlyNotOnPlanogram(productPosition === "notOnPlanogram");
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilterPopover = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFiltersPopover = () => {
    setPi(draftPi);
    setProductPosition(draftOnlyNotOnPlanogram ? "notOnPlanogram" : "all");
    setFilterAnchorEl(null);
  };

  const handleResetFiltersPopover = () => {
    setDraftPi({
      brands: [],
      subCategories: [],
      priceRange: [],
      searchText: "",
    });
    setDraftOnlyNotOnPlanogram(false);
  };
  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };
  const handleSortChange = (option) => {
    setSortBy(option);
    setSortMenuAnchor(null);
  };

  // First apply position filter
  const positionFilteredItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const inPlanogram = isProductOnPlanogram.has(item.tpnb);

      switch (productPosition) {
        case "onPlanogram":
          return inPlanogram;
        case "notOnPlanogram":
          return !inPlanogram && !item.isRemoved;
        case "removed":
          return item.isRemoved;
        default: // 'all'
          return true;
      }
    });
  }, [filteredItems, isProductOnPlanogram, productPosition]);

  // Then sort the filtered items
  const sortedItems = useMemo(() => {
    const items = [...positionFilteredItems];
    items.sort((a, b) => {
      let aValue, bValue;
      if (sortBy === "price") {
        aValue = a.price || 0;
        bValue = b.price || 0;
      } else if (sortBy === "volume") {
        const aVol = (a.width || 0) * (a.height || 0) * (a.depth || 0);
        const bVol = (b.width || 0) * (b.height || 0) * (b.depth || 0);
        aValue = aVol;
        bValue = bVol;
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [positionFilteredItems, sortBy, sortOrder]);

  // Uniform image viewport height so titles/badges align across cards
  const maxInventoryImageHeight = useMemo(() => {
    const SCALE = 3;
    const zoomFactor = 1;
    if (!sortedItems || sortedItems.length === 0) return 140;
    let maxH = 0;
    for (const item of sortedItems) {
      const rawHeight = item?.height ?? 50;
      const scaledH = (rawHeight / 10) * SCALE * zoomFactor;
      if (scaledH > maxH) maxH = scaledH;
    }
    return Math.ceil(maxH);
  }, [sortedItems]);

  const handleProductSelect = (item) => {
    const isOnPlanogram = isProductOnPlanogram.has(item.tpnb);

    if (selectedProduct?.id === item.id) {
      dispatch(setSelectedProduct(null));
      dispatch(setProductInventorySelectedProduct(null));
    } else {
      if (!isOnPlanogram) {
        toast.error("Item not available in planogram");
      }
      dispatch(
        setSelectedProduct({
          ...item,
          product_id: item.id,
          actualWidth: item.actualWidth || (item.width ? item.width / 10 : 0),
          actualHeight:
            item.actualHeight || (item.height ? item.height / 10 : 0),
          facings_wide: item.facings_wide || item.facing_wide || 1,
          facings_high: item.facings_high || item.facing_high || 1,
          total_facings:
            (item.facings_high || item.facing_high || 1) *
            (item.facings_wide || item.facing_wide || 1),
          gtin: item.gtin || item.global_trade_item_number,
          description:
            item.description ||
            `${item.subCategory_name || ""} - ${item.name || ""}`,
          brand: item.brand || item.brand_name,
        })
      );
      dispatch(setProductInventorySelectedProduct(item));
    }
  };

  const hasActiveFilters = Boolean(
    pi.brands?.length ||
      pi.subCategories?.length ||
      pi.searchText?.trim().length ||
      (pi.priceRange?.length === 2 &&
        (pi.priceRange[0] !== minPrice || pi.priceRange[1] !== maxPrice))
  );

  // Handler functions to reduce nesting depth
  const createProductClickHandler = (item) => () => {
    handleProductSelect(item);
  };

  const createImageErrorHandler = (itemId) => () => {
    setImageErrorMap((prev) => ({
      ...prev,
      [itemId]: true,
    }));
  };

  const createPlusClickHandler = (item) => (e) => {
    handlePlusClick(e, item);
  };

  const createProductKeyDownHandler = (item) => (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleProductSelect(item);
    }
  };

  const createProductKeyUpHandler = (item) => (event) => {
    if (event.key === " ") {
      event.preventDefault();
      handleProductSelect(item);
    }
  };

  return (
    <div className="h-[100%] flex flex-col">
      <Box sx={{ width: "100%", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <InventoryIcon sx={{ color: "#1d1d1d", fontSize: 20 }} />
          <Typography
            variant="h6"
            sx={{ fontSize: "16px", fontWeight: "600", color: "#1d1d1d" }}
          >
            Product Inventory ({positionFilteredItems.length})
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "#1d1d1d", opacity: 0.2 }} />
      </Box>

      {/* Product Position Filter */}
      <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
        <InputLabel
          id="product-position-label"
          sx={{
            color: "rgba(0, 0, 0, 0.6)",
            "&.Mui-focused": {
              color: "rgba(0, 0, 0, 0.6)",
            },
          }}
        >
          Product Position
        </InputLabel>
        <Select
          labelId="product-position-label"
          value={productPosition}
          onChange={(e) => setProductPosition(e.target.value)}
          label="Product Position"
          sx={{
            backgroundColor: "#fff",
            borderRadius: "4px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.23)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.87)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.87)",
              borderWidth: "1px",
            },
            "& .MuiSelect-icon": {
              color: "rgba(0, 0, 0, 0.54)",
            },
          }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="onPlanogram">On Planogram</MenuItem>
          <MenuItem value="notOnPlanogram">Not On Planogram</MenuItem>
          <MenuItem value="removed">Removed</MenuItem>
        </Select>
      </FormControl>

      {/* Search & Filter Toggle */}
      <div className="flex items-center gap-2 mb-2 pr-2">
        <TextField
          placeholder="Search ..."
          value={pi.searchText}
          onChange={(e) => setPi((f) => ({ ...f, searchText: e.target.value }))}
          fullWidth
          size="small"
          variant="outlined"
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: "#1d1d1d", mr: 1 }} />,
            },
          }}
          sx={{
            fontSize: "0.9rem",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#fff",
              borderRadius: "8px",
              "& fieldset": {
                borderColor: "#1d1d1d",
              },
              "&:hover fieldset": {
                borderColor: "#1d1d1d",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1d1d1d",
              },
            },
          }}
        />
        <button
          className="border p-0.5 rounded-md text-[#1d1d1d] hover:bg-gray-300 flex items-center justify-center"
          onClick={handleOpenFilterPopover}
          style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
        >
          <Badge
            color="primary"
            variant="dot"
            invisible={!hasActiveFilters}
            overlap="circular"
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            sx={{
              "& .MuiBadge-dot": {
                top: 4,
                right: 4,
                minWidth: 7,
                height: 7,
              },
            }}
          >
            <ListFilter size={19} />
          </Badge>
        </button>
        <button
          className="border p-0.5 rounded-md text-[#1d1d1d] hover:bg-gray-300 flex items-center justify-center"
          onClick={handleSortMenuOpen}
          style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
        >
          <ArrowDownUp size={19} />
        </button>
        <Menu
          id="sort-menu"
          anchorEl={sortMenuAnchor}
          open={Boolean(sortMenuAnchor)}
          onClose={handleSortMenuClose}
        >
          <div className="w-full bg-white rounded-lg overflow-hidden">
            {/* Title */}
            <div className="px-4 py-2 border-b border-gray-200 font-semibold text-sm flex items-center gap-x-2 text-[#FF6B6B]">
              <BiSortAlt2 className="text-xl" />
              <p>Sort By</p>
            </div>

            {/* Fields */}
            <ul>
              {[
                { value: "price", label: "Price" },
                { value: "volume", label: "Volume" },
              ].map((option) => {
                const isSelected = sortBy === option.value;
                return (
                  <li key={option.value}>
                    <button
                      onClick={() => handleSortChange(option.value)}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                    >
                      <span
                        className={`w-4 h-4 mr-2 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          isSelected
                            ? "border-black bg-black"
                            : "border-gray-400 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "text-black font-bold"
                            : "text-black font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-gray-200" />

            {/* Directions */}
            <ul>
              {[
                { value: "asc", label: "Ascending", icon: <BsSortAlphaDown /> },
                { value: "desc", label: "Descending", icon: <BsSortAlphaUp /> },
              ].map((option) => {
                const isSelected = sortOrder === option.value;
                return (
                  <li key={option.value}>
                    <button
                      onClick={() => setSortOrder(option.value)}
                      className="flex items-center gap-x-3 w-full px-4 py-2 hover:bg-gray-100"
                    >
                      <span
                        className={`text-xl ${
                          isSelected ? "text-black font-bold" : "text-gray-400"
                        }`}
                      >
                        {option.icon}
                      </span>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "text-black font-bold"
                            : "text-black font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Menu>
        {/* <button
          className="border p-0.5 rounded-md text-[#05AF97]"
          onClick={handleResetInventoryFilters}
        >
          <RestartAlt />
        </button> */}
      </div>

      {/* Filters Popover */}
      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilterPopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: { sx: { width: 420, borderRadius: 3, boxShadow: 6 } },
        }}
      >
        <Box sx={{ pt: 1 }}>
          {/* header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-x-2 text-sm font-semibold text-[#FF6B6B]">
              <IoFilter size={18} />
              <p>Filters</p>
            </div>
            <button
              onClick={handleCloseFilterPopover}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* content */}
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div>
              {/* Brand */}
              <Autocomplete
                multiple
                options={brands}
                disableCloseOnSelect
                value={draftPi.brands}
                onChange={(_, val) =>
                  setDraftPi((f) => ({ ...f, brands: val }))
                }
                renderInput={(params) => (
                  <TextField {...params} placeholder="Brands" size="small" />
                )}
                renderOption={(props, option, { selected }) => {
                  return (
                    <li {...props}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        style={{ marginRight: 8 }}
                      />
                      {option}
                    </li>
                  );
                }}
                slotProps={{
                  tags: renderCustomTag,
                }}
                sx={{ width: "100%", mb: 2 }}
              />

              {/* Subcategory */}
              <Autocomplete
                multiple
                options={categories}
                disableCloseOnSelect
                value={draftPi.subCategories}
                onChange={(_, val) =>
                  setDraftPi((f) => ({ ...f, subCategories: val }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Sub Categories"
                    size="small"
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  return (
                    <li {...props}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        style={{ marginRight: 8 }}
                      />
                      {option}
                    </li>
                  );
                }}
                slotProps={{
                  tags: renderCustomTag,
                }}
                sx={{ width: "100%", mb: 2 }}
              />

              {/* Price */}
              <div className="mb-4">
                <Typography variant="body2" gutterBottom>
                  Price Range
                </Typography>
                <div className="flex items-center gap-x-5 px-1">
                  <p className="w-10 text-right">{minPrice}</p>
                  <Slider
                    value={[
                      draftPi.priceRange[0] || minPrice,
                      draftPi.priceRange[1] || maxPrice,
                    ]}
                    onChange={(_, val) =>
                      setDraftPi((f) => ({ ...f, priceRange: val }))
                    }
                    valueLabelDisplay="auto"
                    min={minPrice}
                    max={maxPrice}
                    sx={{
                      color: "#FF6B6B",
                      "& .MuiSlider-track": {
                        backgroundColor: "#FF6B6B",
                      },
                      "& .MuiSlider-rail": {
                        backgroundColor: "#b0b0b0",
                      },
                      "& .MuiSlider-thumb": {
                        width: 12,
                        height: 12,
                        borderColor: "#FF6B6B",
                      },
                    }}
                  />
                  <p className="w-10 text-left">{maxPrice}</p>
                </div>
              </div>

              {/* Only not on planogram */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Checkbox
                  size="small"
                  checked={draftOnlyNotOnPlanogram}
                  onChange={(e) => setDraftOnlyNotOnPlanogram(e.target.checked)}
                />
                <Typography variant="body2">
                  Show Only Products Not On Planogram
                </Typography>
              </Box>
            </div>
          </div>

          {/* footer */}
          <div className="flex w-full justify-between text-sm font-semibold border-t">
            <button
              onClick={handleResetFiltersPopover}
              className="w-[50%] p-4 flex items-center justify-center gap-x-3 border-r hover:bg-[#f0f0f0]"
            >
              <LiaBroomSolid size={18} />
              <p>Reset All Filters</p>
            </button>
            <button
              onClick={handleApplyFiltersPopover}
              className="w-[50%] p-4 flex items-center justify-center gap-x-3 hover:bg-[#f0f0f0]"
            >
              <p>Apply</p>
              <FaCheckCircle size={14} />
            </button>
          </div>
        </Box>
      </Popover>

      {/* Facings Type Menu */}
      <Menu
        anchorEl={facingsMenuAnchor}
        open={Boolean(facingsMenuAnchor)}
        onClose={handleCloseFacingsMenu}
      >
        <MenuItem onClick={() => handleSelectFacingType("wide")}>
          Facings Wide
        </MenuItem>
        <MenuItem onClick={() => handleSelectFacingType("high")}>
          Facings High
        </MenuItem>
      </Menu>

      {/* Facings Number Input Modal */}
      <Dialog
        open={facingsModalOpen}
        onClose={handleCloseFacingsModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Select {facingsType === "wide" ? "Facings Wide" : "Facings High"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Number of Facings"
              type="number"
              value={facingsValue}
              onChange={(e) =>
                setFacingsValue(
                  Math.max(
                    1,
                    Math.min(10, Number.parseInt(e.target.value) || 1)
                  )
                )
              }
              fullWidth
              slotProps={{
                input: { min: 1, max: 10 },
              }}
              helperText="Enter a number between 1 and 10"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFacingsModal}>Cancel</Button>
          <Button
            onClick={handleConfirmFacings}
            variant="contained"
            sx={{ bgcolor: "#05AF97", "&:hover": { bgcolor: "#048c7a" } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Grid */}
      <div className="overflow-y-auto h-full pr-3">
        <Droppable droppableId="items" direction="vertical">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`w-full pb-4 ${
                sortedItems.length > 0
                  ? "grid grid-cols-2 gap-4"
                  : "flex justify-center items-center min-h-[200px]"
              }`}
            >
              {sortedItems.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontStyle: "italic" }}
                >
                  No Products Found
                </Typography>
              ) : (
                sortedItems.map((item, index) => {
                  const imageSrc =
                    !imageErrorMap[item.id] && item.image_url
                      ? item.image_url
                      : getFallbackImage(item);
                  const inPlanogram = isProductOnPlanogram.has(item.tpnb);
                  // === SCALE CALCULATION (matching planogramFunctions.js) ===
                  const SCALE = 3;
                  const zoomFactor = 1; // Default zoom for inventory display
                  const rawWidth = item.width ?? 50;
                  const rawHeight = item.height ?? 50;
                  const scaledWidth = (rawWidth / 10) * SCALE * zoomFactor;
                  const scaledHeight = (rawHeight / 10) * SCALE * zoomFactor;
                  // =========================
                  // Create handlers at this level to reduce nesting depth
                  const handleProductClick = createProductClickHandler(item);
                  const handlePlusButtonClick = createPlusClickHandler(item);
                  const handleImageError = createImageErrorHandler(item.id);
                  const handleProductKeyDown =
                    createProductKeyDownHandler(item);
                  const handleProductKeyUp = createProductKeyUpHandler(item);
                  let planogramStatusClass =
                    "border-gray-300 text-[#B09510] bg-transparent";
                  let planogramStatusLabel = "Not On Planogram";
                  let planogramStatusColor = "#B09510";
                  if (item.isRemoved) {
                    planogramStatusClass =
                      "border-gray-300 text-red-800 bg-transparent";
                    planogramStatusLabel = "Removed";
                    planogramStatusColor = "#991b1b";
                  } else if (inPlanogram) {
                    planogramStatusClass =
                      "border-gray-300 text-[#05AF97] bg-transparent";
                    planogramStatusLabel = "On Planogram";
                    planogramStatusColor = "#05AF97";
                  }
                  const statusClassName = `px-2 py-0.5 rounded-full text-[9px] font-semibold border ${planogramStatusClass}`;
                  return (
                    <Draggable
                      draggableId={item.id}
                      index={index}
                      key={item.id}
                      isDragDisabled={inPlanogram}
                    >
                      {(provided, snapshot) => (
                        <button
                          type="button"
                          onClick={handleProductClick}
                          onKeyDown={handleProductKeyDown}
                          onKeyUp={handleProductKeyUp}
                          className={`w-full text-left p-3 border transition relative ${
                            inPlanogram ? "cursor-not-allowed" : "cursor-pointer"
                          } ${
                            snapshot.isDragging
                              ? "shadow-lg border-blue-300 bg-blue-50"
                              : "shadow-sm border-gray-200 hover:shadow-md bg-white"
                          }
                        ${
                          selectedProduct?.id == item.id
                            ? "border-2 border-[#05AF97]"
                            : "border-gray-200"
                        }`}
                        >
                          {/* Plus Button - Only show if product is not on planogram */}
                          {!inPlanogram && (
                            <IconButton
                              size="small"
                              onClick={handlePlusButtonClick}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "#05AF97",
                                color: "white",
                                width: 24,
                                height: 24,
                                "&:hover": {
                                  bgcolor: "#048c7a",
                                },
                                zIndex: 10,
                              }}
                              data-testid="facings-plus-btn"
                            >
                              <AddIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}

                          <div className="flex flex-col items-center">
                            <div
                              className="w-full flex items-center justify-center"
                              style={{ height: maxInventoryImageHeight }}
                            >
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  width: scaledWidth,
                                  height: scaledHeight,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                }}
                              >
                                <img
                                  src={imageSrc}
                                  alt={item.name}
                                  onError={handleImageError}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  className="object-cover"
                                />
                              </div>
                            </div>

                            <div className="w-full mt-2 space-y-1 flex-1 flex flex-col justify-end">
                              <div
                                className="text-center text-xs text-gray-700 w-full truncate"
                                title={item.name}
                              >
                                {item.name || "Unnamed"}
                              </div>
                              <div className="flex justify-center">
                                <span
                                  className={statusClassName}
                                  style={{
                                    minWidth: 0,
                                    background: "transparent",
                                    color: planogramStatusColor,
                                  }}
                                >
                                  {planogramStatusLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                    </Draggable>
                  );
                })
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};

export default React.memo(ProductInventory);
