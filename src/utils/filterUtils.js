// Returns filtered products based on filters, with an option to exclude a specific filter key

export function getFilteredProducts(apiProducts, filters, excludeKey) {
  if (!apiProducts) return [];

  let priceRange = filters.priceRange;

  let shouldFilterByPrice =
    Array.isArray(priceRange) && priceRange.length === 2;

  return apiProducts.filter((product) => {
    const { product_details } = product;

    const subCategory = product_details?.["subCategory_name"];

    const brand = product_details?.["brand_name"];

    const price = product_details?.["price"];

    const subCatMatch =
      excludeKey === "subCategories" ||
      filters.subCategories.length === 0 ||
      filters.subCategories.includes(subCategory);

    const brandMatch =
      excludeKey === "brands" ||
      filters.brands.length === 0 ||
      filters.brands.includes(brand);

    const priceMatch =
      excludeKey === "priceRange" ||
      !shouldFilterByPrice ||
      (typeof price === "number" &&
        price >= priceRange[0] &&
        price <= priceRange[1]);

    const intensityMatch =
      excludeKey === "intensities" ||
      !filters.intensities.length ||
      filters.intensities.includes(product_details?.["INTENSITY"]);

    const npdVal = product_details?.["NPD"] ? 1 : 0;

    const benchmarkVal = product_details?.["BENCHMARK"] ? 1 : 0;

    const promoVal = product_details?.["PROMOITEM"] ? 1 : 0;

    const npdMatch =
      excludeKey === "npds" ||
      !filters.npds.length ||
      filters.npds.includes(npdVal);

    const benchmarkMatch =
      excludeKey === "benchmarks" ||
      !filters.benchmarks.length ||
      filters.benchmarks.includes(benchmarkVal);

    const promoMatch =
      excludeKey === "promoItems" ||
      !filters.promoItems.length ||
      filters.promoItems.includes(promoVal);

    const platformMatch =
      excludeKey === "platforms" ||
      !filters.platforms.length ||
      filters.platforms.includes(product_details?.["PLATFORM"]);

    return (
      subCatMatch &&
      brandMatch &&
      priceMatch &&
      intensityMatch &&
      npdMatch &&
      benchmarkMatch &&
      promoMatch &&
      platformMatch
    );
  });
}

// Returns unique values for a given key from the filtered products

export function getUniqueOptions(filteredProducts, key) {
  return Array.from(
    new Set(
      filteredProducts.map((p) => p.product_details?.[key]).filter(Boolean)
    )
  );
}

// Returns counts for each brand

export function getBrandCounts(apiProducts, filters) {
  const counts = {};

  if (!apiProducts) return counts;

  // Handle price range filtering

  let priceRange = filters.priceRange;

  let shouldFilterByPrice = true;

  // If no price range is specified or it's empty, don't filter by price

  if (!priceRange || priceRange.length === 0) {
    shouldFilterByPrice = false;
  } else if (priceRange.length !== 2) {
    // If price range is malformed, compute from products

    const prices = apiProducts
      .map((p) => p.product_details?.["price"])
      .filter((p) => typeof p === "number");

    const minPrice = prices.length ? Math.min(...prices) : 0;

    const maxPrice = prices.length ? Math.max(...prices) : 1000000;

    priceRange = [minPrice, maxPrice];
  }

  const availableBrands = Array.from(
    new Set(
      apiProducts.map((p) => p.product_details?.["brand_name"]).filter(Boolean)
    )
  );

  availableBrands.forEach((brand) => {
    const subCatFilter = filters.subCategories;

    const count = apiProducts.filter((product) => {
      const { product_details } = product;

      const productBrand = product_details?.["brand_name"];

      const subCategory = product_details?.["subCategory_name"];

      const price = product_details?.["price"];

      if (productBrand !== brand) return false;

      const subCatMatch =
        subCatFilter.length === 0 || subCatFilter.includes(subCategory);

      const priceMatch =
        !shouldFilterByPrice ||
        (typeof price === "number" &&
          price >= priceRange[0] &&
          price <= priceRange[1]);

      return subCatMatch && priceMatch;
    }).length;

    counts[brand] = count;
  });

  return counts;
}

// Returns counts for each sub-category

export function getSubCategoryCounts(apiProducts, filters) {
  const counts = {};

  if (!apiProducts) return counts;

  // Handle price range filtering

  let priceRange = filters.priceRange;

  let shouldFilterByPrice = true;

  // If no price range is specified or it's empty, don't filter by price

  if (!priceRange || priceRange.length === 0) {
    shouldFilterByPrice = false;
  } else if (priceRange.length !== 2) {
    // If price range is malformed, compute from products

    const prices = apiProducts
      .map((p) => p.product_details?.["price"])
      .filter((p) => typeof p === "number");

    const minPrice = prices.length ? Math.min(...prices) : 0;

    const maxPrice = prices.length ? Math.max(...prices) : 1000000;

    priceRange = [minPrice, maxPrice];
  }

  const availableSubCategories = Array.from(
    new Set(
      apiProducts
        .map((p) => p.product_details?.["subCategory_name"])
        .filter(Boolean)
    )
  );

  availableSubCategories.forEach((subCat) => {
    const brandFilter = filters.brands;

    const count = apiProducts.filter((product) => {
      const { product_details } = product;

      const productSubCat = product_details?.["subCategory_name"];

      const brand = product_details?.["brand_name"];

      const price = product_details?.["price"];

      if (productSubCat !== subCat) return false;

      const brandMatch =
        brandFilter.length === 0 || brandFilter.includes(brand);

      const priceMatch =
        !shouldFilterByPrice ||
        (typeof price === "number" &&
          price >= priceRange[0] &&
          price <= priceRange[1]);

      return brandMatch && priceMatch;
    }).length;

    counts[subCat] = count;
  });

  return counts;
}

export function filteredProducts(apiProducts, filters) {
  return getFilteredProducts(apiProducts, filters);
}
