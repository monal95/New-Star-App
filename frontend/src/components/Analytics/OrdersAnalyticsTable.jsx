import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

const OrdersAnalyticsTable = ({ data = [], isLoading = false }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "orderDate",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const tableData =
    data.length > 0
      ? data
      : [
          {
            id: 1,
            orderId: "ORD-001",
            customerName: "Raj Kumar",
            dressType: "Shirt",
            tailor: "Sanjay",
            price: 500,
            status: "Completed",
            deliveryDate: "2024-03-20",
          },
          {
            id: 2,
            orderId: "ORD-002",
            customerName: "Priya Singh",
            dressType: "Pants",
            tailor: "Anwar",
            price: 600,
            status: "In Progress",
            deliveryDate: "2024-03-25",
          },
          {
            id: 3,
            orderId: "ORD-003",
            customerName: "Ankit Patel",
            dressType: "Blazer",
            tailor: "Dhana",
            price: 1200,
            status: "Pending",
            deliveryDate: "2024-03-28",
          },
          {
            id: 4,
            orderId: "ORD-004",
            customerName: "Neha Verma",
            dressType: "Saree Blouse",
            tailor: "Ramesh",
            price: 400,
            status: "Completed",
            deliveryDate: "2024-03-19",
          },
          {
            id: 5,
            orderId: "ORD-005",
            customerName: "Vikram Desai",
            dressType: "Uniform",
            tailor: "Vikram",
            price: 800,
            status: "In Progress",
            deliveryDate: "2024-03-26",
          },
        ];

  // Filter data
  const filteredData = useMemo(() => {
    return tableData.filter(
      (item) =>
        item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dressType.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, tableData]);

  // Sort data
  const sortedData = useMemo(() => {
    let sorted = [...filteredData];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Pending: "bg-yellow-100 text-yellow-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
    };
    return statusStyles[status] || "bg-slate-100 text-slate-800";
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="h-96 bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Orders Analytics
        </h3>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, or Dress Type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                <button
                  onClick={() => handleSort("orderId")}
                  className="flex items-center gap-2 hover:text-slate-900"
                >
                  Order ID
                  <SortIcon column="orderId" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                <button
                  onClick={() => handleSort("customerName")}
                  className="flex items-center gap-2 hover:text-slate-900"
                >
                  Customer
                  <SortIcon column="customerName" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                <button
                  onClick={() => handleSort("dressType")}
                  className="flex items-center gap-2 hover:text-slate-900"
                >
                  Dress Type
                  <SortIcon column="dressType" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                Tailor
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center gap-2 hover:text-slate-900"
                >
                  Price
                  <SortIcon column="price" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                Status
              </th>
              <th className="px-6 py-3 text-left text-slate-600 font-semibold">
                Delivery Date
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row._id || row.id || row.orderId}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 text-slate-900 font-medium">
                  {row.orderId}
                </td>
                <td className="px-6 py-4 text-slate-600">{row.customerName}</td>
                <td className="px-6 py-4 text-slate-600">{row.dressType}</td>
                <td className="px-6 py-4 text-slate-600">{row.tailor}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">
                  ₹{row.price}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{row.deliveryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Showing{" "}
          {paginatedData.length > 0 ? currentPage * itemsPerPage + 1 : 0} to{" "}
          {Math.min((currentPage + 1) * itemsPerPage, sortedData.length)} of{" "}
          {sortedData.length} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={`page-${i}`}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                  currentPage === i
                    ? "bg-blue-900 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersAnalyticsTable;
