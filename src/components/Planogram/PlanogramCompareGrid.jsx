import React, { useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  selectBays,
  selectShelfLines,
} from "../../redux/reducers/planogramVisualizerSlice";
import ShelfLine from "./ShelfLine";
import ProductNameTag from "./ProductNameTag";

import PropTypes from "prop-types";

export default function PlanogramCompareGrid({
  ItemWithTooltip,
  showProductNameTag = true,
  coloredProducts = [],
  dimmedProductIds = [],
  onContainerReady,
}) {
  const containerRef = useRef(null);
  const bays = useSelector(selectBays);
  const shelfLines = useSelector(selectShelfLines);

  React.useEffect(() => {
    if (onContainerReady && containerRef.current) {
      onContainerReady(containerRef.current);
    }
  }, [onContainerReady]);

  const contentWidth = useMemo(() => {
    if (!bays || bays.length === 0) return 0;
    const bayWidth = bays?.[0]?.width || 0;
    return bayWidth * bays.length + 40;
  }, [bays]);

  const isDimmed = (item) => dimmedProductIds.includes(item.id);

  const bayKeys = useMemo(() => {
    const keys = [];
    const seenKeys = new Set();
    (bays || []).forEach((bay) => {
      let key = bay?.id ?? bay?.bayId ?? bay?.bayUuid;
      if (!key) {
        // Create a stable key from bay properties
        const signature = `${bay?.width || 0}-${bay?.height || 0}-${(bay?.subShelves || []).length}`;
        key = `bay-${signature}`;
        // Ensure uniqueness by appending a counter if needed
        let uniqueKey = key;
        let counter = 0;
        while (seenKeys.has(uniqueKey)) {
          uniqueKey = `${key}-${counter}`;
          counter++;
        }
        key = uniqueKey;
      }
      seenKeys.add(key);
      keys.push(key);
    });
    return keys;
  }, [bays]);

  const getSubShelfKey = (bayKey, subShelf) => {
    if (subShelf?.id) {
      return `${bayKey}-subshelf-${subShelf.id}`;
    }
    // Create stable key from sub-shelf properties
    const signature = `${subShelf?.width || 0}-${subShelf?.height || 0}`;
    return `${bayKey}-subshelf-${signature}`;
  };

  if (!bays?.length || !shelfLines?.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#666", fontSize: 14 }}>Building bays...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        position: "relative",
      }}
    >
      <div
        style={{
          width: contentWidth,
          padding: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "end" }}>
          {bays.map((shelf, shelfIdx) => {
            const bayKey = bayKeys[shelfIdx];
            return (
            <div
              key={bayKey}
              style={{
                display: "flex",
                flexDirection: "column-reverse",
                gap: 4,
                padding: "0 4px",
                position: "relative",
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

              {(() => {
                const subShelfKeyMap = new Map();
                return shelf.subShelves.map((subShelf, subShelfIdx) => {
                  let subShelfKey = getSubShelfKey(bayKey, subShelf);
                  // Ensure uniqueness within this bay
                  const count = subShelfKeyMap.get(subShelfKey) || 0;
                  subShelfKeyMap.set(subShelfKey, count + 1);
                  if (count > 0) {
                    subShelfKey = `${subShelfKey}-${count}`;
                  }
                  return (
                  <div
                    key={subShelfKey}
                    style={{
                      position: "relative",
                      width: subShelf.width,
                      height: subShelf.height,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div className="relative">
                      {showProductNameTag && (
                        <ProductNameTag
                          shelfLines={shelfLines}
                          shelfIdx={shelfIdx}
                          subShelfIdx={subShelfIdx}
                          isDimmed={isDimmed}
                          displayZoom={1}
                        />
                      )}
                      <ShelfLine
                        shelf={subShelf}
                        items={shelfLines[shelfIdx]?.[subShelfIdx] || []}
                        shelfIdx={`${shelfIdx}-${subShelfIdx}`}
                        ItemWithTooltip={ItemWithTooltip}
                        SHELF_GAP={32}
                        focusedBay={null}
                        isViewOnly={true}
                        dimmedProductIds={dimmedProductIds}
                        coloredProducts={coloredProducts}
                        productInventorySelectectProduct={null}
                      />
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

PlanogramCompareGrid.propTypes = {
  ItemWithTooltip: PropTypes.elementType.isRequired,
  showProductNameTag: PropTypes.bool,
  coloredProducts: PropTypes.array,
  dimmedProductIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onContainerReady: PropTypes.func,
};
