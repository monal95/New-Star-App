import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import KPICard from "../components/Analytics/KPICard";
import RevenueChart from "../components/Analytics/RevenueChart";
import DressTypePieChart from "../components/Analytics/DressTypePieChart";
import OrdersTrendChart from "../components/Analytics/OrdersTrendChart";
import TailorBarChart from "../components/Analytics/TailorBarChart";
import OrdersAnalyticsTable from "../components/Analytics/OrdersAnalyticsTable";

// Helper Functions
const filterOrdersByDateRange = (orders, dateRange) => {
  if (!Array.isArray(orders)) return [];
  const now = new Date();
  const startDate = new Date();

  switch (dateRange) {
    case "7days":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90days":
      startDate.setDate(now.getDate() - 90);
      break;
    case "ytd":
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    return orderDate >= startDate && orderDate <= now;
  });
};

const getPreviousDateRange = (dateRange) => {
  const now = new Date();
  const previousStart = new Date();
  const previousEnd = new Date();

  switch (dateRange) {
    case "7days":
      previousEnd.setDate(now.getDate() - 7);
      previousStart.setDate(now.getDate() - 14);
      break;
    case "30days":
      previousEnd.setDate(now.getDate() - 30);
      previousStart.setDate(now.getDate() - 60);
      break;
    case "90days":
      previousEnd.setDate(now.getDate() - 90);
      previousStart.setDate(now.getDate() - 180);
      break;
    case "ytd":
      previousEnd.setMonth(0);
      previousEnd.setDate(1);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousStart.setMonth(0);
      previousStart.setDate(1);
      break;
    default:
      previousEnd.setDate(now.getDate() - 30);
      previousStart.setDate(now.getDate() - 60);
  }

  return { start: previousStart, end: previousEnd };
};

