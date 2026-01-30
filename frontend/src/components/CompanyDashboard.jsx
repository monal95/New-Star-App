import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Building2, Clock, CheckCircle, X, Shirt, PanelBottom, Eye, Plus, Save, Calendar,
    Users, ShieldCheck, UserCog, Briefcase, UserCheck, Home, ArrowLeft, Phone, Mail, MapPin, Check, XCircle
} from 'lucide-react';
import { companiesAPI, employeesAPI } from '../services/api';

// Position types with icons
const POSITION_CONFIG = {
    'Employee': { label: 'Employee', icon: Users, color: '#3b82f6' },
    'Watchman': { label: 'Watchman', icon: ShieldCheck, color: '#f59e0b' },
    'Security': { label: 'Security', icon: ShieldCheck, color: '#ef4444' },
    'HR': { label: 'HR', icon: UserCog, color: '#8b5cf6' },
    'Manager': { label: 'Manager', icon: Briefcase, color: '#10b981' },
    'Senior Manager': { label: 'Senior Manager', icon: UserCheck, color: '#06b6d4' },
    'Housekeeping': { label: 'Housekeeping', icon: Home, color: '#ec4899' },
    'Other': { label: 'Other', icon: Users, color: '#64748b' }
};

const CompanyDashboard = ({ refreshOrders }) => {
    // View states
    const [view, setView] = useState('companies'); // companies, company-detail
    const [selectedCompany, setSelectedCompany] = useState(null);
    
    // Data states
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter states
    const [timePeriod, setTimePeriod] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    
    // Modal states
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
    const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // Form states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    
    // Company form
    const [companyForm, setCompanyForm] = useState({
        name: '',
        address: '',
        gstNumber: '',
        hrName: '',
        hrPhone: '',
        managerName: '',
        managerPhone: '',
        landlineNumber: '',
        estimatedOrders: '',
        email: ''
    });
    
    // Employee order form
    const [orderForm, setOrderForm] = useState({
        orderId: '',
        name: '',
        phone: '',
        position: 'Employee',
        noOfSets: 1,
        shirt: { length: '', shoulder: '', sleeve: '', chest: '', collar: '', waist: '' },
        pant: { length: '', waist: '', hip: '', thigh: '', knee: '', bottom: '' }
    });

    // Fetch companies
    const fetchCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await companiesAPI.getAll();
            setCompanies(data);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch employees for selected company
    const fetchEmployees = useCallback(async (companyId) => {
        try {
            const data = await employeesAPI.getByCompany(companyId);
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            setEmployees([]);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        if (selectedCompany) {
            fetchEmployees(selectedCompany._id);
        }
    }, [selectedCompany, fetchEmployees]);

    // Filter employees by time/date
    const filteredByTime = useMemo(() => {
        const now = new Date();
        return employees.filter(emp => {
            if (selectedDate) {
                const empDate = new Date(emp.date).toISOString().split('T')[0];
                return empDate === selectedDate;
            }
            if (timePeriod === 'all') return true;
            const empDate = new Date(emp.date);
            const diffDays = Math.floor((now - empDate) / (1000 * 60 * 60 * 24));
            switch (timePeriod) {
                case 'today': return diffDays === 0;
                case 'week': return diffDays <= 7;
                case 'month': return diffDays <= 30;
                case 'year': return diffDays <= 365;
                default: return true;
            }
        });
    }, [employees, timePeriod, selectedDate]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = filteredByTime.length;
        const pending = filteredByTime.filter(o => o.status === 'Pending' || o.status === 'In Progress').length;
        const movedToStitching = filteredByTime.filter(o => o.status === 'Moved to Stitching').length;
        const completed = filteredByTime.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
        
        // Count by position
        const positionCounts = {};
        Object.keys(POSITION_CONFIG).forEach(pos => {
            positionCounts[pos] = filteredByTime.filter(e => e.position === pos).length;
        });

        return { total, pending, movedToStitching, completed, ...positionCounts };
    }, [filteredByTime]);

    // Filter for display based on active filter
    const displayOrders = useMemo(() => {
        let filtered = filteredByTime;
        
        if (activeFilter === 'pending') {
            filtered = filtered.filter(o => o.status === 'Pending' || o.status === 'In Progress');
        } else if (activeFilter === 'completed') {
            filtered = filtered.filter(o => o.status === 'Delivered' || o.status === 'Completed');
        } else if (activeFilter === 'Moved to Stitching') {
            filtered = filtered.filter(o => o.status === 'Moved to Stitching');
        } else if (Object.keys(POSITION_CONFIG).includes(activeFilter)) {
            filtered = filtered.filter(o => o.position === activeFilter);
        }
        
        return filtered;
    }, [filteredByTime, activeFilter]);

    // Handlers
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
        setTimePeriod('');
    };

    const clearDateFilter = () => {
        setSelectedDate('');
        setTimePeriod('all');
    };

    const handleCardClick = (filter) => {
        setActiveFilter(activeFilter === filter ? 'all' : filter);
    };

    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
        setView('company-detail');
        setActiveFilter('all');
    };

    const handleBackToCompanies = () => {
        setView('companies');
        setSelectedCompany(null);
        setEmployees([]);
        setActiveFilter('all');
    };

    const viewMeasurements = (order) => {
        setSelectedOrder(order);
        setShowMeasurementsModal(true);
    };

    // Update employee status
    const handleStatusChange = async (employeeId, newStatus) => {
        try {
            await employeesAPI.updateStatus(employeeId, newStatus);
            setEmployees(employees.map(emp => 
                emp._id === employeeId ? { ...emp, status: newStatus } : emp
            ));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Company form handlers
    const handleCompanyInputChange = (e) => {
        const { name, value } = e.target;
        setCompanyForm(prev => ({...prev, [name]: value }));
    };

    const handleAddCompany = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        if (!companyForm.name) {
            setFormError('Company name is required');
            setIsSubmitting(false);
            return;
        }

        try {
            await companiesAPI.create(companyForm);
            setShowAddCompanyModal(false);
            setCompanyForm({
                name: '', address: '', gstNumber: '', hrName: '', hrPhone: '',
                managerName: '', managerPhone: '', landlineNumber: '', estimatedOrders: '', email: ''
            });
            fetchCompanies();
        } catch (error) {
            setFormError(error.message || 'Failed to create company');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Order form handlers
    const handleOrderInputChange = (e) => {
        const { name, value } = e.target;
        setOrderForm(prev => ({ ...prev, [name]: value }));
    };

    const handleShirtChange = (e) => {
        const { name, value } = e.target;
        setOrderForm(prev => ({ ...prev, shirt: { ...prev.shirt, [name]: value } }));
    };

    const handlePantChange = (e) => {
        const { name, value } = e.target;
        setOrderForm(prev => ({ ...prev, pant: { ...prev.pant, [name]: value } }));
    };

    const generateOrderId = async () => {
        try {
            const response = await employeesAPI.getNextId(selectedCompany._id);
            setOrderForm(prev => ({ ...prev, orderId: response.nextId }));
        } catch (error) {
            const timestamp = Date.now().toString().slice(-6);
            setOrderForm(prev => ({ ...prev, orderId: `EMP${timestamp}` }));
        }
    };

    const handleOpenOrderModal = () => {
        setFormError('');
        generateOrderId();
        setShowCreateOrderModal(true);
    };

    const handleCloseOrderModal = () => {
        setShowCreateOrderModal(false);
        setOrderForm({
            orderId: '', name: '', phone: '', position: 'Employee', noOfSets: 1,
            shirt: { length: '', shoulder: '', sleeve: '', chest: '', collar: '', waist: '' },
            pant: { length: '', waist: '', hip: '', thigh: '', knee: '', bottom: '' }
        });
        setFormError('');
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        if (!orderForm.name || !orderForm.phone) {
            setFormError('Name and Phone are required');
            setIsSubmitting(false);
            return;
        }

        try {
            await employeesAPI.create({
                ...orderForm,
                companyId: selectedCompany._id
            });
            handleCloseOrderModal();
            fetchEmployees(selectedCompany._id);
        } catch (error) {
            setFormError(error.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========== COMPANIES LIST VIEW ==========
    if (view === 'companies') {
        return (
            <div>
                {/* Companies Grid */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Building2 size={20} />
                            All Companies
                        </h3>
                        <span className="badge badge-primary">{companies.length} Companies</span>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <p>Loading companies...</p>
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="empty-state">
                                <Building2 size={48} />
                                <h3>No Companies Found</h3>
                                <p>Add your first company to get started.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {companies.map(company => (
                                    <div 
                                        key={company._id}
                                        onClick={() => handleCompanySelect(company)}
                                        style={{
                                            padding: '1.5rem',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '12px',
                                            border: '2px solid #e2e8f0',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = '#1e3a8a';
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.backgroundColor = '#f8fafc';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ 
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                backgroundColor: '#1e3a8a', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#1e3a8a', fontWeight: '600' }}>{company.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                                    {company.totalOrders || 0} Orders
                                                </p>
                                            </div>
                                        </div>
                                        {company.address && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                                <MapPin size={14} />
                                                <span>{company.address}</span>
                                            </div>
                                        )}
                                        {company.email && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                <Mail size={14} />
                                                <span>{company.email}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Company Button */}
                <button
                    onClick={() => setShowAddCompanyModal(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '60%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '1rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.4)',
                        transition: 'all 0.3s ease',
                        zIndex: 40,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => {
                        e.target.style.backgroundColor = '#1e40af';
                        e.target.style.padding = '1rem 2rem';
                    }}
                    onMouseLeave={e => {
                        e.target.style.backgroundColor = '#1e3a8a';
                        e.target.style.padding = '1rem 1.5rem';
                    }}
                >
                    <Plus size={20} />
                    <span>Add New Company</span>
                </button>

                {/* Add Company Modal */}
                {showAddCompanyModal && (
                    <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                            <div className="modal-header">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building2 size={20} />
                                    Add New Company
                                </h3>
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowAddCompanyModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleAddCompany}>
                                <div className="modal-body">
                                    {formError && (
                                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1rem' }}>
                                            {formError}
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label">Company Name *</label>
                                            <input type="text" name="name" value={companyForm.name} onChange={handleCompanyInputChange} className="form-input" required />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label">Company Address</label>
                                            <input type="text" name="address" value={companyForm.address} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">GST Number</label>
                                            <input type="text" name="gstNumber" value={companyForm.gstNumber} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Company Email</label>
                                            <input type="email" name="email" value={companyForm.email} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">HR Name</label>
                                            <input type="text" name="hrName" value={companyForm.hrName} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">HR Phone</label>
                                            <input type="tel" name="hrPhone" value={companyForm.hrPhone} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Manager Name</label>
                                            <input type="text" name="managerName" value={companyForm.managerName} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Manager Phone</label>
                                            <input type="tel" name="managerPhone" value={companyForm.managerPhone} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Landline Number</label>
                                            <input type="tel" name="landlineNumber" value={companyForm.landlineNumber} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Estimated Orders</label>
                                            <input type="number" name="estimatedOrders" value={companyForm.estimatedOrders} onChange={handleCompanyInputChange} className="form-input" />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddCompanyModal(false)} disabled={isSubmitting}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        <Save size={18} />
                                        {isSubmitting ? 'Creating...' : 'Create Company'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========== COMPANY DETAIL VIEW ==========
    return (
        <div>
            {/* Back Button & Company Info */}
            <div className="card mb-4">
                <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={handleBackToCompanies} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#1e3a8a' }}>{selectedCompany?.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{selectedCompany?.address}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {selectedCompany?.landlineNumber && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    <Phone size={14} /> {selectedCompany.landlineNumber}
                                </div>
                            )}
                            {selectedCompany?.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    <Mail size={14} /> {selectedCompany.email}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Time/Date Filter */}
            <div className="card mb-4">
                <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="form-label" style={{ marginBottom: 0 }}>Quick Filter:</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[
                                    { value: 'today', label: 'Today' },
                                    { value: 'week', label: 'This Week' },
                                    { value: 'month', label: 'This Month' },
                                    { value: 'all', label: 'All Time' },
                                ].map(period => (
                                    <button
                                        key={period.value}
                                        onClick={() => { setTimePeriod(period.value); setSelectedDate(''); }}
                                        className={`btn btn-sm ${timePeriod === period.value && !selectedDate ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} style={{ color: '#64748b' }} />
                            <span className="form-label" style={{ marginBottom: 0 }}>Select Date:</span>
                            <input type="date" value={selectedDate} onChange={handleDateChange} className="form-input" style={{ padding: '0.5rem 0.75rem', width: 'auto' }} />
                            {selectedDate && (
                                <button onClick={clearDateFilter} className="btn btn-sm btn-secondary" style={{ padding: '0.5rem' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {selectedDate && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', backgroundColor: '#eff6ff', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#1e3a8a' }}>
                            <Calendar size={14} />
                            Showing orders for: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid - Main Stats */}
            <div className="stats-grid mb-4">
                <div className="stat-card" style={{ cursor: 'pointer', border: activeFilter === 'all' ? '2px solid #1e3a8a' : undefined }} onClick={() => handleCardClick('all')}>
                    <div className="stat-info">
                        <h3>Total Orders</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                    <div className="stat-icon primary"><Users size={24} /></div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer', border: activeFilter === 'pending' ? '2px solid #d97706' : undefined }} onClick={() => handleCardClick('pending')}>
                    <div className="stat-info">
                        <h3>Pending Orders</h3>
                        <p className="stat-value">{stats.pending}</p>
                    </div>
                    <div className="stat-icon warning"><Clock size={24} /></div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer', border: activeFilter === 'Moved to Stitching' ? '2px solid #9333ea' : undefined }} onClick={() => handleCardClick('Moved to Stitching')}>
                    <div className="stat-info">
                        <h3>Garment Moved to Stitching</h3>
                        <p className="stat-value">{stats.movedToStitching}</p>
                    </div>
                    <div className="stat-icon success"><CheckCircle size={24} /></div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer', backgroundColor: '#f0fdf4', border: '2px solid #16a34a' }}>
                    <div className="stat-info">
                        <h3>Out of Completed Orders</h3>
                        <p className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.completed}/{stats.total}</p>
                    </div>
                    <div className="stat-icon success"><CheckCircle size={24} /></div>
                </div>
            </div>

            {/* Position-based Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {Object.entries(POSITION_CONFIG).map(([key, config]) => {
                    const IconComponent = config.icon;
                    const count = stats[key] || 0;
                    const isActive = activeFilter === key;
                    return (
                        <div
                            key={key}
                            onClick={() => handleCardClick(key)}
                            style={{
                                padding: '1rem',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                border: isActive ? `2px solid ${config.color}` : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${config.color}20`, color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComponent size={20} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{config.label}</p>
                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>{count}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter indicator */}
            {activeFilter !== 'all' && (
                <div className="card mb-4" style={{ backgroundColor: '#eff6ff' }}>
                    <div className="card-body" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: '#1e3a8a' }}>
                            Filtering by: {POSITION_CONFIG[activeFilter]?.label || (activeFilter === 'pending' ? 'Pending' : activeFilter === 'completed' ? 'Completed' : activeFilter)}
                        </span>
                        <button className="btn btn-sm btn-secondary" onClick={() => setActiveFilter('all')}>Show All</button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Users size={20} />Employee Orders</h3>
                    <span className="badge badge-primary">{displayOrders.length} Orders</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Employee</th>
                                    <th>Position</th>
                                    <th>Sets</th>
                                    <th>Date</th>
                                    <th>Measurements</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="empty-state">
                                                <Users size={48} />
                                                <h3>No Orders Found</h3>
                                                <p>No employee orders match the selected filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayOrders.map(order => (
                                        <tr key={order._id}>
                                            <td className="font-semibold">#{order.orderId || order._id?.toString().slice(-6)}</td>
                                            <td>
                                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{order.phone}</div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500',
                                                    backgroundColor: `${POSITION_CONFIG[order.position]?.color || '#64748b'}20`,
                                                    color: POSITION_CONFIG[order.position]?.color || '#64748b'
                                                }}>
                                                    {order.position}
                                                </span>
                                            </td>
                                            <td>{order.noOfSets || 1}</td>
                                            <td>{order.date}</td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => viewMeasurements(order)}>
                                                    <Eye size={14} /> View
                                                </button>
                                            </td>
                                            <td>
                                                <span className={`badge ${order.status === 'Delivered' || order.status === 'Moved to stitching' ? 'badge-success' : order.status === 'In Progress' ? 'badge-info' : 'badge-warning'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={() => handleStatusChange(order._id, 'Moved to Stitching')}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            backgroundColor: order.status === 'Moved to Stitching' || order.status === 'Delivered' ? '#16a34a' : '#e2e8f0',
                                                            color: order.status === 'Moved to Stitching' || order.status === 'Delivered' ? 'white' : '#64748b',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (order.status !== 'Moved to Stitching' && order.status !== 'Delivered') {
                                                                e.currentTarget.style.backgroundColor = '#dcfce7';
                                                                e.currentTarget.style.color = '#16a34a';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (order.status !== 'Moved to Stitching' && order.status !== 'Delivered') {
                                                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                                                                e.currentTarget.style.color = '#64748b';
                                                            }
                                                        }}
                                                    >
                                                        <Check size={16} />
                                                       
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(order._id, 'Pending')}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            backgroundColor: order.status === 'Pending' ? '#ef4444' : '#e2e8f0',
                                                            color: order.status === 'Pending' ? 'white' : '#64748b',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (order.status !== 'Pending') {
                                                                e.currentTarget.style.backgroundColor = '#fee2e2';
                                                                e.currentTarget.style.color = '#ef4444';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (order.status !== 'Pending') {
                                                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                                                                e.currentTarget.style.color = '#64748b';
                                                            }
                                                        }}
                                                    >
                                                        <XCircle size={16} />
                                                        
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(order._id, 'Completed')}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            backgroundColor: order.status === 'Completed' || order.status === 'Delivered' ? '#3b82f6' : '#e2e8f0',
                                                            color: order.status === 'Completed' || order.status === 'Delivered' ? 'white' : '#64748b',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (order.status !== 'Completed' && order.status !== 'Delivered') {
                                                                e.currentTarget.style.backgroundColor = '#dbeafe';
                                                                e.currentTarget.style.color = '#3b82f6';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (order.status !== 'Completed' && order.status !== 'Delivered') {
                                                                e.currentTarget.style.backgroundColor = '#e2e8f0';
                                                                e.currentTarget.style.color = '#64748b';
                                                            }
                                                        }}
                                                    >
                                                        <CheckCircle size={16} />
                                                        Stich Completed
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Order Button - Bottom Right */}
            <button
                onClick={handleOpenOrderModal}
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
                <Plus size={24} />
                <span style={{ display: 'none', whiteSpace: 'nowrap' }}>Add New Order</span>
            </button>

            {/* Create Order Modal */}
            {showCreateOrderModal && (
                <div className="modal-overlay" onClick={handleCloseOrderModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} />
                                Create Employee Order - {selectedCompany?.name}
                            </h3>
                            <button className="btn btn-sm btn-secondary" onClick={handleCloseOrderModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder}>
                            <div className="modal-body">
                                {formError && (
                                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1rem' }}>
                                        {formError}
                                    </div>
                                )}

                                {/* Employee Details */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Users size={18} />
                                        Employee Details
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Order ID</label>
                                            <input type="text" name="orderId" value={orderForm.orderId} onChange={handleOrderInputChange} className="form-input" readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Position *</label>
                                            <select name="position" value={orderForm.position} onChange={handleOrderInputChange} className="form-select">
                                                {Object.keys(POSITION_CONFIG).map(pos => (
                                                    <option key={pos} value={pos}>{POSITION_CONFIG[pos].label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Employee Name *</label>
                                            <input type="text" name="name" value={orderForm.name} onChange={handleOrderInputChange} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone Number *</label>
                                            <input type="tel" name="phone" value={orderForm.phone} onChange={handleOrderInputChange} className="form-input" required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Number of Sets</label>
                                            <input type="number" name="noOfSets" value={orderForm.noOfSets} onChange={handleOrderInputChange} className="form-input" min="1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Measurements */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <Shirt size={18} />
                                            Shirt Measurements (inches)
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {['length', 'shoulder', 'sleeve', 'chest', 'collar', 'waist'].map(field => (
                                                <div className="form-group" key={field}>
                                                    <label className="form-label" style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{field}</label>
                                                    <input type="number" step="0.5" name={field} value={orderForm.shirt[field]} onChange={handleShirtChange} className="form-input" style={{ padding: '0.5rem' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <PanelBottom size={18} />
                                            Pant Measurements (inches)
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'].map(field => (
                                                <div className="form-group" key={field}>
                                                    <label className="form-label" style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{field}</label>
                                                    <input type="number" step="0.5" name={field} value={orderForm.pant[field]} onChange={handlePantChange} className="form-input" style={{ padding: '0.5rem' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={handleCloseOrderModal} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    <Save size={18} />
                                    {isSubmitting ? 'Creating...' : 'Create Order'}
                                </button>
                            </div>
                        </form>
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
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                                <span style={{ fontWeight: '500', color: '#1e3a8a' }}>Position: </span>
                                <span style={{ 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.875rem',
                                    backgroundColor: `${POSITION_CONFIG[selectedOrder.position]?.color || '#64748b'}20`,
                                    color: POSITION_CONFIG[selectedOrder.position]?.color || '#64748b'
                                }}>
                                    {selectedOrder.position}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
                                <div>
                                    <h4 className="form-section-title">
                                        <PanelBottom size={18} style={{ marginRight: '0.5rem' }} />
                                        Pant
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedOrder.pant && Object.entries(selectedOrder.pant).map(([key, value]) => (
                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                                                <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{key}</span>
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
        </div>
    );
};

export default CompanyDashboard;
