import React from 'react';
import { LayoutDashboard, Users, Building2, ClipboardList, Scissors, Settings, HelpCircle } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'orders', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'civil', label: 'Customer Orders', icon: Users },
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'company-orders', label: 'Bulk Orders', icon: ClipboardList },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">
                        <Scissors size={22} />
                    </div>
                    <div className="logo-text">
                        <span className="logo-title">NEW STAR TAILOR</span>
                        <span className="logo-subtitle">Smart Tailoring System</span>
                    </div>
                </div>
            </div>

            <nav className="nav-links">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <p className="sidebar-footer-text">© 2026 New Star Tailor</p>
            </div>
        </aside>
    );
};

export default Sidebar;