const processOrdersTrend = (orders) => {
  const trendMap = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt || order.orderDate);
    const dateKey = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
  });

  return Object.entries(trendMap)
    .map(([date, count]) => ({
      date,
      orders: count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const processDressTypes = (orders) => {
  const dressTypeMap = {};

  orders.forEach((order) => {
    const dressType = order.dressType || "Unknown";
    dressTypeMap[dressType] = (dressTypeMap[dressType] || 0) + 1;
  });

  return Object.entries(dressTypeMap).map(([name, value]) => ({
    name,
    value,
  }));
};

const processTailorProductivity = (orders) => {
  const tailorMap = {};

  orders.forEach((order) => {
    const tailor = order.tailorName || order.assignedTailor || "Unassigned";
    tailorMap[tailor] = (tailorMap[tailor] || 0) + 1;
  });

  return Object.entries(tailorMap)
    .map(([name, completed]) => ({
      name: name.length > 15 ? name.substring(0, 12) + "..." : name,
      completed,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 8);
};

const processMonthlyRevenue = (orders) => {
  const monthlyMap = {};
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  orders.forEach((order) => {
    const date = new Date(order.createdAt || order.orderDate);
    if (!isNaN(date.getTime())) {
      const monthKey = months[date.getMonth()];
      const price = order.orderPrice || order.price || 0;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + price;
    }
  });

  return months.map((month) => ({
    month,
    revenue: monthlyMap[month] || 0,
  }));
};

// Normalize API response to table format
const normalizeOrderData = (order) => {
  return {
    _id: order._id,
    id: order.id || Math.random(),
    orderId:
      order.orderId ||
      order.order_id ||
      order._id?.toString()?.slice(-6) ||
      "N/A",
    customerName:
      order.customerName || order.customer_name || order.customer || "Unknown",
    dressType: order.dressType || order.dress_type || "Unknown",
    tailor:
      order.tailorName ||
      order.tailor_name ||
      order.tailor ||
      order.assignedTailor ||
      "Unassigned",
    price: order.orderPrice || order.price || 0,
    status: order.status || "Pending",
    deliveryDate:
      order.deliveryDate ||
      order.delivery_date ||
      order.dueDate ||
      new Date().toLocaleDateString(),
  };
};

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState("7days");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [dressTypeFilter, setDressTypeFilter] = useState("all");
  const [tailorFilter, setTailorFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // KPI Data
  const [kpiData, setKpiData] = useState({
    totalOrders: { value: 856, growth: 12 },
    revenue: { value: "₹45,230", growth: 18 },
    activeCustomers: { value: 342, growth: 8 },
    pendingOrders: { value: 45, growth: -5 },
  });

  // Chart data
  const [chartData, setChartData] = useState({
    ordersTrend: [],
    monthlyRevenue: [],
    dressTypes: [],
    tailorProductivity: [],
    recentOrders: [],
  });

  // Fetch Analytics Data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        // Fetch all orders from API
        const ordersResponse = await fetch("http://localhost:5000/api/orders");
        if (!ordersResponse.ok) throw new Error("Failed to fetch orders");
        const orders = await ordersResponse.json();

        // Filter orders based on date range
        let filteredOrders;
        if (dateRange === "custom" && customDateStart && customDateEnd) {
          const startDate = new Date(customDateStart);
          const endDate = new Date(customDateEnd);
          filteredOrders = orders.filter((order) => {
            const orderDate = new Date(order.createdAt || order.orderDate);
            return orderDate >= startDate && orderDate <= endDate;
          });
        } else {
          filteredOrders = filterOrdersByDateRange(orders, dateRange);
        }

        // Further filter by dress type, tailor, and status
        const finalFilteredOrders = filteredOrders.filter((order) => {
          const isDressTypeMatch =
            dressTypeFilter === "all" ||
            (order.dressType &&
              order.dressType.toLowerCase() === dressTypeFilter.toLowerCase());
          const isOrderStatusMatch =
            orderStatusFilter === "all" ||
            (order.status &&
              order.status.toLowerCase() === orderStatusFilter.toLowerCase());
          return isDressTypeMatch && isOrderStatusMatch;
        });

        // Calculate KPIs
        const totalOrders = filteredOrders.length;
        const revenue = filteredOrders.reduce(
          (sum, order) => sum + (order.orderPrice || order.price || 0),
          0,
        );
        const uniqueCustomers = new Set(
          filteredOrders.map((order) => order.customerName),
        ).size;
        const pendingOrders = filteredOrders.filter(
          (order) =>
            order.status === "Pending" || order.status === "In Progress",
        ).length;

        // Calculate growth (comparing with previous period)
        const previousPeriodOrders = filterOrdersByDateRange(
          orders,
          getPreviousDateRange(dateRange),
        );
        const previousRevenue = previousPeriodOrders.reduce(
          (sum, order) => sum + (order.orderPrice || order.price || 0),
          0,
        );
        const previousCustomers = new Set(
          previousPeriodOrders.map((order) => order.customerName),
        ).size;
        const previousPending = previousPeriodOrders.filter(
          (order) =>
            order.status === "Pending" || order.status === "In Progress",
        ).length;

        const revenueGrowth =
          previousRevenue > 0
            ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
            : 0;
        const customerGrowth =
          previousCustomers > 0
            ? Math.round(
                ((uniqueCustomers - previousCustomers) / previousCustomers) *
                  100,
              )
            : 0;
        const ordersGrowth =
          previousPeriodOrders.length > 0
            ? Math.round(
                ((totalOrders - previousPeriodOrders.length) /
                  previousPeriodOrders.length) *
                  100,
              )
            : 0;
        const pendingGrowth =
          previousPending > 0
            ? Math.round(
                ((pendingOrders - previousPending) / previousPending) * 100,
              )
            : 0;

        setKpiData({
          totalOrders: { value: totalOrders, growth: ordersGrowth },
          revenue: {
            value: `₹${revenue.toLocaleString()}`,
            growth: revenueGrowth,
          },
          activeCustomers: { value: uniqueCustomers, growth: customerGrowth },
          pendingOrders: { value: pendingOrders, growth: pendingGrowth },
        });

        // Process chart data
        const ordersTrendData = processOrdersTrend(finalFilteredOrders);
        const monthlyRevenueData = processMonthlyRevenue(filteredOrders);
        const dressTypesData = processDressTypes(filteredOrders);
        const tailorProductivityData =
          processTailorProductivity(filteredOrders);

        // Normalize orders data for the table
        const normalizedRecentOrders = finalFilteredOrders
          .slice(0, 50)
          .map(normalizeOrderData);

        setChartData({
          ordersTrend: ordersTrendData,
          monthlyRevenue: monthlyRevenueData,
          dressTypes: dressTypesData,
          tailorProductivity: tailorProductivityData,
          recentOrders: normalizedRecentOrders, // Normalized data for table
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [
    dateRange,
    customDateStart,
    customDateEnd,
    dressTypeFilter,
    tailorFilter,
    orderStatusFilter,
  ]);

  const handleExportReport = () => {
    // Generate CSV or PDF report
    const csvContent = "data:text/csv;charset=utf-8,Date,Orders,Revenue\n";
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `analytics-report-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.click();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Track your tailoring business performance
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-600" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={ShoppingBag}
          title="Total Orders"
          value={kpiData.totalOrders.value}
          growth={kpiData.totalOrders.growth}
          isLoading={isLoading}
        />
        <KPICard
          icon={DollarSign}
          title="Revenue Generated"
          value={kpiData.revenue.value}
          growth={kpiData.revenue.growth}
          isLoading={isLoading}
        />
        <KPICard
          icon={Users}
          title="Active Customers"
          value={kpiData.activeCustomers.value}
          growth={kpiData.activeCustomers.growth}
          isLoading={isLoading}
        />
        <KPICard
          icon={Clock}
          title="Pending Orders"
          value={kpiData.pendingOrders.value}
          growth={kpiData.pendingOrders.growth}
          trend="down"
          isLoading={isLoading}
        />
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Dress Type
            </label>
            <select
              value={dressTypeFilter}
              onChange={(e) => setDressTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="all">All Types</option>
              <option value="shirt">Shirt</option>
              <option value="pants">Pants</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tailor
            </label>
            <select
              value={tailorFilter}
              onChange={(e) => setTailorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="all">All Tailors</option>
              <option value="sanjay">Sanjay</option>
              <option value="anwar">Anwar</option>
              <option value="dhana">Dhana</option>
              <option value="ramesh">Ramesh</option>
              <option value="vikram">Vikram</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Order Status
            </label>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Section - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Monthly Revenue
          </h3>
          <RevenueChart data={chartData.monthlyRevenue} isLoading={isLoading} />
        </div>
        <DressTypePieChart data={chartData.dressTypes} isLoading={isLoading} />
      </div>

      {/* Charts Section - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersTrendChart data={chartData.ordersTrend} isLoading={isLoading} />
        <TailorBarChart
          data={chartData.tailorProductivity}
          isLoading={isLoading}
        />
      </div>

      {/* Analytics Table */}
      <OrdersAnalyticsTable
        data={chartData.recentOrders}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AnalyticsDashboard;
