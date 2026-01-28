import React, { useState } from 'react';
import { Save, User } from 'lucide-react';

const CivilForm = ({ addOrder }) => {
    const [formData, setFormData] = useState({
        name: '', phno: '', email: '', position: '',
        shirt: { shoulder: '', collar: '', sleeve: '', length: '', chest: '' },
        pant: { length: '', hip: '', thigh: '', bottom: '', zip: '', butt: '' },
        payment: '', noOfSets: '1'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addOrder({ ...formData, id: Date.now(), date: new Date().toLocaleDateString(), status: 'Pending' });
        alert('Order saved successfully!');
        setFormData({
            name: '', phno: '', email: '', position: '',
            shirt: { shoulder: '', collar: '', sleeve: '', length: '', chest: '' },
            pant: { length: '', hip: '', thigh: '', bottom: '', zip: '', butt: '' },
            payment: '', noOfSets: '1'
        });
    };

    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <User size={20} />
                    Customer Measurement Form
                </h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    {/* Customer Details Section */}
                    <div className="form-section">
                        <h4 className="form-section-title">Customer Information</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="Enter customer name"
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
                                <label className="form-label">Email Address</label>
                                <input 
                                    type="email" 
                                    className="form-input"
                                    value={formData.email} 
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Position/Title</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.position} 
                                    onChange={e => setFormData({ ...formData, position: e.target.value })} 
                                    placeholder="e.g., Manager, Staff"
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
                                {Object.keys(formData.shirt).map(field => (
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
                                {Object.keys(formData.pant).map(field => (
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

                    {/* Order Details */}
                    <div className="form-section">
                        <h4 className="form-section-title">Order Details</h4>
                        <div className="form-grid">
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
                            <div className="form-group">
                                <label className="form-label">Payment Mode / Status</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={formData.payment} 
                                    onChange={e => setFormData({ ...formData, payment: e.target.value })} 
                                    placeholder="e.g., Cash, UPI, Pending"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-block mt-4">
                        <Save size={20} /> Save Customer Order
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CivilForm;
