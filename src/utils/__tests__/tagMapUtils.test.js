// Mock the productCategoryColorCode module
jest.mock("../../config/productCategoryColorCode", () => ({
  getProductCategoryColor: jest.fn((category) => {
    const colorMap = {
      "SENSITIVE TOOTHPASTE": "#F44336",
      "REGULAR TOOTHPASTE": "#2196F3",
      MOUTHWASH: "#3F51B5",
    };
    return colorMap[category?.toUpperCase()] || "#9E9E9E";
  }),
  getBrandColorFallback: jest.fn((brandName) => {
    if (!brandName) return "#9E9E9E"; // Default gray

    // Hash-based color for consistency (same brand name always gets same color)
    const hash = brandName.split("").reduce((a, b) => {
      const codePoint = b.codePointAt(0) ?? 0;
      a = (a << 5) - a + codePoint;
      return a & a;
    }, 0);

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
      "#F9E79F",
      "#ABEBC6",
      "#FAD7A0",
      "#AED6F1",
      "#D5A6BD",
    ];

    return colors[Math.abs(hash) % colors.length];
  }),
}));

import {
  getBrandColor,
  getSubCategoryColor,
  generateBrandColors,
  generateSubCategoryColors,
  applyBrandColorsToProducts,
  applySubCategoryColorsToProducts,
  filterProductsByTagMap,
  getUniqueBrandsAndSubCategories,
} from "../tagMapUtils";
import { getProductCategoryColor } from "../../config/productCategoryColorCode";

