import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography, Button, Tooltip } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ProductDetails from "./ProductDetails";
import ProductKPIS from "./ProductKPIS";
import { getFallbackImage } from "../../utils/productUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsFullScreen,
  selectPlanogramId,
  selectRightSidebarCollapsed,
  selectSelectedProduct,
  setRightSidebarCollapsed,
} from "../../redux/reducers/planogramVisualizerSlice";

const RightSideBar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectRightSidebarCollapsed);
  const [tab, setTab] = useState(0);
  const [imageError, setImageError] = useState(false);
  const selectedProduct = useSelector(selectSelectedProduct);
  const isViewOnly = useSelector(selectIsFullScreen);
  const planogramId = useSelector(selectPlanogramId);

  const collapsedWidth = 0;
  const expandedWidth = 250;

  useEffect(() => {
    if (selectedProduct) {
      dispatch(setRightSidebarCollapsed(false));
      setImageError(false); // reset image error on new selection
    }
    if (selectedProduct === null) {
      dispatch(setRightSidebarCollapsed(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  useEffect(() => {
    if (collapsed) {
      setTab(0);
    }
  }, [collapsed]);

  return (
    <Box
      sx={{
        position: isViewOnly ? "fixed" : "relative",
        right: 0,
        // top: '126px',
        height: "calc(100vh - 126px)",
        maxHeight: "calc(100vh - 126px)",
        width: collapsed ? collapsedWidth : expandedWidth,
        backgroundColor: "white",
        borderLeft: "1px solid #e0e0e0",
        boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
        zIndex: 1201,
      }}
    >
      {/* Toggle Button */}
      <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} arrow>
        <Button
          size="small"
          onClick={() => dispatch(setRightSidebarCollapsed(!collapsed))}
          sx={{
            position: "absolute",
            left: -30,
            minWidth: "unset",
            width: 32,
            height: 46,
            borderRadius: "4px 0 0 4px",
            backgroundColor: "#000000",
            boxShadow: 2,
            zIndex: 1202,
            color: "white",
          }}
        >
          {collapsed ? (
            <ChevronLeftIcon fontSize="small" />
          ) : (
            <ChevronRightIcon fontSize="small" />
          )}
        </Button>
      </Tooltip>

      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {!collapsed && (
          <>
            {/* Tabs */}
            <Box
              sx={{
                width: "100%",
                borderBottom: "1px solid #f0f0f0",
                bgcolor: "#fff",
                flexShrink: 0,
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{ minHeight: 44 }}
              >
                <Tooltip title="Product details" arrow>
                  <Tab
                    label={
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: tab === 0 ? "#FF782C" : "#1d1d1d",
                          fontSize: 15,
                        }}
                      >
                        Product
                      </Typography>
                    }
                    sx={{ minHeight: 44 }}
                  />
                </Tooltip>
                <Tooltip title="Product KPIs" arrow>
                  <Tab
                    label={
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: tab === 1 ? "#FF782C" : "#1d1d1d",
                          fontSize: 15,
                        }}
                      >
                        KPIs
                      </Typography>
                    }
                    sx={{ minHeight: 44 }}
                  />
                </Tooltip>
              </Tabs>
            </Box>

            {/* Main Content */}
            {(() => {
              if (selectedProduct) {
                return (
                  <Box
                    sx={{
                      width: "100%",
                      overflowY: "auto",
                      padding: "16px",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: "100%",
                        height: "200px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px",
                        border: "1px solid #e0e0e0",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          !imageError && selectedProduct.image_url
                            ? selectedProduct.image_url
                            : getFallbackImage(selectedProduct)
                        }
                        alt={selectedProduct.name || "Product"}
                        onError={() => setImageError(true)}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Content */}
                    {tab === 0 && (
                      <ProductDetails selectedProduct={selectedProduct} />
                    )}
                    {tab === 1 && (
                      <ProductKPIS
                        selectedProductID={selectedProduct?.product_id}
                        planogramId={planogramId}
                        selectedProduct={selectedProduct}
                      />
                    )}
                  </Box>
                );
              }

              if (tab === 1) {
                return (
                  <Box
                    sx={{
                      textAlign: "center",
                      color: "#7f8c8d",
                      fontSize: 16,
                      mt: 8,
                    }}
                  >
                    KPIs will be shown here.
                  </Box>
                );
              }

              return (
                <Box
                  sx={{
                    textAlign: "center",
                    color: "#7f8c8d",
                    fontSize: 16,
                    mt: 8,
                  }}
                >
                  Select a product to view details
                </Box>
              );
            })()}
          </>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(RightSideBar);