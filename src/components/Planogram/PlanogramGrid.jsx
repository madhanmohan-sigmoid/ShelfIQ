import React, { useEffect, useMemo, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import ShelfLine from "./ShelfLine";
import { useSelector, useDispatch } from "react-redux";
import {
  selectBays,
  selectIsFullScreen,
  selectLeftSidebarCollapsed,
  selectProductInventorySelectedProduct,
  selectRightSidebarCollapsed,
  selectShelfLines,
  setZoomState,
} from "../../redux/reducers/planogramVisualizerSlice";
import ProductNameTag from "./ProductNameTag";
import PropTypes from "prop-types";

const useWindowWidth = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenWidth;
};

const useAutoScrollToSelectedProduct = (
  isViewOnly,
  selectedProduct,
  rightCollapsed
) => {
  useEffect(() => {
    if (!isViewOnly && selectedProduct?.tpnb) {
      const timeout = setTimeout(() => {
        const el = document.getElementById(selectedProduct.tpnb.toString());
        el?.scrollIntoView?.({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [selectedProduct, isViewOnly, rightCollapsed]);
};

const useZoomInteractions = (
  isViewOnly,
  zoomState,
  dispatch,
  containerRef,
  lastTouchDistance
) => {
  useEffect(() => {
    if (isViewOnly || !containerRef.current || !zoomState) return;

    const container = containerRef.current;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newValue = Math.max(0.3, Math.min(3, zoomState.newValue + delta));
        dispatch(setZoomState({ oldValue: zoomState.newValue, newValue }));
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [touch1, touch2] = e.touches;
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && lastTouchDistance.current) {
        e.preventDefault();
        const [touch1, touch2] = e.touches;
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const delta = (distance - lastTouchDistance.current) * 0.01;
        const newValue = Math.max(0.3, Math.min(3, zoomState.newValue + delta));
        dispatch(setZoomState({ oldValue: zoomState.newValue, newValue }));

        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance.current = null;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isViewOnly, zoomState, dispatch, containerRef, lastTouchDistance]);
};

const useShelfViolationLookup = (violations) =>
  useMemo(() => {
    if (!Array.isArray(violations)) return {};
    return violations.reduce((acc, violation) => {
      if (
        typeof violation.bayIdx === "number" &&
        typeof violation.shelfIdx === "number"
      ) {
        acc[`${violation.bayIdx}-${violation.shelfIdx}`] = true;
      }
      return acc;
    }, {});
  }, [violations]);

const usePlacementPositionLookup = (pendingPlacement) =>
  useMemo(() => {
    if (
      !pendingPlacement?.active ||
      !Array.isArray(pendingPlacement?.compatiblePositions)
    ) {
      return {};
    }
    return pendingPlacement.compatiblePositions.reduce((acc, pos) => {
      acc[`${pos.bayIdx}-${pos.shelfIdx}`] = pos;
      return acc;
    }, {});
  }, [pendingPlacement]);

const PlanogramEmptyState = ({ width }) => (
  <div
    style={{
      width,
      margin: "0 auto",
      background: "#e0e0e0",
      borderRadius: "8px",
      padding: "24px 0",
      position: "relative",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
    }}
  >
    <div style={{ color: "#666", fontSize: "14px" }}>Building bays...</div>
  </div>
);

const buildContainerStyle = ({
  isViewOnly,
  constrainToParent,
  maxWidth,
  MAX_WIDTH,
}) => {
  const baseStyle = {
    margin: "0 auto",
    borderRadius: "8px",
    padding: "10px 20px",
    position: "relative",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

  if (isViewOnly) {
    baseStyle.width = constrainToParent ? "100%" : "";
    baseStyle.maxWidth = constrainToParent ? "100%" : "none";
    baseStyle.maxHeight = constrainToParent ? "100%" : "none";
    baseStyle.transform = "scale(1)";
    if (constrainToParent) {
      baseStyle.overflowX = "auto";
      baseStyle.overflowY = "auto";
    }
  } else {
    baseStyle.width = Math.min(maxWidth, MAX_WIDTH);
    baseStyle.maxWidth = MAX_WIDTH;
    baseStyle.maxHeight = "calc(100vh - 200px)";
    baseStyle.overflowX = "auto";
    baseStyle.overflowY = "auto";
  }

  return baseStyle;
};

const buildInnerStyle = ({ isViewOnly, constrainToParent, maxWidth }) => {
  const style = {
    minWidth: isViewOnly && constrainToParent ? 0 : "100%",
    position: "relative",
    display: "flex",
    alignItems: "end",
  };

  if (isViewOnly) {
    style.width = "100%";
  } else {
    style.width = maxWidth;
  }

  return style;
};

const getBayClassName = (isViewOnly, focusedBay, shelfLinesLength) => {
  if (!isViewOnly) return "";
  if (focusedBay) return "bubbly-zoom";
  const hoverClass =
    shelfLinesLength < 6 ? "hover:scale-[1.05]" : "hover:scale-[1.3]";
  return `bubbly-zoom ${hoverClass}`;
};

const getBayHighlightStyles = (focusedBay, bayIdx) =>
  focusedBay?.bayIndex === bayIdx
    ? {
        outline: "3px solid #3498db",
        outlineOffset: "2px",
        borderRadius: "4px",
        boxShadow: "0 0 12px rgba(52, 152, 219, 0.3)",
      }
    : {};

const getSubShelfStyle = (subShelf, displayZoom) => ({
  position: "relative",
  width: subShelf.width * displayZoom,
  height: subShelf.height * displayZoom,
  cursor: "pointer",
  transition: "all 0.3s ease",
  background: "transparent",
  border: "none",
  padding: 0,
});

const ViewOnlySubShelf = ({
  shelfIdx,
  subShelfIdx,
  subShelf,
  onClick,
  focusedBay,
  content,
  displayZoom,
}) => {
  const handleClick = (event) => {
    onClick?.(shelfIdx, subShelfIdx, event);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        focusedBay && shelfIdx === focusedBay?.bayIndex
          ? "hover:scale-[1.2] bubbly-zoom"
          : ""
      }
      style={getSubShelfStyle(subShelf, displayZoom)}
    >
      {content}
    </button>
  );
};

const PlanogramGridView = ({
  containerRef,
  bays,
  shelfLines,
  isViewOnly,
  constrainToParent,
  maxWidth,
  MAX_WIDTH,
  focusedBay,
  dimmedProductIds,
  violationProductIds,
  coloredProducts,
  selectedProduct,
  showProductNameTag,
  ItemWithTooltip,
  pendingPlacement,
  placementPositions,
  onShelfClickForPlacement,
  shelfHasViolation,
  bayClickHandler,
  SHELF_GAP,
  displayZoom,
}) => {
  const containerStyle = useMemo(
    () =>
      buildContainerStyle({
        isViewOnly,
        constrainToParent,
        maxWidth,
        MAX_WIDTH,
      }),
    [isViewOnly, constrainToParent, maxWidth, MAX_WIDTH]
  );

  const innerStyle = useMemo(
    () => buildInnerStyle({ isViewOnly, constrainToParent, maxWidth }),
    [isViewOnly, constrainToParent, maxWidth]
  );

  const bayClassName = useMemo(
    () => getBayClassName(isViewOnly, focusedBay, shelfLines.length),
    [isViewOnly, focusedBay, shelfLines.length]
  );

  const isDimmed = (item) =>
    dimmedProductIds.includes(item.id) ||
    (selectedProduct && selectedProduct.tpnb !== item?.tpnb);

  const renderShelfContent = (
    shelfIdx,
    subShelfIdx,
    subShelf,
    provided = null,
    snapshot = null
  ) => {
    const position = placementPositions[`${shelfIdx}-${subShelfIdx}`];
    const handlePlacementClick = () => {
      if (!position || !onShelfClickForPlacement) return;
      onShelfClickForPlacement(shelfIdx, subShelfIdx, position.startItemIdx);
    };

    return (
      <div className="relative">
        {showProductNameTag && (
          <ProductNameTag
            shelfLines={shelfLines}
            shelfIdx={shelfIdx}
            subShelfIdx={subShelfIdx}
            isDimmed={isDimmed}
            displayZoom={displayZoom}
          />
        )}
        <ShelfLine
          provided={provided}
          snapshot={snapshot}
          shelf={subShelf}
          items={shelfLines[shelfIdx]?.[subShelfIdx] || []}
          shelfIdx={`${shelfIdx}-${subShelfIdx}`}
          ItemWithTooltip={ItemWithTooltip}
          SHELF_GAP={SHELF_GAP}
          focusedBay={focusedBay}
          isViewOnly={isViewOnly}
          dimmedProductIds={dimmedProductIds}
          violationProductIds={violationProductIds}
          coloredProducts={coloredProducts}
          productInventorySelectectProduct={selectedProduct}
          isCompatibleForPlacement={Boolean(position)}
          bayIdx={shelfIdx}
          subShelfIdx={subShelfIdx}
          pendingPlacement={pendingPlacement}
          onClickForPlacement={handlePlacementClick}
          hasViolation={!!shelfHasViolation[`${shelfIdx}-${subShelfIdx}`]}
          displayZoom={displayZoom}
        />
      </div>
    );
  };

  const renderSubShelf = (shelfIdx, subShelfIdx, subShelf) => {
    const content = renderShelfContent(shelfIdx, subShelfIdx, subShelf);
    if (isViewOnly) {
      return (
        <ViewOnlySubShelf
          key={subShelf.id ?? `${shelfIdx}-${subShelfIdx}`}
          shelfIdx={shelfIdx}
          subShelfIdx={subShelfIdx}
          subShelf={subShelf}
          focusedBay={focusedBay}
          onClick={bayClickHandler}
          content={content}
          displayZoom={displayZoom}
        />
      );
    }

    return (
      <Droppable
        droppableId={`shelf-line-${shelfIdx}-${subShelfIdx}`}
        direction="horizontal"
        key={subShelf.id ?? `${shelfIdx}-${subShelfIdx}`}
      >
        {(provided, snapshot) =>
          renderShelfContent(
            shelfIdx,
            subShelfIdx,
            subShelf,
            provided,
            snapshot
          )
        }
      </Droppable>
    );
  };

  return (
    <div ref={containerRef} className="planogram-bg" style={containerStyle}>
      <div style={innerStyle}>
        {bays.map((shelf, shelfIdx) => {
          const shelfKey =
            shelf?.id ?? shelf?.bayId ?? shelf?.bayUuid ?? `bay-${shelfIdx}`;
          return (
            <div
              key={shelfKey}
              className={bayClassName}
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: "4px",
                padding: "0 4px",
                position: "relative",
                ...getBayHighlightStyles(focusedBay, shelfIdx),
              }}
            >
              <div
                className="w-full flex items-center justify-center px-2 py-1"
                style={{ marginTop: "0.7rem" }}
              >
                <p className="w-fit px-5 bg-black text-white rounded-md bg-opacity-65">
                  {shelfIdx + 1}
                </p>
              </div>

              {shelf.subShelves.map((subShelf, subShelfIdx) =>
                renderSubShelf(shelfIdx, subShelfIdx, subShelf)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

PlanogramEmptyState.propTypes = {
  width: PropTypes.number.isRequired,
};

ViewOnlySubShelf.propTypes = {
  shelfIdx: PropTypes.number.isRequired,
  subShelfIdx: PropTypes.number.isRequired,
  subShelf: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  focusedBay: PropTypes.shape({
    bayIndex: PropTypes.number,
  }),
  content: PropTypes.node.isRequired,
  displayZoom: PropTypes.number.isRequired,
};

const placementPositionShape = PropTypes.shape({
  bayIdx: PropTypes.number.isRequired,
  shelfIdx: PropTypes.number.isRequired,
  startItemIdx: PropTypes.number,
});

PlanogramGridView.propTypes = {
  containerRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  bays: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      bayId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      bayUuid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      width: PropTypes.number,
      subShelves: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          width: PropTypes.number,
          height: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  shelfLines: PropTypes.array.isRequired,
  isViewOnly: PropTypes.bool.isRequired,
  constrainToParent: PropTypes.bool.isRequired,
  maxWidth: PropTypes.number.isRequired,
  MAX_WIDTH: PropTypes.number.isRequired,
  focusedBay: PropTypes.shape({
    bayIndex: PropTypes.number,
  }),
  dimmedProductIds: PropTypes.array.isRequired,
  violationProductIds: PropTypes.array.isRequired,
  coloredProducts: PropTypes.array.isRequired,
  selectedProduct: PropTypes.shape({
    tpnb: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  showProductNameTag: PropTypes.bool,
  ItemWithTooltip: PropTypes.elementType.isRequired,
  pendingPlacement: PropTypes.shape({
    active: PropTypes.bool,
    compatiblePositions: PropTypes.arrayOf(placementPositionShape),
  }),
  placementPositions: PropTypes.objectOf(placementPositionShape).isRequired,
  onShelfClickForPlacement: PropTypes.func,
  shelfHasViolation: PropTypes.object.isRequired,
  bayClickHandler: PropTypes.func,
  SHELF_GAP: PropTypes.number.isRequired,
  displayZoom: PropTypes.number.isRequired,
};
const PlanogramGrid = ({
  ItemWithTooltip,
  onBayClick,
  focusedBay,
  dimmedProductIds = [],
  violationProductIds = [],
  showProductNameTag = true,
  zoomState,
  coloredProducts = [],
  constrainToParent = false,
  pendingPlacement = null,
  onShelfClickForPlacement = null,
}) => {
  const SHELF_GAP = 32;
  const leftCollapsed = useSelector(selectLeftSidebarCollapsed);
  const rightCollapsed = useSelector(selectRightSidebarCollapsed);
  const shelfLines = useSelector(selectShelfLines);
  const isViewOnly = useSelector(selectIsFullScreen);
  const selectedProduct = useSelector(selectProductInventorySelectedProduct);
  const bays = useSelector(selectBays);
  const dispatch = useDispatch();

  const containerRef = React.useRef(null);
  const lastTouchDistance = React.useRef(null);

  const leftWidth = leftCollapsed ? 32 : 280;
  const rightWidth = rightCollapsed ? 0 : 250;
  const screenWidth = useWindowWidth();
  const MAX_WIDTH = screenWidth - leftWidth - rightWidth - 80;
  const displayZoom = zoomState?.newValue || 1;

  useAutoScrollToSelectedProduct(isViewOnly, selectedProduct, rightCollapsed);

  useZoomInteractions(
    isViewOnly,
    zoomState,
    dispatch,
    containerRef,
    lastTouchDistance
  );

  const violations = useSelector(
    (state) => state.planogramVisualizerData.violations || []
  );
  const shelfHasViolation = useShelfViolationLookup(violations);
  const placementPositions = usePlacementPositionLookup(pendingPlacement);

  if (!bays?.length || !shelfLines?.length) {
    return <PlanogramEmptyState width={MAX_WIDTH} />;
  }

  const maxWidth =
    (bays || []).reduce((sum, bay) => sum + (bay?.width || 0), 0) *
      displayZoom +
    40;

  const bayClickHandler =
    isViewOnly && onBayClick
      ? (shelfIdx, subShelfIdx, event) => {
          event.stopPropagation();
          onBayClick(shelfIdx, subShelfIdx);
        }
      : null;

  return (
    <PlanogramGridView
      containerRef={containerRef}
      bays={bays}
      shelfLines={shelfLines}
      isViewOnly={isViewOnly}
      constrainToParent={constrainToParent}
      maxWidth={maxWidth}
      MAX_WIDTH={MAX_WIDTH}
      focusedBay={focusedBay}
      dimmedProductIds={dimmedProductIds}
      violationProductIds={violationProductIds}
      coloredProducts={coloredProducts}
      selectedProduct={selectedProduct}
      showProductNameTag={showProductNameTag}
      ItemWithTooltip={ItemWithTooltip}
      pendingPlacement={pendingPlacement}
      placementPositions={placementPositions}
      onShelfClickForPlacement={onShelfClickForPlacement}
      shelfHasViolation={shelfHasViolation}
      bayClickHandler={bayClickHandler}
      SHELF_GAP={SHELF_GAP}
      displayZoom={displayZoom}
    />
  );
};

export default React.memo(PlanogramGrid);

PlanogramGrid.propTypes = {
  ItemWithTooltip: PropTypes.elementType.isRequired,
  onBayClick: PropTypes.func,
  focusedBay: PropTypes.shape({
    bayIndex: PropTypes.number,
  }),
  dimmedProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  violationProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  showProductNameTag: PropTypes.bool,
  zoomState: PropTypes.shape({
    oldValue: PropTypes.number,
    newValue: PropTypes.number,
  }),
  coloredProducts: PropTypes.array,
  constrainToParent: PropTypes.bool,
  pendingPlacement: PropTypes.shape({
    active: PropTypes.bool,
    compatiblePositions: PropTypes.arrayOf(
      PropTypes.shape({
        bayIdx: PropTypes.number,
        shelfIdx: PropTypes.number,
        startItemIdx: PropTypes.number,
      })
    ),
  }),
  onShelfClickForPlacement: PropTypes.func,
};
