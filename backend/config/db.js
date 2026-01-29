const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27018';
        const dbName = process.env.DB_NAME || 'newstar_tailors';
        
        client = new MongoClient(uri);
        await client.connect();
        
        db = client.db(dbName);
        console.log(`MongoDB connected: ${dbName}`);
        
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};

module.exports = { connectDB, getDB, closeDB };
