import React, { useEffect } from "react";
import mouthwashMockUp from '../assets/mouthwashMockup.png';
import toothbrushMockUp from '../assets/ToothbrushMockup.png';
import toothpasteMockUp from "../assets/toothpasteMockup.png";

const includesAny = (str, keywords = []) =>
   keywords.some(keyword => str.toLowerCase().includes(keyword));

export const getFallbackImage = (item) => {
   const text = `${item?.subCategory_name || ''} ${item?.name || ''} ${item?.description || ''}`.toLowerCase();
   if (includesAny(text, ['paste', 't/paste', 'toothpaste'])) return toothpasteMockUp;
   if (includesAny(text, ['brush', 'toothbrush', 't/brush'])) return toothbrushMockUp;
   if (includesAny(text, ['wash', 'mouthwash', 'm/wash'])) return mouthwashMockUp;
   return toothpasteMockUp;
};


export const flattenProduct = (product) => {
   const { dimension = {}, attributes = {}, ...rest } = product;
   // Map specific attribute keys to desired field names
   const mappedAttributes = { ...attributes };
   if ('BRAND' in mappedAttributes) {
      mappedAttributes.brand_name = mappedAttributes.BRAND;
      delete mappedAttributes.BRAND;
   }
   if ('SUB_CATEGORY' in mappedAttributes) {
      mappedAttributes.subCategory_name = mappedAttributes.SUB_CATEGORY;
      delete mappedAttributes.SUB_CATEGORY;
   }
   return {
      ...rest,
      ...dimension,
      ...mappedAttributes,
   };
};


export function filterProducts(products, filters) {
   const {
      searchText = '',
      selectedBrand = [],
      selectedCategory = [],
      selectedBenchmark = [],
      selectedIntensity = [],
      selectedNPD = [],
      selectedPlatform = [],
      selectedPromoItem = [],
      priceRange = { min: 0, max: Infinity },
   } = filters;

   const query = searchText.toLowerCase();

   return products.filter((product) => {
      const matchesSearch =
         !query ||
         product?.name?.toLowerCase().includes(query) ||
         product?.tpnb?.toLowerCase().includes(query);

      const matchesBrand =
         selectedBrand.length === 0 || selectedBrand.includes(product.brand_name);

      const matchesCategory =
         selectedCategory.length === 0 || selectedCategory.includes(product.subCategory_name);

      const matchesBenchmark =
         selectedBenchmark.length === 0 ||
         selectedBenchmark.includes(product.BENCHMARK ? 1 : 0);

      const matchesIntensity =
         selectedIntensity.length === 0 || selectedIntensity.includes(product.INTENSITY);

      const matchesNPD =
         selectedNPD.length === 0 ||
         selectedNPD.includes(product.NPD ? 1 : 0);

      const matchesPlatform =
         selectedPlatform.length === 0 || selectedPlatform.includes(product.PLATFORM);

      const matchesPromoItem =
         selectedPromoItem.length === 0 ||
         selectedPromoItem.includes(product.PROMOITEM ? 1 : 0);

      const matchesPrice =
         product?.price >= priceRange.min && product?.price <= priceRange.max;

      return (
         matchesSearch &&
         matchesBrand &&
         matchesCategory &&
         matchesBenchmark &&
         matchesIntensity &&
         matchesNPD &&
         matchesPlatform &&
         matchesPromoItem &&
         matchesPrice
      );
   });
}

function normalizeKey(key) {
   switch (key.toLowerCase()) {
      case "brand_name": return "brands";
      case "subcategory_name": return "subCategories";
      case "benchmark": return "benchmarks";
      case "intensity": return "intensities";
      case "npd": return "npds";
      case "platform": return "platforms";
      case "promoitem": return "promoItems";
      default: return key.toLowerCase();
   }
}

export const getUniqueSets = (products, keys) => {
   const result = {};

   keys.forEach((key) => {
      const unique = new Set(products.map((p) => p[key]).filter(Boolean));
      let values = Array.from(unique).sort();

      if (values.length && typeof values[0] === "boolean") {
         values = [0, 1];
      }

      const normalizedKey = normalizeKey(key);
      result[normalizedKey] = values;
   });

   return result;
}


export const getMinMaxPrice = (products) => {
   if (!products || products.length === 0) return { min: 0, max: 0 };

   const prices = products.map(p => p.price || 0);
   const min = Math.min(...prices);
   const max = Math.max(...prices);

   return { min, max };
};