const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Get all work assignments
router.get("/", async (req, res) => {
  try {
    const assignments = await runQuery(
      `SELECT 
        wa.*,
        COALESCE(o.orderId, e.orderId) AS orderIdString,
        COALESCE(o.name, o.customer_name, e.name) AS orderCustomerName
      FROM work_assignments wa
      LEFT JOIN orders o ON wa.order_id = o.id
      LEFT JOIN employees e ON wa.employee_id = e.id
      ORDER BY wa.assigned_date DESC`,
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
        wa.employee_id,
        wa.task_type,
        wa.quantity,
        wa.status,
        wa.assigned_date AS assignedDate,
        wa.completed_date,
        wa.createdAt,
        wa.updatedAt,
        COALESCE(o.orderId, e.orderId) AS orderId,
        COALESCE(o.name, o.customer_name, e.name) AS orderCustomerName,
        o.date,
        o.delivery_date
      FROM work_assignments wa
      LEFT JOIN orders o ON wa.order_id = o.id
      LEFT JOIN employees e ON wa.employee_id = e.id
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

// Get work assignments for a specific order (civil or company)
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // We don't know if the frontend passed a string orderId or an integer DB id.
    // Also we don't know if it's civil or company.
    // So we lookup the internal IDs first.
    let civilOrder = await getRow(
      "SELECT id FROM orders WHERE id = ? OR orderId = ?",
      [orderId, orderId],
    );
    let companyOrder = await getRow(
      "SELECT id FROM employees WHERE id = ? OR orderId = ?",
      [orderId, orderId],
    );

    // If neither found, return empty array rather than error since it might just have no assignments
    let conditions = [];
    let params = [];

    if (civilOrder) {
      conditions.push(`wa.order_id = ?`);
      params.push(civilOrder.id);
    }

    if (companyOrder) {
      conditions.push(`wa.employee_id = ?`);
      params.push(companyOrder.id);
    }

    if (conditions.length === 0) {
      return res.json([]);
    }

    const assignments = await runQuery(
      `SELECT 
        wa.id,
        wa.labour_id,
        wa.order_id,
        wa.employee_id,
        wa.task_type,
        wa.quantity,
        wa.status,
        wa.assigned_date AS assignedDate,
        wa.completed_date,
        wa.createdAt,
        wa.updatedAt,
        COALESCE(o.orderId, e.orderId) AS orderId,
        COALESCE(o.name, o.customer_name, e.name) AS orderCustomerName,
        o.date,
        o.delivery_date
      FROM work_assignments wa
      LEFT JOIN orders o ON wa.order_id = o.id
      LEFT JOIN employees e ON wa.employee_id = e.id
      WHERE ${conditions.join(" OR ")}
      ORDER BY wa.assigned_date DESC`,
      params,
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
    let order = await getRow(
      "SELECT * FROM orders WHERE id = ? OR orderId = ?",
      [orderId, orderId],
    );
    let orderType = "civil";

    if (!order) {
      // If not found in orders, check if it's a company employee order
      order = await getRow(
        "SELECT * FROM employees WHERE id = ? OR orderId = ?",
        [orderId, orderId],
      );
      if (order) {
        orderType = "company";
      }
    }

    if (!order) {
      console.error(
        "[WorkAssignment POST] Order not found in orders or employees:",
        orderId,
      );
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
        return res.status(400).json({ error: "Assigned quantity must be greater than 0" });
      }
      
      const item = await getRow(
        `SELECT * FROM order_items WHERE order_id = ? AND item_type = ?`,
        [order.id, task_type]
      );
      if (item) {
        const trueRemaining = item.total_qty - item.assigned_qty;
        if (assignedQuantity > trueRemaining) {
          return res.status(400).json({ error: "Exceeds remaining quantity", message: "Exceeds remaining quantity" });
        }
        await runQuery(`UPDATE order_items SET assigned_qty = assigned_qty + ? WHERE id = ?`, [assignedQuantity, item.id]);
      } else {
        const fieldName = orderType === "company" ? "employee_id" : "order_id";
        const assignmentResult = await getRow(
          `SELECT SUM(quantity) as totalAssigned FROM work_assignments WHERE ${fieldName} = ? AND task_type = ?`,
          [order.id, task_type]
        );
        const alreadyAssigned = assignmentResult?.totalAssigned || 0;
        const totalQty = order.noOfSets || 1;
        const remainingQty = Math.max(0, totalQty - alreadyAssigned);

        if (assignedQuantity > remainingQty) {
          return res.status(400).json({ error: "Exceeds remaining quantity", message: "Exceeds remaining quantity" });
        }
      }

      const now = new Date().toISOString();
    const assignedDate = now.split("T")[0];

    console.log("[WorkAssignment POST] Inserting into database:", {
      labour_id: labour.id,
      order_id: orderType === "civil" ? order.id : null,
      employee_id: orderType === "company" ? order.id : null,
      task_type,
      quantity: parseInt(quantity),
      status: "Pending",
      assigned_date: assignedDate,
    });

    const result = await run(
      `INSERT INTO work_assignments (labour_id, order_id, employee_id, task_type, quantity, status, assigned_date, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        labour.id,
        orderType === "civil" ? order.id : null,
        orderType === "company" ? order.id : null,
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
        order_id: orderType === "civil" ? order.id : null,
        employee_id: orderType === "company" ? order.id : null,
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

    // First, get the order to validate it exists and get its numeric ID
    let order = await getRow(
      "SELECT id, orderId, shirt, pant, noOfSets FROM orders WHERE id = ? OR orderId = ?",
      [orderId, orderId]
    );
    let orderType = "civil";

    if (!order) {
      order = await getRow(
        "SELECT id, orderId, shirt, pant, noOfSets FROM employees WHERE id = ? OR orderId = ?",
        [orderId, orderId]
      );
      if (order) {
        orderType = "company";
      }
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Split Order Assignment Logic (as requested)
    // We will use order_items for items checking. For company employees (which might be mixed),
    // we still use the order_id, although the backend structure maps it differently.

    const rows = await runQuery(
      `SELECT item_type AS itemType, total_qty AS totalQty, assigned_qty AS assignedQty,
       (total_qty - assigned_qty) AS remainingQty
       FROM order_items
       WHERE order_id = ? AND assigned_qty < total_qty`,
      [order.id]
    );

    // If order_items is empty (e.g. legacy company orders), fallback to DB sum calculation
    // but the request expects strictly order_items behavior.
    
    // Format response matching the frontend expectations
    const formattedItems = rows.map(r => ({
      itemType: r.itemType,
      totalQty: r.totalQty,
      assignedQty: r.assignedQty,
      remainingQty: r.remainingQty,
      isFullyAssigned: r.remainingQty <= 0,
      displayLabel: `${r.itemType} (Remaining: ${r.remainingQty})`
    }));

    res.json({
      orderId: order.orderId || order.id,
      items: formattedItems,
      allItems: formattedItems,
      summary: {
        totalItems: formattedItems.length,
        availableItems: formattedItems.filter(i => i.remainingQty > 0).length,
        fullyAssignedItems: 0 // pre-filtered by query
      }
    });

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;


