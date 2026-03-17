const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Get all companies
router.get("/", async (req, res) => {
  try {
    const companies = await runQuery(
      "SELECT * FROM companies ORDER BY createdAt DESC",
    );
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Get single company by ID
router.get("/:id", async (req, res) => {
  try {
    const company = await getRow("SELECT * FROM companies WHERE id = ?", [
      req.params.id,
    ]);

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ error: "Failed to fetch company" });
  }
});

// Create new company
router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      gstNumber,
      hrName,
      hrPhone,
      managerName,
      managerPhone,
      landlineNumber,
      estimatedOrders,
      email,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Company name is required" });
    }

    // Check if company already exists
    const existingCompany = await getRow(
      "SELECT * FROM companies WHERE name = ?",
      [name],
    );
    if (existingCompany) {
      return res
        .status(400)
        .json({ error: "Company with this name already exists" });
    }

    const now = new Date().toISOString();

    const result = await run(
      `INSERT INTO companies (name, address, gstNumber, hrName, hrPhone, managerName, managerPhone, landlineNumber, estimatedOrders, email, status, totalOrders, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        address || "",
        gstNumber || "",
        hrName || "",
        hrPhone || "",
        managerName || "",
        managerPhone || "",
        landlineNumber || "",
        parseInt(estimatedOrders) || 0,
        email || "",
        "Active",
        0,
        now,
        now,
      ],
    );

    res.status(201).json({
      message: "Company created successfully",
      company: {
        id: result.id,
        name,
        address: address || "",
        gstNumber: gstNumber || "",
        hrName: hrName || "",
        hrPhone: hrPhone || "",
        managerName: managerName || "",
        managerPhone: managerPhone || "",
        landlineNumber: landlineNumber || "",
        estimatedOrders: parseInt(estimatedOrders) || 0,
        email: email || "",
        status: "Active",
        totalOrders: 0,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ error: "Failed to create company" });
  }
});

// Update company
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    // Build dynamic SET clause
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    values.push(new Date().toISOString()); // For updatedAt
    values.push(req.params.id); // For WHERE clause

    const setClause =
      fields.map((field) => `${field} = ?`).join(", ") + ", updatedAt = ?";

    const result = await run(
      `UPDATE companies SET ${setClause} WHERE id = ?`,
      values,
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ message: "Company updated successfully" });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Delete company
router.delete("/:id", async (req, res) => {
  try {
    // Also delete all employees for this company
    await run("DELETE FROM employees WHERE company_id = ?", [req.params.id]);

    const result = await run("DELETE FROM companies WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// Get company statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const employees = await runQuery(
      "SELECT * FROM employees WHERE company_id = ?",
      [req.params.id],
    );

    const stats = {
      totalEmployees: employees.length,
      pending: employees.filter(
        (e) => e.status === "Pending" || e.status === "In Progress",
      ).length,
      completed: employees.filter(
        (e) => e.status === "Delivered" || e.status === "Completed",
      ).length,
      byPosition: {},
    };

    // Count by role
    employees.forEach((emp) => {
      const role = emp.role || "Other";
      stats.byPosition[role] = (stats.byPosition[role] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching company stats:", error);
    res.status(500).json({ error: "Failed to fetch company stats" });
  }
});

module.exports = router;
