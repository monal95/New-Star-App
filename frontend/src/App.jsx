import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CivilForm from './components/CivilForm';
import CivilDashboard from './components/CivilDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import LabourDashboard from './components/LabourDashboard';
import { ordersAPI } from './services/api';
import { Search, Filter } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('civil-dashboard');
  const [orders, setOrders] = useState([]);
  const [labourSearchTerm, setLabourSearchTerm] = useState('');
  const [labourFilterCategory, setLabourFilterCategory] = useState('all');

  // Fetch civil orders from API (current month only)
  const fetchOrders = useCallback(async () => {
    try {
      // Fetch civil orders for current month from backend
      const data = await ordersAPI.getCivil();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Fallback to localStorage if API fails
      const savedOrders = localStorage.getItem('tailor_orders');
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
    return () => { isMounted = false; };
  }, [fetchOrders]);

  // Update order status via API
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        (order._id === orderId || order.id === orderId) ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      // Fallback to local update
      setOrders(orders.map(order => 
        (order._id === orderId || order.id === orderId) ? { ...order, status: newStatus } : order
      ));
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'civil-dashboard': return { title: 'Civil Dashboard', subtitle: 'Customer orders analytics and management' };
      case 'company-dashboard': return { title: 'Company Dashboard', subtitle: 'Company-wise orders and analytics' };
      case 'labour-dashboard': return { title: 'Labour Dashboard', subtitle: 'Manage tailor workforce and labour' };
      case 'civil': return { title: 'Customer Orders', subtitle: 'Add new customer measurements' };
      case 'companies': return { title: 'Company Management', subtitle: 'Manage company accounts' };
      case 'company-orders': return { title: 'Bulk Orders', subtitle: 'Manage company bulk orders' };
      default: return { title: 'Dashboard', subtitle: '' };
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'civil-dashboard':
        return <CivilDashboard orders={orders} updateOrderStatus={updateOrderStatus} refreshOrders={fetchOrders} />;
      case 'company-dashboard':
        return <CompanyDashboard
          searchTerm={labourSearchTerm}
          setSearchTerm={setLabourSearchTerm}
          filterCategory={labourFilterCategory}
          setFilterCategory={setLabourFilterCategory}
         refreshOrders={fetchOrders} />;
      case 'labour-dashboard':
        return <LabourDashboard />;
      case 'civil':
        return <CivilForm addOrder={(order) => setOrders([...orders, order])} refreshOrders={fetchOrders} />;
      default:
        return <CivilDashboard orders={orders} updateOrderStatus={updateOrderStatus} refreshOrders={fetchOrders} />;
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="header-actions">
            {activeView === 'labour-dashboard' ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={18} style={{ color: '#64748b' }} />
                  <select
                    value={labourFilterCategory}
                    onChange={(e) => setLabourFilterCategory(e.target.value)}
                    className="form-input"
                    style={{ padding: '0.5rem 0.75rem', minWidth: '150px' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Tailor">Tailor</option>
                    <option value="Iron Master">Iron Master</option>
                    <option value="Embroider">Embroider</option>
                  </select>
                </div>

                {/* Search Bar - Compact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '250px' }}>
                  <Search size={18} style={{ color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={labourSearchTerm}
                    onChange={(e) => setLabourSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '0.5rem 0.75rem' }}
                  />
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
        </header>
        <div className="page-content">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;