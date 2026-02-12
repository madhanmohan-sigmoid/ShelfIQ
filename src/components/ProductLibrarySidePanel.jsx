import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormHelperText } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMasterProductBrands,
  selectMasterProductSubCategories,
} from "../redux/reducers/dataTemplateSlice";
import { addProduct, getProductData, updateProduct } from "../api/api";
import {
  selectSelectedCategory,
  selectSelectedRetailer,
} from "../redux/reducers/regionRetailerSlice";
import { setProducts } from "../redux/reducers/productDataSlice";
import toast from "react-hot-toast";
import productBoxIcon from "../assets/product_box.svg";
import PropTypes from "prop-types";

const ProductLibrarySidePanel = ({ product, onClose, mode }) => {
  const isViewMode = mode !== "edit";
  console.log(mode, isViewMode, product);
  const dispatch = useDispatch();

  const brands = useSelector(selectMasterProductBrands) || [];
  const subCategories = useSelector(selectMasterProductSubCategories) || [];

  const [previewImage, setPreviewImage] = useState(product?.image_url || "");
  const [file] = useState(null);
  const retailer = useSelector(selectSelectedRetailer)?.name || "TESCO";
  const category = useSelector(selectSelectedCategory)?.name || "ORAL CARE";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      attributes: {
        BRAND: product?.brand_name || "",
        SUB_CATEGORY: product?.subCategory_name || "",
      },
      tpnb: product?.tpnb || "",
      product_name: product?.name || "",
      price: product?.price || 0,
      global_trade_item_number: product.global_trade_item_number || "",
      image_url: product?.image_url || "",
      width: product?.width || 0,
      height: product?.height || 0,
      depth: product?.depth || 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        attributes: {
          BRAND: product?.brand_name || "",
          SUB_CATEGORY: product?.subCategory_name || "",
        },
        tpnb: product?.tpnb || "",
        product_name: product?.name || "",
        price: product?.price || 0,
        global_trade_item_number: product?.global_trade_item_number || "",
        image_url: product?.image_url || "",
        width: product?.width || 0,
        height: product?.height || 0,
        depth: product?.depth || 0,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data) => {
    const payload = {
      id: product?.id || null,
      product_id: `${data.tpnb}_0`,
      global_trade_item_number: data.global_trade_item_number,
      name: data.product_name,
      tpnc: "NaN",
      tpnb: data.tpnb,
      company_id: 1,
      price: parseFloat(data.price),
      image_url: data.image_url,
      added_on: null,
      updated_on: null,
      added_by: 1,
      updated_by: 1,
      dimension: {
        width: parseFloat(data.width),
        height: parseFloat(data.height),
        depth: parseFloat(data.depth),
      },
      attributes: {
        BRAND: data.attributes.BRAND,
        SUB_CATEGORY: data.attributes.SUB_CATEGORY,
      },
    };
    console.log(payload);

    const toastId = toast.loading(
      `${product?.id ? "Updating Product" : "Adding new Product"}`
    );
    try {
      if (product?.id) {
        const res = await updateProduct(
          retailer,
          category,
          product?.id,
          payload,
          file
        );
        console.log(res);
      } else {
        const res = await addProduct(retailer, category, payload, file);
        console.log(res);
      }

      const updatedProduct = await getProductData();
      dispatch(setProducts(updatedProduct.data.data));
      toast.dismiss(toastId);
      toast.success(
        `${
          product?.id
            ? "Updated Successfully"
            : "Created new Product Successfully"
        }`
      );
    } catch (e) {
      console.log(e);
      toast.dismiss(toastId);
      toast.error("Something went wrong");
    }
    onClose();
  };

  const imageUrl = watch("image_url");

  // Update preview when user types a valid URL manually
  useEffect(() => {
    if (imageUrl?.startsWith("http")) {
      setPreviewImage(imageUrl);
    }
  }, [imageUrl]);

  let headerTitle = "Add Product";
  if (isViewMode) {
    headerTitle = "Product view";
  } else if (product?.id) {
    headerTitle = "Edit Product";
  }

  return (
    <div className=" flex items-center justify-center h-fit ">
      <div className="bg-[#FFD3D3] w-full rounded-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-[#FF9F9F]">
          <div className="font-semibold text-black flex gap-x-3 items-center">
            <span>
              <img src={productBoxIcon} alt="product box" />
            </span>
            {headerTitle}
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="flex flex-col items-start justify-between gap-3 overflow-y-auto max-h-[65vh] ">
            <div className="flex flex-col w-96 items-center ">
              <div className="bg-white rounded-lg w-full flex items-center justify-center">
                <div className="w-48 h-28 rounded-lg flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Product preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg
                        className="w-8 h-8 mx-auto mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-xs">No image</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-1 flex justify-between w-full items-center gap-x-2">
                <p className="text-xs text-black font-semibold truncate">
                  {watch("product_name") || "Product Name"}
                </p>
                <p className="text-xs font-bold text-white bg-[#ff9f9f] px-2 py-1 rounded-md whitespace-nowrap">
                  {`${"\u00A3"}${((watch("price") ?? 0) / 100).toFixed(2)}`}
                </p>
              </div>
            </div>

            <div className="space-y-2 pr-2 pl-1 w-full">
              {[
                {
                  label: "TPNB ID",
                  field: "tpnb",
                  type: "text",
                  disabled: !!product?.id,
                },
                {
                  label: "Global Trade Item Number",
                  field: "global_trade_item_number",
                  type: "text",
                  disabled: !!product?.id,
                },
                {
                  label: "Product Name",
                  field: "product_name",
                  type: "text",
                  disabled: false,
                },
                {
                  label: "Price (pence)",
                  field: "price",
                  type: "text",
                  disabled: false,
                },
              ].map(({ label, field, type, disabled }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    {label} <span className="text-red-250">*</span>
                  </label>
                  <input
                    type={type}
                    className={`w-full px-2 py-1.5 border ${
                      errors[field] ? "border-red-250" : "border-gray-300"
                    } rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500
                     ${
                       isViewMode
                         ? "bg-gray-100 cursor-not-allowed"
                         : "bg-white"
                     }
                    `}
                    {...register(field, {
                      required: `${label} is required`,
                      ...(field === "price" && {
                        min: {
                          value: 0,
                          message: "Price must be non-negative",
                        },
                      }),
                    })}
                    disabled={isViewMode || disabled}
                  />
                  {errors[field] && (
                    <FormHelperText error className="text-xs">
                      {errors[field].message}
                    </FormHelperText>
                  )}
                </div>
              ))}

              <div>
                <label htmlFor="brand-select" className="block text-xs font-medium mb-0.5">
                  Brand <span className="text-red-250">*</span>
                </label>
                <select
                  id="brand-select"
                  {...register("attributes.BRAND", {
                    required: "Brand is required",
                  })}
                  className={`w-full px-2 py-1.5 border ${
                    errors?.attributes?.BRAND
                      ? "border-red-250"
                      : "border-gray-300"
                  } rounded-md text-xs
                   ${
                     isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                   }`}
                  disabled={isViewMode}
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors?.attributes?.BRAND && (
                  <FormHelperText error className="text-xs">
                    {errors.attributes.BRAND.message}
                  </FormHelperText>
                )}
              </div>

              <div>
                <label htmlFor="sub-category-select" className="block text-xs font-medium mb-0.5">
                  Sub Category <span className="text-red-250">*</span>
                </label>
                <select
                  id="sub-category-select"
                  {...register("attributes.SUB_CATEGORY", {
                    required: "Sub Category is required",
                  })}
                  className={`w-full px-2 py-1.5 border ${
                    errors?.attributes?.SUB_CATEGORY
                      ? "border-red-250"
                      : "border-gray-300"
                  } rounded-md text-xs
                   ${
                     isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                   }`}
                  disabled={isViewMode}
                >
                  <option value="">Select a Sub Category</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.name}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
                {errors?.attributes?.SUB_CATEGORY && (
                  <FormHelperText error className="text-xs">
                    {errors.attributes.SUB_CATEGORY.message}
                  </FormHelperText>
                )}
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                {["width", "height", "depth"].map((dim) => (
                  <div key={dim}>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5 ">
                      <span className="capitalize">{dim}</span> (mm){" "}
                      <span className="text-red-250">*</span>
                    </label>
                    <input
                      type="number"
                      className={`w-full px-2 py-1.5 border ${
                        errors[dim] ? "border-red-250" : "border-gray-300"
                      } rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500
                       ${
                         isViewMode
                           ? "bg-gray-100 cursor-not-allowed"
                           : "bg-white"
                       }`}
                      {...register(dim, { required: `${dim} is required` })}
                      disabled={isViewMode}
                    />
                    {errors[dim] && (
                      <FormHelperText error className="text-xs">
                        {errors[dim].message}
                      </FormHelperText>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductLibrarySidePanel;

ProductLibrarySidePanel.propTypes = {
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.string,
};
