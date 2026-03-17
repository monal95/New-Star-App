const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Get work assignments for a specific labour
router.get("/labour/:labourId", async (req, res) => {
  try {
    const { labourId } = req.params;

    const assignments = await runQuery(
      "SELECT * FROM work_assignments WHERE labour_id = ? ORDER BY assigned_date DESC",
      [labourId],
    );

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching work assignments:", error);
    res.status(500).json({ error: "Failed to fetch work assignments" });
  }
});

// Get work assignments for a specific order
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const assignments = await runQuery(
      "SELECT * FROM work_assignments WHERE order_id = ? ORDER BY assigned_date DESC",
      [orderId],
    );

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching work assignments for order:", error);
    res.status(500).json({ error: "Failed to fetch work assignments" });
  }
});

// Create new work assignment
router.post("/", async (req, res) => {
  try {
    const { labourId, orderId, task_type, quantity } = req.body;

    // Validation
    if (!labourId || !orderId || !task_type || quantity === undefined) {
      return res.status(400).json({
        error: "labourId, orderId, task_type, and quantity are required",
      });
    }

    // Validate work type
    const validWorkTypes = ["Pant", "Shirt", "Ironing", "Embroidery"];
    if (!validWorkTypes.includes(task_type)) {
      return res.status(400).json({
        error: `Invalid task type. Must be one of: ${validWorkTypes.join(", ")}`,
      });
    }

    const now = new Date().toISOString();
    const assignedDate = now.split("T")[0];

    const result = await run(
      `INSERT INTO work_assignments (labour_id, order_id, task_type, quantity, status, assigned_date, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        labourId,
        orderId,
        task_type,
        parseInt(quantity),
        "Pending",
        assignedDate,
        now,
        now,
      ],
    );

    res.status(201).json({
      message: "Work assigned successfully",
      id: result.id,
      assignment: {
        id: result.id,
        labour_id: labourId,
        order_id: orderId,
        task_type,
        quantity: parseInt(quantity),
        status: "Pending",
        assigned_date: assignedDate,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Error creating work assignment:", error);
    res.status(500).json({ error: "Failed to create work assignment" });
  }
});

// Update work assignment status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Pending", "In Progress", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const now = new Date().toISOString();
    let updateFields = "status = ?, updatedAt = ?";
    let updateValues = [status, now, id];

    if (status === "Completed") {
      updateFields = "status = ?, completed_date = ?, updatedAt = ?";
      updateValues = [status, now.split("T")[0], now, id];
    }

    const result = await run(
      `UPDATE work_assignments SET ${updateFields} WHERE id = ?`,
      updateValues,
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Work assignment not found" });
    }

    res.json({
      message: "Work assignment status updated",
      status,
    });
  } catch (error) {
    console.error("Error updating work assignment status:", error);
    res.status(500).json({ error: "Failed to update work assignment status" });
  }
});

// Delete work assignment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await run("DELETE FROM work_assignments WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Work assignment not found" });
    }

    res.json({ message: "Work assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting work assignment:", error);
    res.status(500).json({ error: "Failed to delete work assignment" });
  }
});

// Get summary stats for a labour (for dashboard)
router.get("/summary/labour/:labourId", async (req, res) => {
  try {
    const { labourId } = req.params;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = "SELECT * FROM work_assignments WHERE labour_id = ?";
    let params = [labourId];

    // Filter by date range if provided
    if (startDate && endDate) {
      query += " AND assigned_date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const assignments = await runQuery(query, params);

    const totalWages = assignments.reduce(
      (sum, a) => sum + a.quantity * 110,
      0,
    );
    const totalQuantity = assignments.reduce((sum, a) => sum + a.quantity, 0);
    const completedCount = assignments.filter(
      (a) => a.status === "Completed",
    ).length;

    res.json({
      totalAssignments: assignments.length,
      completedAssignments: completedCount,
      totalWages,
      totalQuantity,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching labour summary:", error);
    res.status(500).json({ error: "Failed to fetch labour summary" });
  }
});

module.exports = router;
