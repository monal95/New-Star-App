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
  // Default data with both completed and assigned
  const defaultData = [
    { tailor: "Sanjay", completed: 12, assigned: 15 },
    { tailor: "Anwar", completed: 15, assigned: 17 },
    { tailor: "Dhana", completed: 10, assigned: 14 },
    { tailor: "Ramesh", completed: 14, assigned: 15 },
    { tailor: "Vikram", completed: 11, assigned: 14 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="h-80 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Labour Productivity
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          Number of tasks completed vs assigned
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="tailor" stroke="#64748b" />
          <YAxis
            stroke="#64748b"
            label={{ value: "Tasks", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
            formatter={(value) => `${value} tasks`}
          />
          <Legend />
          <Bar
            dataKey="completed"
            fill="#10b981"
            name="Completed"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          />
          {chartData.some((item) => item.assigned !== undefined) && (
            <Bar
              dataKey="assigned"
              fill="#3b82f6"
              name="Assigned"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationDuration={800}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TailorBarChart;
