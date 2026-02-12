import { useSelector, useDispatch } from "react-redux";
import {
  setViewMode,
  setSearchTerm,
} from "../../redux/reducers/dashboardSlice";

export function useDashboardState() {
  const dispatch = useDispatch();
  const { viewMode, searchTerm } = useSelector((state) => state.dashboard);

  const updateViewMode = (mode) => {
    dispatch(setViewMode(mode));
  };

  const updateSearchTerm = (term) => {
    dispatch(setSearchTerm(term));
  };

  return {
    viewMode,
    searchTerm,
    setViewMode: updateViewMode,
    setSearchTerm: updateSearchTerm,
  };
}
