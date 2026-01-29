const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Get all companies
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const companies = await db.collection('companies').find({}).sort({ createdAt: -1 }).toArray();
        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Get single company by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const company = await db.collection('companies').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

// Create new company
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            name,
            address,
            gstNumber,
            hrName,
            hrPhone,
            managerName,
            managerPhone,
            landlineNumber,
            estimatedOrders,
            email
        } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Check if company already exists
        const existingCompany = await db.collection('companies').findOne({ name });
        if (existingCompany) {
            return res.status(400).json({ error: 'Company with this name already exists' });
        }

        const newCompany = {
            name,
            address: address || '',
            gstNumber: gstNumber || '',
            hrName: hrName || '',
            hrPhone: hrPhone || '',
            managerName: managerName || '',
            managerPhone: managerPhone || '',
            landlineNumber: landlineNumber || '',
            estimatedOrders: parseInt(estimatedOrders) || 0,
            email: email || '',
            status: 'Active',
            totalOrders: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('companies').insertOne(newCompany);
        
        res.status(201).json({ 
            message: 'Company created successfully',
            company: { ...newCompany, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

// Update company
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = { ...req.body, updatedAt: new Date() };
        delete updateData._id;

        const result = await db.collection('companies').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ message: 'Company updated successfully' });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

// Delete company
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        
        // Also delete all employees/orders for this company
        await db.collection('company_employees').deleteMany({ 
            companyId: new ObjectId(req.params.id) 
        });
        
        const result = await db.collection('companies').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

// Get company statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const db = getDB();
        const companyId = new ObjectId(req.params.id);
        
        const employees = await db.collection('company_employees')
            .find({ companyId })
            .toArray();
        
        const stats = {
            totalEmployees: employees.length,
            pending: employees.filter(e => e.status === 'Pending' || e.status === 'In Progress').length,
            completed: employees.filter(e => e.status === 'Delivered' || e.status === 'Completed').length,
            byPosition: {}
        };

        // Count by position
        employees.forEach(emp => {
            const pos = emp.position || 'Other';
            stats.byPosition[pos] = (stats.byPosition[pos] || 0) + 1;
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching company stats:', error);
        res.status(500).json({ error: 'Failed to fetch company stats' });
    }
});

module.exports = router;
