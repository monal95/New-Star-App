import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const OrdersTrendChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="h-80 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const chartData =
    data.length > 0
      ? data
      : [
          { date: "Mon", orders: 45 },
          { date: "Tue", orders: 52 },
          { date: "Wed", orders: 48 },
          { date: "Thu", orders: 61 },
          { date: "Fri", orders: 55 },
          { date: "Sat", orders: 67 },
          { date: "Sun", orders: 58 },
        ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Orders Trend
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#1e40af"
            strokeWidth={2}
            dot={{ fill: "#1e40af", r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrdersTrendChart;
