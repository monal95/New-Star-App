const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get civil orders (orders without companyId)
router.get('/civil', async (req, res) => {
    try {
        const db = getDB();
        const orders = await db.collection('orders')
            .find({ companyId: { $exists: false } })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching civil orders:', error);
        res.status(500).json({ error: 'Failed to fetch civil orders' });
    }
});

// Get single order by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const order = await db.collection('orders').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            orderId, 
            name, 
            phone, 
            email, 
            noOfSets,
            shirtAmount,
            pantAmount,
            paymentMethod,
            shirt,
            pant
        } = req.body;

        // Validate required fields
        if (!orderId || !name || !phone) {
            return res.status(400).json({ error: 'Order ID, name, and phone are required' });
        }

        // Check if orderId already exists
        const existingOrder = await db.collection('orders').findOne({ orderId });
        if (existingOrder) {
            return res.status(400).json({ error: 'Order ID already exists' });
        }

        const newOrder = {
            orderId,
            name,
            phone,
            email: email || '',
            noOfSets: parseInt(noOfSets) || 1,
            shirtAmount: parseFloat(shirtAmount) || 500,
            pantAmount: parseFloat(pantAmount) || 400,
            totalAmount: ((parseFloat(shirtAmount) || 500) + (parseFloat(pantAmount) || 400)) * (parseInt(noOfSets) || 1),
            paymentMethod: paymentMethod || 'Cash',
            shirt: shirt || {},
            pant: pant || {},
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('orders').insertOne(newOrder);
        
        res.status(201).json({ 
            message: 'Order created successfully',
            order: { ...newOrder, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const db = getDB();
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['Pending', 'In Progress', 'Ready', 'Delivered', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { 
                $set: { 
                    status,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Update entire order
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const updateData = { ...req.body, updatedAt: new Date() };
        delete updateData._id;

        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('orders').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Generate next order ID
router.get('/generate/next-id', async (req, res) => {
    try {
        const db = getDB();
        const lastOrder = await db.collection('orders')
            .find({})
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        let nextId = 'ORD001';
        if (lastOrder.length > 0 && lastOrder[0].orderId) {
            const lastNum = parseInt(lastOrder[0].orderId.replace('ORD', '')) || 0;
            nextId = `ORD${String(lastNum + 1).padStart(3, '0')}`;
        }

        res.json({ nextId });
    } catch (error) {
        console.error('Error generating order ID:', error);
        res.status(500).json({ error: 'Failed to generate order ID' });
    }
});

module.exports = router;
