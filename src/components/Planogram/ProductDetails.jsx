import React from "react";
import PropTypes from "prop-types";

const ProductDetails = ({ selectedProduct }) => {
  // Price formatting
  const formatPrice = (price) => {
    if (typeof price !== "number") return "N/A";
    return price > 100 ? `£${(price / 100).toFixed(2)}` : `${price}p`;
  };

  return (
    <div className="w-full ">
      {/* Name, Brand, Price */}
      <div style={{ marginBottom: "16px" }}>
        <h4
          style={{
            margin: "0 0 8px 0",
            fontSize: "15px",
            fontWeight: "600",
            color: "#2c3e50",
            textWrap: "wrap",
            wordBreak: "break-word",
          }}
        >
          {selectedProduct.name}
        </h4>
        <div
          style={{
            fontSize: "15px",
            color: "#292929",
            marginBottom: "8px",
            fontWeight: "600",
          }}
        >
          TPNB: {selectedProduct.tpnb}
        </div>
        <div
          style={{ fontSize: "14px", color: "#7f8c8d", marginBottom: "8px" }}
        >
          Brand: {selectedProduct.brand}
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#27ae60",
            textWrap: "wrap",
            wordBreak: "break-word",
          }}
        >
          {formatPrice(selectedProduct.price)}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#7f8c8d",
            marginBottom: "4px",
          }}
        >
          Description
        </div>
        <div
          style={{
            fontSize: "13px",
            lineHeight: "1.4",
            color: "#2c3e50",
            textWrap: "wrap",
            wordBreak: "break-word",
          }}
        >
          {selectedProduct.description || "No description available"}
        </div>
      </div>

      {/* Specs Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {[
          {
            label: "Width",
            value: selectedProduct.actualWidth
              ? `${(selectedProduct.actualWidth * 10).toFixed(1)} ${
                  selectedProduct.dimensionUom || "mm"
                }`
              : "-",
          },
          {
            label: "Height",
            value: selectedProduct.actualHeight
              ? `${(selectedProduct.actualHeight * 10).toFixed(1)} ${
                  selectedProduct.dimensionUom || "mm"
                }`
              : "-",
          },
          {
            label: "Depth",
            value: `${selectedProduct.depth || 0} mm`,
          },
          {
            label: "Units",
            value: `${selectedProduct.total_facings} (${selectedProduct.facings_wide}×${selectedProduct.facings_high})`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#7f8c8d",
                marginBottom: "4px",
              }}
            >
              {label}
            </div>
            <div
              style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#f0f8ff",
          borderRadius: "6px",
          border: "1px solid #e3f2fd",
        }}
      >
        <div
          style={{ fontSize: "11px", color: "#7f8c8d", marginBottom: "4px" }}
        >
          Product Metadata
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Kenvue Sans, sans-serif",
            color: "#2c3e50",
          }}
        >
          {/* <div>TPNB: {selectedProduct.tpnb}</div> */}
          <div>GTIN: {selectedProduct.gtin}</div>
          <div>Orientation: {selectedProduct.orientation}°</div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

ProductDetails.propTypes = {
  selectedProduct: PropTypes.object.isRequired,
};
