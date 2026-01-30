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
        const { date } = req.query;
        
        let query = { companyId: { $exists: false } };
        
        // If date is provided, filter by that specific date
        if (date) {
            query.date = date;
        } else {
            // Otherwise, get current month's orders
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const monthPrefix = `${year}-${month}`;
            
            // Filter orders from current month
            query.date = { $regex: `^${monthPrefix}` };
        }
        
        const orders = await db.collection('orders')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching civil orders:', error);
        res.status(500).json({ error: 'Failed to fetch civil orders' });
    }
});});

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
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        // Check if we need to reset for new month
        const counterCollection = db.collection('order_counters');
        const counter = await counterCollection.findOne({ _id: 'order_counter' });
        
        let nextId = 'ORD001';
        let shouldReset = false;
        
        if (!counter) {
            // First time initialization
            await counterCollection.insertOne({
                _id: 'order_counter',
                lastMonth: currentMonthKey,
                count: 0,
                lastResetDate: new Date()
            });
        } else if (counter.lastMonth !== currentMonthKey) {
            // New month detected - reset counter
            shouldReset = true;
            await counterCollection.updateOne(
                { _id: 'order_counter' },
                { 
                    $set: { 
                        lastMonth: currentMonthKey,
                        count: 0,
                        lastResetDate: new Date()
                    }
                }
            );
        }
        
        // Get the next ID
        const updatedCounter = await counterCollection.findOneAndUpdate(
            { _id: 'order_counter' },
            { $inc: { count: 1 } },
            { returnDocument: 'after' }
        );
        
        const nextNum = updatedCounter.value.count;
        nextId = `ORD${String(nextNum).padStart(3, '0')}`;
        
        res.json({ 
            nextId,
            monthReset: shouldReset,
            currentMonth: currentMonthKey
        });
    } catch (error) {
        console.error('Error generating order ID:', error);
        res.status(500).json({ error: 'Failed to generate order ID' });
    }
});

module.exports = router;
