import api from "./axiosInstance";

// Get all master data
export const getMasterData = async () => api.get("/data_template");

// Get all planograms
export const getAllPlanograms = async (
  retailer_id = 1,
  limit = 100,
  offset = 0
) =>
  api.get("/planogram/get-all-planogram", {
    params: {
      retailer_id,
      limit,
      offset,
    },
  });

// Get planogram visualizer data by planogram_instance_id
export const getPlanogramVisualizer = async (id) =>
  api.get(`/planogram-visualizer?planogram_instance_id=${id}`);

export const getProductData = () => api.get("/product/product-data");

export const getProductKPI = async (planogramId, productId) =>
  api.get(
    `/product/product-kpi?planogram_instance_id=${planogramId}&product_id=${productId}`
  );

export const getProductKPIs = async (planogramId) =>
  api.post("/planogram/product-kpis-planogram", {
    planogram_id: planogramId,
  });

export const getScorecardData = () =>
  api.get("/range-review/c21c3454-f08d-4e90-aa1e-e28b1d9e07d6");

export const getAttributeScoreCard = async (
  before_planogram_id,
  after_planogram_id,
  attribute_value,
  storeId
) =>
  api.get("/planogram-scorecard/attribute-scorecard", {
    params: {
      before_planogram_id: before_planogram_id,
      after_planogram_id: after_planogram_id,
      attribute_value: attribute_value,
      store_ids: storeId,
    },
  });

// Get cluster data for scorecard cluster overview
export const getClusterData = async (
  before_planogram_id,
  after_planogram_id,
  storeId
) =>
  api.get("/planogram-scorecard/base-scorecard", {
    params: {
      before_planogram_id: before_planogram_id,
      after_planogram_id: after_planogram_id,
      store_ids: storeId,
    },
  });

// Get planogram attributes (brand & sub-category) for a given planogram
export const getPlanogramAttributes = async (planogramId) => {
  return api.get("/planogram-scorecard/planogram-attributes", {
    params: {
      planogram_id: planogramId,
    },
  });
};

// Get planogram rules for a planogram instance
export const getPlanogramRules = async (planogramId) =>
  api.get(`/planogram-rules/get-planogram-rules/${planogramId}`);

// export planogram schematic
export const exportPlanogramSchematic = async (id, payload) => {
  return api.post(
    `/planogram-visualizer/export-planogram-schematic/${id}`,
    payload,
    {
      responseType: "blob",
    }
  );
};

//update product data
export const updateProduct = (
  retailerName,
  categoryName,
  productId,
  payload,
  file
) => {
  const formData = new FormData();

  formData.append("payload", JSON.stringify(payload));

  if (file) {
    formData.append("file", file);
  }

  return api.put("/product/update-product-details", formData, {
    params: {
      product_id: productId,
      retailer_name: retailerName,
      category_name: categoryName,
    },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// add new product
export const addProduct = (retailerName, categoryName, payload, file) => {
  const formData = new FormData();

  formData.append("payload", JSON.stringify(payload));

  if (file) {
    formData.append("file", file);
  }

  return api.post("/product/add-product", formData, {
    params: {
      retailer_name: retailerName,
      category_name: categoryName,
    },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// get planogram product kpis
export const getPlanogramProductKPIS = async (planogramId) => {
  return api.get("/product/planogram-product-kpis", {
    params: {
      planogram_instance_id: planogramId,
    },
  });
};

export const checkUserAuthorization = async (name, email) => {
  try {
    const response = await api.post("/users/user-info", { email });

    return {
      authorized: response.data.status, // boolean from backend
      data: response.data,
    };
  } catch (err) {
    console.error("checkUserAuthorization failed:", err);
    return { authorized: false, error: err.message };
  }
};

// get user image
export const getUserProfileImage = async () => {
  return api.get("https://graph.microsoft.com/v1.0/me/photo/$value", {
    responseType: "arraybuffer",
  });
};

// Azure OAuth login endpoint
export const azureLogin = () => {
  const baseURL = api.defaults.baseURL;
  const loginURL = baseURL.replace("/api", "") + "/auth/azure/login";
  globalThis.location.href = loginURL;
  return loginURL;
};

// Logout endpoint
export const logoutUser = async () => {
  try {
    const response = await api.post("/users/logout");
    return response;
  } catch (error) {
    console.error("Logout API call failed:", error);
    // Even if the API call fails, we should still clear local state
    throw error;
  }
};

export const getRegionRetailerCategoryMappings = async () => {
  return api.get("/data_template/region-retailer-category-mappings");
};

// Duplicate planogram API
export const duplicatePlanogram = async (planogramId) => {
  return api.post("/planogram/clone-planogram", {
    planogram_id: planogramId,
  });
};

// Get my planograms API
export const getMyPlanograms = async (email) => {
  return api.post("/planogram/get-my-planograms", { email });
};

// Save or publish planogram API
export const saveOrPublishPlanogram = async (payload) => {
  return api.post("/planogram/save-or-publish", payload);
};

// Compare two planograms
export const compareTwoPlanograms = async (planogramId1, planogramId2) => {
  return api.post("/planogram/compare-two-planograms", {
    planogram_id_1: planogramId1,
    planogram_id_2: planogramId2,
  });
};

// Get scorecard data from DS module
export const getScorecardDataFromDSModule = async (payload) => {
  return api.post("/planogram/get-scorecard-data-from-ds-module", payload);
};
//Get relative scorecard data from DS module
export const getRelativeScorecardDataFromDSModule = async (payload) => {
  return api.post("/planogram/relative-scorecard-with-ds-module", payload);
};

// Get NPD products
export const getNpdProducts = async () => {
  return api.get("/npd_delisted/npd-products");
};

// Get delisted products
export const getDelistedProducts = async () => {
  return api.get("/npd_delisted/delisted-products");
};

// Get optimization job status
export const getOptimizationStatus = async (jobId) =>
  api.get(`/rules_manager/status/${jobId}`);

// Run rules manager
export const runRulesManager = async (payload) =>
  api.post("/rules_manager/run", payload);

// Mass update API
export const runMassUpdate = async ({
  reference_planogram,
  email,
  status,
  planograms_list,
}) => {
  return api.post("/mass-update/mass-update-edit", {
    reference_planogram,
    email,
    status,
    planograms_list,
  });
};

export const checkViolations = async ({ planogram_instance_id, snapshot }) => {
  return api.post(`/checks_validation/checks-and-validation`, {
    planogram_instance_id,
    snapshot,
  });
};