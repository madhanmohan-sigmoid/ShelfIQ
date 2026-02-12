import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { Tooltip as MuiTooltip } from "@mui/material";
import {
  resetFilters,
  selectAllProducts,
  selectFilters,
  setPriceRange,
  selectViewMode,
  // setViewMode,
} from "../redux/reducers/productDataSlice";
import { selectCategoryAccessType } from "../redux/reducers/regionRetailerSlice";

import ProductDetailModal from "../components/Modals/ProductDetailModal";
import ProductLibraryBar from "../components/ProductLibraryBar";
import ProductLibraryTable from "../components/ProductLibraryTable";
import ProductLibrarySidePanel from "../components/ProductLibrarySidePanel";

import {
  filterProducts,
  getFallbackImage,
  getUniqueSets,
  getMinMaxPrice,
} from "../utils/productUtils";

const ProductLibrary = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const filters = useSelector(selectFilters);
  const { priceRange } = filters;
  const viewMode = useSelector(selectViewMode);
  const categoryAccessType = useSelector(selectCategoryAccessType);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("view");
  const [addNewProductModalOpen, setAddNewProductModalOpen] = useState(false);

  // Reset all filters on first load
  useEffect(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  const allPriceRange = useMemo(() => getMinMaxPrice(products), [products]);

  useEffect(() => {
    if (priceRange.min === null && priceRange.max === null) {
      dispatch(
        setPriceRange({ min: allPriceRange.min, max: allPriceRange.max })
      );
    }
  }, [allPriceRange, priceRange, dispatch]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, filters);
  }, [products, filters]);

  const [sortBy, setSortBy] = useState("name-asc");

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    const [field, direction] = sortBy.split("-");

    switch (field) {
      case "name":
        return direction === "asc"
          ? sorted.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""))
          : sorted.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
      case "id":
        return direction === "asc"
          ? sorted.sort((a, b) => (a?.tpnb || "").localeCompare(b?.tpnb || ""))
          : sorted.sort((a, b) => (b?.tpnb || "").localeCompare(a?.tpnb || ""));
      case "price":
        return direction === "asc"
          ? sorted.sort((a, b) => (a?.price || 0) - (b?.price || 0))
          : sorted.sort((a, b) => (b?.price || 0) - (a?.price || 0));
      case "sales":
        return direction === "asc"
          ? sorted.sort((a, b) => (a?.sales || 0) - (b?.sales || 0))
          : sorted.sort((a, b) => (b?.sales || 0) - (a?.sales || 0));
      case "volume":
        return direction === "asc"
          ? sorted.sort((a, b) => (a?.volume || 0) - (b?.volume || 0))
          : sorted.sort((a, b) => (b?.volume || 0) - (a?.volume || 0));
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

  const filterElements = getUniqueSets(products, [
    "brand_name",
    "subCategory_name",
    "BENCHMARK",
    "INTENSITY",
    "NPD",
    "PLATFORM",
    "PROMOITEM",
  ]);

  const addNewProductHandler = () => {
    setMode("edit");
    setAddNewProductModalOpen(true);
  };

  return (
    <div className="w-full h-full font-sans overflow-hidden bg-gray-100 px-6 py-4 flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center justify-between">
          <span className="font-semibold text-lg">
            PRODUCT LIBRARY ({filteredProducts.length})
          </span>
        </div>

        <MuiTooltip
          title={
            categoryAccessType === "USERS"
              ? "You do not have permission to add products. Only contributors can add products."
              : "Add Product"
          }
          placement="bottom"
        >
          <span>
            <button
              className={`flex items-center justify-center text-lg bg-[#FF6B6B] gap-x-3 rounded-full px-8 py-2.5 text-white font-semibold transition-colors ${
                categoryAccessType === "USERS"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#FF5555]"
              }`}
              onClick={addNewProductHandler}
              disabled={categoryAccessType === "USERS"}
            >
              <Plus />
              <p> Add Product</p>
            </button>
          </span>
        </MuiTooltip>
      </div>

      {/* Product Library Bar */}
      <ProductLibraryBar
        onSortChange={setSortBy}
        sortBy={sortBy}
        filterPriceRange={allPriceRange}
        filterElements={filterElements}
      />

      <div className="flex item-start gap-x-3 flex-1">
        {/* Product Content - Grid or Table View */}
        {viewMode === "grid" && sortedProducts.length > 0 && (
          <div
            className={`w-full grid ${
              selectedProduct ? "grid-cols-4" : "grid-cols-6"
            } gap-4 p-4 rounded-md overflow-y-auto h-[calc(100vh-220px)] bg-white shadow-sm transition-all duration-500`}
            style={{ marginTop: "0" }}
          >
            {sortedProducts.map((product, i) => (
              <button
                type="button"
                key={product?.id || i}
                onClick={() => setSelectedProduct(product)}
                className="w-full cursor-pointer flex flex-col h-[230px] bg-[#f2f2f2] rounded-lg relative items-center border-2 border-[#ececec] group transition-all duration-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#05AF97]"
              >
                <div className="p-4 h-[18rem] rounded overflow-hidden flex items-center justify-center">
                  <img
                    src={product.image_url}
                    className="object-contain w-full h-full"
                    alt={product.name}
                    onError={(e) => (e.target.src = getFallbackImage(product))}
                  />
                </div>
                <div
                  className={`text-left h-full w-full flex flex-col gap-2 rounded-b-lg group-hover:bg-[#FFD3D3] p-3 transition-all duration-500 ${
                    product?.id === selectedProduct?.id
                      ? "bg-[#FFD3D3]"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-black text-[11px] font-bold group-hover:bg-white px-2 py-0.5 rounded-full w-fit transition-all duration-500 ${
                        product?.id === selectedProduct?.id
                          ? "bg-white"
                          : "bg-[#FFD3D3]"
                      }`}
                    >
                      ID | {product?.tpnb}
                    </p>
                  </div>

                  <p className="text-gray-600 w-[90%] text-[10px] leading-tight">
                    {product?.name || "Unnamed"}
                  </p>
                  <p className="text-black font-bold text-[13px]">
                    {`${"\u00A3"}${((product?.price ?? 0) / 100).toFixed(2)}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {viewMode === "grid" && sortedProducts.length === 0 && (
          <div className="flex flex-col h-full w-full px-6 py-4 min-h-[500px]">
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <h4 className="text-lg font-medium mb-2">
                No Products Available
              </h4>
            </div>
          </div>
        )}
        {viewMode !== "grid" && (
          <ProductLibraryTable
            products={sortedProducts}
            onProductClick={(product) => setSelectedProduct(product)}
            onEditClick={(product) => {
              setSelectedProduct(product);
              setMode("edit");
            }}
          />
        )}

        {/* Product Detail Side Panel */}
        {selectedProduct &&
          sortedProducts.length > 0 &&
          viewMode === "grid" && (
            <ProductLibrarySidePanel
              product={selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                setMode("view");
              }}
              mode={mode}
            />
          )}

        {/* Add New Product Modal */}
        {addNewProductModalOpen && (
          <ProductDetailModal
            product={{}}
            onClose={() => {
              setMode("view");
              setAddNewProductModalOpen(false);
            }}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
};

export default ProductLibrary;
