import React from 'react';
import { Users, Scissors, UserCircle, Building, Briefcase, LogOut } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, onLogout }) => {
    const navItems = [
        { id: 'civil-dashboard', label: 'Civil Dashboard', icon: UserCircle },
        { id: 'company-dashboard', label: 'Company Dashboard', icon: Building },
        { id: 'labour-dashboard', label: 'Labour Dashboard', icon: Briefcase },
        { id: 'civil', label: 'Customer Orders', icon: Users },
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('currentPage');
        localStorage.removeItem('activeView');
        if (onLogout) onLogout();
    };

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
                <button
                    onClick={handleLogout}
                    className="logout-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.625rem 1rem',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginBottom: '1rem'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                    }}
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
                <p className="sidebar-footer-text">© 2026 New Star Tailor</p>
            </div>
        </aside>
    );
};

export default Sidebar;
