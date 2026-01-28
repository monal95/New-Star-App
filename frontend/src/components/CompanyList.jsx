import React, { useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';

const CompanyList = ({ companies, addCompany, removeCompany }) => {
    const [newCompany, setNewCompany] = useState({ name: '', orderCount: '' });

    const handleAdd = (e) => {
        e.preventDefault();
        if (newCompany.name) {
            addCompany({ ...newCompany, status: 'Active' });
            setNewCompany({ name: '', orderCount: '' });
        }
    };

    return (
        <div>
            {/* Add Company Card */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <Plus size={20} />
                        Add New Company
                    </h3>
                </div>
                <div className="card-body">
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">Company Name</label>
                            <input
                                className="form-input"
                                placeholder="Enter company name"
                                value={newCompany.name}
                                onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Expected Orders</label>
                            <input
                                className="form-input"
                                placeholder="Number of orders"
                                type="number"
                                value={newCompany.orderCount}
                                onChange={e => setNewCompany({ ...newCompany, orderCount: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>
                            <Plus size={18} /> Add Company
                        </button>
                    </form>
                </div>
            </div>

            {/* Companies Table Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Building2 size={20} />
                        Company Directory
                    </h3>
                    <span className="badge badge-primary">{companies.length} Companies</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Company Name</th>
                                    <th>Total Orders</th>
                                    <th>Status</th>
                                    <th style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="4">
                                            <div className="empty-state">
                                                <Building2 size={48} />
                                                <h3>No Companies Added</h3>
                                                <p>Add your first company using the form above.</p>
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
                                            <td>
                                                <button 
                                                    onClick={() => removeCompany(company.id)} 
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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

export default CompanyList;
