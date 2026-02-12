import React from "react";
import PropTypes from "prop-types";

function DashboardLayout({ children }) {
  return (
    <div className="flex justify-center p-6 h-full w-full overflow-hidden">
      <div className="bg-white w-full max-w-[1800px] rounded-xl shadow-lg h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
