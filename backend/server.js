const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("\n=== SERVER STARTUP DEBUG ===");
console.log(`PIXAZO_API_KEY Loaded: ${!!process.env.PIXAZO_API_KEY}`);
console.log(
  `PIXAZO_API_KEY Length: ${process.env.PIXAZO_API_KEY?.length || 0}`,
);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log("============================\n");
const { connectDB } = require("./config/db");
const { initializeAdmin } = require("./utils/initializeAdmin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Import routes
const ordersRoutes = require("./routes/orders");
const companiesRoutes = require("./routes/companies");
const companyEmployeesRoutes = require("./routes/companyEmployees");
const labourRoutes = require("./routes/labour");
const wagesRoutes = require("./routes/wages");
const workAssignmentsRoutes = require("./routes/workAssignments");
const authRoutes = require("./routes/auth");
const tryonRoutes = require("./routes/tryon");

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/employees", companyEmployeesRoutes);
app.use("/api/labour", labourRoutes);
app.use("/api/wages", wagesRoutes);
app.use("/api/workAssignments", workAssignmentsRoutes);
app.use("/", tryonRoutes);

// Start server after DB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const db = await connectDB();

    // Initialize admin user if it doesn't exist
    await initializeAdmin(db);

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`Server running on port ${PORT}`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
