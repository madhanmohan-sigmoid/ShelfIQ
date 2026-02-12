import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import ProductItem from "./ProductItem";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedProduct,
  selectScale,
  selectShelfLines,
  selectPlanogramProducts,
  setPendingPlacement,
} from "../../redux/reducers/planogramVisualizerSlice";
import ProductContextMenu from "./ProductContextMenu";
import {
  removeAllFacings,
  removeSelectiveFacings,
  addSelectiveFacings,
  changeOrientation,
} from "../../utils/planogramFunctions";
import PropTypes from "prop-types";

// Helper component to render a single product facing
const ProductFacing = React.memo(
  ({
    item,
    isDimmed,
    isViewOnly,
    focusedBay,
    coloredProducts,
    hoveredProductId,
    onHover,
    dispatch,
    expandedByPx,
    bayIdx,
    shelfIdx,
    isViolationHighlighted,
    displayZoom,
  }) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const SCALE = useSelector(selectScale);
    const shelfLines = useSelector(selectShelfLines);
    const planogramProducts = useSelector(selectPlanogramProducts);
    const zoom = Number.isFinite(displayZoom) ? displayZoom : 1;

    const handleClick = (e) => {
      if (isViewOnly) {
        if (focusedBay) {
          dispatch(setSelectedProduct(item));
        } else {
          dispatch(setSelectedProduct(null));
        }
        return;
      }

      // Editable mode - show context menu instead of directly opening sidebar
      if (!item.isEmpty) {
        e.preventDefault();
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
      }
    };

    const handleMenuClose = () => {
      setMenuAnchor(null);
    };

    const handleViewDetails = () => {
      dispatch(setSelectedProduct(item));
    };

    const handleRemoveAll = () => {
      removeAllFacings({
        itemId: item.id,
        shelfLines,
        dispatch,
      });
    };

    const handleRemoveSelective = (result) => {
      removeSelectiveFacings({
        itemId: item.id,
        facingsWideToRemove: result.facingsWide || 0,
        facingsHighToRemove: result.facingsHigh || 0,
        shelfLines,
        dispatch,
        SCALE,
      });
    };

    const handleAddFacings = (result) => {
      addSelectiveFacings({
        itemId: item.id,
        facingsWideToAdd: result.facingsWide || 0,
        facingsHighToAdd: result.facingsHigh || 0,
        shelfLines,
        dispatch,
        SCALE,
      });
    };

    const handleChangeOrientation = () => {
      changeOrientation({
        itemId: item.id,
        shelfLines,
        dispatch,
        SCALE,
      });
    };

    const handleClickToPlace = () => {
      // Prefer original product details to get raw (mm) dimensions
      const original = planogramProducts.find(
        (p) => p.product_id === item.product_id
      );

      const productDetails = original?.product_details || {};
      const widthMm =
        productDetails.width ??
        (item.actualWidth ? item.actualWidth * 10 : item.width || 50);
      const heightMm =
        productDetails.height ??
        (item.actualHeight ? item.actualHeight * 10 : item.height || 50);

      const productForPlacement = {
        id: original?.product_id ?? item.product_id ?? item.id,
        width: widthMm,
        height: heightMm,
        depth: productDetails.depth ?? item.depth,
        name: productDetails.name ?? item.name,
        brand_name: productDetails.brand_name ?? item.brand,
        subCategory_name:
          productDetails.subCategory_name ?? item.subCategory_name,
        price: productDetails.price ?? item.price,
        image_url: productDetails.image_url ?? item.image_url,
        tpnb: productDetails.tpnb ?? item.tpnb,
        global_trade_item_number:
          productDetails.global_trade_item_number ?? item.gtin,
        dimensionUom: productDetails.dimensionUom ?? item.dimensionUom,
        orientation: original?.orientation ?? item.orientation,
        // metadata to allow “move” behavior instead of cloning
        isRepositionMove: true,
        originalUniqueItemId: item.id,
        originalProductId: item.product_id,
        originalBay: bayIdx + 1,
        originalShelf: shelfIdx + 1,
        originalPosition: item.xPosition,
        originalLinear: item.linear,
        originalFacingsWide: item.facings_wide || 1,
        originalFacingsHigh: item.facings_high || 1,
        originalActualWidth: item.actualWidth,
        originalActualHeight: item.actualHeight,
        originalDepth: item.depth,
      };

      dispatch(
        setPendingPlacement({
          active: true,
          product: productForPlacement,
          facingsWide: item.facings_wide || 1,
          facingsHigh: item.facings_high || 1,
        })
      );
    };

    return (
      <>
        <div
          className="relative"
          style={{
            width: item.width * zoom,
            height: item.height * zoom,
            transform: "scale(1)",
            transformOrigin: "top left",
            ...(expandedByPx > 0 && {
              boxShadow: "0 0 0 2px #CA1432",
              borderRadius: "3px",
            }),
          }}
        >
          <ProductItem
            item={item}
            onClick={handleClick}
            isViewOnly={isViewOnly}
            dimmed={isDimmed}
            isViolationHighlighted={isViolationHighlighted}
            brandColor={
              coloredProducts.find((p) => p.product_id === item.product_id)
                ?.brandColor
            }
            isHovered={hoveredProductId === item.product_id}
            onHover={onHover}
            zoomFactor={zoom}
          />
        </div>
        {!isViewOnly && (
          <ProductContextMenu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            product={item}
            onViewDetails={handleViewDetails}
            onRemoveAll={handleRemoveAll}
            onRemoveSelective={handleRemoveSelective}
            onAddFacings={handleAddFacings}
            onClickToPlace={handleClickToPlace}
            onChangeOrientation={handleChangeOrientation}
            facingsWide={item.facings_wide || 1}
            facingsHigh={item.facings_high || 1}
          />
        )}
      </>
    );
  }
);

