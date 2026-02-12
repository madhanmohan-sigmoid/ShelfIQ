import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import DashboardLayout from "../dashboard/DashboardLayout";
import MassUpdateContent from "./MassUpdateContent";
import { resetMyPlanogram } from "../../redux/reducers/myPlanogramSlice";

function MassUpdateContainer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset myPlanogram state when component mounts
    dispatch(resetMyPlanogram());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <MassUpdateContent />
    </DashboardLayout>
  );
}

export default MassUpdateContainer;
