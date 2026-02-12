import { useSelector, useDispatch } from "react-redux";
import { setViewMode, setSearchTerm, setSelectedPlanogramIds } from "../../redux/reducers/myPlanogramSlice";

export function useMyPlanogramState() {
  const dispatch = useDispatch();
  const { viewMode, searchTerm, selectedPlanogramIds } = useSelector((state) => state.myPlanogram);

  const updateViewMode = (mode) => {
    dispatch(setViewMode(mode));
  };

  const updateSearchTerm = (term) => {
    dispatch(setSearchTerm(term));
  };

  const updateSelectedPlanogramIds = (ids) => {
    dispatch(setSelectedPlanogramIds(ids));
  };

  return {
    viewMode,
    searchTerm,
    selectedPlanogramIds,
    setViewMode: updateViewMode,
    setSearchTerm: updateSearchTerm,
    setSelectedPlanogramIds: updateSelectedPlanogramIds,
  };
}
