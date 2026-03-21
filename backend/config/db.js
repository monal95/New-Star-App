const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path - stores in backend directory
const DB_PATH = path.join(__dirname, "..", "database.db");

let db = null;

// Initialize SQLite database connection
const connectDB = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("SQLite connection error:", err);
        reject(err);
      } else {
        console.log(`✅ SQLite Connected: ${DB_PATH}`);
        resolve(db);
      }
    });

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
  });
};

// Get database instance
const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

// Close database connection
const closeDB = async () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
          reject(err);
        } else {
          console.log("✅ SQLite connection closed");
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

// Initialize database tables
const initializeTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Companies table
      db.run(`
        CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          address TEXT,
          gstNumber TEXT,
          hrName TEXT,
          hrPhone TEXT,
          managerName TEXT,
          managerPhone TEXT,
          landlineNumber TEXT,
          estimatedOrders INTEGER DEFAULT 0,
          email TEXT,
          status TEXT DEFAULT 'Active',
          totalOrders INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      // Company Employees table
      db.run(`
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          role TEXT,
          salary REAL,
          company_id INTEGER NOT NULL,
          email TEXT,
          phone TEXT,
          joinDate TEXT,
          status TEXT DEFAULT 'Active',
          orderId TEXT,
          noOfSets INTEGER DEFAULT 1,
          shirt TEXT,
          pant TEXT,
          position TEXT DEFAULT 'Employee',
          createdAt TEXT,
          updatedAt TEXT,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
        )
      `);

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          orderId TEXT UNIQUE,
          name TEXT,
          phone TEXT,
          email TEXT,
          noOfSets INTEGER DEFAULT 1,
          shirtAmount REAL DEFAULT 500,
          pantAmount REAL DEFAULT 400,
          totalAmount REAL,
          advanceAmount REAL DEFAULT 0,
          remainingAmount REAL,
          paymentMethod TEXT DEFAULT 'Cash',
          shirt TEXT,
          pant TEXT,
          status TEXT DEFAULT 'Pending',
          company_id INTEGER,
          customer_name TEXT,
          dress_type TEXT,
          measurements TEXT,
          price REAL,
          notes TEXT,
          delivery_date TEXT,
          date TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
        )
      `);

      // Order Counters table for atomic order ID generation
      db.run(`
        CREATE TABLE IF NOT EXISTS order_counters (
          id TEXT PRIMARY KEY,
          lastMonth TEXT,
          count INTEGER DEFAULT 0,
          lastResetDate TEXT
        )
      `);

      // Labour table for tailor/worker management
      db.run(`
        CREATE TABLE IF NOT EXISTS labour (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          specialist TEXT,
          age INTEGER,
          phone TEXT NOT NULL,
          photo TEXT,
          joinDate TEXT,
          status TEXT DEFAULT 'Active',
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      // Wages table for wage configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS wages (
          id TEXT PRIMARY KEY,
          pant REAL DEFAULT 110,
          shirt REAL DEFAULT 100,
          ironing_pant REAL DEFAULT 12,
          ironing_shirt REAL DEFAULT 10,
          embroidery REAL DEFAULT 25,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      // Work Assignments table
      db.run(`
        CREATE TABLE IF NOT EXISTS work_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          labour_id INTEGER NOT NULL,
          order_id INTEGER,
          task_type TEXT,
          quantity INTEGER DEFAULT 1,
          status TEXT DEFAULT 'Pending',
          assigned_date TEXT,
          completed_date TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          FOREIGN KEY (labour_id) REFERENCES labour(id) ON DELETE CASCADE,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        )
      `);

      // Order Items table for tracking item types per order (for split assignments)
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          item_type TEXT NOT NULL,
          total_qty INTEGER NOT NULL,
          assigned_qty INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          UNIQUE(order_id, item_type)
        )
      `);

      // Admins table for authentication
      db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      // OTP Requests table for password reset
      db.run(
        `
        CREATE TABLE IF NOT EXISTS otpRequests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          otp TEXT NOT NULL,
          expiresAt TEXT NOT NULL,
          verified INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating tables:", err);
            reject(err);
          } else {
            // Add migration to add missing columns to employees table
            addMissingColumns()
              .then(() => {
                console.log("✅ Tables initialized successfully");
                resolve();
              })
              .catch((migrationErr) => {
                console.error("Error during migration:", migrationErr);
                resolve(); // Continue anyway
              });
          }
        },
      );
    });
  });
};

// Migration: Add missing columns to existing tables
const addMissingColumns = () => {
  return new Promise((resolve) => {
    // 1) First migrate employees table
    db.all(`PRAGMA table_info(employees)`, (err, columns) => {
      if (err) {
        console.error("❌ Error checking table columns:", err);
        resolve();
        return;
      }

      const existingColumns = columns.map((col) => col.name);

      const requiredColumns = [
        { name: "orderId", type: "TEXT" },
        { name: "noOfSets", type: "INTEGER DEFAULT 1" },
        { name: "shirt", type: "TEXT" },
        { name: "pant", type: "TEXT" },
        { name: "position", type: "TEXT DEFAULT 'Employee'" },
      ];

      let pendingAlters = 0;

      requiredColumns.forEach((col) => {
        if (!existingColumns.includes(col.name)) {
          pendingAlters++;
          console.log(`📝 Adding missing column: ${col.name}`);
          db.run(
            `ALTER TABLE employees ADD COLUMN ${col.name} ${col.type}`,
            (err) => {
              if (err) {
                console.error(`❌ Error adding column ${col.name}:`, err);
              } else {
                console.log(`✅ Added column ${col.name} to employees table`);
              }
              pendingAlters--;
              if (pendingAlters === 0) {
                checkWorkAssignments();
              }
            },
          );
        }
      });

      if (pendingAlters === 0) {
        console.log("✅ All required columns in employees already exist");
        checkWorkAssignments();
      }
    });

    // 2) Then migrate work_assignments table
    function checkWorkAssignments() {
      db.all(`PRAGMA table_info(work_assignments)`, (err, columns) => {
        if (err) {
          console.error("❌ Error checking work_assignments columns:", err);
          resolve();
          return;
        }

        const existingColumns = columns.map((col) => col.name);

        if (!existingColumns.includes("employee_id")) {
          console.log(
            `📝 Adding missing column: employee_id to work_assignments`,
          );
          db.run(
            `ALTER TABLE work_assignments ADD COLUMN employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL`,
            (err) => {
              if (err) {
                console.error(`❌ Error adding column employee_id:`, err);
              } else {
                console.log(`✅ Added column employee_id to work_assignments`);
              }
              resolve();
            },
          );
        } else {
          console.log(
            "✅ All required columns in work_assignments already exist",
          );
          resolve();
        }
      });
    }
  });
};

// Run a query and return results
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Run a single row query
const getRow = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Execute insert/update/delete
const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

module.exports = {
  connectDB,
  getDB,
  closeDB,
  initializeTables,
  runQuery,
  getRow,
  run,
};
