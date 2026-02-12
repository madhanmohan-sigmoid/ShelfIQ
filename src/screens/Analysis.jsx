import React from "react";

const Analysis = () => {
  return (
    <div className="w-full h-screen bg-white">
      <iframe
        title="ACE"
        className="w-full h-full border-0"
        src="https://app.powerbi.com/reportEmbed?reportId=815ba9f4-90c3-41c9-9151-4f23a281e787&autoAuth=true&ctid=7ba64ac2-8a2b-417e-9b8f-fcf8238f2a56"
        frameBorder="0"
        allowFullScreen="true"
      ></iframe>
    </div>
  );
};

export default Analysis;
