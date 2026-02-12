import React, { useState } from "react";
import WalmartLogo from "../../assets/logos/Walmart.png";
import TescoLogo from "../../assets/logos/Tesco.png";
import DMLogo from "../../assets/logos/DM.png";
import EdekaLogo from "../../assets/logos/EMEA_EDEKA.PNG";
import ReweLogo from "../../assets/logos/EMEA_REWE.PNG";
import RossmannLogo from "../../assets/logos/EMEA_ROSSMANN.PNG";
import BootsLogo from "../../assets/logos/EMEA_BOOTS.png";
import MorrisonsLogo from "../../assets/logos/EMEA_MORRISONS.PNG";
import SainsburysLogo from "../../assets/logos/EMEA_sainsburys.PNG";
import TargetLogo from "../../assets/logos/NA_TARGET.PNG";
import LondonDrugsLogo from "../../assets/logos/NA_LONDONDRUGS.png";
import PublixLogo from "../../assets/logos/NA_PUBLIX.PNG";
import WalgreensLogo from "../../assets/logos/NA_WALLGREENS.PNG";
import RexallLogo from "../../assets/logos/NA_REXALL.PNG";
import DollarGeneralLogo from "../../assets/logos/NA_DOLLORGENERAL.png";
import VishalLogo from "../../assets/logos/APAC_VISHAL.PNG";
import ApolloLogo from "../../assets/logos/APAC_APOLLO.PNG";
import StarBazaarLogo from "../../assets/logos/APAC_STARBAZAAR.PNG";
import CainzLogo from "../../assets/logos/NA_CAINZ.PNG";
import KirindoLogo from "../../assets/logos/APAC_KIRINDO.PNG";
import WelciaLogo from "../../assets/logos/APAC_WELCIA.PNG";
import SparLogo from "../../assets/logos/APAC_SPAR.PNG";
import PropTypes from "prop-types";

// REGION_MAP is deprecated - now using retailers prop from API

const retailerLogos = {
  Walmart: WalmartLogo,
  TESCO: TescoLogo,
  dm: DMLogo,
  // EMEA retailers
  Edeka: EdekaLogo,
  Rewe: ReweLogo,
  Rossmann: RossmannLogo,
  Boots: BootsLogo,
  Morrisons: MorrisonsLogo,
  "Sainsbury's": SainsburysLogo,
  // NA retailers
  Target: TargetLogo,
  "London Drugs": LondonDrugsLogo,
  Publix: PublixLogo,
  Walgreens: WalgreensLogo,
  Rexall: RexallLogo,
  "Dollar General": DollarGeneralLogo,
  // APAC retailers
  "Vishal Mega Mart": VishalLogo,
  "Apollo Pharmacy": ApolloLogo,
  "Star Bazaar": StarBazaarLogo,
  Cainz: CainzLogo,
  KIRINDO: KirindoLogo,
  WELCIA: WelciaLogo,
  SPAR: SparLogo,
};

