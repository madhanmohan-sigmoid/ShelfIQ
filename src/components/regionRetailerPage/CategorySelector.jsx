import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const CategorySelector = ({
  selectedRetailer,
  selectedCategory,
  categories,
  onCategorySelect,
  selectedRegion,
  isCategoryAllowed,
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    const hasAccess = isCategoryAllowed ? isCategoryAllowed(category.id, selectedRetailer?.id, selectedRegion) : true;
    if (category.is_active && hasAccess) {
      onCategorySelect(category);
      navigate("/dashboard");
    }
  };

  // Check if retailer has any active categories
  const hasActiveCategories = categories.some((cat) => cat.is_active === true);

  if (!hasActiveCategories && categories.length > 0) {
    return (
      <div className="flex flex-col items-center gap-y-2">
        <div className="text-2xl font-bold text-gray-400">Coming Soon</div>
        <div className="text-gray-500 text-center max-w-md p-2">
          We&rsquo;re working hard to bring {selectedRetailer?.name} planograms to you. Stay
          tuned for updates!
        </div>
      </div>
    );
  }

  return (
    // <div className="flex flex-col items-center">
    <div className="flex flex-col items-start w-full">
      {/* <h3 className="text-lg font-medium text-center mb-6">Please select a Category</h3> */}
      <h3 className="text-lg font-medium text-left mb-6">
        Please select a Category
      </h3>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
        {categories.length > 0 ? (
          categories.map((cat) => {
            const hasAccess = isCategoryAllowed ? isCategoryAllowed(cat.id, selectedRetailer?.id, selectedRegion) : true;
            const isActive = cat.is_active === true;
            const isAvailable = hasAccess && isActive;
            const isSelected = selectedCategory?.id === cat.id;
            const noAccess = !hasAccess;
            const comingSoon = !isActive && hasAccess;

            const baseButtonClasses =
              "relative rounded-xl px-6 py-3 text-sm font-medium border transition shadow-sm focus:outline-none";
            let availabilityClasses = "";

            if (isAvailable) {
              if (isSelected) {
                availabilityClasses = "bg-black text-white border-black";
              } else {
                availabilityClasses =
                  "bg-white text-gray-800 border-gray-300 cursor-pointer hover:bg-black hover:text-white hover:border-black transition-colors";
              }
            } else {
              availabilityClasses =
                "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60";
            }

            const buttonClassName = `${baseButtonClasses} ${availabilityClasses}`;

            return (
              <div key={cat.id} className="relative">
                <button
                  onClick={() => handleCategoryClick(cat)}
                  className={buttonClassName}
                  disabled={!isAvailable}
                  style={{ cursor: isAvailable ? "pointer" : "not-allowed" }}
                >
                  {cat.name}
                </button>
                {comingSoon && (
                  <span
                    className="absolute top-0 right-0 bg-[#EA4335] text-white text-[8px] font-medium px-1 cursor-not-allowed z-10"
                    style={{
                      borderTopRightRadius: "12px",
                      borderBottomLeftRadius: "12px",
                      borderTopLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
                {noAccess && (
                  <span
                    className="absolute top-0 right-0 bg-[#9E9E9E] text-white text-[8px] font-medium px-1 cursor-not-allowed z-10"
                    style={{
                      borderTopRightRadius: "12px",
                      borderBottomLeftRadius: "12px",
                      borderTopLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  >
                    No Access
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-gray-500">No categories available.</div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;

CategorySelector.propTypes = {
  selectedRetailer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  selectedCategory: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      is_active: PropTypes.bool,
    })
  ).isRequired,
  onCategorySelect: PropTypes.func.isRequired,
  selectedRegion: PropTypes.string,
  isCategoryAllowed: PropTypes.func, // RBAC function
  userAccessGroups: PropTypes.array, // User access groups
};
