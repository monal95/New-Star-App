import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CustomerOrdersChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 h-[350px] flex items-center justify-center">
        <div className="text-slate-500">Loading customer data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 h-[350px] flex items-center justify-center">
        <div className="text-slate-500">No customer data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Top Customers by Orders
        </h3>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              horizontal={false}
            />
            <XAxis type="number" />
            <YAxis
              dataKey="customerName"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              cursor={{ fill: "#f8fafc" }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            <Bar
              dataKey="totalOrders"
              name="Total Orders"
              fill="#0ea5e9"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerOrdersChart;
