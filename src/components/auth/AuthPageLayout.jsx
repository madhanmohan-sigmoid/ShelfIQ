import React from "react";
import PropTypes from "prop-types";
import { Box, Paper } from "@mui/material";
import bgImage from "../../assets/Bg.png";
import LeftLogo from "../../assets/KenvueLeftSide.png";

export default function AuthPageLayout({ children, showLogo = true }) {
  return (
    <div
      className="fullscreen-bg"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        width: "100vw",
        display: "flex",
      }}
    >
      {/* Left Side - Logo */}
      {showLogo && (
        <Box
          data-testid="auth-logo-section"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50%",
            height: "100%",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              padding: 4,
              borderRadius: 4,
              width: 400,
              height: 300,
              textAlign: "center",
              backgroundColor: "transparent",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "none",
            }}
          >
            <Box
              component="img"
              src={LeftLogo}
              alt="Kenvue Logo"
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Vertical Divider */}
      {showLogo && (
        <Box
          data-testid="auth-divider"
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "2px",
            height: "60%",
            backgroundColor: "rgba(128, 128, 128, 0.6)",
            zIndex: 3,
          }}
        />
      )}

      {/* Right Side - Content */}
      <Box
        data-testid="auth-content"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: showLogo ? "50%" : "100%",
          height: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </Box>
    </div>
  );
}

AuthPageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showLogo: PropTypes.bool,
};

