/**
 * Mock responses for optimization APIs
 * Enable/disable by setting VITE_MOCK_OPTIMIZATION_API=true in .env
 * Remove this file once backend APIs are ready
 */

import api from "./axiosInstance";

// Single toggle for mocking. Default false to prefer real backend; set true only when you need mock.
const MOCK_ENABLED = false;

// Mock state tracking (uses sessionStorage to persist across navigation)
const getMockPollCount = (jobId) => {
  const storageKey = `optimization_job_${jobId}`;
  return Number.parseInt(sessionStorage.getItem(storageKey) || "0", 10);
};

const incrementMockPollCount = (jobId) => {
  const storageKey = `optimization_job_${jobId}`;
  const current = getMockPollCount(jobId);
  sessionStorage.setItem(storageKey, (current + 1).toString());
  return current + 1;
};

const clearMockPollCount = (jobId) => {
  const storageKey = `optimization_job_${jobId}`;
  sessionStorage.removeItem(storageKey);
};

/**
 * Run optimization - triggers optimization job and returns job_id
 * Wraps the real API call or returns mock response if mocking is enabled
 */
export const runOptimization = async (planogramId, forceMock = false) => {
  const useMock = MOCK_ENABLED || forceMock;

  if (!useMock) {
    // Real API call
    return api.post("/rules_manager/run-optimization", {
      planogram_id: planogramId,
    });
  }

  // Mock response
  return {
    data: {
      status: 200,
      message: "Success",
      data: {
        job_id: `${Date.now()}`, // Generate unique job ID
      },
    },
  };
};

/**
 * Get optimization job status
 * This function is used as a fallback when real API fails
 * Simulates a job that completes after 3 polls (~30 seconds at 10s intervals)
 * @param {string} jobId - The job ID to check
 * @param {boolean} forceMock - Force use mock even if MOCK_ENABLED is false (for fallback scenarios)
 */
export const getOptimizationStatus = async (jobId, forceMock = false) => {
  // If MOCK_ENABLED is false and forceMock is not set, try real API
  // But if this function is called from polling manager with useMockPolling=true,
  // forceMock should be passed as true
  if (!MOCK_ENABLED && !forceMock) {
    // Real API call
    return api.get(`/rules_manager/status/${jobId}`);
  }

  // Mock response with pollCount logic
  const pollCount = incrementMockPollCount(jobId);

  // Complete after 3 polls (~30 seconds at 10s intervals)
  if (pollCount < 3) {
    return {
      data: {
        status: 200,
        message: "Success",
        data: {
          status: "PENDING",
        },
      },
    };
  }

  // Clear mock state and return completed
  clearMockPollCount(jobId);
  return {
    data: {
      status: 200,
      message: "Success",
      data: {
        status: "COMPLETED",
        cloned_planogram_id: "78dd58b8-3535-4bcf-b850-5ea0e7bc28d3",
      },
    },
  };
};
