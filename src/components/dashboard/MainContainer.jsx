import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import DashboardLayout from "./DashboardLayout";
import DashboardContent from "./DashboardContent";
import { useDashboardState } from "./useDashboardState";
import { resetDashboard } from "../../redux/reducers/dashboardSlice";
import { resetPlanogramVisualizerData } from "../../redux/reducers/planogramVisualizerSlice";

function MainContainer() {
  const dispatch = useDispatch();
  const { searchTerm, setSearchTerm } = useDashboardState();

  useEffect(() => {
    // Reset dashboard state when component mounts
    dispatch(resetDashboard());
    dispatch(resetPlanogramVisualizerData());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <DashboardContent
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </DashboardLayout>
  );
}

export default MainContainer;
