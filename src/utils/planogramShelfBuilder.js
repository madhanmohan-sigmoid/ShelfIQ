// import { initialItems } from "./initialItems";
import { getProductKPIs, getPlanogramVisualizer } from "../api/api";

// Map product KPIs by tpnb instead of product_id
const mapProductKpisByTpnb = (productKpis) => {
  const productKpisMap = {};

  if (Array.isArray(productKpis)) {
    productKpis.forEach(({ tpnb, ...rest }) => {
      if (tpnb) {
        productKpisMap[tpnb] = rest;
      }
    });
  }

  return productKpisMap;
};

// Flatten new JSON structure into flat product list
const flattenProductsFromBayData = (
  bayDetailsList,
  masterProductMap,
  productTpnbKpis
) => {
  const products = [];
  // console.log("bay2",bayDetailsList)

  bayDetailsList.forEach((bay) => {
    const bayNumber = bay.number;
    const shelves = bay.shelf_details_list;

    shelves.forEach((shelf) => {
      const shelfNumber = shelf.number;
      const productInfos = shelf.product_info_list;
      // console.log(shelf)
      const height = shelf.height / 10;
      // const width = shelf.width / 10

      productInfos.forEach((productInfo) => {
        const details = masterProductMap[productInfo.product_id];
        // Get KPI by tpnb from product details
        const tpnb = details?.tpnb;
        const productKpis = tpnb ? productTpnbKpis[tpnb] : null;

        // Flatten relevant fields into a flat product object
        products.push({
          bay: bayNumber,
          shelf: shelfNumber,
          shelfheight: height,
          trayheight: productInfo.tray_height,
          traywidth: productInfo.tray_width,
          traydepth: productInfo.tray_depth,
          shelfwidth: productInfo.width ?? 133, // fallback if needed
          orientation: productInfo.orientation ?? 0,
          position: productInfo.position / 10,
          facings_wide: productInfo.facing_wide,
          facings_high: productInfo.facing_high,
          total_facings:
            (productInfo.facing_wide || 0) * (productInfo.facing_high || 0),
          product_id: productInfo.product_id,
          product_details: details,
          linear: productInfo.linear_value,
          product_kpis: productKpis,
        });
      });
    });
  });

  return products;
};

// Group flat products by shelf and bay to build map of dimensions
const groupShelvesByBay = (bayDetailsList, SCALE = 1) => {
  const bayMap = {};

  bayDetailsList.forEach((bay) => {
    const {
      number: bayNumber,
      shelf_details_list = [],
      width: bayWidth = 133,
      height: bayHeight = 240,
    } = bay;

    if (!bayNumber) return;

    const totalShelfHeight = shelf_details_list.reduce(
      (total, shelf) => total + (shelf.height || 0),
      0
    );
    const leftoverHeight =
      shelf_details_list.length > 0
        ? (bayHeight - totalShelfHeight) / shelf_details_list.length
        : 0;

    if (!bayMap[bayNumber]) {
      bayMap[bayNumber] = {};
    }

    shelf_details_list.forEach((shelf) => {
      const shelfNumber = shelf.number;
      const shelfWidth = shelf.width ?? bayWidth;
      const shelfHeight = shelf.height ?? bayHeight / shelf_details_list.length;

      if (!bayMap[bayNumber][shelfNumber]) {
        bayMap[bayNumber][shelfNumber] = {
          width: (shelfWidth / 10) * SCALE,
          height: ((shelfHeight + leftoverHeight) / 10) * SCALE,
        };
      }
    });
  });

  return bayMap;
};

// Convert the shelfMap to structured shelf objects
const buildShelvesFromBayMap = (bayMap) => {
  const shelves = [];

  const bayNumbers = Object.keys(bayMap)
    .map(Number)
    .sort((a, b) => a - b);

  console.log("bay", bayMap);

  bayNumbers.forEach((bayNo) => {
    const shelvesInBay = bayMap[bayNo];
    const shelfNumbers = Object.keys(shelvesInBay)
      .map(Number)
      .sort((a, b) => a - b);

    const subShelves = shelfNumbers.map((shelfNo) => {
      const h = shelvesInBay[shelfNo].height;
      const w = shelvesInBay[shelfNo].width;
      return {
        height: h,
        width: w,
        baseWidth: w,
      };
    });

    const totalHeight = subShelves.reduce((sum, s) => sum + (s.height || 0), 0);
    const shelfWidth = Math.max(...subShelves.map((s) => s.width || 0));

    shelves.push({
      height: totalHeight,
      width: shelfWidth,
      baseWidth: shelfWidth,
      subShelves,
    });
  });

  return shelves;
};

export const buildShelvesFromApi = async (SCALE, id, masterProductMap) => {
  try {
    const response = await getPlanogramVisualizer(id);
    const planogramProductKpisResponse = await getProductKPIs(id);
    const bayDetailsList = response.data.data.bay_details_list;
    // Extract the nested data array from the response structure
    const kpiDataArray = planogramProductKpisResponse?.data?.data?.data || [];
    const productTpnbKpis = mapProductKpisByTpnb(kpiDataArray);
    // console.log(productTpnbKpis)
    const products = flattenProductsFromBayData(
      bayDetailsList,
      masterProductMap,
      productTpnbKpis
    );

    const shelfMap = groupShelvesByBay(bayDetailsList, SCALE);
    const dynamicShelves = buildShelvesFromBayMap(shelfMap);
    const ruleManager = response.data.data.planogram_rules;
    // console.log(ruleManager)

    return { dynamicShelves, products, ruleManager, productKPIsByTpnb: productTpnbKpis };
  } catch (error) {
    console.error("Failed to fetch and build shelves:", error);
    return { dynamicShelves: [], products: [] };
  }
};
