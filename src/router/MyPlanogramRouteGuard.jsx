import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCategoryAccessType } from "../redux/reducers/regionRetailerSlice";

const MyPlanogramRouteGuard = () => {
  const categoryAccessType = useSelector(selectCategoryAccessType);

  if (categoryAccessType !== "CONTRIBUTORS") {
    return <Navigate to="/dashboard" replace />;
  }
    return <Outlet />;
};

export default MyPlanogramRouteGuard;

