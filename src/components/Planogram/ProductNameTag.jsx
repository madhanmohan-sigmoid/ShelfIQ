import React from "react";
import PropTypes from "prop-types";

const ProductNameTag = ({
  shelfLines,
  shelfIdx,
  subShelfIdx,
  isDimmed,
  displayZoom = 1,
}) => {
  const zoom = Number.isFinite(displayZoom) ? displayZoom : 1;
  return (
    <div className="w-full  h-4 absolute z-[4] -bottom-4 flex gap-x-[1]  ">
      {shelfLines[shelfIdx]?.[subShelfIdx]?.map((item, idx) => {
        const productKey =
          item?.id ||
          item?.tpnb ||
          item?.product_id ||
          item?.name ||
          `${item?.linear || "linear"}-${item?.price || "price"}`;
        const linearWidth = (item?.linear || 0) * zoom;

        return (
          <div
            key={`${productKey}-${idx}`}
          className={`text-[5px]  pt-0.5 leading-none text-ellipsis whitespace-nowrap overflow-hidden text-wrap h-full text-center flex flex-col  ${
            item.isEmpty ? "bg-transparent" : "bg-[#ffffa7]"
          } ${isDimmed(item) && " opacity-30 grayscale-0"}`}
          style={{ maxWidth: linearWidth, width: linearWidth }}
          title={item.name}
        >
          <p className="line-clamp-1 break-words  text-center">{item.name}</p>
          <p
            className={`${
              linearWidth < 25 ? "text-[5px]" : "text-[7px]"
            } font-semibold text-wrap`}
          >
            {typeof item?.price === "number"
              ? new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                }).format(item.price / 100)
              : ""}
          </p>
          </div>
        );
      })}
    </div>
  );
};

export default ProductNameTag;

ProductNameTag.propTypes = {
  shelfLines: PropTypes.array.isRequired,
  shelfIdx: PropTypes.number.isRequired,
  subShelfIdx: PropTypes.number.isRequired,
  isDimmed: PropTypes.func.isRequired,
  displayZoom: PropTypes.number,
};
