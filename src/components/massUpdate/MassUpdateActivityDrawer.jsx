import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Drawer, Typography, Divider, IconButton, Tabs, Tab } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

const SUCCESS_COLOR = "#A3C63A";
const SUCCESS_LIGHT = "#EEF7F0";
const FAILED_COLOR = "#E11D48";
const FAILED_LIGHT = "#FBECEC";
const TAB_TEXT = "#111827";

const formatDateTime = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function MassUpdateActivityDrawer({
  open,
  onClose,
  successLogs,
  failedLogs,
}) {
  const [activeTab, setActiveTab] = useState(0);

  const successItems = useMemo(() => successLogs || [], [successLogs]);
  const failedItems = useMemo(() => failedLogs || [], [failedLogs]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 10000 }}>
      <Box
        sx={{
          width: 360,
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            Activity Logs
          </Typography>
          <IconButton
            aria-label="Close activity drawer"
            onClick={onClose}
            size="small"
            sx={{
              color: "#6b7280",
              "&:hover": { color: "#111827", backgroundColor: "transparent" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />

        <Tabs
          value={activeTab}
          onChange={(_, nextValue) => setActiveTab(nextValue)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            mt: 1,
            "& .MuiTabs-indicator": {
              backgroundColor: activeTab === 0 ? SUCCESS_COLOR : FAILED_COLOR,
              height: 3,
            },
          }}
        >
          <Tab
            label="Success"
            icon={<CheckCircleOutlineIcon />}
            iconPosition="start"
            sx={{
              fontWeight: 600,
              color: activeTab === 0 ? SUCCESS_COLOR : TAB_TEXT,
              textTransform: "none",
            }}
          />
          <Tab
            label="Failed"
            icon={<CancelOutlinedIcon />}
            iconPosition="start"
            sx={{
              fontWeight: 600,
              color: activeTab === 1 ? FAILED_COLOR : TAB_TEXT,
              textTransform: "none",
            }}
          />
        </Tabs>

        <Box
          sx={{
            mt: 1.5,
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#f9fafb",
            borderRadius: 2,
            p: 1.5,
          }}
        >
          {activeTab === 0 ? (
            <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {successItems.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: index === successItems.length - 1 ? 0 : 2.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 28,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${SUCCESS_COLOR}`,
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: SUCCESS_COLOR,
                        }}
                      />
                    </Box>
                    {index !== successItems.length - 1 && (
                      <Box
                        sx={{
                          width: 2,
                          flex: 1,
                          backgroundColor: SUCCESS_COLOR,
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        px: 1.5,
                        py: 0.3,
                        borderRadius: 10,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: SUCCESS_LIGHT,
                        color: SUCCESS_COLOR,
                        mb: 0.75,
                      }}
                    >
                      Mass update
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Update completed successfully for {item.count} planograms.
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textAlign: "right",
                      }}
                    >
                      {formatDateTime(item.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {failedItems.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: index === failedItems.length - 1 ? 0 : 2.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 28,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${FAILED_COLOR}`,
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: FAILED_COLOR,
                        }}
                      />
                    </Box>
                    {index !== failedItems.length - 1 && (
                      <Box
                        sx={{
                          width: 2,
                          flex: 1,
                          backgroundColor: FAILED_COLOR,
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        px: 1.5,
                        py: 0.3,
                        borderRadius: 10,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: FAILED_LIGHT,
                        color: FAILED_COLOR,
                        mb: 0.75,
                      }}
                    >
                      Mass Update
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Update failed for {item.count} planograms. Please try again.
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        textAlign: "right",
                        mb: 1,
                      }}
                    >
                      {formatDateTime(item.timestamp)}
                    </Typography>

                    <Box
                      sx={{
                        border: "1px solid #E5E7EB",
                        borderRadius: 1,
                        overflow: "hidden",
                        backgroundColor: "#fff",
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: "#F3F4F6",
                          px: 2,
                          py: 0.75,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Planogram ID
                      </Box>
                      {item.planogramIds.map((planogramId) => (
                        <Box
                          key={planogramId}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2,
                            py: 0.75,
                            fontSize: "0.75rem",
                            borderTop: "1px solid #E5E7EB",
                          }}
                        >
                          <span>{planogramId}</span>
                          <span style={{ color: FAILED_COLOR, fontWeight: 600 }}>
                            View
                          </span>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

MassUpdateActivityDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  successLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      count: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
    })
  ).isRequired,
  failedLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      count: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
      planogramIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
};

export default MassUpdateActivityDrawer;
