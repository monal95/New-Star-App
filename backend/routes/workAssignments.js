const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Get work assignments for a specific labour
router.get('/labour/:labourId', async (req, res) => {
    try {
        const db = getDB();
        const { labourId } = req.params;

        const assignments = await db.collection('workAssignments')
            .find({ labourId: new ObjectId(labourId) })
            .sort({ assignedDate: -1 })
            .toArray();

        res.json(assignments);
    } catch (error) {
        console.error('Error fetching work assignments:', error);
        res.status(500).json({ error: 'Failed to fetch work assignments' });
    }
});

// Get work assignments for a specific order
router.get('/order/:orderId', async (req, res) => {
    try {
        const db = getDB();
        const { orderId } = req.params;

        const assignments = await db.collection('workAssignments')
            .find({ orderId: orderId })
            .sort({ assignedDate: -1 })
            .toArray();

        res.json(assignments);
    } catch (error) {
        console.error('Error fetching work assignments for order:', error);
        res.status(500).json({ error: 'Failed to fetch work assignments' });
    }
});

// Create new work assignment
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            labourId, 
            orderId, 
            workType, 
            quantity, 
            customWage,
            orderCustomerName,
            orderDate
        } = req.body;

        // Validation
        if (!labourId || !orderId || !workType || quantity === undefined) {
            return res.status(400).json({ 
                error: 'labourId, orderId, workType, and quantity are required' 
            });
        }

        // Validate work type
        const validWorkTypes = ['Pant', 'Shirt', 'Ironing', 'Embroidery'];
        if (!validWorkTypes.includes(workType)) {
            return res.status(400).json({ 
                error: `Invalid work type. Must be one of: ${validWorkTypes.join(', ')}` 
            });
        }

        // Get wage configuration to calculate wages
        const wages = await db.collection('wages').findOne({ _id: 'default' });
        const wageConfig = wages || {
            pant: 110,
            shirt: 100,
            ironing_pant: 12,
            ironing_shirt: 10,
            embroidery: 25
        };

        // Calculate wages based on work type and quantity
        // Use custom wage if provided, otherwise use standard rates
        let wagePerUnit = 0;
        
        if (customWage) {
            // Use custom wage provided by admin
            wagePerUnit = parseFloat(customWage);
        } else {
            // Use standard rates from configuration
            if (workType === 'Pant') {
                wagePerUnit = wageConfig.pant;
            } else if (workType === 'Shirt') {
                wagePerUnit = wageConfig.shirt;
            } else if (workType === 'Ironing') {
                wagePerUnit = wageConfig.ironing_pant; // Default for ironing
            } else if (workType === 'Embroidery') {
                wagePerUnit = wageConfig.embroidery;
            }
        }

        const totalWages = wagePerUnit * quantity;

        const newAssignment = {
            labourId: new ObjectId(labourId),
            orderId: orderId,
            workType,
            quantity: parseInt(quantity),
            wagePerUnit,
            totalWages,
            customWage: customWage ? parseFloat(customWage) : null,
            orderCustomerName: orderCustomerName || '',
            orderDate: orderDate || new Date().toISOString().split('T')[0],
            assignedDate: new Date(),
            status: 'Assigned', // Can be: Assigned, InProgress, Completed
            completedDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('workAssignments').insertOne(newAssignment);

        res.status(201).json({
            message: 'Work assigned successfully',
            id: result.insertedId,
            assignment: { ...newAssignment, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating work assignment:', error);
        res.status(500).json({ error: 'Failed to create work assignment' });
    }
});

// Update work assignment status
router.patch('/:id/status', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Assigned', 'InProgress', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const updateData = {
            status,
            updatedAt: new Date()
        };

        if (status === 'Completed') {
            updateData.completedDate = new Date();
        }

        const result = await db.collection('workAssignments').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(404).json({ error: 'Work assignment not found' });
        }

        res.json({
            message: 'Work assignment status updated',
            assignment: result.value
        });
    } catch (error) {
        console.error('Error updating work assignment status:', error);
        res.status(500).json({ error: 'Failed to update work assignment status' });
    }
});

// Delete work assignment
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        const result = await db.collection('workAssignments').deleteOne(
            { _id: new ObjectId(id) }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Work assignment not found' });
        }

        res.json({ message: 'Work assignment deleted successfully' });
    } catch (error) {
        console.error('Error deleting work assignment:', error);
        res.status(500).json({ error: 'Failed to delete work assignment' });
    }
});

// Get summary stats for a labour (for dashboard)
router.get('/summary/labour/:labourId', async (req, res) => {
    try {
        const db = getDB();
        const { labourId } = req.params;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const query = { labourId: new ObjectId(labourId) };

        // Filter by date range if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            query.assignedDate = {
                $gte: start,
                $lte: end
            };
        }

        const assignments = await db.collection('workAssignments')
            .find(query)
            .toArray();

        const totalWages = assignments.reduce((sum, a) => sum + a.totalWages, 0);
        const totalQuantity = assignments.reduce((sum, a) => sum + a.quantity, 0);
        const completedCount = assignments.filter(a => a.status === 'Completed').length;

        res.json({
            totalAssignments: assignments.length,
            completedAssignments: completedCount,
            totalWages,
            totalQuantity,
            assignments
        });
    } catch (error) {
        console.error('Error fetching labour summary:', error);
        res.status(500).json({ error: 'Failed to fetch labour summary' });
    }
});

module.exports = router;
