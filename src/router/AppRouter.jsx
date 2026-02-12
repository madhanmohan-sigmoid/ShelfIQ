import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../screens/Dashboard";
import SSOPage from "../screens/SSOPage";
import RegionRetailerPage from "../screens/RegionRetailerPage";
import Planogram from "../screens/Planogram";
import Compare from "../screens/Compare";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import ProductLibrary from "../screens/ProductLibrary";
import Scorecard from "../screens/Scorecard";
import ClusterOverview from "../components/scorecard/ClusterOverview";
import BrandOverview from "../screens/BrandOverview";
import SubcategoryOverview from "../screens/SubcategoryOverview";
import Analysis from "../screens/Analysis";
import UserUnauthorised from "../screens/UserUnauthorised";
import MyPlanogram from "../screens/MyPlanogram";
import MyPlanogramVisualizer from "../screens/MyPlanogramVisualizer";
import EditPlanogram from "../screens/EditPlanogram";
import MyPlanogramRouteGuard from "./MyPlanogramRouteGuard";
import MassUpdate from "../screens/MassUpdate";
import NotFound from "../screens/NotFound";
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SSOPage />} />
      <Route path="/user_not_found" element={<UserUnauthorised />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planogram" element={<Planogram />} />
          <Route path="/scorecard" element={<Scorecard />} />
          <Route path="/cluster-overview" element={<ClusterOverview />} />
          <Route path="/brand-overview" element={<BrandOverview />} />
          <Route
            path="/subcategory-overview"
            element={<SubcategoryOverview />}
          />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/region" element={<RegionRetailerPage />} />
          <Route path="/product-details" element={<ProductLibrary />} />
          <Route element={<MyPlanogramRouteGuard />}>
            <Route path="/my-planogram" element={<MyPlanogram />} />
            <Route
              path="/my-planogram/edit-planogram/:id"
              element={<EditPlanogram />}
            />
            <Route path="/my-planogram/:id" element={<MyPlanogramVisualizer />} />
            <Route path="/mass-update" element={<MassUpdate />} />
          </Route>
          <Route path="/compare" element={<Compare />} />
        </Route>
      </Route>
      {/* Catch all unmatched routes - outside MainLayout to avoid navbar */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;
