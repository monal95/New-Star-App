import React, { useState, useMemo, useEffect } from 'react';
import { Users, Phone, Briefcase, Calendar, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import Toast from './Toast';
import { labourAPI, workAssignmentsAPI } from '../services/api';

// Labour categories constant
const LABOUR_CATEGORIES = ['Tailor', 'Iron Master', 'Embroider'];

const LabourDashboard = ({ searchTerm = '', filterCategory = 'all' }) => {
    const [labourData, setLabourData] = useState([]);
    const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
    const [internalFilterCategory, setInternalFilterCategory] = useState(filterCategory);
    const [showModal, setShowModal] = useState(false);
    const [editingLabour, setEditingLabour] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLabourForStats, setSelectedLabourForStats] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'Tailor',
        specialist: '',
        age: '',
        phone: '',
        photo: '',
        joinDate: '',
        status: 'Active'
    });

    // Load labour data from API
    useEffect(() => {
        const fetchLabourData = async () => {
            try {
                const data = await labourAPI.getAll();
                setLabourData(data);
            } catch (error) {
                console.error('Failed to fetch labour data:', error);
                setToast({ show: true, message: 'Failed to load labour data', type: 'error' });
            }
        };
        fetchLabourData();
    }, []);

    // Sync internal state with props
    useEffect(() => {
        setInternalSearchTerm(searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        setInternalFilterCategory(filterCategory);
    }, [filterCategory]);

    // Filter labour by category and search term
    const filteredLabour = useMemo(() => {
        return labourData.filter(labour => {
            const matchCategory = internalFilterCategory === 'all' || labour.category === internalFilterCategory;
            const matchSearch = 
                labour.name.toLowerCase().includes(internalSearchTerm.toLowerCase()) ||
                labour.specialist.toLowerCase().includes(internalSearchTerm.toLowerCase()) ||
                labour.phone.includes(internalSearchTerm);
            return matchCategory && matchSearch;
        });
    }, [labourData, internalFilterCategory, internalSearchTerm]);

    // Group labour by category
    const labourByCategory = useMemo(() => {
        const grouped = {};
        LABOUR_CATEGORIES.forEach(cat => {
            grouped[cat] = filteredLabour.filter(l => l.category === cat);
        });
        return grouped;
    }, [filteredLabour]);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Tailor',
            specialist: '',
            age: '',
            phone: '',
            photo: '',
            joinDate: '',
            status: 'Active'
        });
        setEditingLabour(null);
    };

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle photo upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Open add labour modal
    const handleAddLabour = () => {
        resetForm();
        setShowModal(true);
    };

    // Open edit labour modal
    const handleEditLabour = (labour) => {
        setFormData({
            name: labour.name,
            category: labour.category,
            specialist: labour.specialist,
            age: labour.age || '',
            phone: labour.phone,
            photo: labour.photo || '',
            joinDate: labour.joinDate || '',
            status: labour.status || 'Active'
        });
        setEditingLabour(labour._id);
        setShowModal(true);
    };

    // Save labour
    const handleSaveLabour = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation
        if (!formData.name || !formData.phone || !formData.specialist) {
            setToast({ show: true, message: 'Name, Phone, and Specialist field are required', type: 'error' });
            setIsSubmitting(false);
            return;
        }

        try {
            if (editingLabour) {
                // Update existing labour
                await labourAPI.update(editingLabour, {
                    name: formData.name,
                    category: formData.category,
                    specialist: formData.specialist,
                    age: formData.age,
                    phone: formData.phone,
                    photo: formData.photo,
                    joinDate: formData.joinDate,
                    status: formData.status
                });
                setToast({ show: true, message: 'Labour Updated Successfully', type: 'success' });
            } else {
                // Add new labour
                await labourAPI.create({
                    name: formData.name,
                    category: formData.category,
                    specialist: formData.specialist,
                    age: formData.age,
                    phone: formData.phone,
                    photo: formData.photo,
                    joinDate: formData.joinDate,
                    status: formData.status
                });
                setToast({ show: true, message: 'Labour Added Successfully', type: 'success' });
            }

            // Refresh labour data from API
            const updatedData = await labourAPI.getAll();
            setLabourData(updatedData);
            handleCloseModal();
        } catch (error) {
            setToast({ show: true, message: error.message || 'Error saving labour', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete labour
    const handleDeleteLabour = async (id) => {
        if (confirm('Are you sure you want to delete this labour?')) {
            try {
                await labourAPI.delete(id);
                setToast({ show: true, message: 'Labour Deleted Successfully', type: 'success' });
                
                // Refresh labour data from API
                const updatedData = await labourAPI.getAll();
                setLabourData(updatedData);
            } catch (error) {
                setToast({ show: true, message: error.message || 'Failed to delete labour', type: 'error' });
            }
        }
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    return (
        <div>
            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {/* Search and Filter Section - Removed, moved to header */}

            {/* Labour Grid by Category */}
            {LABOUR_CATEGORIES.map(category => (
                <div key={category}>
                    {/* Category Header */}
                    <div style={{
                        padding: '0.7rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        marginTop: '1.5rem',
                        marginBottom: '1rem',
                        borderLeft: '4px solid #3b82f6'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                            {category} ({labourByCategory[category].length})
                        </h2>
                    </div>

                    {/* Labour Cards Grid */}
                    {labourByCategory[category].length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem 1.5rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '1.25rem'
                        }}>
                            <Users size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                            <p style={{ color: '#64748b', fontSize: '1rem' }}>
                                No {category}s found. Click "Add Labour" to add one.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.25rem'
                        }}>
                            {labourByCategory[category].map(labour => (
                                <div
                                    key={labour._id}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                    }}
                                    onClick={() => setSelectedLabourForStats(labour)}
                                >
                                    {/* Photo Container - Bigger */}
                                    <div style={{
                                        width: '100%',
                                        height: '380px',
                                        backgroundColor: '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {labour.photo ? (
                                            <img
                                                src={labour.photo}
                                                alt={labour.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <Users size={80} style={{ color: '#cbd5e1' }} />
                                        )}
                                    </div>

                                    {/* Name and Specialist Only */}
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                        {/* Name */}
                                        <h3 style={{
                                            margin: '0 0 0.5rem 0',
                                            fontSize: '1.1rem',
                                            color: '#1e293b',
                                            fontWeight: '600'
                                        }}>
                                            {labour.name}
                                        </h3>

                                        {/* Specialist */}
                                        <p style={{
                                            margin: '0',
                                            color: '#64748b',
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic'
                                        }}>
                                            {labour.specialist}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Floating Add Labour Button at Bottom Center */}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                left: '60%',
                transform: 'translateX(-50%)',
                zIndex: 900
            }}>
                <button
                    onClick={handleAddLabour}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '100px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                    }}
                >
                    <Plus size={20} />
                    Add Labour
                </button>
            </div>

            {/* Labour Stats Detailed View Modal */}
            {selectedLabourForStats && (
                <LabourStatsModal 
                    labour={selectedLabourForStats} 
                    onClose={() => setSelectedLabourForStats(null)}
                    onEdit={(labour) => {
                        handleEditLabour(labour);
                        setSelectedLabourForStats(null);
                    }}
                    onDelete={(id) => {
                        handleDeleteLabour(id);
                        setSelectedLabourForStats(null);
                    }}
                />
            )}

            {/* Add/Edit Labour Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                                {editingLabour ? 'Edit Labour' : 'Add New Labour'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem' }}>
                            <form onSubmit={handleSaveLabour}>
                                {/* Photo Upload */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Photo</label>
                                    <div style={{
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        cursor: 'pointer'
                                    }}>
                                        {formData.photo ? (
                                            <div>
                                                <img
                                                    src={formData.photo}
                                                    alt="Preview"
                                                    style={{
                                                        maxWidth: '280px',
                                                        maxHeight: '280px',
                                                        borderRadius: '8px',
                                                        marginBottom: '1rem'
                                                    }}
                                                />
                                                <p style={{ margin: '0.5rem 0' }}>
                                                    <label htmlFor="photo" style={{ color: '#3b82f6', cursor: 'pointer' }}>
                                                        Change photo
                                                    </label>
                                                </p>
                                            </div>
                                        ) : (
                                            <label htmlFor="photo" style={{ cursor: 'pointer' }}>
                                                <Users size={32} style={{ color: '#cbd5e1', margin: '0 auto 0.5rem' }} />
                                                <p style={{ margin: 0, color: '#64748b' }}>Click to upload photo</p>
                                            </label>
                                        )}
                                        <input
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                {/* Name */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter labour name"
                                    />
                                </div>

                                {/* Category */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        {LABOUR_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Specialist */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Specialist *</label>
                                    <input
                                        type="text"
                                        name="specialist"
                                        value={formData.specialist}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., Shirt Tailoring, Iron Pressing, Embroidery Design"
                                    />
                                </div>

                                {/* Age */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter age"
                                    />
                                </div>

                                {/* Phone */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                {/* Join Date */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Join Date</label>
                                    <input
                                        type="date"
                                        name="joinDate"
                                        value={formData.joinDate}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>

                                {/* Status */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : editingLabour ? 'Update Labour' : 'Add Labour'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="btn btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Labour Stats Modal Component
const LabourStatsModal = ({ labour, onClose, onEdit, onDelete }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load work assignments from API
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                setLoading(true);
                const data = await workAssignmentsAPI.getByLabour(labour._id);
                setAssignments(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching assignments:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (labour && labour._id) {
            fetchAssignments();
        }
    }, [labour]);

    const totalWages = assignments.reduce((sum, work) => sum + work.totalWages, 0);
    const totalQuantity = assignments.reduce((sum, work) => sum + work.quantity, 0);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '1400px',
                height: '90vh',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: '600' }}>
                        Labour Statistics - {labour.name}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: 0,
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#1e293b'}
                        onMouseLeave={(e) => e.target.style.color = '#64748b'}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '350px 1fr',
                    gap: '2rem',
                    padding: '2rem',
                    overflow: 'hidden',
                    flex: 1
                }}>
                    {/* Left Panel - Labour Details */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        overflowY: 'auto',
                        paddingRight: '1rem'
                    }}>
                        {/* Photo */}
                        <div style={{
                            width: '100%',
                            height: '280px',
                            borderRadius: '12px',
                            backgroundColor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            {labour.photo ? (
                                <img
                                    src={labour.photo}
                                    alt={labour.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <Users size={100} style={{ color: '#cbd5e1' }} />
                            )}
                        </div>

                        {/* Labour Details Section */}
                        <div style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            padding: '1.5rem'
                        }}>
                            <h3 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.1rem',
                                color: '#1e293b',
                                fontWeight: '600',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '1rem'
                            }}>
                                Labour Details
                            </h3>

                            {/* Name */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Name
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    color: '#1e293b',
                                    fontWeight: '500'
                                }}>
                                    {labour.name}
                                </p>
                            </div>

                            {/* Category */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Category
                                </label>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    border: '1px solid #bfdbfe'
                                }}>
                                    {labour.category}
                                </span>
                            </div>

                            {/* Specialist */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Specialist
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    color: '#1e293b',
                                    fontWeight: '500'
                                }}>
                                    {labour.specialist}
                                </p>
                            </div>

                            {/* Age */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Age
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    color: '#1e293b',
                                    fontWeight: '500'
                                }}>
                                    {labour.age || 'N/A'} years
                                </p>
                            </div>

                            {/* Phone */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Phone
                                </label>
                                <a
                                    href={`tel:${labour.phone}`}
                                    style={{
                                        fontSize: '0.95rem',
                                        color: '#3b82f6',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    {labour.phone}
                                </a>
                            </div>

                            {/* Status */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Status
                                </label>
                                <span style={{
                                    display: 'inline-block',
                                    backgroundColor: labour.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                    color: labour.status === 'Active' ? '#166534' : '#991b1b',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    {labour.status}
                                </span>
                            </div>

                            {/* Join Date */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Join Date
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    color: '#1e293b',
                                    fontWeight: '500'
                                }}>
                                    {labour.joinDate && new Date(labour.joinDate).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem'
                            }}>
                                <button
                                    onClick={() => onEdit(labour)}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.6rem',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this labour?')) {
                                            onDelete(labour._id);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        padding: '0.6rem',
                                        fontSize: '0.85rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fecaca';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fee2e2';
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Work History */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        overflowY: 'auto'
                    }}>
                        {/* Summary Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '1rem'
                        }}>
                            {/* Total Wages */}
                            <div style={{
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #86efac',
                                borderRadius: '8px',
                                padding: '1rem'
                            }}>
                                <label style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#166534',
                                    textTransform: 'uppercase'
                                }}>
                                    Total Wages Earned
                                </label>
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: '#166534'
                                }}>
                                    Rs. {totalWages.toLocaleString()}
                                </p>
                            </div>

                            {/* Total Items */}
                            <div style={{
                                backgroundColor: '#eff6ff',
                                border: '1px solid #93c5fd',
                                borderRadius: '8px',
                                padding: '1rem'
                            }}>
                                <label style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#1e40af',
                                    textTransform: 'uppercase'
                                }}>
                                    Total Items Completed
                                </label>
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: '#1e40af'
                                }}>
                                    {totalQuantity}
                                </p>
                            </div>
                        </div>

                        {/* Work History Table */}
                        <div style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h3 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.1rem',
                                color: '#1e293b',
                                fontWeight: '600',
                                borderBottom: '2px solid #e2e8f0',
                                paddingBottom: '1rem'
                            }}>
                                Work Assignments
                            </h3>

                            {/* Loading State */}
                            {loading && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '200px',
                                    color: '#64748b'
                                }}>
                                    <p>Loading assignments...</p>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div style={{
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <AlertCircle size={20} />
                                    <p style={{ margin: 0 }}>{error}</p>
                                </div>
                            )}

                            {/* No Data State */}
                            {!loading && !error && assignments.length === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: '#64748b'
                                }}>
                                    <p>No work assignments yet. Assign work from order dashboards.</p>
                                </div>
                            )}

                            {/* Work Items */}
                            {!loading && assignments.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    overflowY: 'auto',
                                    flex: 1
                                }}>
                                    {assignments.map((work) => (
                                        <div
                                            key={work._id}
                                            style={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                padding: '1rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            {/* Order and Date Header */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <div>
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: '600',
                                                        color: '#3b82f6',
                                                        backgroundColor: '#eff6ff',
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '4px',
                                                        marginRight: '0.5rem'
                                                    }}>
                                                        {work.orderCustomerName || work.orderId}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: '#64748b'
                                                    }}>
                                                        {new Date(work.assignedDate).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <span style={{
                                                    display: 'inline-block',
                                                    backgroundColor: work.status === 'Completed' ? '#dcfce7' : work.status === 'InProgress' ? '#fef3c7' : '#dbeafe',
                                                    color: work.status === 'Completed' ? '#166534' : work.status === 'InProgress' ? '#92400e' : '#1e40af',
                                                    padding: '0.3rem 0.6rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {work.status}
                                                </span>
                                            </div>

                                            {/* Work Type and Description */}
                                            <p style={{
                                                margin: '0 0 0.75rem 0',
                                                fontSize: '0.95rem',
                                                color: '#1e293b',
                                                fontWeight: '500'
                                            }}>
                                                {work.workType} {work.quantity && `(${work.quantity} items)`}
                                            </p>
                                            {work.description && (
                                                <p style={{
                                                    margin: '0 0 0.75rem 0',
                                                    fontSize: '0.85rem',
                                                    color: '#64748b'
                                                }}>
                                                    {work.description}
                                                </p>
                                            )}

                                            {/* Wages and Details */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr 1fr',
                                                gap: '1rem',
                                                borderTop: '1px solid #e2e8f0',
                                                paddingTop: '0.75rem'
                                            }}>
                                                <div>
                                                    <label style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        color: '#64748b',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Rate/Item
                                                    </label>
                                                    <p style={{
                                                        margin: '0.3rem 0 0 0',
                                                        fontSize: '1rem',
                                                        fontWeight: '700',
                                                        color: '#7c3aed'
                                                    }}>
                                                        Rs. {work.wagePerUnit}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        color: '#64748b',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Total Wages
                                                    </label>
                                                    <p style={{
                                                        margin: '0.3rem 0 0 0',
                                                        fontSize: '1.1rem',
                                                        fontWeight: '700',
                                                        color: '#16a34a'
                                                    }}>
                                                        Rs. {work.totalWages}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '600',
                                                        color: '#64748b',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Quantity
                                                    </label>
                                                    <p style={{
                                                        margin: '0.3rem 0 0 0',
                                                        fontSize: '1rem',
                                                        fontWeight: '700',
                                                        color: '#2563eb'
                                                    }}>
                                                        {work.quantity} pcs
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabourDashboard;
