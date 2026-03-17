const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { runQuery, getRow, run } = require("../config/db");
const { sendOTPEmail } = require("../services/emailService");

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate OTP expiration time (10 minutes from now)
const getOTPExpiration = () => {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString();
};

// Register endpoint (only for creating first admin)
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: "Email, username, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Check if admin already exists
    const existingAdmin = await getRow("SELECT * FROM admins LIMIT 1", []);
    if (existingAdmin) {
      return res
        .status(403)
        .json({
          error: "Admin account already exists. Only one admin is allowed.",
        });
    }

    // Check if email already exists
    const emailExists = await getRow("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Create admin
    const result = await run(
      "INSERT INTO admins (email, username, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [email, username, hashedPassword, now, now],
    );

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: {
        id: result.id,
        email,
        username,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create admin account" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin by email
    const admin = await getRow("SELECT * FROM admins WHERE email = ?", [email]);

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
        id: admin.id,
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
    const admin = await getRow("SELECT * FROM admins LIMIT 1", []);

    res.json({
      adminExists: !!admin,
    });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ error: "Failed to check admin" });
  }
});

// Forgot Password: Send OTP to email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if admin exists
    const admin = await getRow("SELECT * FROM admins WHERE email = ?", [email]);

    if (!admin) {
      // For security, don't reveal if email exists or not
      return res
        .status(400)
        .json({ error: "If the email exists, OTP will be sent shortly" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiration();
    const now = new Date().toISOString();

    // Store OTP in database (insert or update)
    await run(
      `INSERT INTO otpRequests (email, otp, expiresAt, verified, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
       otp = excluded.otp,
       expiresAt = excluded.expiresAt,
       verified = 0,
       updatedAt = excluded.updatedAt`,
      [email, otp, expiresAt, now, now],
    );

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return res
        .status(500)
        .json({ error: "Failed to send OTP. Please try again." });
    }

    res.json({
      success: true,
      message: "OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Find the OTP request
    const otpRequest = await getRow(
      "SELECT * FROM otpRequests WHERE email = ?",
      [email],
    );

    if (!otpRequest) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRequest.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check if OTP matches
    if (otpRequest.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark OTP as verified
    await run(
      "UPDATE otpRequests SET verified = 1, updatedAt = ? WHERE email = ?",
      [new Date().toISOString(), email],
    );

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if OTP is verified
    const otpRequest = await getRow(
      "SELECT * FROM otpRequests WHERE email = ? AND verified = 1",
      [email],
    );

    if (!otpRequest) {
      return res
        .status(400)
        .json({ error: "Please verify OTP before resetting password" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin password
    await run("UPDATE admins SET password = ?, updatedAt = ? WHERE email = ?", [
      hashedPassword,
      new Date().toISOString(),
      email,
    ]);

    // Delete OTP request
    await run("DELETE FROM otpRequests WHERE email = ?", [email]);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;
