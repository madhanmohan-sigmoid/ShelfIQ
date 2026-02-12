import React from "react";
import PropTypes from "prop-types";
import { Box, Drawer, Typography, Divider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ACCENT_COLOR = "#FF782C";
const ACCENT_MUTED = "#FFEFE5";
const TIMELINE_LINE = "#E5E7EB";

const typeLabel = (type = "") =>
  type
    .toString()
    .replaceAll("_", " ")
    .toLowerCase()
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());

const formatTime = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const formatDate = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

const formatDateTime = (timestamp) => {
  const dateLabel = formatDate(timestamp);
  const timeLabel = formatTime(timestamp);
  if (dateLabel && timeLabel) {
    return `${dateLabel} | ${timeLabel}`;
  }
  return dateLabel || timeLabel;
};

const renderEmptyState = () => (
  <Typography
    variant="body2"
    sx={{ color: "#9ca3af", mt: 2, textAlign: "center" }}
  >
    No activities yet. Start editing the planogram to see them here.
  </Typography>
);

const renderActivity = (activity, isLast) => {
  const dateTimeLabel = formatDateTime(activity.timestamp);
  return (
    <Box
      key={activity.id}
      sx={{
        display: "flex",
        gap: 2,
        mb: isLast ? 0 : 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 36,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `2px solid ${ACCENT_COLOR}`,
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 10px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: ACCENT_COLOR,
            }}
          />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              backgroundColor: TIMELINE_LINE,
              mt: 0.5,
            }}
          />
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          <Box
            component="span"
            sx={{
              px: 1.25,
              py: 0.25,
              borderRadius: 10,
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "capitalize",
              backgroundColor: ACCENT_MUTED,
              color: ACCENT_COLOR,
            }}
          >
            {typeLabel(activity.type) || "Activity"}
          </Box>
        </Box>
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 0.5 }}
        >
          <Typography
            sx={{
              fontSize: "0.70rem",
              fontWeight: 500,
              color: "#0f172a",
            }}
          >
            {activity.message}
          </Typography>
          {dateTimeLabel && (
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "#6b7280",
                textAlign: "right",
                alignSelf: "flex-end",
              }}
            >
              {dateTimeLabel}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const PlanogramActivityDrawer = ({
  open,
  onClose,
  activities,
}) => (
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
          Activity Log
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
        {!activities || activities.length === 0 ? (
          renderEmptyState()
        ) : (
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {[...activities]
              .slice()
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
              .map((activity, index, array) =>
                renderActivity(activity, index === array.length - 1)
              )}
          </Box>
        )}
      </Box>
    </Box>
  </Drawer>
);

PlanogramActivityDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string,
      timestamp: PropTypes.number,
      message: PropTypes.string,
    })
  ),
};

export default PlanogramActivityDrawer;