ProductFacing.displayName = "ProductFacing";

ProductFacing.propTypes = {
  item: PropTypes.object.isRequired,
  isDimmed: PropTypes.bool,
  isViewOnly: PropTypes.bool,
  focusedBay: PropTypes.object,
  coloredProducts: PropTypes.arrayOf(PropTypes.object),
  hoveredProductId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onHover: PropTypes.func,
  dispatch: PropTypes.func,
  expandedByPx: PropTypes.number,
  bayIdx: PropTypes.number,
  shelfIdx: PropTypes.number,
  isViolationHighlighted: PropTypes.bool,
  displayZoom: PropTypes.number,
};

// Helper component to render a product with all its facings (wide x high)
const ProductFacings = React.memo(
  ({
    item,
    isDimmed,
    isViewOnly,
    focusedBay,
    coloredProducts,
    hoveredProductId,
    onHover,
    dispatch,
    expandedByPx,
    bayIdx,
    shelfIdx,
    isViolationHighlighted,
    displayZoom,
  }) => {
    const facingCount = item.facings_high || 1;
    const facingsWide = item.facings_wide || 1;
    const alignmentClass = isViewOnly ? "items-end" : "items-start";
    const zoom = Number.isFinite(displayZoom) ? displayZoom : 1;

    return (
      <>
        {Array.from({ length: facingsWide }).map((_, i) => (
          <div
            id={item?.tpnb}
            key={`${item.id || item.product_id || "facing"}-${i}`}
            className={`flex flex-col ${alignmentClass} box-border`}
            style={{ width: item.width * zoom }}
          >
            {Array.from({ length: facingCount }).map((_, facingIdx) => (
              <ProductFacing
                key={`${
                  item.id || item.product_id || "facing"
                }-${i}-${facingIdx}`}
                item={item}
                facingIdx={facingIdx}
                isDimmed={isDimmed}
                isViolationHighlighted={isViolationHighlighted}
                isViewOnly={isViewOnly}
                focusedBay={focusedBay}
                coloredProducts={coloredProducts}
                hoveredProductId={hoveredProductId}
                onHover={onHover}
                dispatch={dispatch}
                expandedByPx={expandedByPx || 0}
                bayIdx={bayIdx}
                shelfIdx={shelfIdx}
                displayZoom={zoom}
              />
            ))}
          </div>
        ))}
      </>
    );
  }
);

ProductFacings.displayName = "ProductFacings";

