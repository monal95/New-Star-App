const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { getDB } = require("../config/db");

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDB();

    // Find admin by email
    const admin = await db.collection("admins").findOne({ email });

    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Return success response with admin info (without password)
    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Check if admin exists (for frontend verification)
router.get("/check", async (req, res) => {
  try {
    const db = getDB();
    const adminExists = await db.collection("admins").findOne({});

    res.json({
      adminExists: !!adminExists,
    });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ error: "Failed to check admin" });
  }
});

module.exports = router;
