import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaChartLine } from "react-icons/fa";

function CardView({ searchTerm }) {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5002/api/v1/planogram/get_all_planograms")
      .then((res) => res.json())
      .then((apiData) => {
        const transformed = apiData.records.map((item) => {
          const stableId =
            item.id ||
            `${item.projectName || "planogram"}-${
              item.lastModifiedDate || "pending"
            }`;

          return {
            id: stableId,
            projectName: item.projectName || `Planogram ${stableId.slice(0, 4)}`,
            lastOptimisation: item.lastModifiedDate,
            totalOptimisations: Math.floor(Math.random() * 100),
            salesImprovement: `${(Math.random() * 5 + 5).toFixed(1)}%`,
          };
        });
        setAllData(transformed);
        setFilteredData(transformed);
      })
      .catch((err) => console.error("Error fetching planograms:", err));
  }, []);

  useEffect(() => {
    const filtered = allData.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchTerm, allData]);

  return (
    <div className="p-6 bg-[#f9fbfc] h-screen w-full overflow-y-auto py-10">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ">
        {filteredData.map((item) => (
          <div
            key={item.id || `${item.projectName}-${item.lastOptimisation}`}
            className="rounded-3xl bg-white/80 border border-gray-200 backdrop-blur-md shadow-[rgba(13,_38,_76,_0.10)_0px_9px_20px] p-6 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[rgba(13,_38,_76,_0.15)_0px_16px_24px] hover:border-[#00B097]"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-wide">
              {item.projectName}
            </h3>
            <div className="flex justify-between text-sm text-gray-700 mb-3">
              <div>
                <p className="font-semibold">Last Optimisation</p>
                <p>{item.lastOptimisation?.slice(0, 19).replace("T", " ")}</p>
              </div>
              <div>
                <p className="font-semibold">Total Optimisations</p>
                <p>{item.totalOptimisations}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-[#00B097] font-medium">
              <FaChartLine className="text-base" />
              {item.salesImprovement} Sales (As per last optimisation)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardView;

CardView.propTypes = {
  searchTerm: PropTypes.string.isRequired,
};
