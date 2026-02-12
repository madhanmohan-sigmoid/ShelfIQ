import { useSelector } from "react-redux";
import { 
  selectSelectedRegion, 
  selectSelectedRetailer, 
  selectSelectedCategory 
} from "../../../redux/reducers/regionRetailerSlice";

export function useHeaderData() {
  const user = useSelector((state) => state.auth.user);
  
  const selectedRegion = useSelector(selectSelectedRegion);
  const selectedRetailer = useSelector(selectSelectedRetailer);
  const selectedCategory = useSelector(selectSelectedCategory);

  return {
    user,
    selectedRegion,
    selectedRetailer: selectedRetailer?.name || '',
    selectedCategory: selectedCategory?.name || ''
  };
} 