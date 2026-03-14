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

const TailorBarChart = ({ data = [], isLoading = false }) => {
  const chartData =
    data.length > 0
      ? data
      : [
          { tailor: "Sanjay", completed: 12 },
          { tailor: "Anwar", completed: 15 },
          { tailor: "Dhana", completed: 10 },
          { tailor: "Ramesh", completed: 14 },
          { tailor: "Vikram", completed: 11 },
        ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="h-80 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        Tailor Productivity
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="tailor" stroke="#64748b" />
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
          <Bar
            dataKey="completed"
            fill="#1e40af"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TailorBarChart;
