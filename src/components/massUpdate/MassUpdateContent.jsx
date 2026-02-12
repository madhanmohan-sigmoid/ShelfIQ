import React, { useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import SearchBar from "../dashboard/SearchBar";
import PlanogramTable from "../dashboard/PlanogramTable";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import MassUpdateConfirmationModal from "../Modals/MassUpdateConfirmationModal";
import MassUpdateStatusModal from "../Modals/MassUpdateStatusModal";
import MassUpdateModeModal from "../Modals/MassUpdateModeModal";
import { runMassUpdate } from "../../api/api";
import MassUpdateActivityDrawer from "./MassUpdateActivityDrawer";

function MassUpdateContent() {
  const step1TableRef = useRef();
  const step2TableRef = useRef();
  const [step1SearchTerm, setStep1SearchTerm] = useState("");
  const [step2SearchTerm, setStep2SearchTerm] = useState("");
  const [step1HasActiveFilters, setStep1HasActiveFilters] = useState(false);
  const [step2HasActiveFilters, setStep2HasActiveFilters] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlanogramId, setSelectedPlanogramId] = useState(null);
  const [selectedPlanogramStatus, setSelectedPlanogramStatus] = useState("draft");
  const [selectedPlanogramsStep2, setSelectedPlanogramsStep2] = useState([]);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [massUpdateReport, setMassUpdateReport] = useState({
    successCount: 0,
    failedCount: 0,
  });
  const navigate = useNavigate();
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const mockSuccessLogs = [
    { id: 1, count: 4, timestamp: Date.now() - 1000 * 60 * 60 * 12 },
    { id: 2, count: 2, timestamp: Date.now() - 1000 * 60 * 60 * 9 },
    { id: 3, count: 3, timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 },
    { id: 4, count: 10, timestamp: Date.now() - 1000 * 60 * 60 * 72 },
  ];

  const mockFailedLogs = [
    {
      id: 10,
      count: 4,
      timestamp: Date.now() - 1000 * 60 * 60 * 13,
      planogramIds: [
        "ORAL_CARE_2025H2_N3....",
        "ORAL_CARE_2025H2_N3....",
        "ORAL_CARE_2025H2_N3....",
        "ORAL_CARE_2025H2_N3....",
      ],
    },
    {
      id: 11,
      count: 2,
      timestamp: Date.now() - 1000 * 60 * 60 * 10,
      planogramIds: ["ORAL_CARE_2025H2_N3....", "ORAL_CARE_2025H2_N3...."],
    },
  ];

  const handleStep1ResetFilters = useCallback(() => {
    if (step1TableRef.current) {
      step1TableRef.current.resetAllFilters();
    }
  }, []);

  const handleStep2ResetFilters = useCallback(() => {
    if (step2TableRef.current) {
      step2TableRef.current.resetAllFilters();
    }
  }, []);

  const handleStep1FilterChange = useCallback((value) => {
    const isActive = Array.isArray(value) ? value.length > 0 : Boolean(value);
    setStep1HasActiveFilters(isActive);
  }, []);

  const handleStep2FilterChange = useCallback((value) => {
    const isActive = Array.isArray(value) ? value.length > 0 : Boolean(value);
    setStep2HasActiveFilters(isActive);
  }, []);

  const handleActivityLog = useCallback(() => {
    setIsActivityDrawerOpen(true);
  }, []);

  const handleRowClickStep1 = useCallback((params) => {
    if (!params.data) return;
    setSelectedPlanogramId(params.data.id);
    setSelectedPlanogramStatus(params.data.status ?? "draft");
    setShowModeModal(true);
  }, []);

  const handleModeConfirm = useCallback((mode) => {
    // Mode is intentionally not used in payload for now; keep modal for UX.
    setCurrentStep(2);
  }, []);

  const handleSelectionChangeStep2 = useCallback((ids) => {
    setSelectedPlanogramsStep2(ids);
  }, []);

  const handleApplyMassUpdate = useCallback(() => {
    if (selectedPlanogramsStep2.length === 0) {
      toast.error("Please select at least one planogram");
      return;
    }
    setShowConfirmModal(true);
  }, [selectedPlanogramsStep2]);

  const handleConfirmMassUpdate = useCallback(async () => {
    setShowConfirmModal(false);
    setShowStatusModal(true);
    setIsRunning(true);

    try {
      const response = await runMassUpdate({
        reference_planogram: selectedPlanogramId,
        email: user?.email,
        status: selectedPlanogramStatus ?? "draft",
        planograms_list: selectedPlanogramsStep2,
      });

      const passed = response?.data?.data?.passed ?? [];
      const failed = response?.data?.data?.failed ?? [];
      const successCount = Array.isArray(passed) ? passed.length : 0;
      const failedCount = Array.isArray(failed) ? failed.length : 0;
      setMassUpdateReport({ successCount, failedCount });
    } catch (error) {
      console.error("Mass update failed:", error);
      setMassUpdateReport({ successCount: 0, failedCount: 0 });
    } finally {
      setIsRunning(false);
      setSelectedPlanogramsStep2([]);
    }
  }, [
    selectedPlanogramsStep2,
    selectedPlanogramId,
    selectedPlanogramStatus,
    user?.email,
  ]);

  const getStepBorderColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#BCD530";
    }
    return "#D1D5DB";
  };

  const getStepBackgroundColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#BCD530";
    }
    return "#FFFFFF";
  };

  const getStepTextColor = (stepNumber) => {
    if (currentStep === stepNumber) {
      return "#000000";
    }
    return "#6B7280";
  };

  const getStepOpacity = (stepNumber) => {
    return currentStep === stepNumber ? "opacity-100" : "opacity-50";
  };

  const handleStepChange = (newStep) => {
    if (newStep === 1) {
      setCurrentStep(newStep);
    } else if (newStep === 2 && selectedPlanogramId) {
      setCurrentStep(newStep);
    } else if (newStep === 2 && !selectedPlanogramId) {
      toast.error("Please select a planogram first");
    }
  };

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
      {/* Header with Stepper */}
      <div className="px-8 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between">
 
            <div>
              <h1 className="text-xl font-semibold">Mass Update</h1>
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
    
                <p className="text-[10px] text-gray-500">
              Select an Optimized Planogram
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
         
                <p className="text-[10px] text-gray-500">
                  Apply Mass Update to Planograms
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Select Planograms */}
      {currentStep === 1 && (
        <div className="flex-shrink-0">
          <SearchBar
            onSearchChange={setStep1SearchTerm}
            onResetFilters={handleStep1ResetFilters}
            hasActiveFilters={step1HasActiveFilters}
            showActivityLog={true}
            canViewActivityLog={true}
            onActivityLog={handleActivityLog}
            useOrangeTheme={false}
            hideCompare={true}
          />
          <div className="px-6 pb-2">
            <div className="flex items-center gap-4 bg-white/90 rounded-lg px-6 py-3 border border-gray-200 shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 mt-0.5">
                  Select an optimized planogram as the reference.
                  {" "}
                  <span className="font-medium text-[#BCD530]">
                    Its updates will be applied to other planograms in the next step.
                  </span>
                </span>
              </div>
            </div>
          </div>
          <PlanogramTable
            ref={step1TableRef}
            searchTerm={step1SearchTerm}
            onFilterChange={handleStep1FilterChange}
            variant="massUpdate"
            customNav={handleRowClickStep1}
          />
        </div>
      )}

      {/* Step 2: Review & Update */}
      {currentStep === 2 && (
        <div className="flex-shrink-0 flex flex-col h-full">
          <SearchBar
            onSearchChange={setStep2SearchTerm}
            onResetFilters={handleStep2ResetFilters}
            hasActiveFilters={step2HasActiveFilters}
            useOrangeTheme={false}
            hideCompare={true}
            showApplyMassUpdate={true}
            canApplyMassUpdate={selectedPlanogramsStep2.length > 0}
            onApplyMassUpdate={handleApplyMassUpdate}
          />
          <div className="px-6 pb-2">
            <div className="flex items-center gap-4 bg-white/90 rounded-lg px-6 py-3 border border-gray-200 shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 mt-0.5">
                  Select planograms to update in bulk.
                  {" "}
                  <span className="font-medium text-[#BCD530]">
                    Selected planograms will be updated based on your reference.
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <PlanogramTable
              ref={step2TableRef}
              searchTerm={step2SearchTerm}
              onFilterChange={handleStep2FilterChange}
              onSelectionChange={handleSelectionChangeStep2}
              variant="massUpdateBulk"
              referencePlanogramId={selectedPlanogramId}
            />
          </div>
        </div>
      )}

      {/* Mode Selection Modal */}
      <MassUpdateModeModal
        open={showModeModal}
        onClose={() => setShowModeModal(false)}
        onConfirm={handleModeConfirm}
      />

      {/* Confirmation Modal */}
      <MassUpdateConfirmationModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmMassUpdate}
      />
      <MassUpdateStatusModal
        open={showStatusModal}
        isRunning={isRunning}
        successCount={massUpdateReport.successCount}
        failedCount={massUpdateReport.failedCount}
        onClose={() => {
          setShowStatusModal(false);
          setCurrentStep(1);
        }}
        onGoToDashboard={() => {
          setShowStatusModal(false);
          navigate("/dashboard");
        }}
      />
      <MassUpdateActivityDrawer
        open={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        successLogs={mockSuccessLogs}
        failedLogs={mockFailedLogs}
      />
    </div>
  );
}

export default MassUpdateContent;

MassUpdateContent.propTypes = {};