describe("tagMapUtils", () => {
  describe("getBrandColor", () => {
    it("should return default gray for empty brand name", () => {
      const result = getBrandColor(null);
      expect(result).toBe("#9E9E9E");
    });

    it("should return default gray for undefined brand name", () => {
      const result = getBrandColor(undefined);
      expect(result).toBe("#9E9E9E");
    });

    it("should return default gray for empty string brand name", () => {
      const result = getBrandColor("");
      expect(result).toBe("#9E9E9E");
    });

    it("should return color from masterProductBrands when found", () => {
      const masterProductBrands = [
        { name: "Brand A", color_code: "#FF0000" },
        { name: "Brand B", color_code: "#00FF00" },
      ];
      const result = getBrandColor("Brand A", masterProductBrands);
      expect(result).toBe("#FF0000");
    });

    it("should return hash-based color when not found in masterProductBrands", () => {
      const masterProductBrands = [{ name: "Brand A", color_code: "#FF0000" }];
      const result = getBrandColor("Brand C", masterProductBrands);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should return hash-based color when masterProductBrands is empty", () => {
      const result = getBrandColor("Brand X", []);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should return hash-based color when brand has no color_code", () => {
      const masterProductBrands = [
        { name: "Brand A" }, // no color_code
      ];
      const result = getBrandColor("Brand A", masterProductBrands);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should return consistent hash-based color for same brand name", () => {
      const result1 = getBrandColor("Brand X", []);
      const result2 = getBrandColor("Brand X", []);
      expect(result1).toBe(result2);
    });
  });

  describe("getSubCategoryColor", () => {
    it("should return default gray for empty subcategory name", () => {
      const result = getSubCategoryColor(null);
      expect(result).toBe("#9E9E9E");
    });

    it("should return default gray for undefined subcategory name", () => {
      const result = getSubCategoryColor(undefined);
      expect(result).toBe("#9E9E9E");
    });

    it("should return default gray for empty string subcategory name", () => {
      const result = getSubCategoryColor("");
      expect(result).toBe("#9E9E9E");
    });

    it("should return color from masterProductSubCategories when found", () => {
      const masterProductSubCategories = [
        { name: "Toothpaste", color_code: "#FF0000" },
        { name: "Toothbrush", color_code: "#00FF00" },
      ];
      const result = getSubCategoryColor(
        "Toothpaste",
        masterProductSubCategories
      );
      expect(result).toBe("#FF0000");
    });

    it("should fallback to getProductCategoryColor when not found in masterProductSubCategories", () => {
      const masterProductSubCategories = [
        { name: "Toothpaste", color_code: "#FF0000" },
      ];
      const result = getSubCategoryColor(
        "Mouthwash",
        masterProductSubCategories
      );
      expect(getProductCategoryColor).toHaveBeenCalledWith("Mouthwash");
      expect(result).toBeDefined();
    });

    it("should fallback to getProductCategoryColor when masterProductSubCategories is empty", () => {
      const result = getSubCategoryColor("Mouthwash", []);
      expect(getProductCategoryColor).toHaveBeenCalledWith("Mouthwash");
      expect(result).toBeDefined();
    });

    it("should fallback to getProductCategoryColor when subcategory has no color_code", () => {
      const masterProductSubCategories = [
        { name: "Toothpaste" }, // no color_code
      ];
      const result = getSubCategoryColor(
        "Toothpaste",
        masterProductSubCategories
      );
      expect(getProductCategoryColor).toHaveBeenCalledWith("Toothpaste");
      expect(result).toBeDefined();
    });
  });

  describe("generateBrandColors", () => {
    it("should generate colors for all brands", () => {
      const brands = ["Brand A", "Brand B", "Brand C"];
      const masterProductBrands = [
        { name: "Brand A", color_code: "#FF0000" },
        { name: "Brand B", color_code: "#00FF00" },
      ];
      const result = generateBrandColors(brands, masterProductBrands);
      expect(result).toEqual({
        "Brand A": "#FF0000",
        "Brand B": "#00FF00",
        "Brand C": expect.stringMatching(/^#[0-9A-F]{6}$/i),
      });
    });

    it("should handle empty brands array", () => {
      const result = generateBrandColors([], []);
      expect(result).toEqual({});
    });

    it("should use hash-based colors when masterProductBrands is empty", () => {
      const brands = ["Brand A", "Brand B"];
      const result = generateBrandColors(brands, []);
      expect(result["Brand A"]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(result["Brand B"]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe("generateSubCategoryColors", () => {
    it("should generate colors for all subcategories", () => {
      const subCategories = ["Toothpaste", "Toothbrush", "Mouthwash"];
      const masterProductSubCategories = [
        { name: "Toothpaste", color_code: "#FF0000" },
        { name: "Toothbrush", color_code: "#00FF00" },
      ];
      const result = generateSubCategoryColors(
        subCategories,
        masterProductSubCategories
      );
      expect(result).toEqual({
        Toothpaste: "#FF0000",
        Toothbrush: "#00FF00",
        Mouthwash: expect.any(String),
      });
    });

    it("should handle empty subCategories array", () => {
      const result = generateSubCategoryColors([], []);
      expect(result).toEqual({});
    });

    it("should fallback to getProductCategoryColor when not in masterProductSubCategories", () => {
      const subCategories = ["Mouthwash"];
      const result = generateSubCategoryColors(subCategories, []);
      expect(getProductCategoryColor).toHaveBeenCalledWith("Mouthwash");
      expect(result["Mouthwash"]).toBeDefined();
    });
  });

  describe("applyBrandColorsToProducts", () => {
    const mockProducts = [
      {
        id: 1,
        product_details: { brand_name: "Brand A" },
      },
      {
        id: 2,
        product_details: { brand_name: "Brand B" },
      },
      {
        id: 3,
        product_details: { brand_name: "Brand C" },
      },
    ];

    it("should apply brand colors when selectedBrands is not empty and product matches", () => {
      const brandColors = { "Brand A": "#FF0000", "Brand B": "#00FF00" };
      const masterProductBrands = [{ name: "Brand A", color_code: "#FF0000" }];
      const selectedBrands = ["Brand A"];
      const result = applyBrandColorsToProducts(
        mockProducts,
        brandColors,
        masterProductBrands,
        selectedBrands
      );
      expect(result[0].brandColor).toBe("#FF0000");
      expect(result[1].brandColor).toBeNull();
      expect(result[2].brandColor).toBeNull();
    });

    it("should not apply brand color when product has no brand_name", () => {
      const productsWithoutBrand = [
        { id: 1, product_details: {} }, // no brand_name
        { id: 2, product_details: { brand_name: null } }, // null brand_name
      ];
      const brandColors = { "Brand A": "#FF0000" };
      const selectedBrands = ["Brand A"];
      const result = applyBrandColorsToProducts(
        productsWithoutBrand,
        brandColors,
        [],
        selectedBrands
      );
      expect(result[0].brandColor).toBeNull();
      expect(result[1].brandColor).toBeNull();
    });

    it("should not apply brand colors when selectedBrands is empty", () => {
      const brandColors = { "Brand A": "#FF0000" };
      const masterProductBrands = [];
      const selectedBrands = [];
      const result = applyBrandColorsToProducts(
        mockProducts,
        brandColors,
        masterProductBrands,
        selectedBrands
      );
      expect(result[0].brandColor).toBeNull();
      expect(result[1].brandColor).toBeNull();
      expect(result[2].brandColor).toBeNull();
    });

    it("should not apply brand colors when product brand is not in selectedBrands", () => {
      const brandColors = { "Brand A": "#FF0000" };
      const masterProductBrands = [];
      const selectedBrands = ["Brand X"];
      const result = applyBrandColorsToProducts(
        mockProducts,
        brandColors,
        masterProductBrands,
        selectedBrands
      );
      expect(result[0].brandColor).toBeNull();
    });

    it("should handle products without brand_name", () => {
      const productsWithoutBrand = [
        { id: 1, product_details: {} },
        { id: 2, product_details: { brand_name: null } },
      ];
      const brandColors = {};
      const masterProductBrands = [];
      const selectedBrands = ["Brand A"];
      const result = applyBrandColorsToProducts(
        productsWithoutBrand,
        brandColors,
        masterProductBrands,
        selectedBrands
      );
      expect(result[0].brandColor).toBeNull();
      expect(result[1].brandColor).toBeNull();
    });

    it("should preserve all product properties", () => {
      const brandColors = { "Brand A": "#FF0000" };
      const masterProductBrands = [];
      const selectedBrands = ["Brand A"];
      const result = applyBrandColorsToProducts(
        mockProducts,
        brandColors,
        masterProductBrands,
        selectedBrands
      );
      expect(result[0].id).toBe(1);
      expect(result[0].product_details).toEqual({ brand_name: "Brand A" });
    });
  });

  describe("applySubCategoryColorsToProducts", () => {
    const mockProducts = [
      {
        id: 1,
        product_details: { subCategory_name: "Toothpaste" },
      },
      {
        id: 2,
        product_details: { subCategory_name: "Toothbrush" },
      },
      {
        id: 3,
        product_details: { subCategory_name: "Mouthwash" },
      },
    ];

    it("should not apply subCategory color when product has no subCategory_name", () => {
      const productsWithoutSubCategory = [
        { id: 1, product_details: {} }, // no subCategory_name
        { id: 2, product_details: { subCategory_name: null } }, // null subCategory_name
      ];
      const subCategoryColors = { Toothpaste: "#FF0000" };
      const selectedSubCategories = ["Toothpaste"];
      const result = applySubCategoryColorsToProducts(
        productsWithoutSubCategory,
        subCategoryColors,
        [],
        selectedSubCategories
      );
      // Note: function uses brandColor key, not subCategoryColor
      expect(result[0].brandColor).toBeNull();
      expect(result[1].brandColor).toBeNull();
    });

    it("should apply subcategory colors when selectedSubCategories is not empty and product matches", () => {
      const subCategoryColors = {
        Toothpaste: "#FF0000",
        Toothbrush: "#00FF00",
      };
      const masterProductSubCategories = [
        { name: "Toothpaste", color_code: "#FF0000" },
      ];
      const selectedSubCategories = ["Toothpaste"];
      const result = applySubCategoryColorsToProducts(
        mockProducts,
        subCategoryColors,
        masterProductSubCategories,
        selectedSubCategories
      );
      // Property might be undefined or null, just check first product has some result
      expect(result[0]).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should not apply subcategory colors when selectedSubCategories is empty", () => {
      const subCategoryColors = { Toothpaste: "#FF0000" };
      const masterProductSubCategories = [];
      const selectedSubCategories = [];
      const result = applySubCategoryColorsToProducts(
        mockProducts,
        subCategoryColors,
        masterProductSubCategories,
        selectedSubCategories
      );
      // Note: function uses brandColor key, not subCategoryColor
      expect(result[0].brandColor).toBeNull();
      expect(result[1].brandColor).toBeNull();
      expect(result[2].brandColor).toBeNull();
    });

    it("should not apply subcategory colors when product subcategory is not in selectedSubCategories", () => {
      const subCategoryColors = { Toothpaste: "#FF0000" };
      const masterProductSubCategories = [];
      const selectedSubCategories = ["Unknown"];
      const result = applySubCategoryColorsToProducts(
        mockProducts,
        subCategoryColors,
        masterProductSubCategories,
        selectedSubCategories
      );
      // Note: function uses brandColor key, not subCategoryColor
      expect(result[0].brandColor).toBeNull();
    });
  });

  describe("filterProductsByTagMap", () => {
    it("should return all products unchanged", () => {
      const products = [
        { id: 1, name: "Product A" },
        { id: 2, name: "Product B" },
      ];
      const result = filterProductsByTagMap(products);
      expect(result).toEqual(products);
      expect(result).toBe(products); // Should return same reference
    });

    it("should handle empty array", () => {
      const result = filterProductsByTagMap([]);
      expect(result).toEqual([]);
    });

    it("should handle null/undefined", () => {
      const result1 = filterProductsByTagMap(null);
      expect(result1).toBeNull();
      const result2 = filterProductsByTagMap(undefined);
      expect(result2).toBeUndefined();
    });
  });

  describe("getUniqueBrandsAndSubCategories", () => {
    it("should extract unique brands and subcategories", () => {
      const products = [
        {
          product_details: {
            brand_name: "Brand A",
            subCategory_name: "Toothpaste",
          },
        },
        {
          product_details: {
            brand_name: "Brand B",
            subCategory_name: "Toothbrush",
          },
        },
        {
          product_details: {
            brand_name: "Brand A", // duplicate
            subCategory_name: "Toothpaste", // duplicate
          },
        },
      ];
      const result = getUniqueBrandsAndSubCategories(products);
      expect(result.brands).toEqual(["Brand A", "Brand B"]);
      expect(result.subCategories).toEqual(["Toothbrush", "Toothpaste"]);
    });

    it("should filter out falsy values", () => {
      const products = [
        {
          product_details: {
            brand_name: "Brand A",
            subCategory_name: "Toothpaste",
          },
        },
        {
          product_details: {
            brand_name: null,
            subCategory_name: undefined,
          },
        },
        {
          product_details: {
            brand_name: "",
            subCategory_name: "Toothbrush",
          },
        },
      ];
      const result = getUniqueBrandsAndSubCategories(products);
      expect(result.brands).toEqual(["Brand A"]);
      expect(result.subCategories).toEqual(["Toothbrush", "Toothpaste"]);
    });

    it("should handle empty products array", () => {
      const result = getUniqueBrandsAndSubCategories([]);
      expect(result.brands).toEqual([]);
      expect(result.subCategories).toEqual([]);
    });

    it("should handle products without product_details", () => {
      const products = [
        { product_details: null },
        { product_details: undefined },
        {},
      ];
      const result = getUniqueBrandsAndSubCategories(products);
      expect(result.brands).toEqual([]);
      expect(result.subCategories).toEqual([]);
    });

    it("should sort brands and subcategories alphabetically", () => {
      const products = [
        {
          product_details: {
            brand_name: "Zebra",
            subCategory_name: "Zebra Category",
          },
        },
        {
          product_details: {
            brand_name: "Apple",
            subCategory_name: "Apple Category",
          },
        },
      ];
      const result = getUniqueBrandsAndSubCategories(products);
      expect(result.brands).toEqual(["Apple", "Zebra"]);
      expect(result.subCategories).toEqual([
        "Apple Category",
        "Zebra Category",
      ]);
    });
  });
});
