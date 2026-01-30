import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CivilForm from './components/CivilForm';
import CivilDashboard from './components/CivilDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import { ordersAPI } from './services/api';

function App() {
  const [activeView, setActiveView] = useState('civil-dashboard');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Fallback to localStorage if API fails
      const savedOrders = localStorage.getItem('tailor_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchOrders();
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
        return <CompanyDashboard refreshOrders={fetchOrders} />;
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
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