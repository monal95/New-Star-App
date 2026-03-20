const bcrypt = require("bcrypt");
const { getRow, run } = require("../config/db");

/**
 * Initialize admin user if it doesn't exist
 * This function runs when the server starts
 * Uses SQLite (not MongoDB)
 */
const initializeAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await getRow("SELECT * FROM admins LIMIT 1", []);
    
    if (existingAdmin) {
      console.log("✓ Admin user already exists, skipping initialization");
      return existingAdmin;
    }

    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("newstar1234", salt);

    // Get current timestamp
    const now = new Date().toISOString();

    // Create default admin user
    const result = await run(
      "INSERT INTO admins (username, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [
        "Chinna Kannan (Owner)",
        "monalprashanth98@gmail.com",
        hashedPassword,
        now,
        now,
      ]
    );

    console.log("✓ Admin user created successfully");
    console.log("  Username: Chinna Kannan (Owner)");
    console.log("  Email: monalprashanth98@gmail.com");
    console.log("  Password: newstar1234");
    console.log("  Note: Please change the password after first login");

    return result;
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
    throw error;
  }
};

module.exports = { initializeAdmin };
