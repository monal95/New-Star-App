const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Get all labour
router.get("/", async (req, res) => {
  try {
    const labour = await runQuery(
      "SELECT * FROM labour ORDER BY createdAt DESC",
    );
    res.json(labour);
  } catch (error) {
    console.error("Error fetching labour:", error);
    res.status(500).json({ error: "Failed to fetch labour" });
  }
});

// Get labour by category
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const labour = await runQuery(
      "SELECT * FROM labour WHERE category = ? ORDER BY createdAt DESC",
      [category],
    );
    res.json(labour);
  } catch (error) {
    console.error("Error fetching labour by category:", error);
    res.status(500).json({ error: "Failed to fetch labour" });
  }
});

// Get single labour
router.get("/:id", async (req, res) => {
  try {
    const labour = await getRow("SELECT * FROM labour WHERE id = ?", [
      req.params.id,
    ]);
    if (!labour) {
      return res.status(404).json({ error: "Labour not found" });
    }
    res.json(labour);
  } catch (error) {
    console.error("Error fetching labour:", error);
    res.status(500).json({ error: "Failed to fetch labour" });
  }
});

// Create new labour
router.post("/", async (req, res) => {
  try {
    const { name, category, specialist, age, phone, photo, joinDate, status } =
      req.body;

    // Validation
    if (!name || !phone || !specialist) {
      return res.status(400).json({
        error: "Name, Phone, and Specialist are required",
      });
    }

    if (
      !category ||
      !["Tailor", "Iron Master", "Embroider"].includes(category)
    ) {
      return res.status(400).json({
        error: "Valid category is required",
      });
    }

    const now = new Date().toISOString();

    const result = await run(
      `INSERT INTO labour (name, category, specialist, age, phone, photo, joinDate, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        specialist,
        age ? parseInt(age) : null,
        phone,
        photo || null,
        joinDate || now.split("T")[0],
        status || "Active",
        now,
        now,
      ],
    );

    res.status(201).json({
      message: "Labour created successfully",
      id: result.id,
      labour: {
        id: result.id,
        name,
        category,
        specialist,
        age: age ? parseInt(age) : null,
        phone,
        photo: photo || null,
        joinDate: joinDate || now.split("T")[0],
        status: status || "Active",
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Error creating labour:", error);
    res.status(500).json({ error: "Failed to create labour" });
  }
});

// Update labour
router.put("/:id", async (req, res) => {
  try {
    const { name, category, specialist, age, phone, photo, joinDate, status } =
      req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (specialist !== undefined) updateData.specialist = specialist;
    if (age !== undefined) updateData.age = age ? parseInt(age) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (photo !== undefined) updateData.photo = photo;
    if (joinDate !== undefined) updateData.joinDate = joinDate;
    if (status !== undefined) updateData.status = status;

    // Build dynamic SET clause
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    values.push(new Date().toISOString()); // For updatedAt
    values.push(req.params.id); // For WHERE clause

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const setClause =
      fields.map((field) => `${field} = ?`).join(", ") + ", updatedAt = ?";

    const result = await run(
      `UPDATE labour SET ${setClause} WHERE id = ?`,
      values,
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Labour not found" });
    }

    res.json({
      message: "Labour updated successfully",
    });
  } catch (error) {
    console.error("Error updating labour:", error);
    res.status(500).json({ error: "Failed to update labour" });
  }
});

// Delete labour
router.delete("/:id", async (req, res) => {
  try {
    const result = await run("DELETE FROM labour WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Labour not found" });
    }

    res.json({ message: "Labour deleted successfully" });
  } catch (error) {
    console.error("Error deleting labour:", error);
    res.status(500).json({ error: "Failed to delete labour" });
  }
});

module.exports = router;
