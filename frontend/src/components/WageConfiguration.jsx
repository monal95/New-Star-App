import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { wagesAPI } from '../services/api';
import Toast from './Toast';

const WageConfiguration = () => {
    const [wages, setWages] = useState({
        pant: 110,
        shirt: 100,
        ironing_pant: 12,
        ironing_shirt: 10,
        embroidery: 25
    });

    const [editingWages, setEditingWages] = useState({ ...wages });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Load wage configuration from API
    useEffect(() => {
        const fetchWages = async () => {
            try {
                setLoading(true);
                const data = await wagesAPI.get();
                setWages(data);
                setEditingWages(data);
            } catch (error) {
                console.error('Error fetching wages:', error);
                setToast({ show: true, message: 'Failed to load wage configuration', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchWages();
    }, []);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        setEditingWages(prev => ({
            ...prev,
            [name]: numValue
        }));
        setIsDirty(true);
    };

    // Save wage configuration
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validation
            const values = Object.values(editingWages);
            if (values.some(v => v < 0 || isNaN(v))) {
                setToast({ show: true, message: 'All wages must be positive numbers', type: 'error' });
                setIsSubmitting(false);
                return;
            }

            const result = await wagesAPI.update(editingWages);
            setWages(editingWages);
            setIsDirty(false);
            setToast({ show: true, message: 'Wage configuration updated successfully', type: 'success' });
        } catch (error) {
            console.error('Error updating wages:', error);
            setToast({ show: true, message: error.message || 'Failed to update wage configuration', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset to saved values
    const handleReset = () => {
        setEditingWages({ ...wages });
        setIsDirty(false);
    };

    // Reset to default wages
    const handleResetToDefault = async () => {
        if (!confirm('Are you sure you want to reset to default wage rates?')) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await wagesAPI.reset();
            setWages(result.wages);
            setEditingWages(result.wages);
            setIsDirty(false);
            setToast({ show: true, message: 'Wages reset to default values', type: 'success' });
        } catch (error) {
            console.error('Error resetting wages:', error);
            setToast({ show: true, message: error.message || 'Failed to reset wages', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading wage configuration...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <DollarSign size={32} style={{ color: '#3b82f6' }} />
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1e293b' }}>
                        Wage Configuration
                    </h1>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                    Manage and configure standard wage rates for different types of work
                </p>
            </div>

            {/* Information Card */}
            <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
            }}>
                <AlertCircle size={20} style={{ color: '#1e40af', flexShrink: 0, marginTop: '0.2rem' }} />
                <div style={{ color: '#1e40af' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>How wages are calculated:</p>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                        <li>Pant/Shirt: wage_rate × quantity assigned</li>
                        <li>Ironing: wage_rate × quantity assigned</li>
                        <li>Embroidery: wage_rate × pieces assigned</li>
                    </ul>
                </div>
            </div>

            {/* Wage Configuration Form */}
            <form onSubmit={handleSave}>
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }}>
                    {/* Tailoring Wages */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '2px solid #e2e8f0'
                        }}>
                            Tailoring Wages (Per Set)
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Pant */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Pant Tailoring
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem', color: '#64748b' }}>Rs.</span>
                                    <input
                                        type="number"
                                        name="pant"
                                        value={editingWages.pant}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        step="1"
                                        min="0"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Shirt */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Shirt Tailoring
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem', color: '#64748b' }}>Rs.</span>
                                    <input
                                        type="number"
                                        name="shirt"
                                        value={editingWages.shirt}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        step="1"
                                        min="0"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ironing Wages */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '2px solid #e2e8f0'
                        }}>
                            Ironing Wages (Per Piece)
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Ironing Pant */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Iron Pant
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem', color: '#64748b' }}>Rs.</span>
                                    <input
                                        type="number"
                                        name="ironing_pant"
                                        value={editingWages.ironing_pant}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        step="0.5"
                                        min="0"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Ironing Shirt */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Iron Shirt
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem', color: '#64748b' }}>Rs.</span>
                                    <input
                                        type="number"
                                        name="ironing_shirt"
                                        value={editingWages.ironing_shirt}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        step="0.5"
                                        min="0"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Embroidery Wages */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '2px solid #e2e8f0'
                        }}>
                            Embroidery Wages
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Embroidery Per Piece */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase'
                                }}>
                                    Embroidery Per Piece
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem', color: '#64748b' }}>Rs.</span>
                                    <input
                                        type="number"
                                        name="embroidery"
                                        value={editingWages.embroidery}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        step="1"
                                        min="0"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'flex-end',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={!isDirty || isSubmitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#fff',
                                color: '#64748b',
                                fontWeight: '500',
                                cursor: !isDirty || isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: !isDirty || isSubmitting ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleResetToDefault}
                            disabled={isSubmitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                fontWeight: '500',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.5 : 1,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <RotateCcw size={16} />
                            Reset to Default
                        </button>

                        <button
                            type="submit"
                            disabled={!isDirty || isSubmitting}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                fontWeight: '500',
                                cursor: !isDirty || isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: !isDirty || isSubmitting ? 0.5 : 1,
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Save size={16} />
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Rate Summary */}
            <div style={{ marginTop: '2rem' }}>
                <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '1rem'
                }}>
                    Current Wage Summary
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    {Object.entries(editingWages).map(([key, value]) => (
                        <div
                            key={key}
                            style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '1rem'
                            }}
                        >
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#64748b',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                {key.replace(/_/g, ' ')}
                            </div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#3b82f6'
                            }}>
                                Rs. {value.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WageConfiguration;
