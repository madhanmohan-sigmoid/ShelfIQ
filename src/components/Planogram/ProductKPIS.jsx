import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { 
  selectProductKPIsByTpnb,
  selectPlanogramProducts 
} from "../../redux/reducers/planogramVisualizerSlice";
import {
  BarChart3,
  Package,
  Calendar,
  Flag,
  Hash,
  Zap,
} from "lucide-react";

const KPIItem = ({ label, value, icon }) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-md shadow-sm bg-[#f0f8ff] border border-[#e3f2fd]`}
  >
    <div className="p-2 bg-gray-100 rounded-full">
      {React.createElement(icon, { className: "w-5 h-5 text-gray-600" })}
    </div>
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className=" font-semibold text-gray-800 break-words text-sm">
        {value}
      </div>
    </div>
  </div>
);

KPIItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node])
    .isRequired,
  icon: PropTypes.elementType.isRequired,
};

const ProductKPIS = ({ selectedProductID, planogramId, selectedProduct }) => {
  // Get pre-fetched KPI data from Redux
  const productKPIsByTpnb = useSelector(selectProductKPIsByTpnb);
  const planogramProducts = useSelector(selectPlanogramProducts);

  // Get tpnb from selectedProduct
  const tpnb = selectedProduct?.tpnb;

  // Get KPI data - PRIMARY: Look up from planogramProducts by product_id
  // This is the most reliable since planogramProducts definitely has product_kpis
  const productKPI = useMemo(() => {
    // Method 1: Look up from planogramProducts by product_id (MOST RELIABLE)
    if (selectedProduct?.product_id && planogramProducts?.length > 0) {
      const productFromPlanogram = planogramProducts.find(
        (p) => p.product_id === selectedProduct.product_id
      );
      if (productFromPlanogram?.product_kpis) {
        return productFromPlanogram.product_kpis;
      }
    }

    // Method 2: Try selectedProduct.product_kpis directly (if it was copied)
    if (selectedProduct?.product_kpis) {
      return selectedProduct.product_kpis;
    }

    // Method 3: Redux lookup by tpnb (handle both string and number types)
    if (tpnb) {
      let kpi = productKPIsByTpnb[tpnb];
      if (kpi) {
        return kpi;
      }

      kpi = productKPIsByTpnb[String(tpnb)];
      if (kpi) {
        return kpi;
      }

      kpi = productKPIsByTpnb[Number(tpnb)];
      if (kpi) {
        return kpi;
      }
    }

    return null;
  }, [selectedProduct, planogramProducts, productKPIsByTpnb, tpnb]);

  // Commented out: Original API call code
  // const [productKPI, setProductKPI] = useState(null);
  // const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchProductKPI = async () => {
  //     if (!selectedProductID) return;
  //     setLoading(true);
  //     try {
  //       const response = await getProductKPI(planogramId, selectedProductID);
  //       const data = response?.data?.data;
  //       setProductKPI(data || null);
  //     } catch (error) {
  //       console.error("Failed to fetch product KPI:", error);
  //       setProductKPI(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchProductKPI();
  //   //eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedProductID]);

  if (!selectedProductID || !tpnb) {
    return (
      <div className="text-center text-gray-500 text-base mt-8">
        Please select a product to view KPI details.
      </div>
    );
  }

  if (!productKPI) {
    return (
      <div className="text-center text-gray-400 text-sm mt-8">
        No KPI data available for the selected product.
      </div>
    );
  }

  return (
    <div className=" space-y-4 w-full word-break">
      <h2 className="text-lg font-semibold text-gray-800">Product KPIs</h2>

      <KPIItem
        label="Weekly Sales Value"
        value={`£ ${productKPI?.sales ?? 0}`}
        icon={BarChart3}
      />

      <KPIItem
        label="Weekly Units"
        value={`${productKPI?.units ?? 0} units`}
        icon={Package}
      />

      <KPIItem
        label="Days of Supply"
        value={`${productKPI?.DOS ?? 0} days`}
        icon={Calendar}
      />
      
      {productKPI?.index !== undefined && (
        <KPIItem 
          label="Index" 
          value={productKPI?.index ?? "N/A"} 
          icon={Hash} 
        />
      )}
      
      {productKPI?.productivity !== undefined && (
        <KPIItem 
          label="Productivity" 
          value={productKPI?.productivity ?? "N/A"} 
          icon={Zap} 
        />
      )}
    </div>
  );
};

export default ProductKPIS;

ProductKPIS.propTypes = {
  selectedProductID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  planogramId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  selectedProduct: PropTypes.shape({
    tpnb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    product_kpis: PropTypes.object,
    product_details: PropTypes.shape({
      tpnb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
};
