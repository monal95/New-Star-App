import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const DressTypePieChart = ({
  data = [],
  isLoading = false,
  selectedTailor = "all",
}) => {
  const COLORS = [
    "#1e40af",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#bfdbfe",
    "#dbeafe",
  ];

  // Filter data by selected tailor and aggregate by dress type
  let chartData = [];

  if (data.length > 0) {
    const filtered =
      selectedTailor === "all"
        ? data
        : data.filter(
            (item) =>
              item.tailor &&
              item.tailor.toLowerCase() === selectedTailor.toLowerCase(),
          );

    // Group by name (dress type) and sum values
    const dressTypeMap = {};
    filtered.forEach((item) => {
      const key = item.name || "Unknown";
      if (dressTypeMap[key]) {
        dressTypeMap[key].value += item.value;
      } else {
        dressTypeMap[key] = {
          name: item.name,
          value: item.value,
        };
      }
    });

    chartData = Object.values(dressTypeMap).sort((a, b) => b.value - a.value);
  }

  // Fallback data if empty
  if (chartData.length === 0) {
    chartData = [
      { name: "Shirt", value: 35 },
      { name: "Pants", value: 25 },
      { name: "Blazer", value: 15 },
      { name: "Uniform", value: 12 },
      { name: "Saree Blouse", value: 8 },
      { name: "Others", value: 5 },
    ];
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="h-80 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const tailorDisplay =
    selectedTailor === "all" ? "All Tailors" : selectedTailor;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Orders by Dress Type
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          {tailorDisplay !== "All Tailors" && `Filtered for: ${tailorDisplay}`}
        </p>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => {
                const percent = ((value / totalValue) * 100).toFixed(0);
                return `${name} ${percent}%`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
              formatter={(value) => {
                const percent = ((value / totalValue) * 100).toFixed(1);
                return `${value} orders (${percent}%)`;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">
            No data available for selected tailor
          </p>
        </div>
      )}
    </div>
  );
};

export default DressTypePieChart;
