const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Get all work assignments
router.get("/", async (req, res) => {
  try {
    const assignments = await runQuery(
      "SELECT * FROM work_assignments ORDER BY assigned_date DESC",
      [],
    );

    res.json(assignments || []);
  } catch (error) {
    console.error("Error fetching work assignments:", error);
    res.status(500).json({ error: "Failed to fetch work assignments" });
  }
});

// Get work assignments for a specific labour
router.get("/labour/:labourId", async (req, res) => {
  try {
    const { labourId } = req.params;

    const assignments = await runQuery(
      `SELECT 
        wa.id,
        wa.labour_id,
        wa.order_id,
        wa.task_type,
        wa.quantity,
        wa.status,
        wa.assigned_date AS assignedDate,
        wa.completed_date,
        wa.createdAt,
        wa.updatedAt,
        o.orderId,
        o.customer_name AS orderCustomerName,
        o.date,
        o.delivery_date
      FROM work_assignments wa
      LEFT JOIN orders o ON wa.order_id = o.id
      WHERE wa.labour_id = ? 
      ORDER BY wa.assigned_date DESC`,
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
      `SELECT 
        wa.id,
        wa.labour_id,
        wa.order_id,
        wa.task_type,
        wa.quantity,
        wa.status,
        wa.assigned_date AS assignedDate,
        wa.completed_date,
        wa.createdAt,
        wa.updatedAt,
        o.orderId,
        o.customer_name AS orderCustomerName,
        o.date,
        o.delivery_date
      FROM work_assignments wa
      LEFT JOIN orders o ON wa.order_id = o.id
      WHERE wa.order_id = ? 
      ORDER BY wa.assigned_date DESC`,
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

    console.log("\n[WorkAssignment POST] Received request:", {
      labourId,
      orderId,
      task_type,
      quantity,
      bodyKeys: Object.keys(req.body),
    });

    // Validation
    if (!labourId || !orderId || !task_type || quantity === undefined) {
      console.error("[WorkAssignment POST] Validation failed:", {
        labourId,
        orderId,
        task_type,
        quantity,
      });
      return res.status(400).json({
        error: "labourId, orderId, task_type, and quantity are required",
        received: { labourId, orderId, task_type, quantity },
      });
    }

    // Validate work type
    const validWorkTypes = ["Pant", "Shirt", "Ironing", "Embroidery"];
    if (!validWorkTypes.includes(task_type)) {
      console.error("[WorkAssignment POST] Invalid task type:", task_type);
      return res.status(400).json({
        error: `Invalid task type. Must be one of: ${validWorkTypes.join(", ")}`,
      });
    }

    // Fetch the order to get its quantity AND its internal ID
    const order = await getRow(
      "SELECT * FROM orders WHERE id = ? OR orderId = ?",
      [orderId, orderId],
    );

    if (!order) {
      console.error("[WorkAssignment POST] Order not found:", orderId);
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Fetch the labour to verify it exists and get its internal ID
    const labour = await getRow("SELECT * FROM labour WHERE id = ?", [
      labourId,
    ]);

    if (!labour) {
      console.error("[WorkAssignment POST] Labour not found:", labourId);
      return res.status(404).json({
        error: "Labour not found",
      });
    }

    const assignedQuantity = parseInt(quantity) || 0;

    if (assignedQuantity <= 0) {
      console.error(
        "[WorkAssignment POST] Invalid quantity:",
        assignedQuantity,
      );
      return res.status(400).json({
        error: "Assigned quantity must be greater than 0",
      });
    }

    // Calculate remaining quantity for this specific item type
    // First, try to get from order_items table (preferred)
    let totalQty = 0;

    const orderItem = await getRow(
      "SELECT total_qty FROM order_items WHERE order_id = ? AND item_type = ?",
      [order.id, task_type],
    );

    if (orderItem) {
      // Use quantity from order_items table if available
      totalQty = orderItem.total_qty || 0;
    } else {
      // Fallback: Use noOfSets for all item types
      totalQty = order.noOfSets || 1;
    }

    // Get total already assigned for this item type
    const assignmentResult = await getRow(
      `SELECT SUM(quantity) as totalAssigned FROM work_assignments 
       WHERE order_id = ? AND task_type = ?`,
      [order.id, task_type],
    );

    const alreadyAssigned = assignmentResult?.totalAssigned || 0;
    const remainingQty = Math.max(0, totalQty - alreadyAssigned);

    console.log("[WorkAssignment POST] Quantity validation:", {
      task_type,
      totalQty,
      alreadyAssigned,
      remainingQty,
      requestedQty: assignedQuantity,
      valid: assignedQuantity <= remainingQty,
    });

    // NEW: Validate assigned quantity does not exceed remaining quantity
    if (assignedQuantity > remainingQty) {
      console.error(
        `[WorkAssignment POST] Quantity error: requested ${assignedQuantity} exceeds remaining ${remainingQty} for ${task_type}`,
      );
      return res.status(400).json({
        error: `Cannot assign ${assignedQuantity} ${task_type}(s). Only ${remainingQty} remaining available.`,
        details: {
          task_type,
          totalQty,
          alreadyAssigned,
          remainingQty,
          requested: assignedQuantity,
        },
      });
    }

    const now = new Date().toISOString();
    const assignedDate = now.split("T")[0];

    console.log("[WorkAssignment POST] Inserting into database:", {
      labour_id: labour.id,
      order_id: order.id,
      task_type,
      quantity: parseInt(quantity),
      status: "Pending",
      assigned_date: assignedDate,
    });

    const result = await run(
      `INSERT INTO work_assignments (labour_id, order_id, task_type, quantity, status, assigned_date, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        labour.id,
        order.id,
        task_type,
        parseInt(quantity),
        "Pending",
        assignedDate,
        now,
        now,
      ],
    );

    console.log("[WorkAssignment POST] Insert successful:", result);

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
    console.error("[WorkAssignment POST] Error creating work assignment:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    console.error("  Full error:", error);
    res.status(500).json({
      error: "Failed to create work assignment",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
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

// Get available items for an order (items not fully assigned)
// This endpoint returns items with their remaining quantities for split assignments
router.get("/available-items/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // First, get the order to validate it exists
    const order = await getRow(
      "SELECT id, orderId, shirt, pant, noOfSets FROM orders WHERE id = ? OR orderId = ?",
      [orderId, orderId],
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Define item types that can be assigned
    const itemTypes = ["Shirt", "Pant", "Ironing", "Embroidery"];
    const availableItems = [];

    // For each potential item type, calculate remaining quantity
    for (const itemType of itemTypes) {
      // Try to get total quantity from order_items table first (preferred)
      let totalQty = 0;

      const orderItem = await getRow(
        "SELECT total_qty FROM order_items WHERE order_id = ? AND item_type = ?",
        [order.id, itemType],
      );

      if (orderItem) {
        // Use quantity from order_items table if available
        totalQty = orderItem.total_qty || 0;
      } else {
        // Fallback: Use noOfSets for all item types if order_items not populated
        totalQty = order.noOfSets || 1;
      }

      // Get total assigned quantity for this item type (from work_assignments)
      const assignmentResult = await getRow(
        `SELECT SUM(quantity) as totalAssigned FROM work_assignments 
         WHERE order_id = ? AND task_type = ?`,
        [order.id, itemType],
      );

      const assignedQty = assignmentResult?.totalAssigned || 0;
      const remainingQty = Math.max(0, totalQty - assignedQty);

      // Only include items with remaining quantity > 0
      if (totalQty > 0) {
        availableItems.push({
          itemType,
          totalQty,
          assignedQty,
          remainingQty,
          isFullyAssigned: remainingQty === 0,
          displayLabel:
            remainingQty > 0
              ? `${itemType} (Remaining: ${remainingQty})`
              : `${itemType} (FULL - ${totalQty}/${totalQty})`,
        });
      }
    }

    res.json({
      orderId: order.orderId || order.id,
      items: availableItems.filter((item) => item.totalQty > 0),
      allItems: availableItems,
      summary: {
        totalItems: availableItems.length,
        availableItems: availableItems.filter((item) => item.remainingQty > 0)
          .length,
        fullyAssignedItems: availableItems.filter(
          (item) => item.isFullyAssigned,
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching available items:", error);
    res.status(500).json({
      error: "Failed to fetch available items",
      details: error.message,
    });
  }
});

module.exports = router;
