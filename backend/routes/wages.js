const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Standard wage rates (default configuration)
const DEFAULT_WAGES = {
    pant: 110,
    shirt: 100,
    ironing_pant: 12,
    ironing_shirt: 10,
    embroidery: 25
};

// Initialize wage configuration in database
const initializeWages = async (db) => {
    const existing = await db.collection('wages').findOne({ _id: 'default' });
    if (!existing) {
        await db.collection('wages').insertOne({
            _id: 'default',
            pant: 110,
            shirt: 100,
            ironing_pant: 12,
            ironing_shirt: 10,
            embroidery: 25,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
};

// Get wage configuration
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        await initializeWages(db);
        
        const wages = await db.collection('wages').findOne({ _id: 'default' });
        res.json(wages || DEFAULT_WAGES);
    } catch (error) {
        console.error('Error fetching wages:', error);
        res.status(500).json({ error: 'Failed to fetch wage configuration' });
    }
});

// Update wage configuration
router.put('/', async (req, res) => {
    try {
        const db = getDB();
        const { pant, shirt, ironing_pant, ironing_shirt, embroidery } = req.body;

        // Validation
        if (pant === undefined || shirt === undefined || ironing_pant === undefined || 
            ironing_shirt === undefined || embroidery === undefined) {
            return res.status(400).json({ 
                error: 'All wage fields are required' 
            });
        }

        // Ensure all values are positive numbers
        const wages = {
            pant: parseFloat(pant),
            shirt: parseFloat(shirt),
            ironing_pant: parseFloat(ironing_pant),
            ironing_shirt: parseFloat(ironing_shirt),
            embroidery: parseFloat(embroidery),
            updatedAt: new Date()
        };

        if (Object.values(wages).some(v => isNaN(v) || v < 0)) {
            return res.status(400).json({ 
                error: 'All wages must be positive numbers' 
            });
        }

        const result = await db.collection('wages').findOneAndUpdate(
            { _id: 'default' },
            { $set: wages },
            { returnDocument: 'after', upsert: true }
        );

        res.json({
            message: 'Wage configuration updated successfully',
            wages: result.value || wages
        });
    } catch (error) {
        console.error('Error updating wages:', error);
        res.status(500).json({ error: 'Failed to update wage configuration' });
    }
});

// Reset to default wages
router.post('/reset', async (req, res) => {
    try {
        const db = getDB();
        
        const result = await db.collection('wages').findOneAndUpdate(
            { _id: 'default' },
            { $set: {
                ...DEFAULT_WAGES,
                updatedAt: new Date()
            }},
            { returnDocument: 'after' }
        );

        res.json({
            message: 'Wages reset to default values',
            wages: result.value || DEFAULT_WAGES
        });
    } catch (error) {
        console.error('Error resetting wages:', error);
        res.status(500).json({ error: 'Failed to reset wages' });
    }
});

module.exports = router;
