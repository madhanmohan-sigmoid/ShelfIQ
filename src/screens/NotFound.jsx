import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import bgImage from "../assets/Bg.png";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          zIndex: -1,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: -1,
        },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: 6,
          borderRadius: 4,
          maxWidth: 500,
          width: "90%",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* 404 Number */}
        <Typography
          variant="h1"
          sx={{
            fontSize: "120px",
            fontWeight: 700,
            color: "#00B097",
            mb: 2,
            lineHeight: 1,
          }}
        >
          404
        </Typography>

        {/* Error Message */}
        <Typography variant="h5" fontWeight={600} mb={1}>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" mb={4}>
          Oops! The page you&apos;re looking for doesn&apos;t exist.
          <br />
          It might have been moved or deleted.
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            onClick={handleGoHome}
            fullWidth
            sx={{
              textTransform: "none",
              backgroundColor: "#00B097",
              color: "white",
              borderRadius: "500px",
              py: 1.5,
              fontWeight: "600",
              "&:hover": { backgroundColor: "#00947F" },
            }}
          >
            Go to Dashboard
          </Button>
          
          <Button
            onClick={handleGoBack}
            fullWidth
            sx={{
              textTransform: "none",
              backgroundColor: "transparent",
              color: "#00B097",
              border: "2px solid #00B097",
              borderRadius: "500px",
              py: 1.5,
              fontWeight: "600",
              "&:hover": {
                backgroundColor: "rgba(0, 176, 151, 0.05)",
                border: "2px solid #00947F",
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
