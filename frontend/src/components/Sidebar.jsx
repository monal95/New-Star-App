import React from "react";
import {
  Scissors,
  UserCircle,
  Building,
  Briefcase,
  LogOut,
  BarChart3,
  Sparkles,
} from "lucide-react";

const Sidebar = ({ activeView, setActiveView, onLogout }) => {
  const navItems = [
    { id: "civil-dashboard", label: "Civil Dashboard", icon: UserCircle },
    { id: "company-dashboard", label: "Company Dashboard", icon: Building },
    { id: "labour-dashboard", label: "Labour Dashboard", icon: Briefcase },
    {
      id: "analytics-dashboard",
      label: "Analytics Dashboard",
      icon: BarChart3,
    },
    {
      id: "virtual-tryon",
      label: "Virtual Try-On Studio",
      icon: Sparkles,
    },
    { id: "civil", label: "Customer Orders", icon: UserCircle },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("currentPage");
    localStorage.removeItem("activeView");
    if (onLogout) onLogout();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg">
            <Scissors size={24} className="text-slate-900" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">NEW STAR</span>
            <span className="text-xs text-slate-400">
              Smart Tailoring System
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              activeView === item.id
                ? "text-white font-semibold"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300 font-medium text-sm mb-3"
        >
          <LogOut size={18} />
          Logout
        </button>
        <p className="text-xs text-slate-500 text-center">© 2026 New Star</p>
      </div>
    </aside>
  );
};

export default Sidebar;
