import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import DashboardLayout from "../dashboard/DashboardLayout";
import MyPlanogramContent from "./MyPlanogramContent";
import { resetMyPlanogram } from "../../redux/reducers/myPlanogramSlice";

function MyPlanogramContainer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Reset myPlanogram state when component mounts
    dispatch(resetMyPlanogram());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <MyPlanogramContent />
    </DashboardLayout>
  );
}

export default MyPlanogramContainer;