ProductFacings.propTypes = {
  item: PropTypes.object.isRequired,
  isDimmed: PropTypes.bool,
  isViewOnly: PropTypes.bool,
  focusedBay: PropTypes.object,
  coloredProducts: PropTypes.arrayOf(PropTypes.object),
  hoveredProductId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onHover: PropTypes.func,
  dispatch: PropTypes.func,
  expandedByPx: PropTypes.number,
  bayIdx: PropTypes.number,
  shelfIdx: PropTypes.number,
  isViolationHighlighted: PropTypes.bool,
  displayZoom: PropTypes.number,
};

const ShelfLine = ({
  provided,
  snapshot,
  shelf,
  items,
  isViewOnly,
  dimmedProductIds = [],
  violationProductIds = [],
  productInventorySelectectProduct,
  focusedBay = null,
  coloredProducts = [],
  isCompatibleForPlacement = false,
  onClickForPlacement = null,
  hasViolation = false,
  bayIdx,
  subShelfIdx,
  displayZoom = 1,
}) => {
  const [hoveredProductId, setHoveredProductId] = useState(null); // console.log(productInventorySelectectProduct)
  const dispatch = useDispatch(); // Handle click when in compatible mode
  const zoom = Number.isFinite(displayZoom) ? displayZoom : 1;
  const violationIdSet = React.useMemo(
    () => new Set(violationProductIds),
    [violationProductIds]
  );

  const handleShelfClick = (e) => {
    if (isCompatibleForPlacement && onClickForPlacement) {
      e.stopPropagation();
      onClickForPlacement();
    }
  }; // Handle keyboard events for accessibility

  const handleKeyDown = (e) => {
    if (isCompatibleForPlacement && onClickForPlacement) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClickForPlacement();
      }
    }
  }; // Helper function to group consecutive items by product_id for efficient rendering

  const groupConsecutiveItems = (items) => {
    const groups = [];
    let currentGroup = null;

    let index = 0;
    for (const item of items) {
      if (currentGroup && currentGroup.product_id === item.product_id) {
        // Add to current group
        currentGroup.items.push({ item, shelfPosition: index });
        currentGroup.totalWidth += item.width * (item.facings_wide || 1);
      } else {
        // Start new group
        currentGroup = {
          product_id: item.product_id,
          items: [{ item, shelfPosition: index }],
          totalWidth: item.width * (item.facings_wide || 1),
          startIndex: index,
        };
        groups.push(currentGroup);
      }
      index += 1;
    }

    return groups;
  }; // Check if we should use background coloring (compare mode)

  const useColorOnly =
    isViewOnly && coloredProducts && coloredProducts.length > 0;

  let shelfBackgroundClass = "bg-transparent";
  if (snapshot?.isDraggingOver) {
    shelfBackgroundClass = "bg-[#d0eaff]";
  } else if (isCompatibleForPlacement) {
    shelfBackgroundClass = "animate-blink-green";
  }

  let shelfItemsContent;
  if (isViewOnly && useColorOnly) {
    shelfItemsContent = groupConsecutiveItems(items).map((group) => (
      <div
        className="flex relative"
        key={`group-color-${group.product_id}-${group.startIndex}`}
      >
        {group.items.map(({ item, shelfPosition }) => {
          const isDimmed =
            dimmedProductIds.includes(item.id) ||
            (productInventorySelectectProduct &&
              productInventorySelectectProduct?.tpnb != item?.tpnb);
          const isViolationHighlighted = violationIdSet.has(item.product_id);
          return (
            <div
              className="flex"
              key={`group-item-${item.id || item.product_id}-${shelfPosition}`}
            >
              <ProductFacings
                item={item}
                isDimmed={isDimmed}
                isViolationHighlighted={isViolationHighlighted}
                isViewOnly={true}
                focusedBay={focusedBay}
                coloredProducts={coloredProducts}
                hoveredProductId={hoveredProductId}
                onHover={setHoveredProductId}
                dispatch={dispatch}
                expandedByPx={0}
                bayIdx={bayIdx}
                shelfIdx={subShelfIdx}
                displayZoom={zoom}
              />
            </div>
          );
        })}
      </div>
    ));
  } else if (isViewOnly) {
    shelfItemsContent = items.map((item, itemIdx) => {
      const isDimmed =
        dimmedProductIds.includes(item.id) ||
        (productInventorySelectectProduct &&
          productInventorySelectectProduct?.tpnb != item?.tpnb);
      const isViolationHighlighted = violationIdSet.has(item.product_id);

      return (
        <div
          className="flex"
          key={item.id || item.tpnb || `view-only-item-${itemIdx}`}
        >
          <ProductFacings
            item={item}
            isDimmed={isDimmed}
            isViolationHighlighted={isViolationHighlighted}
            isViewOnly={true}
            focusedBay={focusedBay}
            coloredProducts={coloredProducts}
            hoveredProductId={hoveredProductId}
            onHover={setHoveredProductId}
            dispatch={dispatch}
            expandedByPx={item?.expandedByPx || 0}
            bayIdx={bayIdx}
            shelfIdx={subShelfIdx}
            displayZoom={zoom}
          />
        </div>
      );
    });
  } else {
    shelfItemsContent = items.map((item, itemIdx) => {
      const isDimmed =
        dimmedProductIds.includes(item.id) ||
        (productInventorySelectectProduct &&
          productInventorySelectectProduct?.tpnb != item?.tpnb);
      const isViolationHighlighted = violationIdSet.has(item.product_id);

      return (
        <Draggable draggableId={item.id} index={itemIdx} key={item.id}>
          {(provided) => (
            <div
              className="flex"
              id={item?.tpnb}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                width: item.width * (item.facings_wide || 1) * zoom,
              }}
            >
              <ProductFacings
                item={item}
                isDimmed={isDimmed}
                isViolationHighlighted={isViolationHighlighted}
                isViewOnly={false}
                focusedBay={focusedBay}
                coloredProducts={coloredProducts}
                hoveredProductId={hoveredProductId}
                onHover={setHoveredProductId}
                dispatch={dispatch}
                expandedByPx={item?.expandedByPx || 0}
                bayIdx={bayIdx}
                shelfIdx={subShelfIdx}
                displayZoom={zoom}
              />
            </div>
          )}
        </Draggable>
      );
    });
  }

  const shelfContent = (
    <div
      data-testid="shelf-line-container"
      {...(isCompatibleForPlacement
        ? {
            onClick: handleShelfClick,
            onKeyDown: handleKeyDown,
            role: "button",
            tabIndex: 0,
            "aria-label": "Place product on shelf",
          }
        : {
            role: "region",
            "aria-label": "Shelf line",
          })}
      className={`relative flex items-end transition-colors shadow-xl shadow-gray-50 duration-200 ${shelfBackgroundClass}`}
      style={{
        height: shelf.height * zoom,
        width: shelf.width * zoom,
        borderBottom: hasViolation ? "4px solid #CA1432" : "4px solid #b0b0b0",
        padding: isViewOnly ? "0" : "0 1px",
        ...(isCompatibleForPlacement && {
          borderTop: "3px dashed #22c55e",
          borderLeft: "3px dashed #22c55e",
          borderRight: "3px dashed #22c55e",
          borderBottom: "3px dashed #22c55e",
          cursor: "pointer",
          boxShadow: "0 0 12px rgba(34, 197, 94, 0.4)",
        }),
        ...(hasViolation && {
          boxShadow: "0 4px 0 0 #CA1432",
        }),
      }}
    >
      {shelfItemsContent}
      {!isViewOnly && provided?.placeholder}
    </div>
  );

  // Always return a consistent wrapper structure for SonarQube compliance
  if (isViewOnly) {
    return <>{shelfContent}</>;
  }
  
  return (
    <div ref={provided?.innerRef} {...provided?.droppableProps}>
      {shelfContent}
    </div>
  );
};

export default React.memo(ShelfLine);

ShelfLine.propTypes = {
  provided: PropTypes.object,
  snapshot: PropTypes.object,
  shelf: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number,
  }).isRequired,
  items: PropTypes.array.isRequired,
  isViewOnly: PropTypes.bool,
  dimmedProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  violationProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  productInventorySelectectProduct: PropTypes.object,
  focusedBay: PropTypes.object,
  coloredProducts: PropTypes.array,
  isCompatibleForPlacement: PropTypes.bool,
  onClickForPlacement: PropTypes.func,
  hasViolation: PropTypes.bool,
  bayIdx: PropTypes.number,
  subShelfIdx: PropTypes.number,
  displayZoom: PropTypes.number,
};
