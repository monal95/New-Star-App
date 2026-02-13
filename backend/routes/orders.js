const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendOrderStatusEmail } = require('../services/emailService');

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
});

// Search for previous customers by name (for auto-fill)
router.get('/search/customers', async (req, res) => {
    try {
        const db = getDB();
        const { name } = req.query;

        if (!name || name.length < 2) {
            return res.json([]);
        }

        // Search for customers with matching names (case-insensitive)
        // Only search civil orders (orders without companyId)
        const customers = await db.collection('orders').aggregate([
            {
                $match: {
                    companyId: { $exists: false },
                    name: { $regex: name, $options: 'i' }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: { $toLower: '$name' },
                    name: { $first: '$name' },
                    phone: { $first: '$phone' },
                    email: { $first: '$email' },
                    shirt: { $first: '$shirt' },
                    pant: { $first: '$pant' },
                    lastOrderDate: { $first: '$date' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    phone: 1,
                    email: 1,
                    shirt: 1,
                    pant: 1,
                    lastOrderDate: 1,
                    orderCount: 1
                }
            },
            {
                $limit: 5
            }
        ]).toArray();

        res.json(customers);
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ error: 'Failed to search customers' });
    }
});

// Preview next order ID (does NOT increment counter - for display only)
// IMPORTANT: This route must be defined BEFORE /:id to avoid being caught by it
router.get('/generate/next-id', async (req, res) => {
    try {
        const db = getDB();
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        const counterCollection = db.collection('order_counters');
        const counter = await counterCollection.findOne({ _id: 'order_counter' });
        
        let previewId = 'ORD001';
        let shouldReset = false;
        
        if (!counter) {
            previewId = 'ORD001';
        } else if (counter.lastMonth !== currentMonthKey) {
            // New month - preview will be ORD001
            shouldReset = true;
            previewId = 'ORD001';
        } else {
            // Preview the next ID without incrementing
            const nextNum = counter.count + 1;
            previewId = `ORD${String(nextNum).padStart(3, '0')}`;
        }
        
        res.json({ 
            nextId: previewId,
            monthReset: shouldReset,
            currentMonth: currentMonthKey
        });
    } catch (error) {
        console.error('Error previewing order ID:', error);
        res.status(500).json({ error: 'Failed to preview order ID' });
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

// Helper function to generate order ID atomically (only during order creation)
const generateOrderIdAtomic = async (db) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    const counterCollection = db.collection('order_counters');
    const counter = await counterCollection.findOne({ _id: 'order_counter' });
    
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
    
    // Atomically increment and get the next ID
    const updatedCounter = await counterCollection.findOneAndUpdate(
        { _id: 'order_counter' },
        { $inc: { count: 1 } },
        { returnDocument: 'after' }
    );
    
    const nextNum = updatedCounter.value.count;
    return `ORD${String(nextNum).padStart(3, '0')}`;
};

// Create new order
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            name, 
            phone, 
            email, 
            noOfSets,
            shirtAmount,
            pantAmount,
            advanceAmount,
            paymentMethod,
            shirt,
            pant
        } = req.body;

        // Validate required fields
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        // Generate order ID atomically - only increments when order is actually created
        const orderId = await generateOrderIdAtomic(db);

        const totalAmount = ((parseFloat(shirtAmount) || 500) + (parseFloat(pantAmount) || 400)) * (parseInt(noOfSets) || 1);
        const advancePaid = parseFloat(advanceAmount) || 0;
        const remainingAmount = Math.max(0, totalAmount - advancePaid);

        const newOrder = {
            orderId,
            name,
            phone,
            email: email || '',
            noOfSets: parseInt(noOfSets) || 1,
            shirtAmount: parseFloat(shirtAmount) || 500,
            pantAmount: parseFloat(pantAmount) || 400,
            totalAmount,
            advanceAmount: advancePaid,
            remainingAmount,
            paymentMethod: paymentMethod || 'Cash',
            shirt: shirt || {},
            pant: pant || {},
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('orders').insertOne(newOrder);
        
        // Increment the order counter ONLY after successful order creation
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        const counterCollection = db.collection('order_counters');
        await counterCollection.updateOne(
            { _id: 'order_counter' },
            { 
                $inc: { count: 1 },
                $set: { lastMonth: currentMonthKey }
            },
            { upsert: true }
        );
        
        // Send email notification for civil orders (orders without companyId)
        if (!newOrder.companyId && newOrder.email && newOrder.email.trim()) {
            const orderWithId = { ...newOrder, _id: result.insertedId };
            const emailResult = await sendOrderStatusEmail(orderWithId, 'Pending');
            console.log('\n📧 Order Creation Email Result:');
            console.log(`   Success: ${emailResult.success}`);
            console.log(`   Message: ${emailResult.message}`);
            if (!emailResult.success && emailResult.error) {
                console.log(`   Error Code: ${emailResult.error}`);
            }
            console.log();
        }
        
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

        // Fetch the order first to get all details for email
        const order = await db.collection('orders').findOne(
            { _id: new ObjectId(req.params.id) }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order status in database
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

        // Send email notification for civil orders (orders without companyId)
        if (!order.companyId) {
            const emailResult = await sendOrderStatusEmail(order, status);
            console.log('\n📧 Email Result:');
            console.log(`   Success: ${emailResult.success}`);
            console.log(`   Message: ${emailResult.message}`);
            if (!emailResult.success && emailResult.error) {
                console.log(`   Error Code: ${emailResult.error}`);
            }
            console.log();
        }

        res.json({ 
            message: 'Status updated successfully',
            emailSent: !order.companyId 
        });
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

module.exports = router;
