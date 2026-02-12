import axios from "axios";
import { getAccessToken } from "../utils/authHelpers";

export const baseURL = import.meta.env.VITE_REACT_APP_BACKEND || "/api/v1/";

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 second timeout
  withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        // Note: We need access to msalInstance here, so we'll handle this in the component level
        // For now, we'll redirect to SSO
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userAccount");
        window.location.href = "/";
        return Promise.reject(error);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userAccount");
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;