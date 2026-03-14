import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import CivilForm from "./components/CivilForm";
import CivilDashboard from "./components/CivilDashboard";
import CompanyDashboard from "./components/CompanyDashboard";
import LabourDashboard from "./components/LabourDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import { ordersAPI } from "./services/api";
import { Search, Filter } from "lucide-react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing', 'login', or 'app'
  const [activeView, setActiveView] = useState("civil-dashboard");
  const [orders, setOrders] = useState([]);
  const [labourSearchTerm, setLabourSearchTerm] = useState("");
  const [labourFilterCategory, setLabourFilterCategory] = useState("all");

  // Persist current page to localStorage
  useEffect(() => {
    if (currentPage === "app") {
      localStorage.setItem("currentPage", currentPage);
    } else if (currentPage === "landing") {
      localStorage.removeItem("currentPage");
    }
  }, [currentPage]);

  // Persist active view to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("activeView", activeView);
    }
  }, [activeView, isAuthenticated]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth) {
      // Restore session if user was logged in
      setIsAuthenticated(true);
      setCurrentPage("app");

      const savedView = localStorage.getItem("activeView");
      if (savedView) {
        setActiveView(savedView);
      }
    }
    // If no auth, stay on landing page (default state)
  }, []);

  // Fetch civil orders from API (current month only)
  const fetchOrders = useCallback(async () => {
    try {
      // Fetch civil orders for current month from backend
      const data = await ordersAPI.getCivil();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      // Fallback to localStorage if API fails
      const savedOrders = localStorage.getItem("tailor_orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      if (isMounted) {
        await fetchOrders();
      }
    };
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [fetchOrders]);

  // Update order status via API
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order._id === orderId || order.id === orderId
            ? { ...order, status: newStatus }
            : order,
        ),
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      // Fallback to local update
      setOrders(
        orders.map((order) =>
          order._id === orderId || order.id === orderId
            ? { ...order, status: newStatus }
            : order,
        ),
      );
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case "civil-dashboard":
        return {
          title: "Civil Dashboard",
          subtitle: "Customer orders analytics and management",
        };
      case "company-dashboard":
        return {
          title: "Company Dashboard",
          subtitle: "Company-wise orders and analytics",
        };
      case "labour-dashboard":
        return {
          title: "Labour Dashboard",
          subtitle: "Manage tailor workforce and labour",
        };
      case "analytics-dashboard":
        return {
          title: "Analytics Dashboard",
          subtitle: "Track your tailoring business performance",
        };
      case "civil":
        return {
          title: "Customer Orders",
          subtitle: "Add new customer measurements",
        };
      case "companies":
        return {
          title: "Company Management",
          subtitle: "Manage company accounts",
        };
      case "company-orders":
        return { title: "Bulk Orders", subtitle: "Manage company bulk orders" };
      default:
        return { title: "Dashboard", subtitle: "" };
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "civil-dashboard":
        return (
          <CivilDashboard
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            refreshOrders={fetchOrders}
          />
        );
      case "company-dashboard":
        return (
          <CompanyDashboard
            searchTerm={labourSearchTerm}
            setSearchTerm={setLabourSearchTerm}
            filterCategory={labourFilterCategory}
            setFilterCategory={setLabourFilterCategory}
            refreshOrders={fetchOrders}
          />
        );
      case "labour-dashboard":
        return (
          <LabourDashboard
            searchTerm={labourSearchTerm}
            filterCategory={labourFilterCategory}
          />
        );
      case "analytics-dashboard":
        return <AnalyticsDashboard />;
      case "civil":
        return (
          <CivilForm
            addOrder={(order) => setOrders([...orders, order])}
            refreshOrders={fetchOrders}
          />
        );
      default:
        return (
          <CivilDashboard
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            refreshOrders={fetchOrders}
          />
        );
    }
  };

  const { title, subtitle } = getPageTitle();

  // Handle landing page
  if (currentPage === "landing") {
    return <LandingPage onStartTailoring={() => setCurrentPage("login")} />;
  }

  // Handle login page
  if (currentPage === "login") {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentPage("app");
        }}
        onBack={() => setCurrentPage("landing")}
      />
    );
  }

  // Render main app
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage("landing");
    setActiveView("civil-dashboard");
  };

  return (
    <div className="app-container">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="header-actions">
            {activeView === "labour-dashboard" ? (
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                {/* Category Filter Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Filter size={18} style={{ color: "#cbd5e1" }} />
                  <button
                    onClick={() => setLabourFilterCategory("all")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        labourFilterCategory === "all" ? "#1e40af" : "#e2e8f0",
                      color:
                        labourFilterCategory === "all" ? "#fff" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight:
                        labourFilterCategory === "all" ? "600" : "500",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={(e) => {
                      if (labourFilterCategory !== "all") {
                        e.currentTarget.style.backgroundColor = "#cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (labourFilterCategory !== "all") {
                        e.currentTarget.style.backgroundColor = "#e2e8f0";
                      }
                    }}
                  >
                    All Categories
                  </button>
                  <button
                    onClick={() => setLabourFilterCategory("Tailor")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        labourFilterCategory === "Tailor"
                          ? "#1e40af"
                          : "#e2e8f0",
                      color:
                        labourFilterCategory === "Tailor" ? "#fff" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight:
                        labourFilterCategory === "Tailor" ? "600" : "500",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={(e) => {
                      if (labourFilterCategory !== "Tailor") {
                        e.currentTarget.style.backgroundColor = "#cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (labourFilterCategory !== "Tailor") {
                        e.currentTarget.style.backgroundColor = "#e2e8f0";
                      }
                    }}
                  >
                    Tailor
                  </button>
                  <button
                    onClick={() => setLabourFilterCategory("Iron Master")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        labourFilterCategory === "Iron Master"
                          ? "#1e40af"
                          : "#e2e8f0",
                      color:
                        labourFilterCategory === "Iron Master"
                          ? "#fff"
                          : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight:
                        labourFilterCategory === "Iron Master" ? "600" : "500",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={(e) => {
                      if (labourFilterCategory !== "Iron Master") {
                        e.currentTarget.style.backgroundColor = "#cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (labourFilterCategory !== "Iron Master") {
                        e.currentTarget.style.backgroundColor = "#e2e8f0";
                      }
                    }}
                  >
                    Iron Master
                  </button>
                  <button
                    onClick={() => setLabourFilterCategory("Embroider")}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        labourFilterCategory === "Embroider"
                          ? "#1e40af"
                          : "#e2e8f0",
                      color:
                        labourFilterCategory === "Embroider"
                          ? "#fff"
                          : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight:
                        labourFilterCategory === "Embroider" ? "600" : "500",
                      transition: "all 0.2s ease",
                      fontSize: "0.875rem",
                    }}
                    onMouseEnter={(e) => {
                      if (labourFilterCategory !== "Embroider") {
                        e.currentTarget.style.backgroundColor = "#cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (labourFilterCategory !== "Embroider") {
                        e.currentTarget.style.backgroundColor = "#e2e8f0";
                      }
                    }}
                  >
                    Embroider
                  </button>
                </div>

                {/* Search Bar - Compact */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "250px",
                  }}
                >
                  <Search size={18} style={{ color: "#1e40af" }} />
                  <input
                    type="text"
                    placeholder="Search labour..."
                    value={labourSearchTerm}
                    onChange={(e) => setLabourSearchTerm(e.target.value)}
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#f1f5f9",
                      color: "#1e293b",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>
            ) : (
              <span
                style={{
                  fontSize: "1rem",
                  color: "#1e293b",
                  fontWeight: "500",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </header>
        <div className="page-content">{renderView()}</div>
      </main>
    </div>
  );
}

export default App;
