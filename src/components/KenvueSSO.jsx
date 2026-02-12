import React from "react";
import { Box, Typography } from "@mui/material";
import KenvueLogo from "../assets/Logo and Title.svg";

const KenvueSSO = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        px: 4,
        height: "100%",
      }}
    >
      {/* Kenvue Logo and Branding */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            backgroundColor: "#00B097",
            width: 80,
            height: 80,
            borderRadius: 2,
            mr: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img 
            src={KenvueLogo} 
            alt="Kenvue Logo" 
            style={{ 
              width: "60px", 
              height: "auto",
              filter: "brightness(0) invert(1)" // Make logo white
            }} 
          />
        </Box>
        <Typography 
          variant="h3" 
          fontWeight="bold"
          sx={{ 
            textTransform: "lowercase",
            letterSpacing: "0.5px"
          }}
        >
          kenvue
        </Typography>
      </Box>
      
      {/* ACE Description */}
      <Typography
        variant="h6"
        sx={{ 
          fontWeight: "500", 
          letterSpacing: "0.5px",
          textAlign: "center",
          mb: 1
        }}
      >
        Assortment Category Excellence
      </Typography>
      
      {/* ACE Title */}
      <Typography
        variant="h4"
        sx={{ 
          fontWeight: "700", 
          mt: 1,
          color: "#00B097",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}
      >
        ACE
      </Typography>
      
      {/* Additional branding text */}
      <Typography
        variant="body1"
        sx={{ 
          mt: 3,
          textAlign: "center",
          opacity: 0.9,
          maxWidth: "300px",
          lineHeight: 1.6
        }}
      >
        Empowering retail excellence through intelligent shelf optimization and category management
      </Typography>
    </Box>
  );
};

export default KenvueSSO; 