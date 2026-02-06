const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Get all labour
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const labour = await db.collection('labour').find({}).sort({ createdAt: -1 }).toArray();
        res.json(labour);
    } catch (error) {
        console.error('Error fetching labour:', error);
        res.status(500).json({ error: 'Failed to fetch labour' });
    }
});

// Get labour by category
router.get('/category/:category', async (req, res) => {
    try {
        const db = getDB();
        const { category } = req.params;
        const labour = await db.collection('labour')
            .find({ category })
            .sort({ createdAt: -1 })
            .toArray();
        res.json(labour);
    } catch (error) {
        console.error('Error fetching labour by category:', error);
        res.status(500).json({ error: 'Failed to fetch labour' });
    }
});

// Get single labour
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const labour = await db.collection('labour').findOne({ 
            _id: new ObjectId(req.params.id) 
        });
        if (!labour) {
            return res.status(404).json({ error: 'Labour not found' });
        }
        res.json(labour);
    } catch (error) {
        console.error('Error fetching labour:', error);
        res.status(500).json({ error: 'Failed to fetch labour' });
    }
});

// Create new labour
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { name, category, specialist, age, phone, photo, joinDate, status } = req.body;

        // Validation
        if (!name || !phone || !specialist) {
            return res.status(400).json({ 
                error: 'Name, Phone, and Specialist are required' 
            });
        }

        if (!category || !['Tailor', 'Iron Master', 'Embroider'].includes(category)) {
            return res.status(400).json({ 
                error: 'Valid category is required' 
            });
        }

        const newLabour = {
            name,
            category,
            specialist,
            age: age ? parseInt(age) : null,
            phone,
            photo: photo || null,
            joinDate: joinDate || new Date().toISOString().split('T')[0],
            status: status || 'Active',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('labour').insertOne(newLabour);
        
        res.status(201).json({
            message: 'Labour created successfully',
            id: result.insertedId,
            labour: { ...newLabour, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating labour:', error);
        res.status(500).json({ error: 'Failed to create labour' });
    }
});

// Update labour
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { name, category, specialist, age, phone, photo, joinDate, status } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (category !== undefined) updateData.category = category;
        if (specialist !== undefined) updateData.specialist = specialist;
        if (age !== undefined) updateData.age = age ? parseInt(age) : null;
        if (phone !== undefined) updateData.phone = phone;
        if (photo !== undefined) updateData.photo = photo;
        if (joinDate !== undefined) updateData.joinDate = joinDate;
        if (status !== undefined) updateData.status = status;
        updateData.updatedAt = new Date();

        const result = await db.collection('labour').findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(404).json({ error: 'Labour not found' });
        }

        res.json({
            message: 'Labour updated successfully',
            labour: result.value
        });
    } catch (error) {
        console.error('Error updating labour:', error);
        res.status(500).json({ error: 'Failed to update labour' });
    }
});

// Delete labour
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        const result = await db.collection('labour').deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Labour not found' });
        }

        res.json({ message: 'Labour deleted successfully' });
    } catch (error) {
        console.error('Error deleting labour:', error);
        res.status(500).json({ error: 'Failed to delete labour' });
    }
});

module.exports = router;
