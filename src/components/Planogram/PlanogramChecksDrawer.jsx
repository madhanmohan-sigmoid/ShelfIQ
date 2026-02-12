import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Drawer,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const ACCENT_COLOR = "#FF782C";
const ACCENT_MUTED = "#FFEFE5";
const TIMELINE_LINE = "#E5E7EB";
const VIOLATION_ICON_COLOR = "#d97706";
const VIOLATION_BORDER_COLOR = "#9ca3af";

const generateViolationKey = (check) => {
  if (check?.id) {
    return `violation-${check.id}`;
  }
  const parts = [
    check?.type || "",
    check?.level_name || "",
    check?.level_value || "",
    check?.extras?.bay || "",
    check?.extras?.shelf || "",
    check?.extras?.product_id_list || "",
  ];
  return `violation-${parts.join("-")}`;
};

const renderEmptyState = () => (
  <Typography
    variant="body2"
    sx={{ color: "#9ca3af", mt: 2, textAlign: "center" }}
  >
    No checks yet. Run validations to see them here.
  </Typography>
);

const renderErrorState = (errorMessage) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
      mt: 2,
      p: 2,
      textAlign: "center",
    }}
  >
    <ErrorOutlineIcon sx={{ fontSize: 40, color: "#dc2626" }} />
    <Typography
      variant="body2"
      sx={{ color: "#374151", fontWeight: 500 }}
    >
      Could not load violation checks
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "#6b7280", fontSize: "0.8rem" }}
    >
      {errorMessage}
    </Typography>
  </Box>
);

const renderCheck = (check, isLast) => {
  return (
    <Box
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
            border: `1px solid ${VIOLATION_BORDER_COLOR}`,
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 10px rgba(15, 23, 42, 0.12)",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 16, color: VIOLATION_ICON_COLOR }} />
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
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "capitalize",
              color: "#4b5563",
            }}
          >
            {check.type || "Check"}
          </Typography>
          {check.level_name && (
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "capitalize",
                color: ACCENT_COLOR,
              }}
            >
              {check.level_name}
            </Typography>
          )}
          {check.level_value && (
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "capitalize",
                color: "#374151",
              }}
            >
              {check.level_value}
            </Typography>
          )}
          {(check?.extras?.bay || check?.extras?.shelf) && (
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 500,
                color: "#6b7280",
              }}
            >
              Bay {check?.extras?.bay ?? "-"} · Shelf{" "}
              {check?.extras?.shelf ?? "-"}
            </Typography>
          )}
        </Box>
        {/* Message intentionally hidden until API provides it */}
      </Box>
    </Box>
  );
};

const PlanogramChecksDrawer = ({
  open,
  onClose,
  checks = [],
  violationCount = 0,
  isLoading = false,
  errorMessage = null,
}) => {
  const renderBody = () => {
    if (isLoading) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: 200,
          }}
        >
          <CircularProgress size={28} sx={{ color: ACCENT_COLOR }} />
        </Box>
      );
    }

    if (errorMessage) {
      return renderErrorState(errorMessage);
    }

    if (!checks || checks.length === 0) {
      return renderEmptyState();
    }

    return (
      <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {[...checks]
          .slice()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .map((check, index, array) => (
            <React.Fragment key={generateViolationKey(check)}>
              {renderCheck(check, index === array.length - 1)}
            </React.Fragment>
          ))}
      </Box>
    );
  };

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Violation Checks
            </Typography>
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 8,
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: "#f3f4f6",
                color: "#374151",
              }}
            >
              {violationCount}
            </Box>
          </Box>
          <IconButton
            aria-label="Close checks drawer"
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
          {renderBody()}
        </Box>
      </Box>
    </Drawer>
  );
};

PlanogramChecksDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  checks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      level_name: PropTypes.string,
      level_value: PropTypes.string,
    })
  ),
  violationCount: PropTypes.number,
  isLoading: PropTypes.bool,
  errorMessage: PropTypes.string,
};

export default PlanogramChecksDrawer;
