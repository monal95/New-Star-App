import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const KPICard = ({
  icon: Icon,
  title,
  value,
  growth,
  trend = "up",
  isLoading = false,
}) => {
  const isPositive = growth >= 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-12 w-12 bg-slate-200 rounded-lg mb-4"></div>
          <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
          <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow duration-300">
      {/* Header with Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon size={24} className="text-blue-900" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-slate-600 text-sm font-medium mb-2">{title}</h3>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
      </div>

      {/* Growth Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="text-sm font-medium">
            {isPositive ? "+" : ""}
            {growth}%
          </span>
        </div>
        <span className="text-slate-500 text-sm">vs last period</span>
      </div>
    </div>
  );
};

export default KPICard;
