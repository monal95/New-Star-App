import React from "react";

const MetabaseEmbed = ({ title, source, height = 400, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div
          className={`h-${height} bg-slate-100 rounded-lg animate-pulse`}
        ></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="rounded-lg overflow-hidden border border-slate-200">
        <iframe
          src={source}
          frameBorder="0"
          width="100%"
          height={height}
          allowFullScreen
          title={title}
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
};

export default MetabaseEmbed;
