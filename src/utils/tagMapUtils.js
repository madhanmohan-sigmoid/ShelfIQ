// Use colors from API data instead of generating them
import {
  getProductCategoryColor,
  getBrandColorFallback,
} from "../config/productCategoryColorCode";

// Get brand color from API data
export const getBrandColor = (brandName, masterProductBrands = []) => {
  if (!brandName) return "#9E9E9E"; // Default gray

  // Find the brand in master data and get its color_code
  const brandData = masterProductBrands.find(
    (brand) => brand.name === brandName
  );
  const brandColorCode = brandData?.color_code;
  if (brandColorCode) {
    return brandColorCode;
  }

  // Fallback: use the brand color fallback from productCategoryColorCode
  return getBrandColorFallback(brandName);
};

// Get subcategory color from API data
export const getSubCategoryColor = (
  subCategoryName,
  masterProductSubCategories = []
) => {
  if (!subCategoryName) return "#9E9E9E"; // Default gray

  // Find the subcategory in master data and get its color_code
  const subCategoryData = masterProductSubCategories.find(
    (subCat) => subCat.name === subCategoryName
  );
  if (subCategoryData?.color_code) {
    return subCategoryData.color_code;
  }

  // Fallback: use the existing productCategoryColorCode system
  return getProductCategoryColor(subCategoryName);
};

// Get brand colors from API data instead of generating
export const generateBrandColors = (brands, masterProductBrands = []) => {
  const brandColors = {};
  for (const brand of brands) {
    brandColors[brand] = getBrandColor(brand, masterProductBrands);
  }
  return brandColors;
};

// Get subcategory colors from API data instead of generating
export const generateSubCategoryColors = (
  subCategories,
  masterProductSubCategories = []
) => {
  const subCategoryColors = {};
  for (const subCategory of subCategories) {
    subCategoryColors[subCategory] = getSubCategoryColor(
      subCategory,
      masterProductSubCategories
    );
  }
  return subCategoryColors;
};

// Apply brand colors to products using API data
export const applyBrandColorsToProducts = (
  products,
  brandColors,
  masterProductBrands = [],
  selectedBrands = []
) => {
  return products.map((product) => {
    const productBrand = product.product_details?.brand_name;
    const shouldApplyColor =
      selectedBrands.length > 0 && selectedBrands.includes(productBrand);

    return {
      ...product,
      brandColor:
        shouldApplyColor && productBrand
          ? getBrandColor(productBrand, masterProductBrands)
          : null,
    };
  });
};

// Apply subcategory colors to products using API data
export const applySubCategoryColorsToProducts = (
  products,
  subCategoryColors,
  masterProductSubCategories = [],
  selectedSubCategories = []
) => {
  return products.map((product) => {
    const productSubCategory = product.product_details?.subCategory_name;
    const shouldApplyColor =
      selectedSubCategories.length > 0 &&
      selectedSubCategories.includes(productSubCategory);

    return {
      ...product,
      brandColor:
        shouldApplyColor && productSubCategory
          ? getSubCategoryColor(productSubCategory, masterProductSubCategories)
          : null,
    };
  });
};

// Filter products based on Tag Map selections
export const filterProductsByTagMap = (products) => {
  // Always return all products - we don't filter them out, just apply colors selectively
  return products;
};

// Get unique brands and subcategories from planogram products
export const getUniqueBrandsAndSubCategories = (products) => {
  const brands = [
    ...new Set(
      products.map((p) => p.product_details?.brand_name).filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const subCategories = [
    ...new Set(
      products.map((p) => p.product_details?.subCategory_name).filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  return { brands, subCategories };
};

// Modular: Calculate dimmed product IDs based on tag map selection
export const getTagMapDimmedProductIds = (shelfLines, tagMapFilters, showProductNameTag) => {
  if (!shelfLines || shelfLines.length === 0 || showProductNameTag) return [];
  const { selectedType, selectedBrands = [], selectedSubCategories = [] } = tagMapFilters || {};

  if (selectedType === 'brand' && selectedBrands.length > 0) {
    return shelfLines
      .flat(2)
      .filter((item) => {
        const brand = item.brand || item.product_details?.brand_name;
        return !item.isEmpty && item.id && brand && !selectedBrands.includes(brand);
      })
      .map((item) => item.id);
  } else if (selectedType === 'subcategory' && selectedSubCategories.length > 0) {
    return shelfLines
      .flat(2)
      .filter((item) => {
        const subcat = item.subCategory_name || item.product_details?.subCategory_name;
        return !item.isEmpty && item.id && subcat && !selectedSubCategories.includes(subcat);
      })
      .map((item) => item.id);
  }
  return [];
};

// Modular: Filter tag map selections to only include options present in products
export const filterTagMapSelectionsToAvailable = (planogramProducts, tagMapFilters) => {
  const availableBrands = new Set(
    planogramProducts.map((p) => p.product_details?.brand_name).filter(Boolean)
  );
  const availableSubCategories = new Set(
    planogramProducts.map((p) => p.product_details?.subCategory_name).filter(Boolean)
  );

  const currentSelectedBrands = tagMapFilters?.selectedBrands || [];
  const currentSelectedSubCategories = tagMapFilters?.selectedSubCategories || [];

  const filteredBrands = currentSelectedBrands.filter((brand) => availableBrands.has(brand));
  const filteredSubCategories = currentSelectedSubCategories.filter((subcat) => availableSubCategories.has(subcat));

  return {
    filteredBrands,
    filteredSubCategories,
  };
};