import React, { useState, useMemo } from 'react';
import { Users, Clock, CheckCircle, IndianRupee, X, Shirt, PanelBottom, Eye, Plus, Save, Calendar } from 'lucide-react';
import { ordersAPI } from '../services/api';

const CivilDashboard = ({ orders, updateOrderStatus, refreshOrders }) => {
    const [timePeriod, setTimePeriod] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, pending, completed
    const [showRevenueModal, setShowRevenueModal] = useState(false);
    const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Create Order Form State
    const [formData, setFormData] = useState({
        orderId: '',
        name: '',
        phone: '',
        email: '',
        noOfSets: 1,
        shirtAmount: 500,
        pantAmount: 400,
        paymentMethod: 'Cash',
        shirt: {
            length: '',
            shoulder: '',
            sleeve: '',
            chest: '',
            collar: '',
            waist: ''
        },
        pant: {
            length: '',
            waist: '',
            hip: '',
            thigh: '',
            knee: '',
            bottom: ''
        }
    });

    // Generate Order ID when modal opens
    const generateOrderId = async () => {
        try {
            const response = await ordersAPI.getNextId();
            setFormData(prev => ({ ...prev, orderId: response.nextId }));
        } catch (error) {
            // Fallback to timestamp-based ID
            const timestamp = Date.now().toString().slice(-6);
            setFormData(prev => ({ ...prev, orderId: `ORD${timestamp}` }));
        }
    };

    const handleOpenCreateModal = () => {
        setFormError('');
        generateOrderId();
        setShowCreateModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setFormData({
            orderId: '',
            name: '',
            phone: '',
            email: '',
            noOfSets: 1,
            shirtAmount: 500,
            pantAmount: 400,
            paymentMethod: 'Cash',
            shirt: { length: '', shoulder: '', sleeve: '', chest: '', collar: '', waist: '' },
            pant: { length: '', waist: '', hip: '', thigh: '', knee: '', bottom: '' }
        });
        setFormError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleShirtChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            shirt: { ...prev.shirt, [name]: value }
        }));
    };

    const handlePantChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            pant: { ...prev.pant, [name]: value }
        }));
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        // Validation
        if (!formData.orderId || !formData.name || !formData.phone) {
            setFormError('Order ID, Name, and Phone are required');
            setIsSubmitting(false);
            return;
        }

        try {
            await ordersAPI.create(formData);
            handleCloseCreateModal();
            if (refreshOrders) refreshOrders();
            alert('Order created successfully!');
        } catch (error) {
            setFormError(error.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateTotal = () => {
        const sets = parseInt(formData.noOfSets) || 1;
        const shirt = parseFloat(formData.shirtAmount) || 0;
        const pant = parseFloat(formData.pantAmount) || 0;
        return (shirt + pant) * sets;
    };

    // Filter only civil orders (orders without companyId)
    const civilOrders = useMemo(() => {
        return orders.filter(order => !order.companyId);
    }, [orders]);

    // Filter orders by time period or specific date
    const filteredByTime = useMemo(() => {
        const now = new Date();
        return civilOrders.filter(order => {
            // If a specific date is selected, filter by that date
            if (selectedDate) {
                const orderDate = new Date(order.date).toISOString().split('T')[0];
                return orderDate === selectedDate;
            }
            
            if (timePeriod === 'all') return true;
            const orderDate = new Date(order.date);
            const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
            
            switch (timePeriod) {
                case 'today': return diffDays === 0;
                case 'week': return diffDays <= 7;
                case 'month': return diffDays <= 30;
                case 'year': return diffDays <= 365;
                default: return true;
            }
        });
    }, [civilOrders, timePeriod, selectedDate]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = filteredByTime.length;
        const pending = filteredByTime.filter(o => o.status === 'Pending' || o.status === 'In Progress').length;
        const completed = filteredByTime.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
        
        // Calculate revenue only from delivered orders using actual order amounts
        const deliveredOrders = filteredByTime.filter(o => o.status === 'Delivered' || o.status === 'Completed');
        
        // Calculate revenue from actual order prices
        const revenue = deliveredOrders.reduce((sum, o) => {
            const sets = parseInt(o.noOfSets) || 1;
            const shirtPrice = parseFloat(o.shirtAmount) || 0;
            const pantPrice = parseFloat(o.pantAmount) || 0;
            return sum + ((shirtPrice + pantPrice) * sets);
        }, 0);

        // Shirt and Pant revenue breakdown using actual prices
        const shirtRevenue = deliveredOrders.reduce((sum, o) => {
            const sets = parseInt(o.noOfSets) || 1;
            const shirtPrice = parseFloat(o.shirtAmount) || 0;
            return sum + (shirtPrice * sets);
        }, 0);
        
        const pantRevenue = deliveredOrders.reduce((sum, o) => {
            const sets = parseInt(o.noOfSets) || 1;
            const pantPrice = parseFloat(o.pantAmount) || 0;
            return sum + (pantPrice * sets);
        }, 0);

        return { total, pending, completed, revenue, shirtRevenue, pantRevenue };
    }, [filteredByTime]);

    // Filter orders for display
    const displayOrders = useMemo(() => {
        switch (activeFilter) {
            case 'pending':
                return filteredByTime.filter(o => o.status === 'Pending' || o.status === 'In Progress');
            case 'completed':
                return filteredByTime.filter(o => o.status === 'Delivered' || o.status === 'Completed');
            default:
                return filteredByTime;
        }
    }, [filteredByTime, activeFilter]);

    const handleStatusChange = (orderId, newStatus) => {
        updateOrderStatus(orderId, newStatus);
    };

    const handleCardClick = (type) => {
        if (type === 'revenue') {
            setShowRevenueModal(true);
        } else if (type === 'pending') {
            setActiveFilter('pending');
        } else if (type === 'completed') {
            setActiveFilter('completed');
        } else {
            setActiveFilter('all');
        }
    };

    const viewMeasurements = (order) => {
        setSelectedOrder(order);
        setShowMeasurementsModal(true);
    };

    // Handle date selection
    const handleDateChange = async (e) => {
        const selectedDateValue = e.target.value;
        setSelectedDate(selectedDateValue);
        setTimePeriod(''); // Clear time period when specific date is selected
        
        // Fetch orders for the selected date from database
        if (selectedDateValue && refreshOrders) {
            try {
                const ordersForDate = await ordersAPI.getCivil(selectedDateValue);
                // The refreshOrders callback should update the parent component's orders state
                // For now, we'll rely on the parent to handle the database fetch
                refreshOrders();
            } catch (error) {
                console.error('Failed to fetch orders for date:', error);
            }
        }
    };

    // Clear date filter
    const clearDateFilter = () => {
        setSelectedDate('');
        setTimePeriod('all');
    };

    return (
        <div>
            {/* Time Period Filter */}
            <div className="card mb-4">
                <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {/* Quick Filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="form-label" style={{ marginBottom: 0 }}>Quick Filter:</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { value: 'today', label: 'Today' },
                                    { value: 'week', label: 'This Week' },
                                    { value: 'month', label: 'This Month' },
                                    { value: 'year', label: 'This Year' },
                                    { value: 'all', label: 'All Time' },
                                ].map(period => (
                                    <button
                                        key={period.value}
                                        onClick={() => {
                                            setTimePeriod(period.value);
                                            setSelectedDate(''); // Clear date when quick filter is selected
                                        }}
                                        className={`btn btn-sm ${timePeriod === period.value && !selectedDate ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0' }}></div>

                        {/* Date Picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: '#64748b' }} />
                            <span className="form-label" style={{ marginBottom: 0 }}>Select Date:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="form-input"
                                style={{ padding: '0.5rem 0.75rem', width: 'auto' }}
                            />
                            {selectedDate && (
                                <button
                                    onClick={clearDateFilter}
                                    className="btn btn-sm btn-secondary"
                                    style={{ padding: '0.5rem' }}
                                    title="Clear date filter"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Indicator */}
                    {selectedDate && (
                        <div style={{ 
                            marginTop: '0.75rem', 
                            padding: '0.5rem 1rem', 
                            backgroundColor: '#eff6ff', 
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#1e3a8a'
                        }}>
                            <Calendar size={14} />
                            Showing orders for: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div 
                    className="stat-card" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCardClick('all')}
                >
                    <div className="stat-info">
                        <h3>Total Orders</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                    <div className="stat-icon primary">
                        <Users size={24} />
                    </div>
                </div>

                <div 
                    className="stat-card" 
                    style={{ cursor: 'pointer', border: activeFilter === 'pending' ? '2px solid #d97706' : undefined }}
                    onClick={() => handleCardClick('pending')}
                >
                    <div className="stat-info">
                        <h3>Pending Orders</h3>
                        <p className="stat-value">{stats.pending}</p>
                    </div>
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                </div>

                <div 
                    className="stat-card" 
                    style={{ cursor: 'pointer', border: activeFilter === 'completed' ? '2px solid #16a34a' : undefined }}
                    onClick={() => handleCardClick('completed')}
                >
                    <div className="stat-info">
                        <h3>Completed Orders</h3>
                        <p className="stat-value">{stats.completed}</p>
                    </div>
                    <div className="stat-icon success">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div 
                    className="stat-card" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCardClick('revenue')}
                >
                    <div className="stat-info">
                        <h3>Revenue</h3>
                        <p className="stat-value">₹{stats.revenue.toLocaleString()}</p>
                    </div>
                    <div className="stat-icon info">
                        <IndianRupee size={24} />
                    </div>
                </div>
            </div>

            {/* Filter indicator */}
            {activeFilter !== 'all' && (
                <div className="card mb-4" style={{ backgroundColor: activeFilter === 'pending' ? '#fef3c7' : '#dcfce7' }}>
                    <div className="card-body" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500' }}>
                            Showing {activeFilter === 'pending' ? 'Pending' : 'Completed'} Orders
                        </span>
                        <button className="btn btn-sm btn-secondary" onClick={() => setActiveFilter('all')}>
                            Show All
                        </button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Users size={20} />
                        Customer Orders
                    </h3>
                    <span className="badge badge-primary">{displayOrders.length} Orders</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer Name</th>
                                    <th>No. of Sets</th>
                                    <th>Order Date</th>
                                    <th>Measurements</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="empty-state">
                                                <Users size={48} />
                                                <h3>No Orders Found</h3>
                                                <p>No customer orders match the selected filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayOrders.map(order => (
                                        <tr key={order._id || order.id || order.orderId}>
                                            <td className="font-semibold">#{order.orderId || (order._id || order.id || '').toString().slice(-6)}</td>
                                            <td>
                                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    {order.name}
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    {order.phone || order.phno}
                                                </div>
                                            </td>
                                            <td>{order.noOfSets || 1}</td>
                                            <td>{order.date}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => viewMeasurements(order)}
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    order.status === 'Delivered' || order.status === 'Completed' ? 'badge-success' :
                                                    order.status === 'In Progress' ? 'badge-info' :
                                                    'badge-warning'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order._id || order.id, e.target.value)}
                                                    className="form-input"
                                                    style={{ padding: '0.5rem', minWidth: '130px' }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Delivered">Delivered</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Revenue Modal with Pie Chart */}
            {showRevenueModal && (
                <div className="modal-overlay" onClick={() => setShowRevenueModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Revenue Analysis</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowRevenueModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                                {/* Simple Pie Chart using CSS */}
                                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                        {stats.revenue > 0 ? (
                                            <>
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke="#1e3a8a"
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(stats.shirtRevenue / stats.revenue) * 251.2} 251.2`}
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke="#60a5fa"
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(stats.pantRevenue / stats.revenue) * 251.2} 251.2`}
                                                    strokeDashoffset={`-${(stats.shirtRevenue / stats.revenue) * 251.2}`}
                                                />
                                            </>
                                        ) : (
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="transparent"
                                                stroke="#e2e8f0"
                                                strokeWidth="20"
                                            />
                                        )}
                                    </svg>
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '50%', 
                                        left: '50%', 
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{stats.revenue.toLocaleString()}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</div>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shirt size={20} style={{ color: '#1e3a8a' }} />
                                            <div style={{ width: '20px', height: '20px', backgroundColor: '#1e3a8a', borderRadius: '4px' }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Shirts</div>
                                            <div style={{ color: '#64748b' }}>₹{stats.shirtRevenue.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <PanelBottom size={20} style={{ color: '#60a5fa' }} />
                                            <div style={{ width: '20px', height: '20px', backgroundColor: '#60a5fa', borderRadius: '4px' }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Pants</div>
                                            <div style={{ color: '#64748b' }}>₹{stats.pantRevenue.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Measurements Modal */}
            {showMeasurementsModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowMeasurementsModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Measurements - {selectedOrder.name}</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowMeasurementsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Shirt Measurements */}
                                <div>
                                    <h4 className="form-section-title">
                                        <Shirt size={18} style={{ marginRight: '0.5rem' }} />
                                        Shirt
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedOrder.shirt && Object.entries(selectedOrder.shirt).map(([key, value]) => (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                                                <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{key}</span>
                                                <span style={{ fontWeight: '600' }}>{value || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pant Measurements */}
                                <div>
                                    <h4 className="form-section-title">
                                        <PanelBottom size={18} style={{ marginRight: '0.5rem' }} />
                                        Pant
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedOrder.pant && Object.entries(selectedOrder.pant).map(([key, value]) => (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                                                <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{key === 'butt' ? 'Seat' : key}</span>
                                                <span style={{ fontWeight: '600' }}>{value || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={handleCloseCreateModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} />
                                Create New Order
                            </h3>
                            <button className="btn btn-sm btn-secondary" onClick={handleCloseCreateModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitOrder}>
                            <div className="modal-body">
                                {formError && (
                                    <div style={{ 
                                        padding: '1rem', 
                                        backgroundColor: '#fee2e2', 
                                        color: '#dc2626', 
                                        borderRadius: '8px', 
                                        marginBottom: '1rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        {formError}
                                    </div>
                                )}

                                {/* Customer Details Section */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Users size={18} />
                                        Customer Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Order ID *</label>
                                            <input
                                                type="text"
                                                name="orderId"
                                                value={formData.orderId}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="ORD001"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Customer Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Enter customer name"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Enter phone number"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Measurements Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                    {/* Shirt Measurements */}
                                    <div>
                                        <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <Shirt size={18} />
                                            Shirt Measurements (inches)
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {['length', 'shoulder', 'sleeve', 'chest', 'collar', 'waist'].map(field => (
                                                <div className="form-group" key={field}>
                                                    <label className="form-label" style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{field}</label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        name={field}
                                                        value={formData.shirt[field]}
                                                        onChange={handleShirtChange}
                                                        className="form-input"
                                                        placeholder="0"
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pant Measurements */}
                                    <div>
                                        <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <PanelBottom size={18} />
                                            Pant Measurements (inches)
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'].map(field => (
                                                <div className="form-group" key={field}>
                                                    <label className="form-label" style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{field}</label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        name={field}
                                                        value={formData.pant[field]}
                                                        onChange={handlePantChange}
                                                        className="form-input"
                                                        placeholder="0"
                                                        style={{ padding: '0.5rem' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Details Section */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <IndianRupee size={18} />
                                        Order & Payment Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Number of Sets</label>
                                            <input
                                                type="number"
                                                name="noOfSets"
                                                value={formData.noOfSets}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                min="1"
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Shirt Amount (₹)</label>
                                            <input
                                                type="number"
                                                name="shirtAmount"
                                                value={formData.shirtAmount}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                min="0"
                                                placeholder="500"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Pant Amount (₹)</label>
                                            <input
                                                type="number"
                                                name="pantAmount"
                                                value={formData.pantAmount}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                min="0"
                                                placeholder="400"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Payment Method</label>
                                            <select
                                                name="paymentMethod"
                                                value={formData.paymentMethod}
                                                onChange={handleInputChange}
                                                className="form-select"
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {/* Total Amount Display */}
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        padding: '1rem', 
                                        backgroundColor: '#eff6ff', 
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: '600', color: '#1e3a8a' }}>Total Amount:</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                                            ₹{calculateTotal().toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ 
                                padding: '1rem 1.5rem', 
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleCloseCreateModal}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Save size={18} />
                                    {isSubmitting ? 'Creating...' : 'Create Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Create Button */}
            <button
                    onClick={handleOpenCreateModal}
                    style={{
position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    backgroundColor: '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    width: '56px',
                    height: '56px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(30, 58, 138, 0.4)',
                    transition: 'all 0.3s ease',
                    zIndex: 40,
                    overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                    e.currentTarget.style.width = '180px';
                    e.currentTarget.style.paddingLeft = '1.5rem';
                    e.currentTarget.style.paddingRight = '1.5rem';
                    e.currentTarget.querySelector('span').style.display = 'inline';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.width = '56px';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.paddingRight = '0';
                    e.currentTarget.querySelector('span').style.display = 'none';
                    }}
                    >
                    {/* PLUS ICON — ALWAYS VISIBLE */}
                    <Plus size={24} strokeWidth={2.5} color="white" />

                    {/* TEXT — ONLY ON HOVER */}
                    <span style={{ display: 'none', whiteSpace: 'nowrap' }}>Add New Order</span>
            </button>

        </div>
    );
};

export default CivilDashboard;
