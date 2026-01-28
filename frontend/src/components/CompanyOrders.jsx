import React, { useState } from 'react';
import { Building2, User, ArrowLeft, Save, Package } from 'lucide-react';

const CompanyOrders = ({ companies, addOrder }) => {
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '', phno: '', position: '',
        shirt: { shoulder: '', collar: '', sleeve: '', length: '', chest: '' },
        pant: { length: '', hip: '', thigh: '', bottom: '', zip: '', butt: '' },
        noOfSets: '1'
    });

    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
    };

    const handleBack = () => {
        setSelectedCompany(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const orderData = {
            ...formData,
            id: Date.now(),
            companyId: selectedCompany.id,
            companyName: selectedCompany.name,
            date: new Date().toLocaleDateString(),
            status: 'Pending',
            type: 'Company'
        };
        addOrder(orderData);
        alert(`Order for ${formData.name} in ${selectedCompany.name} saved!`);
        setFormData({
            name: '', phno: '', position: '',
            shirt: { shoulder: '', collar: '', sleeve: '', length: '', chest: '' },
            pant: { length: '', hip: '', thigh: '', bottom: '', zip: '', butt: '' },
            noOfSets: '1'
        });
    };

    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    // Company Selection View
    if (!selectedCompany) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Building2 size={20} />
                        Select Company for Bulk Orders
                    </h3>
                </div>
                <div className="card-body">
                    {companies.length === 0 ? (
                        <div className="empty-state">
                            <Building2 size={48} />
                            <h3>No Companies Available</h3>
                            <p>Please add companies first from the Companies section.</p>
                        </div>
                    ) : (
                        <div className="company-grid">
                            {companies.map(company => (
                                <div
                                    key={company.id}
                                    className="company-card"
                                    onClick={() => handleCompanySelect(company)}
                                >
                                    <div className="company-card-header">
                                        <div>
                                            <h4 className="company-name">{company.name}</h4>
                                            <p className="company-orders">{company.orderCount} Expected Orders</p>
                                        </div>
                                        <div className="stat-icon primary" style={{ width: '40px', height: '40px' }}>
                                            <Package size={20} />
                                        </div>
                                    </div>
                                    <span className="badge badge-success">{company.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Individual Order Form View
    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <button onClick={handleBack} className="back-link">
                        <ArrowLeft size={16} /> Back to Company Selection
                    </button>
                    <h3 className="card-title mb-0">
                        <User size={20} />
                        Add Employee Order - {selectedCompany.name}
                    </h3>
                </div>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    {/* Employee Details */}
                    <div className="form-section">
                        <h4 className="form-section-title">Employee Information</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Employee Name *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="Enter employee name"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input 
                                    type="tel" 
                                    className="form-input"
                                    value={formData.phno} 
                                    onChange={e => setFormData({ ...formData, phno: e.target.value })} 
                                    placeholder="Enter phone number"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Position/Department</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.position} 
                                    onChange={e => setFormData({ ...formData, position: e.target.value })} 
                                    placeholder="e.g., Manager, Staff"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Number of Sets</label>
                                <input 
                                    type="number" 
                                    className="form-input"
                                    value={formData.noOfSets} 
                                    onChange={e => setFormData({ ...formData, noOfSets: e.target.value })} 
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Measurements Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Shirt Section */}
                        <div className="form-section">
                            <h4 className="form-section-title">Shirt Measurements (inches)</h4>
                            <div className="form-grid">
                                {['shoulder', 'collar', 'sleeve', 'length', 'chest'].map(field => (
                                    <div className="form-group" key={field}>
                                        <label className="form-label" style={{ textTransform: 'capitalize' }}>{field}</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={formData.shirt[field]} 
                                            onChange={e => handleNestedChange('shirt', field, e.target.value)} 
                                            placeholder="0.0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pant Section */}
                        <div className="form-section">
                            <h4 className="form-section-title">Pant Measurements (inches)</h4>
                            <div className="form-grid">
                                {['length', 'hip', 'thigh', 'bottom', 'zip', 'butt'].map(field => (
                                    <div className="form-group" key={field}>
                                        <label className="form-label" style={{ textTransform: 'capitalize' }}>
                                            {field === 'butt' ? 'Seat' : field}
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={formData.pant[field]} 
                                            onChange={e => handleNestedChange('pant', field, e.target.value)} 
                                            placeholder="0.0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block mt-4">
                        <Save size={20} /> Save Employee Order
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompanyOrders;
