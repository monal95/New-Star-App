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
    "#1e40af", // Shirt - Blue
    "#059669", // Pant - Green
    "#d97706", // Shirt & Pant - Amber
    "#7c3aed", // Others
  ];

  // Format data for the pie chart
  let chartData = [];

  if (data.length > 0) {
    chartData = data
      .filter((item) => item.name && item.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  // Fallback data if empty
  if (chartData.length === 0) {
    chartData = [
      { name: "Shirt", value: 35 },
      { name: "Pant", value: 25 },
      { name: "Shirt & Pant", value: 15 },
      { name: "Other", value: 5 },
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Orders by Dress Type
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          Distribution of shirt, pant, and combination orders
        </p>
      </div>

      {chartData.length > 0 ? (
        <>
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

          {/* Summary stats below chart */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm text-slate-600">{item.name}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-80 flex items-center justify-center bg-slate-50 rounded-lg">
          <p className="text-slate-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default DressTypePieChart;