const RetailerSelector = ({
  selectedRegion = "EMEA",
  selectedRetailer,
  retailers = [], // Retailers from API
  onRetailerSelect,
  viewAllConfig, // Optional config for View All button (currently unused but accepted to avoid prop warnings)
  isRetailerAllowed, // RBAC function to check if retailer is allowed
  userAccessGroups, // User access groups for RBAC
}) => {
  const [showAllModal, setShowAllModal] = useState(false);

  // helpers: case-insensitive matching for logos
  const findLogoFor = (retailer) => {
    if (!retailer) return DMLogo;
    
    // Use image_url from API if available
    if (retailer.image_url) {
      return retailer.image_url;
    }
    
    // Fallback to hardcoded logos
    const name = retailer.name;
    if (!name) return DMLogo;
    
    // exact key
    if (retailerLogos[name]) return retailerLogos[name];
    
    // case-insensitive lookup
    const foundKey = Object.keys(retailerLogos).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    return foundKey ? retailerLogos[foundKey] : DMLogo;
  };

  // Use retailers directly from API
  const regionRetailers = retailers || [];

  const handleViewAll = () => {
    setShowAllModal(true);
  };

  const handleCloseModal = () => {
    setShowAllModal(false);
  };

  const handleRetailerSelectFromModal = (retailer) => {
    if (onRetailerSelect) onRetailerSelect(retailer);
    setShowAllModal(false);
  };

  // Show only first 5 retailers in the main grid
  const displayedRetailers = regionRetailers.slice(0, 5);

  // Check if retailer has RBAC access (separate from other disabled reasons)
  const hasRetailerAccess = (retailer) => {
    if (!isRetailerAllowed) return true; // If no RBAC check, allow all
    return isRetailerAllowed(retailer.id, selectedRegion);
  };

  return (
    <div className="flex flex-col items-start w-full">
      {/* Only show heading + grid when a region is selected */}
      {selectedRegion ? (
        <>
          <h2 className="text-lg font-medium mb-8 text-left">
            Pick the Retailer from below you want to view/optimise planograms
            for.
          </h2>

          <div className="flex flex-wrap justify-start gap-x-4 gap-y-4 max-w-4xl">
            {displayedRetailers.map((retailer) => {
              const hasAccess = hasRetailerAccess(retailer);
              const isDisabledByCategories = !retailer.categories || retailer.categories.length === 0 || !retailer.categories.some((cat) => cat.is_active === true);
              const isDisabled = !hasAccess || isDisabledByCategories;
              const isAvailable = !isDisabled;
              const isComingSoon = isDisabledByCategories && hasAccess;
              const noAccess = !hasAccess;

              return (
                <button
                  key={retailer.id}
                  type="button"
                  onClick={() => {
                    if (isAvailable && onRetailerSelect) {
                      onRetailerSelect(retailer);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`relative bg-white border rounded-2xl shadow-md transition flex items-center justify-center w-24 h-24 ${
                    selectedRetailer?.id === retailer.id && isAvailable
                      ? "border-2 border-black"
                      : "border border-gray-200"
                  } ${
                    isDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-black cursor-pointer"
                  }`}
                >
                  {isComingSoon && (
                    <span
                      className="absolute top-0 right-0 text-white text-[8px] font-medium px-1 z-10"
                      style={{
                        background: "#EA4335",
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
                      className="absolute top-0 right-0 text-white text-[8px] font-medium px-1 z-10"
                      style={{
                        background: "#9E9E9E",
                        borderTopRightRadius: "12px",
                        borderBottomLeftRadius: "12px",
                        borderTopLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                    >
                      No Access
                    </span>
                  )}

                  <img
                    src={findLogoFor(retailer)}
                    alt={retailer.name}
                    className={`w-16 h-16 object-contain ${noAccess ? "opacity-50" : ""}`}
                  />
                </button>
              );
            })}
          </div>

          {regionRetailers.length > 0 && (
            <div className="mt-6 w-full flex justify-end">
              <button
                onClick={handleViewAll}
                aria-label={`View all retailers in ${selectedRegion}`}
                className="
                px-3 py-1 rounded-lg 
                font-medium text-xs flex items-center gap-1
                border border-transparent 
                bg-black text-white 
                ransition 
                transform 
                hover:scale-105 
                active:scale-95
                "
              >
                View All
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* View All Modal */}
          {showAllModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto relative">
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close retailers modal"
                >
                  ×
                </button>

                {/* Modal Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    All Retailers in {selectedRegion}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Click on a retailer to select it
                  </p>
                </div>

                {/* All Retailers Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {regionRetailers.map((retailer) => {
                    const hasAccess = hasRetailerAccess(retailer);
                    const isDisabledByCategories = !retailer.categories || retailer.categories.length === 0 || !retailer.categories.some((cat) => cat.is_active === true);
                    const isDisabled = !hasAccess || isDisabledByCategories;
                    const isAvailable = !isDisabled;
                    const isComingSoon = isDisabledByCategories && hasAccess;
                    const noAccess = !hasAccess;

                    return (
                      <button
                        key={retailer.id}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            handleRetailerSelectFromModal(retailer);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`relative bg-white border rounded-xl shadow-sm transition flex items-center justify-center w-20 h-20 ${
                          selectedRetailer?.id === retailer.id && isAvailable
                            ? "border-2 border-black"
                            : "border border-gray-200"
                        } ${
                          isDisabled
                            ? "cursor-not-allowed opacity-60"
                            : "hover:border-black cursor-pointer"
                        }`}
                      >
                        {isComingSoon && (
                          <span
                            className="absolute top-0 right-0 text-white text-[6px] font-medium px-1 py-0.5 z-10"
                            style={{
                              background: "#EA4335",
                              borderTopRightRadius: "8px",
                              borderBottomLeftRadius: "8px",
                              borderTopLeftRadius: 0,
                              borderBottomRightRadius: 0,
                            }}
                          >
                            Coming Soon
                          </span>
                        )}
                        {noAccess && (
                          <span
                            className="absolute top-0 right-0 text-white text-[6px] font-medium px-1 py-0.5 z-10"
                            style={{
                              background: "#9E9E9E",
                              borderTopRightRadius: "8px",
                              borderBottomLeftRadius: "8px",
                              borderTopLeftRadius: 0,
                              borderBottomRightRadius: 0,
                            }}
                          >
                            No Access
                          </span>
                        )}

                        <img
                          src={findLogoFor(retailer)}
                          alt={retailer.name}
                          className={`w-14 h-14 object-contain ${noAccess ? "opacity-50" : ""}`}
                        />
                        </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default RetailerSelector;

RetailerSelector.propTypes = {
  selectedRegion: PropTypes.string,
  selectedRetailer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  retailers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      image_url: PropTypes.string,
      categories: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
          is_active: PropTypes.bool,
        })
      ),
    })
  ),
  onRetailerSelect: PropTypes.func.isRequired,
  viewAllConfig: PropTypes.object, // Optional config for View All button
  isRetailerAllowed: PropTypes.func, // RBAC function
  userAccessGroups: PropTypes.array, // User access groups
};
