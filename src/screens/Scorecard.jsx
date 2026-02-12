import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { selectSelectedPlanogramVersionId } from "../redux/reducers/scorecardSlice";
import { useSelector } from "react-redux";
import ScorecardFilters from "../components/scorecard/ScorecardFilters";
import ClusterOverview from "../components/scorecard/ClusterOverview";

const Scorecard = () => {
  const after_planogram_id = useSelector(selectSelectedPlanogramVersionId);

  const navigate = useNavigate();

  const handleBack = () => {
    if (after_planogram_id) {
      navigate(`/planogram?id=${after_planogram_id}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-[#FAFAFA] px-10 py-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center justify-between">
          <span className="font-semibold text-lg">SCORECARD</span>
        </div>

        <button
          className="flex items-center justify-center text-lg bg-[#3774B1] gap-x-3 rounded-full px-8 py-2.5 text-white font-semibold"
          onClick={handleBack}
        >
          <ArrowLeft />
          <p> Back to Planogram </p>
        </button>
      </div>

      <ScorecardFilters />

      {/* Tab Content */}
      <div className="overflow-y-auto mt-4">
        <ClusterOverview />
      </div>
    </div>
  );
};

export default Scorecard;
