import { getOptimizationStatus as getOptimizationStatusReal } from "../api/api";
import { getOptimizationStatus as getOptimizationStatusMock } from "../api/optimizationApiMocks";

/**
 * Module-level polling manager for optimization jobs
 * Manages polling outside React lifecycle to persist across navigation
 */

// Map to store active polling jobs
// Key: jobId, Value: { intervalId, startTime, toastId, attempts }
const activeJobs = new Map();

// Polling configuration
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 30; // 30 attempts at 10s intervals = 5 minutes

/**
 * Start polling for a job status
 * @param {string} jobId - The job ID to poll for
 * @param {Function} onComplete - Callback when job completes (receives cloned_planogram_id)
 * @param {Function} onError - Callback when job fails or times out (receives error message)
 * @param {string} toastId - The toast ID for the loading notification
 * @param {boolean} useMockPolling - Whether to use mock polling (fallback)
 */
export function startPolling(jobId, onComplete, onError, toastId, useMockPolling = false) {
  // If already polling for this job, stop previous polling
  if (activeJobs.has(jobId)) {
    stopPolling(jobId);
  }

  const startTime = Date.now();
  let attempts = 0;

  // Select the appropriate API function
  const getStatusFunction = useMockPolling 
    ? getOptimizationStatusMock 
    : getOptimizationStatusReal;

  // Immediate first check
  const checkStatus = async () => {
    attempts++;
    const elapsed = Date.now() - startTime;

    // Check timeout
    if (elapsed > MAX_TIMEOUT || attempts > MAX_ATTEMPTS) {
      stopPolling(jobId);
      onError("Optimization timed out after 5 minutes. Please try again.");
      return;
    }

    try {
      // Pass useMockPolling as forceMock parameter to ensure mock function uses fallback mode
      const response = await getStatusFunction(jobId, useMockPolling);

      // Check if response is valid
      if (!response?.data?.data) {
        console.error("Invalid response format:", response);
        // Continue polling on invalid response format (might be transient)
        return;
      }

      const {
        status,
        cloned_planogram_id,
        error,
        error_type,
      } = response.data.data;

      // Check job status
      if (status === "COMPLETED") {
        if (cloned_planogram_id) {
          stopPolling(jobId);
          onComplete(cloned_planogram_id);
        } else {
          // Job completed but no cloned_planogram_id - treat as error
          stopPolling(jobId);
          onError("Optimization completed but no planogram ID was returned.");
        }
      } else if (status === "FAILED") {
        stopPolling(jobId);
        const errorMessage =
          error ||
          (error_type
            ? `${error_type}: Optimization failed. Please try again.`
            : "Optimization failed. Please try again.");
        onError(errorMessage);
      } else if (status === "PENDING" || status === "RUNNING" || status === "IN_PROGRESS") {
        // Continue polling - status indicates job is still running
        // The interval will handle the next check
      } else {
        // Unknown status - log and continue polling
        console.warn(`Unknown job status: ${status}. Continuing to poll...`);
      }
    } catch (error) {
      // Network or API errors - continue polling unless we've exceeded timeout
      console.error(`Error checking job status (attempt ${attempts}):`, error);
      
      // Only stop on timeout, not on transient errors
      if (elapsed > MAX_TIMEOUT || attempts > MAX_ATTEMPTS) {
        stopPolling(jobId);
        onError("Failed to check optimization status. Please try again.");
      }
      // Otherwise, continue polling - the interval will retry
    }
  };

  // Start immediate check
  checkStatus();

  // Set up interval for subsequent checks
  const intervalId = setInterval(checkStatus, POLL_INTERVAL);

  // Store job info
  activeJobs.set(jobId, {
    intervalId,
    startTime,
    toastId,
    attempts,
    useMockPolling,
  });
}

/**
 * Stop polling for a specific job
 * @param {string} jobId - The job ID to stop polling for
 */
export function stopPolling(jobId) {
  const job = activeJobs.get(jobId);
  if (job) {
    clearInterval(job.intervalId);
    activeJobs.delete(jobId);
  }
}

/**
 * Check if a job is currently being polled
 * @param {string} jobId - The job ID to check
 * @returns {boolean} True if job is actively being polled
 */
export function isPolling(jobId) {
  return activeJobs.has(jobId);
}

/**
 * Stop all active polling jobs
 * Useful for cleanup on logout or app shutdown
 */
export function stopAllPolling() {
  activeJobs.forEach((job, jobId) => {
    clearInterval(job.intervalId);
  });
  activeJobs.clear();
}

/**
 * Get all active job IDs
 * @returns {Array<string>} Array of active job IDs
 */
export function getActiveJobs() {
  return Array.from(activeJobs.keys());
}
