import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { runRulesManager } from "../api/api";
import {
  startPolling,
  stopPolling,
  getActiveJobs,
} from "../utils/optimizationPollingManager";
import { selectRulesManagerPayload } from "../redux/reducers/planogramVisualizerSlice";
import { transformRulesToApiFormat } from "../utils/ruleTransformUtils";

/**
 * Custom hook for running planogram optimization
 * Handles API calls, polling, and toast notifications
 * 
 * @returns {Object} Object containing runOptimization function, loading state, and error state
 */
export function useOptimization() {
  const navigate = useNavigate();
  const rulesManagerPayload = useSelector(selectRulesManagerPayload);

  /**
   * Creates a click handler for the View button in success toast
   * @param {string} toastId - The toast ID to dismiss
   * @param {string} clonedPlanogramId - The ID of the cloned planogram
   * @returns {Function} Click handler function
   */
  const createViewClickHandler = useCallback(
    (toastId, clonedPlanogramId) => {
      return () => {
        toast.dismiss(toastId);
        navigate(`/planogram?id=${clonedPlanogramId}`);
      };
    },
    [navigate]
  );

  /**
   * Creates a success toast with View button for completed optimization
   * @param {string} clonedPlanogramId - The ID of the cloned planogram
   * @returns {Function} Toast render function
   */
  const createSuccessToast = useCallback(
    (clonedPlanogramId) => {
      const ToastComponent = (t) => {
        const handleViewClick = createViewClickHandler(t.id, clonedPlanogramId);
        const handleCloseClick = () => {
          toast.dismiss(t.id);
        };

        return (
          <div className="relative pr-8">
            <div className="flex items-center gap-3">
              <span>Optimization completed successfully!</span>
              <button
                onClick={handleViewClick}
                className="px-3 py-1.5 bg-white text-[#FF782C] rounded-md font-semibold text-sm hover:bg-gray-50 transition-colors border border-[#FF782C]"
              >
                View
              </button>
            </div>
            <button
              onClick={handleCloseClick}
              className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ×
            </button>
          </div>
        );
      };
      ToastComponent.displayName = "OptimizationSuccessToast";
      return ToastComponent;
    },
    [createViewClickHandler]
  );

  /**
   * Handles optimization completion
   * @param {string} clonedPlanogramId - The ID of the cloned planogram
   * @param {string} loadingToastId - The ID of the loading toast to dismiss
   */
  const handleOptimizationComplete = useCallback(
    (clonedPlanogramId, loadingToastId) => {
      toast.dismiss(loadingToastId);
      toast.success(createSuccessToast(clonedPlanogramId), {
        duration: Infinity, // Don't auto-dismiss - user must click View or X
      });
    },
    [createSuccessToast]
  );

  /**
   * Handles optimization error
   * @param {string} errorMessage - The error message to display
   * @param {string} loadingToastId - The ID of the loading toast to dismiss
   */
  const handleOptimizationError = useCallback(
    (errorMessage, loadingToastId) => {
      toast.dismiss(loadingToastId);
      const message = errorMessage || "Optimization failed. Please try again.";
      toast.error(
        (t) => (
          <div className="relative pr-8">
            <span>{message}</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ×
            </button>
          </div>
        ),
        {
          duration: Infinity, // Don't auto-dismiss - user must click X
        }
      );
    },
    []
  );

  /**
   * Run optimization for a planogram
   * @param {string} planogramId - The planogram ID to optimize
   */
  const runOptimizationJob = useCallback(
    async (planogramId) => {
      // Validate input
      if (!planogramId) {
        toast.error("Planogram ID is required");
        return;
      }

      // Check if already running an optimization
      // For now, we allow only one at a time
      const activeJobs = getActiveJobs();
      if (activeJobs.length > 0) {
        toast.error(
          "An optimization is already in progress. Please wait for it to complete."
        );
        return;
      }

      // Show loading toast immediately with dismiss button
      const loadingToastId = toast.loading(
        (t) => (
          <div className="relative pr-8">
            <span>Running optimization...</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
              style={{ fontSize: '20px', lineHeight: '1' }}
            >
              ×
            </button>
          </div>
        ),
        {
          duration: Infinity, // Don't auto-dismiss
          id: `optimization-loading-${Date.now()}`,
        }
      );

      try {
        // Build payload with transformed rules
        const payload = {
          ...rulesManagerPayload,
          rules: transformRulesToApiFormat(rulesManagerPayload?.rules || []),
        };

        const response = await runRulesManager(payload);

        // Validate response
        const jobId = response?.data?.data?.job_id;
        if (!jobId) {
          throw new Error("Invalid response from server");
        }

        // Start polling for job status
        startPolling(
          jobId,
          (clonedPlanogramId) =>
            handleOptimizationComplete(clonedPlanogramId, loadingToastId),
          (errorMessage) =>
            handleOptimizationError(errorMessage, loadingToastId),
          loadingToastId
        );
      } catch (error) {
        console.error("Error starting optimization:", error);

        // Try to dismiss any loading toast and clean up any polling that might have started
        const activeJobs = getActiveJobs();
        activeJobs.forEach((jobId) => {
          stopPolling(jobId);
        });

        // Always dismiss the loading toast on start failure, and show a clean message
        handleOptimizationError("Optimization failed. Please try again.", loadingToastId);
      }
    },
    [handleOptimizationComplete, handleOptimizationError, rulesManagerPayload]
  );

  return {
    runOptimization: runOptimizationJob,
    isOptimizing: false, // Can be enhanced to track active jobs
  };
}
