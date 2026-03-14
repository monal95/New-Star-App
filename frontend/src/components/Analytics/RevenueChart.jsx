import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RevenueChart = ({ data = [], isLoading = false }) => {
  if (isLoading) {
    return <div className="h-80 bg-slate-100 rounded-lg animate-pulse"></div>;
  }

  const chartData =
    data.length > 0
      ? data
      : [
          { month: "Jan", revenue: 0 },
          { month: "Feb", revenue: 0 },
          { month: "Mar", revenue: 0 },
          { month: "Apr", revenue: 0 },
          { month: "May", revenue: 0 },
          { month: "Jun", revenue: 0 },
          { month: "Jul", revenue: 0 },
          { month: "Aug", revenue: 0 },
          { month: "Sep", revenue: 0 },
          { month: "Oct", revenue: 0 },
          { month: "Nov", revenue: 0 },
          { month: "Dec", revenue: 0 },
        ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
            color: "#f1f5f9",
          }}
          formatter={(value) => `₹${value.toLocaleString()}`}
        />
        <Legend />
        <Bar
          dataKey="revenue"
          fill="#1e40af"
          radius={[8, 8, 0, 0]}
          isAnimationActive={true}
          animationDuration={800}
          name="Revenue (₹)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
