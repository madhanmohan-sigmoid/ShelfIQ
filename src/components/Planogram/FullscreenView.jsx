import React, { useState, useRef, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import PlanogramGrid from "./PlanogramGrid";
import FullScreenPlanogramLoader from "../loader/FullScreenPlanogramLoader";
import { useSelector } from "react-redux";
import {
  selectBays,
  selectShelfLines,
} from "../../redux/reducers/planogramVisualizerSlice";
import BottomToolbar from "./BottomToolbar";

const FullscreenView = ({
  ItemWithTooltip,
  onClose,
  dimmedProductIds = [],
  violationProductIds = [],
  showProductNameTag = true,
  coloredProducts = [],
  setShowProductNameTag,
  isOrangeTheme = false,
  planogramStatus = "draft",
  onToggleChecks,
}) => {
  const [loading, setLoading] = useState(true);

  const CONTAINER_PADDING = 0;
  const bays = useSelector(selectBays);
  const shelfLines = useSelector(selectShelfLines);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [focusedBay, setFocusedBay] = useState(null);
  const [shouldCenter, setShouldCenter] = useState(false);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const lastTouchX = useRef(0);
  const lastTouchDistance = useRef(null);
  const initialScaleRef = useRef(1);

  const calculateInitialScale = () => {
    if (!containerRef.current || !contentRef.current) return 1;
    const container = containerRef.current;
    const content = contentRef.current;
    const scaleX = container.clientWidth / content.scrollWidth;
    const scaleY = container.clientHeight / content.scrollHeight;
    return Math.min(scaleX, scaleY, 1);
  };

  const centerContent = () => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const content = contentRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const contentWidth = content.scrollWidth * scale;
    const contentHeight = content.scrollHeight * scale;
    const x = (containerWidth - contentWidth) / 2;
    const y = (containerHeight - contentHeight) / 2;
    // console.log(x, y, containerWidth, containerHeight, contentWidth, contentHeight)
    setPosition({ x, y });
  };

  useEffect(() => {
    setLoading(true);
    if (containerRef.current && contentRef.current) {
      const newScale = calculateInitialScale();
      setScale(newScale);
      initialScaleRef.current = newScale;

      handleReset();
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfLines]);

  const handleReset = () => {
    setLoading(true);
    const newScale = calculateInitialScale();
    setScale(newScale);
    setShouldCenter(true);
    setFocusedBay(null);
    setLoading(false);
  };

  const handleBayClick = (bayIdx, shelfIdx) => {
    if (
      !containerRef.current ||
      !bays.length ||
      !bays[bayIdx]?.subShelves?.length
    )
      return;
    if (focusedBay?.shelfIndex === shelfIdx && focusedBay?.bayIndex === bayIdx)
      return;

    const container = containerRef.current;
    let bayX = CONTAINER_PADDING;
    for (let i = 0; i < bayIdx; i++) {
      bayX += bays[i].subShelves?.[0].width || 0;
    }

    const selectedBay = bays[bayIdx];
    const subShelves = selectedBay.subShelves;
    const totalBayHeight = subShelves.reduce(
      (sum, shelf) => sum + shelf.height,
      0
    );

    const bayWidth = subShelves[shelfIdx].width;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const zoomLevel = 0.85; // can be higher if you want a stronger zoom

    const targetX = containerWidth / 2 - (bayX + bayWidth / 2) * zoomLevel;
    const targetY = containerHeight / 2 - (totalBayHeight / 1.73) * zoomLevel;

    smoothTransitionTo(zoomLevel, { x: targetX, y: targetY });
    setFocusedBay({ shelfIndex: shelfIdx, bayIndex: bayIdx });
  };

  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouchX.current = e.touches[0].clientX;
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistance.current = distance;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && !lastTouchDistance.current) {
      // Single finger panning
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX.current;
      setPosition((prev) => ({ x: prev.x + deltaX, y: prev.y }));
      lastTouchX.current = touch.clientX;
    } else if (e.touches.length === 2 && lastTouchDistance.current) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Reduced sensitivity for smoother pinch zoom
      const delta = (distance - lastTouchDistance.current) * 0.005;
      setScale((prev) => Math.max(0.3, Math.min(4, prev + delta)));

      lastTouchDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
  };

  const handleWheel = (e) => {
    // Enable mouse wheel zoom instead of just panning
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Smaller delta for smoother, less aggressive zoom (matching edit mode feel)
      const delta = e.deltaY > 0 ? -0.02 : 0.02;
      setScale((prev) => Math.max(0.3, Math.min(4, prev + delta)));
    } else if (scale > initialScaleRef.current) {
      e.preventDefault();
      setPosition((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseup", handleMouseUp);
      container.addEventListener("mouseleave", handleMouseUp);
      container.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
      container.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("mouseleave", handleMouseUp);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("wheel", handleWheel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStart, scale]);

  useEffect(() => {
    if (shouldCenter) {
      centerContent();
      setShouldCenter(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, shouldCenter]);

  const onDragEnd = () => {};

  const smoothTransitionTo = (targetScale, targetPosition, duration = 300) => {
    const startTime = performance.now();
    const startScale = scale;
    const startX = position.x;
    const startY = position.y;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1); // Clamp to 1

      // Ease-in-out function for smooth animation
      const easeInOut = (t) => t * (2 - t);

      const eased = easeInOut(progress);

      const currentScale = startScale + (targetScale - startScale) * eased;
      const currentX = startX + (targetPosition.x - startX) * eased;
      const currentY = startY + (targetPosition.y - startY) * eased;

      setScale(currentScale);
      setPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="fixed inset-0 bg-opacity-90 flex flex-col p-5 w-screen">
      {(loading || bays.length === 0) && (
        <FullScreenPlanogramLoader
          bays={bays.length || 1}
          isOrangeTheme={isOrangeTheme}
        />
      )}

      <div className="h-[176px]"></div>

      <div
        ref={containerRef}
        className={`relative flex-1 w-full h-full overflow-hidden rounded-xl mt-2 cursor-${
          isDragging ? "grabbing" : "grab"
        }`}
      >
        {bays.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div
              ref={contentRef}
              className="h-full w-fit"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) translateZ(0)`,
                transformOrigin: "0 0",
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                willChange: isDragging ? "transform" : "auto",
              }}
            >
              <PlanogramGrid
                ItemWithTooltip={ItemWithTooltip}
                onBayClick={handleBayClick}
                focusedBay={focusedBay}
                isViewOnly={true}
                dimmedProductIds={dimmedProductIds}
                violationProductIds={violationProductIds}
                loading={loading}
                showProductNameTag={showProductNameTag}
                coloredProducts={coloredProducts}
              />
            </div>
          </DragDropContext>
        )}
      </div>

      <div className="flex justify-center gap-3 mt-5">
        <BottomToolbar
          onZoomIn={() => setScale((prev) => Math.min(prev + 0.1, 4))}
          onZoomOut={() => setScale((prev) => Math.max(prev - 0.1, 0.4))}
          onReset={handleReset}
          zoomValue={scale}
          showProductNameTag={showProductNameTag}
          setShowProductNameTag={setShowProductNameTag}
          onEdit={onClose}
          onFullscreen={() => {}}
          isFullscreen={true}
          isOrangeTheme={isOrangeTheme}
          planogramStatus={planogramStatus}
          onToggleChecks={onToggleChecks}
        />
      </div>
    </div>
  );
};

export default React.memo(FullscreenView);

import PropTypes from "prop-types";

FullscreenView.propTypes = {
  ItemWithTooltip: PropTypes.elementType.isRequired,
  onClose: PropTypes.func.isRequired,
  dimmedProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  violationProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  showProductNameTag: PropTypes.bool,
  coloredProducts: PropTypes.array,
  setShowProductNameTag: PropTypes.func.isRequired,
  isOrangeTheme: PropTypes.bool,
  planogramStatus: PropTypes.string,
  onToggleChecks: PropTypes.func,
};
