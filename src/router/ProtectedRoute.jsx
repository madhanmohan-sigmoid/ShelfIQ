import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/authHelpers";

const ProtectedRoute = () => {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Clear any stale data and redirect to SSO
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userAccount");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;