import React from 'react';
import { Users, Scissors, UserCircle, Building, Briefcase } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'civil-dashboard', label: 'Civil Dashboard', icon: UserCircle },
        { id: 'company-dashboard', label: 'Company Dashboard', icon: Building },
        { id: 'labour-dashboard', label: 'Labour Dashboard', icon: Briefcase },
        { id: 'civil', label: 'Customer Orders', icon: Users },
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
