import React from "react";
import PropTypes from "prop-types";
import { Paper, Typography, Button, CircularProgress } from "@mui/material";

export default function AuthCard({
  title,
  subtitle,
  description,
  buttonText,
  onButtonClick,
  loading = false,
  error = null,
  buttonColor = "#00B097",
  buttonHoverColor = "#00947F",
  disabled = false,
}) {
  return (
    <Paper
      elevation={8}
      sx={{
        padding: 5,
        borderRadius: 4,
        width: 400,
        textAlign: "center",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography variant="h5" fontWeight={600} mb={1}>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="body1" mb={2}>
          {subtitle}
        </Typography>
      )}
      
      <Typography variant="body2" color="text.secondary" mb={4}>
        {description}
      </Typography>

      {error && (
        <Typography variant="body2" color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Button
        onClick={onButtonClick}
        fullWidth
        disabled={disabled || loading}
        aria-busy={loading ? "true" : "false"}
        sx={{
          textTransform: "none",
          backgroundColor: buttonColor,
          color: "white",
          borderRadius: "500px",
          py: 1.5,
          fontWeight: "600",
          "&:hover": { backgroundColor: buttonHoverColor },
          "&:disabled": { backgroundColor: "#cccccc" },
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : buttonText}
      </Button>
    </Paper>
  );
}

AuthCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  buttonColor: PropTypes.string,
  buttonHoverColor: PropTypes.string,
  disabled: PropTypes.bool,
};

