import React from 'react';
import { ClipboardList, Building2, ShoppingBag, Clock, Users, Package } from 'lucide-react';

const OrderDashboard = ({ orders, companies }) => {
    const totalBulkOrders = companies.reduce((acc, c) => acc + (parseInt(c.orderCount) || 0), 0);
    
    const stats = [
        { 
            label: 'Pending Orders', 
            count: orders.filter(o => o.status === 'Pending').length, 
            icon: Clock, 
            variant: 'warning' 
        },
        { 
            label: 'Active Companies', 
            count: companies.length, 
            icon: Building2, 
            variant: 'primary' 
        },
        { 
            label: 'Total Bulk Orders', 
            count: totalBulkOrders, 
            icon: Package, 
            variant: 'info' 
        },
        { 
            label: 'Total Customers', 
            count: orders.length, 
            icon: Users, 
            variant: 'success' 
        },
    ];

    return (
        <div>
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-info">
                            <h3>{stat.label}</h3>
                            <p className="stat-value">{stat.count}</p>
                        </div>
                        <div className={`stat-icon ${stat.variant}`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <ClipboardList size={20} />
                        Recent Customer Orders
                    </h3>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Phone</th>
                                    <th>Order Date</th>
                                    <th>Sets</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="empty-state">
                                                <ClipboardList size={48} />
                                                <h3>No Orders Yet</h3>
                                                <p>Add your first customer order from the Customer Orders section.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.slice(-10).reverse().map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    {order.name}
                                                </div>
                                                {order.position && (
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {order.position}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{order.phno}</td>
                                            <td>{order.date}</td>
                                            <td>{order.noOfSets}</td>
                                            <td>
                                                <span className={`badge ${
                                                    order.status === 'Completed' ? 'badge-success' :
                                                    order.status === 'In Progress' ? 'badge-info' :
                                                    'badge-warning'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Companies Overview */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <Building2 size={20} />
                        Active Companies
                    </h3>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Company Name</th>
                                    <th>Total Orders</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="3">
                                            <div className="empty-state">
                                                <Building2 size={48} />
                                                <h3>No Companies</h3>
                                                <p>Add companies from the Companies section.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map(company => (
                                        <tr key={company.id}>
                                            <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {company.name}
                                            </td>
                                            <td>{company.orderCount} orders</td>
                                            <td>
                                                <span className="badge badge-success">{company.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDashboard;
