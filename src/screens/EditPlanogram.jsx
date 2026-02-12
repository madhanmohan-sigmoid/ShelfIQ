import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { buildShelvesFromApi } from "../utils/planogramShelfBuilder";
import { getFilteredProducts, getUniqueOptions } from "../utils/filterUtils";
import {
  selectPlanogramProducts,
  selectPlanogramFilters,
  selectPlanogramDetails,
  selectBays,
  setPlanogramProducts,
  setBays,
  setRuleManager,
  setPlanogramId,
  selectScale,
  setRulesPlanogramId,
  setRules,
} from "../redux/reducers/planogramVisualizerSlice";
import { selectProductMap } from "../redux/reducers/productDataSlice";
import toast from "react-hot-toast";
import { CircleArrowLeft, Grid3X3, Layers, Hash, Tag } from "lucide-react";
import { Button } from "@mui/material";
import EditPlanogramStep1 from "../components/rulesManager/EditPlanogramStep1";
import RulesTable from "../components/rulesManager/RulesTable";
import { useOptimization } from "../hooks/useOptimization";
import { getPlanogramRules } from "../api/api";

const EditPlanogram = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const SCALE = useSelector(selectScale);
  const masterProductMap = useSelector(selectProductMap);
  const planogramProducts = useSelector(selectPlanogramProducts);
  const planogramFilters = useSelector(selectPlanogramFilters);
  const planogramDetails = useSelector(selectPlanogramDetails);
  const bays = useSelector(selectBays);
  const { runOptimization } = useOptimization();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedObjective, setSelectedObjective] = useState("");
  const [assortmentOptions, setAssortmentOptions] = useState({
    npdPlus: false,
    removeDelistedItems: true,
    existingItems: true,
    otherClusters: false,
  });
  const [step1Validation, setStep1Validation] = useState({
    isValid: false,
    hasProductGroups: false,
    hasObjective: false,
  });

  // Local state for modal filters
  const [modalFilters, setModalFilters] = useState(planogramFilters);
  const [modalOptions, setModalOptions] = useState({
    subCategories: [],
    brands: [],
    priceTiers: [],
    intensities: [],
    platforms: [],
    npds: [0, 1],
    benchmarks: [0, 1],
    promoItems: [0, 1],
    allSubCategories: [],
    allBrands: [],
    allPriceTiers: [],
  });

  // Fetch planogram data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const { dynamicShelves, products, ruleManager } =
          await buildShelvesFromApi(SCALE, id, masterProductMap);
        dispatch(setPlanogramId(id));
        dispatch(setBays(dynamicShelves));
        dispatch(setRuleManager(ruleManager));
        dispatch(setPlanogramProducts(products));

        // Initialize filter options based on loaded products
        const subCategories = Array.from(
          new Set(
            products
              .map((p) => p.product_details?.["subCategory_name"])
              .filter(Boolean)
          )
        );
        const brands = Array.from(
          new Set(
            products
              .map((p) => p.product_details?.["brand_name"])
              .filter(Boolean)
          )
        );
        const priceTiers = Array.from(
          new Set(
            products.map((p) => p.product_details?.["price"]).filter(Boolean)
          )
        );
        setModalOptions({
          subCategories,
          brands,
          priceTiers,
          intensities: getUniqueOptions(products, "INTENSITY"),
          npds: [0, 1],
          benchmarks: [0, 1],
          promoItems: [0, 1],
          platforms: getUniqueOptions(products, "PLATFORM"),
          allSubCategories: subCategories,
          allBrands: brands,
          allPriceTiers: priceTiers,
        });
      } catch (error) {
        console.error("Error fetching planogram data:", error);
      }
    };

    fetchData();
  }, [id, SCALE, masterProductMap, dispatch]);

  // Fetch planogram rules for Rules Manager table
  useEffect(() => {
    if (!id) return;

    const fetchRules = async () => {
      try {
        const response = await getPlanogramRules(id);
        const data = response?.data?.data;
        const rules = Array.isArray(data?.rules) ? data.rules : [];

        const normalizedRules = rules.map((rule, index) => {
          // Preserve product_groups if present, otherwise normalize clauses
          const normalizedRule = {
            ...rule,
            ruleId:
              rule.ruleId ||
              rule.id ||
              `${rule.type || "rule"}-${index}`,
          };
          
          // If product_groups exists, keep it; otherwise normalize clauses
          if (Array.isArray(rule?.product_groups) && rule.product_groups.length > 0) {
            normalizedRule.product_groups = rule.product_groups;
          } else if (Array.isArray(rule?.clauses) && rule.clauses.length > 0) {
            // For backward compatibility: if only clauses exist, keep them
            normalizedRule.clauses = rule.clauses;
          }
          
          return normalizedRule;
        });

        dispatch(setRulesPlanogramId(data?.planogram_instance_id || id));
        dispatch(setRules(normalizedRules));
      } catch (error) {
        console.error("Error fetching planogram rules:", error);
      }
    };

    fetchRules();
  }, [id, dispatch]);

  // Sync modalFilters with global filters when they change
  useEffect(() => {
    setModalFilters(planogramFilters);
  }, [planogramFilters]);

  // Update modal options when filters or products change
  useEffect(() => {
    if (!planogramProducts || planogramProducts.length === 0) return;

    const allSubCategories = getUniqueOptions(
      planogramProducts,
      "subCategory_name"
    );
    const allBrands = getUniqueOptions(planogramProducts, "brand_name");
    const allPriceTiers = getUniqueOptions(planogramProducts, "price");
    const allIntensities = getUniqueOptions(planogramProducts, "INTENSITY");
    const allPlatforms = getUniqueOptions(planogramProducts, "PLATFORM");

    const subCategories = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "subCategories"),
      "subCategory_name"
    );
    const brands = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "brands"),
      "brand_name"
    );
    const priceTiers = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "priceRange"),
      "price"
    );
    const intensities = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "intensity"),
      "INTENSITY"
    );
    const platforms = getUniqueOptions(
      getFilteredProducts(planogramProducts, modalFilters, "platform"),
      "PLATFORM"
    );

    setModalOptions({
      subCategories,
      brands,
      priceTiers,
      intensities,
      npds: [0, 1],
      benchmarks: [0, 1],
      promoItems: [0, 1],
      platforms,
      allSubCategories,
      allBrands,
      allPriceTiers,
      allIntensities,
      allPlatforms,
    });
  }, [planogramProducts, modalFilters]);

  const getStepBorderColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#FF782C";
    }
    if (currentStep === 2 && stepNumber === 1) {
      return "#128635";
    }
    return "#D1D5DB";
  };

  const getStepBackgroundColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#FF782C";
    }
    if (currentStep === 2 && stepNumber === 1) {
      return "#128635";
    }
    return "#FFFFFF";
  };

  const getStepTextColor = (stepNumber) => {
    if (currentStep === stepNumber || (currentStep === 2 && stepNumber === 1)) {
      return "#FFFFFF";
    }
    return "#6B7280";
  };

  const getStepLabelColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#FF782C";
    }
    return "#6B7280";
  };

  const getStepOpacity = (stepNumber) => {
    return currentStep === stepNumber ? "opacity-100" : "opacity-50";
  };

  const handleStepChange = (newStep) => {
    // Prevent navigation to step 2 if step 1 is not valid
    if (newStep === 2 && !step1Validation.isValid) {
      let errorMessage = "";
      if (!step1Validation.hasProductGroups && !step1Validation.hasObjective) {
        errorMessage = "Please add at least one product group in the Scope section and select an Objective before proceeding.";
      } else if (!step1Validation.hasProductGroups) {
        errorMessage = "Please add at least one product group in the Scope section before proceeding.";
      } else if (!step1Validation.hasObjective) {
        errorMessage = "Please select an Objective before proceeding.";
      }
      if (errorMessage) {
        toast.error(errorMessage);
      }
      return;
    }
    setCurrentStep(newStep);
  };

  const planogramMeta = useMemo(() => {
    const planogramIdValue =
      planogramDetails?.planogramId || planogramDetails?.planogram_id || "";

    const versionIdValue =
      planogramDetails?.version ??
      planogramDetails?.versionId ??
      planogramDetails?.version_id ??
      null;

    const derivedBaysCount = Array.isArray(bays) ? bays.length : null;
    const derivedShelvesCount = Array.isArray(bays)
      ? bays.reduce((sum, bay) => sum + (Array.isArray(bay?.subShelves) ? bay.subShelves.length : 0), 0)
      : null;

    const numberOfBaysValue =
      planogramDetails?.numberOfBays ??
      planogramDetails?.bays ??
      planogramDetails?.number_of_bays ??
      derivedBaysCount ??
      null;

    const numberOfShelvesValue =
      planogramDetails?.numberOfShelves ??
      planogramDetails?.shelvesCount ??
      planogramDetails?.number_of_shelves ??
      derivedShelvesCount ??
      null;

    return {
      planogramId: planogramIdValue || "N/A",
      numberOfBays:
        typeof numberOfBaysValue === "number" ? numberOfBaysValue : "N/A",
      numberOfShelves:
        typeof numberOfShelvesValue === "number" ? numberOfShelvesValue : "N/A",
      versionId:
        typeof versionIdValue === "number" || typeof versionIdValue === "string"
          ? versionIdValue
          : "N/A",
    };
  }, [bays, planogramDetails]);

  const versionDisplay = useMemo(() => {
    if (planogramMeta.versionId === "N/A") return "N/A";
    const v = String(planogramMeta.versionId).trim();
    if (!v) return "N/A";
    return v.toLowerCase().startsWith("v") ? v : `V${v}`;
  }, [planogramMeta.versionId]);

  return (
    <div
      style={{
        height: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/planogram/?id=${id}`)}
              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
            >
              <CircleArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">
                Edit Planogram Rule Manager
              </h1>
              <p className="text-gray-600 text-xs mt-0.5">
                Configure planogram specific rules and constraints for
                optimization
              </p>
            </div>
          </div>
          {/* Stepper at header right */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleStepChange(1)}
              className={`flex flex-col items-center gap-2 transition-all ${getStepOpacity(
                1
              )}`}
              style={{
                outline: "none",
                boxShadow: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  border: `2px solid ${getStepBorderColor(1)}`,
                  padding: "2px",
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: getStepBackgroundColor(1),
                    color: getStepTextColor(1),
                  }}
                >
                  1
                </div>
              </div>
              <div className="text-center">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: getStepLabelColor(1),
                  }}
                >
                  Configuration Scope
                </p>
                <p className="text-[10px] text-gray-500">
                  Define the scope for planogram configuration
                </p>
              </div>
            </button>
            <button
              onClick={() => handleStepChange(2)}
              className={`flex flex-col items-center gap-2 transition-all ${getStepOpacity(
                2
              )}`}
              style={{
                outline: "none",
                boxShadow: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  border: `2px solid ${getStepBorderColor(2)}`,
                  padding: "2px",
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: getStepBackgroundColor(2),
                    color: getStepTextColor(2),
                  }}
                >
                  2
                </div>
              </div>
              <div className="text-center">
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: getStepLabelColor(2),
                  }}
                >
                  Define Constraints
                </p>
                <p className="text-[10px] text-gray-500">
                  Define rules for planogram configuration
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Planogram meta — compact, light palette, no dark tones */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#f2f2f2] px-3 py-2">
          <span className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 shadow-sm">
            <Hash className="h-3.5 w-3.5 text-[#FF782C]/70" />
            <span className="text-[11px] text-slate-400">ID</span>
            <span className="text-xs font-medium text-slate-500 font-mono">{planogramMeta.planogramId}</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 shadow-sm">
            <Grid3X3 className="h-3.5 w-3.5 text-[#FF782C]/70" />
            <span className="text-[11px] text-slate-400">Bays</span>
            <span className="text-xs font-medium text-slate-500">{planogramMeta.numberOfBays}</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 shadow-sm">
            <Layers className="h-3.5 w-3.5 text-[#FF782C]/70" />
            <span className="text-[11px] text-slate-400">Shelves</span>
            <span className="text-xs font-medium text-slate-500">{planogramMeta.numberOfShelves}</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="inline-flex items-center gap-1.5 rounded bg-white px-2.5 py-1 shadow-sm">
            <Tag className="h-3.5 w-3.5 text-[#FF782C]/70" />
            <span className="text-[11px] text-slate-400">Ver</span>
            <span className="text-xs font-medium text-slate-500">{versionDisplay}</span>
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div
        style={{
          background: "#f2f2f2",
          margin: "32px",
          borderRadius: 24,
          padding: 40,
          flex: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {currentStep === 1 && (
          <EditPlanogramStep1
            objective={selectedObjective}
            setObjective={setSelectedObjective}
            assortmentOptions={assortmentOptions}
            setAssortmentOptions={setAssortmentOptions}
            attributeOptions={modalOptions}
            onValidationChange={setStep1Validation}
          />
        )}
        {currentStep === 2 && (
          <RulesTable
            onEdit={(data) => console.log("Edit:", data)}
            onDelete={(data) => console.log("Delete:", data)}
            onCopy={(data) => console.log("Copy:", data)}
            attributeOptions={modalOptions}
          />
        )}
      </div>

      <div
        className="w-full shadow-[0_-2px_20px_0_rgba(30,40,90,0.04)] py-2 px-10 flex shrink-0 items-center bg-white"
        style={{
          justifyContent: currentStep === 1 ? "flex-end" : "space-between",
        }}
      >
        {currentStep === 1 && (
          <Button
            variant="contained"
            onClick={() => handleStepChange(2)}
            sx={{
              bgcolor: "#FFD473",
              color: "#000",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 4,
              py: 1.25,
              borderRadius: "50px",
              textTransform: "none",
            }}
          >
            Next
          </Button>
        )}
        {currentStep === 2 && (
          <>
            <Button
              variant="contained"
              onClick={() => handleStepChange(1)}
              sx={{
                bgcolor: "#E5E7EB",
                color: "#1F2937",
                fontWeight: 600,
                fontSize: "0.8125rem",
                px: 4,
                py: 1.25,
                borderRadius: "50px",
                textTransform: "none",
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => runOptimization(id)}
              sx={{
                bgcolor: "#FFD473",
                color: "#000",
                fontWeight: 600,
                fontSize: "0.8125rem",
                px: 4,
                py: 1.25,
                borderRadius: "50px",
                textTransform: "none",
              }}
            >
              Run Optimization
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditPlanogram;
