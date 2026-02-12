import React, { useEffect } from "react";
import ProductInventory from "./ProductInventory";
import { Box, Button, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLeftSidebarCollapsed,
  selectProductInventorySelectedProduct,
  setLeftSidebarCollapsed,
} from "../../redux/reducers/planogramVisualizerSlice";

const LeftSideBar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectLeftSidebarCollapsed);
  const productInventorySelectectProduct = useSelector(
    selectProductInventorySelectedProduct
  );

  useEffect(() => {
    if (productInventorySelectectProduct?.id) {
      // Try to find the product element by tpnb (used as id in ShelfLine)
      const el = document.getElementById(
        productInventorySelectectProduct.id?.toString()
      );
      el?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);
  // console.log(unplacedItems)
  return (
    <Box
      elevation={0}
      sx={{
        width: collapsed ? "32px" : "280px",
        borderRight: collapsed ? "0px" : "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible",
        background: collapsed ? "transparent" : "white",
        height: "100vh",
        minHeight: "100vh",
        zIndex: 1201,
      }}
    >
      <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} arrow>
        <Button
          onClick={() => dispatch(setLeftSidebarCollapsed(!collapsed))}
          size="small"
          sx={{
            position: "absolute",
            top: 0,
            right: collapsed ? 0 : -30,
            minWidth: "unset",
            width: 32,
            height: 46,
            borderRadius: collapsed ? "0px 4px 4px 0px" : "4px 0 0 4px",
            backgroundColor: "#000000",
            color: "white",
            zIndex: 1202,
            boxShadow: 2,
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </Tooltip>
      {/* Header and Inventory List */}
      {!collapsed && (
        <Box
          sx={{
            padding: "16px 2px 16px 16px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <ProductInventory />
        </Box>
      )}
    </Box>
  );
};

export default React.memo(LeftSideBar);
