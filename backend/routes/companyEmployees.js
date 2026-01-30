const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Position types for company employees
const POSITION_TYPES = [
    'Employee',
    'Watchman',
    'Security',
    'HR',
    'Manager',
    'Senior Manager',
    'Housekeeping',
    'Other'
];

// Get all employees for a company
router.get('/company/:companyId', async (req, res) => {
    try {
        const db = getDB();
        const companyId = new ObjectId(req.params.companyId);
        
        const employees = await db.collection('company_employees')
            .find({ companyId })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Get single employee by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const employee = await db.collection('company_employees').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Create new employee order
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            companyId,
            orderId,
            name,
            phone,
            position,
            noOfSets,
            shirt,
            pant
        } = req.body;

        // Validate required fields
        if (!companyId || !name || !phone) {
            return res.status(400).json({ error: 'Company ID, name, and phone are required' });
        }

        // Validate position
        const validPosition = POSITION_TYPES.includes(position) ? position : 'Employee';

        const newEmployee = {
            companyId: new ObjectId(companyId),
            orderId: orderId || `EMP${Date.now().toString().slice(-6)}`,
            name,
            phone,
            position: validPosition,
            noOfSets: parseInt(noOfSets) || 1,
            shirt: shirt || {},
            pant: pant || {},
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('company_employees').insertOne(newEmployee);
        
        // Update company's total orders count
        await db.collection('companies').updateOne(
            { _id: new ObjectId(companyId) },
            { $inc: { totalOrders: 1 } }
        );
        
        res.status(201).json({ 
            message: 'Employee order created successfully',
            employee: { ...newEmployee, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating employee order:', error);
        res.status(500).json({ error: 'Failed to create employee order' });
    }
});

// Update employee status
router.patch('/:id/status', async (req, res) => {
    try {
        const db = getDB();
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['Pending', 'In Progress', 'Ready', 'Delivered', 'Completed', 'Moved to Stitching'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.collection('company_employees').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Update employee order
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = { ...req.body, updatedAt: new Date() };
        delete updateData._id;
        delete updateData.companyId; // Don't allow changing company

        const result = await db.collection('company_employees').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        
        // Get employee first to update company count
        const employee = await db.collection('company_employees').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await db.collection('company_employees').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        // Update company's total orders count
        await db.collection('companies').updateOne(
            { _id: employee.companyId },
            { $inc: { totalOrders: -1 } }
        );

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// Generate next order ID for a company
router.get('/company/:companyId/next-id', async (req, res) => {
    try {
        const db = getDB();
        const companyId = new ObjectId(req.params.companyId);
        
        const lastEmployee = await db.collection('company_employees')
            .find({ companyId })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        let nextId = 'EMP001';
        if (lastEmployee.length > 0 && lastEmployee[0].orderId) {
            const lastNum = parseInt(lastEmployee[0].orderId.replace('EMP', '')) || 0;
            nextId = `EMP${String(lastNum + 1).padStart(3, '0')}`;
        }

        res.json({ nextId });
    } catch (error) {
        console.error('Error generating order ID:', error);
        res.status(500).json({ error: 'Failed to generate order ID' });
    }
});

// Get position types
router.get('/positions/list', async (req, res) => {
    res.json({ positions: POSITION_TYPES });
});

module.exports = router;
