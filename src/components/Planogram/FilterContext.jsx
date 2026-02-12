import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";

const defaultFilters = {
  subCategories: [],
  brands: [],
  priceTiers: [],
};

const defaultOptions = {
  subCategories: [],
  brands: [],
  priceTiers: [],
};

const FilterContext = createContext();

export const useFilter = () => useContext(FilterContext);

const FilterProviderComponent = ({ children }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [options, setOptions] = useState(defaultOptions);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const contextValue = useMemo(
    () => ({ filters, setFilters, options, setOptions, resetFilters }),
    [filters, options, resetFilters]
  );

  return (
    <FilterContext.Provider
      value={contextValue}
    >
      {children}
    </FilterContext.Provider>
  );
};

FilterProviderComponent.displayName = "FilterProvider";

export const FilterProvider = React.memo(FilterProviderComponent);

FilterProviderComponent.propTypes = {
  children: PropTypes.node.isRequired,
};
