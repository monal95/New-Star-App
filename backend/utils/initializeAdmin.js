const bcrypt = require('bcrypt');

/**
 * Initialize admin user if it doesn't exist
 * This function runs when the server starts
 */
const initializeAdmin = async (db) => {
    try {
        // Check if admin already exists
        const adminExists = await db.collection('admins').findOne({});

        if (adminExists) {
            console.log('✓ Admin user already exists');
            return;
        }

        // Hash the default password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('newstar123', salt);

        // Create default admin user
        const result = await db.collection('admins').insertOne({
            username: 'Chinna Kannan (Owner)',
            email: 'newstartailor78@gmail.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✓ Admin user created successfully');
        console.log('  Username: Chinna Kannan (Owner)');
        console.log('  Email: newstartailor78@gmail.com');
        console.log('  Password: newstar123');
        console.log('  Note: Please change the password after first login');

        return result;
    } catch (error) {
        console.error('Error initializing admin:', error);
        throw error;
    }
};

module.exports = { initializeAdmin };
