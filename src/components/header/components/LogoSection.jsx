import React from "react";
import { Link, useLocation } from "react-router-dom";
import KenvueLogo from "../../../assets/Ace_Logo.png";

function LogoSection() {
  const location = useLocation();

  return (
    <div className="flex gap-x-4 items-center justify-center">
      {/* Logo */}
      <img
        src={KenvueLogo}
        alt="ACE Logo"
        className="h-8 transition-all duration-200 ease-in-out"
      />

      {/* Show text only on /region page */}
      {location.pathname === "/region" && (
        <span className="text-lg font-semibold text-black">
          Assortment Category Excellence
        </span>
      )}
    </div>
  );
}

export default LogoSection;
