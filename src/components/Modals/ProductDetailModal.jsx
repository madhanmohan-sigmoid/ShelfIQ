import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormHelperText } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMasterProductBrands,
  selectMasterProductSubCategories,
} from "../../redux/reducers/dataTemplateSlice";
import { addProduct, getProductData, updateProduct } from "../../api/api";
import {
  selectSelectedCategory,
  selectSelectedRetailer,
} from "../../redux/reducers/regionRetailerSlice";
import { setProducts } from "../../redux/reducers/productDataSlice";
import toast from "react-hot-toast";
import productBoxIcon from "../../assets/product_box.svg";
import { Check } from "lucide-react";
import PropTypes from "prop-types";

const ProductDetailModal = ({ product, onClose, mode }) => {
  const isViewMode = mode !== "edit";
  console.log(mode, isViewMode, product);
  const dispatch = useDispatch();

  const brands = useSelector(selectMasterProductBrands) || [];
  const subCategories = useSelector(selectMasterProductSubCategories) || [];

  const [previewImage, setPreviewImage] = useState(product?.image_url || "");
  const [file, setFile] = useState(null);
  const retailer = useSelector(selectSelectedRetailer)?.name || "TESCO";
  const category = useSelector(selectSelectedCategory)?.name || "ORAL CARE";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      global_trade_item_number: product?.global_trade_item_number || "",
      image_url: product?.image_url || "",
      width: product?.width || 0,
      height: product?.height || 0,
      depth: product?.depth || 0,
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      id: product?.id || null,
      product_id: `${data.tpnb}_0`,
      global_trade_item_number: data.global_trade_item_number,
      name: data.product_name,
      tpnc: "NaN",
      tpnb: data.tpnb,
      company_id: 1,
      price: Number.parseFloat(data.price),
      image_url: data.image_url,
      added_on: null,
      updated_on: null,
      added_by: 1,
      updated_by: 1,
      dimension: {
        width: Number.parseFloat(data.width),
        height: Number.parseFloat(data.height),
        depth: Number.parseFloat(data.depth),
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setValue("image_url", url);
      setFile(file);
    }
  };

  const imageUrl = watch("image_url");

  // Update preview when user types a valid URL manually
  useEffect(() => {
    if (imageUrl?.startsWith("http")) {
      setPreviewImage(imageUrl);
    }
  }, [imageUrl]);

  const brandFieldId = "product-brand-select";
  const subCategoryFieldId = "product-subcategory-select";

  let modalTitle = "Add Product";
  if (product?.id) {
    modalTitle = "Edit Product";
  }
  if (isViewMode) {
    modalTitle = "Product Details";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className=" font-semibold text-black flex items-center gap-x-3">
            <img src={productBoxIcon} alt="product box" />
            {modalTitle}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-2">
          <div className="flex flex-col items-start  gap-x-6 gap-y-2  overflow-y-scroll h-[450px]  ">
            {/* Image upload */}
            <div className="flex flex-col items-center w-full ">
              <label className="w-full h-[8rem] border-2 bg-[#F2F2F2] border-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Product preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-400 ">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
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
                    <p className="text-xs">Upload Image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  {...register("image_url", {
                    validate: (value) =>
                      value?.trim() !== "" ||
                      file !== null ||
                      "Image is required",
                  })}
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isViewMode}
                />
              </label>
              {errors.image_url && (
                <FormHelperText error>
                  {errors.image_url.message}
                </FormHelperText>
              )}
            </div>
            {/* main Form  */}
            <div className=" grid grid-cols-2 items-start gap-x-3 gap-y-4 px-2 ">
              {[
                {
                  label: "TPNB ID",
                  field: "tpnb",
                  type: "text",
                  disabled: Boolean(product?.id),
                },
                {
                  label: "Global Trade Item Number",
                  field: "global_trade_item_number",
                  type: "text",
                  disabled: Boolean(product?.id),
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
              ].map(({ label, field, type, disabled }) => {
                const inputId = `product-${field}-input`;
                return (
                  <div key={field}>
                    <label
                      htmlFor={inputId}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {label} <span className="text-red-250">*</span>
                    </label>
                    <input
                      id={inputId}
                      type={type}
                      className={`w-full px-3 py-2 border ${
                        errors[field] ? "border-red-250" : "border-gray-300"
                      } rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                      <FormHelperText error>
                        {errors[field].message}
                      </FormHelperText>
                    )}
                  </div>
                );
              })}

              <div>
                <label
                  htmlFor={brandFieldId}
                  className="block text-sm font-medium mb-1"
                >
                  Brand <span className="text-red-250">*</span>
                </label>
                <select
                  id={brandFieldId}
                  {...register("attributes.BRAND", {
                    required: "Brand is required",
                  })}
                  className={`w-full px-3 py-2 border ${
                    errors?.attributes?.BRAND
                      ? "border-red-250"
                      : "border-gray-300"
                  } rounded-sm text-sm`}
                  disabled={isViewMode}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors?.attributes?.BRAND && (
                  <FormHelperText error>
                    {errors.attributes.BRAND.message}
                  </FormHelperText>
                )}
              </div>

              <div>
                <label
                  htmlFor={subCategoryFieldId}
                  className="block text-sm font-medium mb-1"
                >
                  Sub Category <span className="text-red-250">*</span>
                </label>
                <select
                  id={subCategoryFieldId}
                  {...register("attributes.SUB_CATEGORY", {
                    required: "Sub Category is required",
                  })}
                  className={`w-full px-3 py-2 border ${
                    errors?.attributes?.SUB_CATEGORY
                      ? "border-red-250"
                      : "border-gray-300"
                  } rounded-sm text-sm`}
                  disabled={isViewMode}
                >
                  <option value="">Select Sub Category</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.name}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
                {errors?.attributes?.SUB_CATEGORY && (
                  <FormHelperText error>
                    {errors.attributes.SUB_CATEGORY.message}
                  </FormHelperText>
                )}
              </div>

              {/* Dimensions */}
              <div className=" col-span-2 grid grid-cols-3 gap-3">
                {["width", "height", "depth"].map((dim) => (
                  <div key={dim}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 ">
                      <span className="capitalize">{dim}</span> (mm){" "}
                      <span className="text-red-250">*</span>
                    </label>
                    <input
                      type="number"
                      className={`w-full px-3 py-2 border ${
                        errors[dim] ? "border-red-250" : "border-gray-300"
                      } rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      {...register(dim, {
                        required: `${dim} is required`,
                        min: {
                          value: 1,
                          message: `${dim} must be greater than 0`,
                        },
                      })}
                      disabled={isViewMode}
                    />
                    {errors[dim] && (
                      <FormHelperText error>
                        {errors[dim].message}
                      </FormHelperText>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center items-center pt-3 border-t border-gray-200 mt-4">
            {!isViewMode && (
              <button
                type="submit"
                className="px-6 py-2 flex items-center justify-center gap-x-1 text-black border-black border rounded-full text-sm font-medium"
              >
                <Check />
                <p>Confirm</p>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailModal;

ProductDetailModal.propTypes = {
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.string,
};
