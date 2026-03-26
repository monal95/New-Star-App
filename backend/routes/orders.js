const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");
const { sendOrderStatusEmail } = require("../services/emailService");

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await runQuery(
      "SELECT * FROM orders ORDER BY createdAt DESC",
    );
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get civil orders (orders without company_id)
router.get("/civil", async (req, res) => {
  try {
    const { date } = req.query;
    let query = "SELECT * FROM orders WHERE company_id IS NULL";
    let params = [];

    // If date is provided, filter by that specific date
    if (date) {
      query += " AND date = ?";
      params.push(date);
    } else {
      // Otherwise, get current month's orders
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const monthPrefix = `${year}-${month}`;

      // Filter orders from current month
      query += " AND date LIKE ?";
      params.push(`${monthPrefix}%`);
    }

    query += " ORDER BY createdAt DESC";

    const orders = await runQuery(query, params);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching civil orders:", error);
    res.status(500).json({ error: "Failed to fetch civil orders" });
  }
});

// Search for previous customers by name (for auto-fill)
router.get("/search/customers", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.length < 2) {
      return res.json([]);
    }

    // Search for customers with matching names (case-insensitive)
    // Only search civil orders (orders without company_id)
    // Use a subquery to get measurements from the most recent order for each customer
    const customers = await runQuery(
      `SELECT 
        LOWER(o.name) as id,
        o.name,
        o.phone,
        o.email,
        o.shirt,
        o.pant,
        MAX(o.date) as lastOrderDate,
        COUNT(*) as orderCount
      FROM orders o
      WHERE o.company_id IS NULL AND LOWER(o.name) LIKE LOWER(?)
      GROUP BY LOWER(o.name)
      ORDER BY MAX(o.createdAt) DESC
      LIMIT 5`,
      [`%${name}%`],
    );

    // For each grouped customer, fetch the actual measurements from their most recent order
    const customersWithLatestMeasurements = await Promise.all(
      customers.map(async (customer) => {
        const latestOrder = await getRow(
          `SELECT shirt, pant FROM orders 
           WHERE company_id IS NULL AND LOWER(name) = LOWER(?)
           ORDER BY date DESC, createdAt DESC
           LIMIT 1`,
          [customer.name],
        );
        return {
          ...customer,
          shirt: latestOrder?.shirt || "{}",
          pant: latestOrder?.pant || "{}",
        };
      }),
    );

    res.json(customersWithLatestMeasurements);

    res.json(customers);
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Failed to search customers" });
  }
});

// Preview next order ID (does NOT increment counter - for display only)
// IMPORTANT: This route must be defined BEFORE /:id to avoid being caught by it
router.get("/generate/next-id", async (req, res) => {
  try {
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const counter = await getRow("SELECT * FROM order_counters WHERE id = ?", [
      "order_counter",
    ]);

    let previewId = "ORD001";
    let shouldReset = false;

    if (!counter) {
      previewId = "ORD001";
    } else if (counter.lastMonth !== currentMonthKey) {
      // New month - preview will be ORD001
      shouldReset = true;
      previewId = "ORD001";
    } else {
      // Preview the next ID without incrementing
      const nextNum = counter.count + 1;
      previewId = `ORD${String(nextNum).padStart(3, "0")}`;
    }

    res.json({
      nextId: previewId,
      monthReset: shouldReset,
      currentMonth: currentMonthKey,
    });
  } catch (error) {
    console.error("Error previewing order ID:", error);
    res.status(500).json({ error: "Failed to preview order ID" });
  }
});

// Get single order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await getRow("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Helper function to generate order ID atomically (only during order creation)
const generateOrderIdAtomic = async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const counter = await getRow("SELECT * FROM order_counters WHERE id = ?", [
    "order_counter",
  ]);

  if (!counter) {
    // First time initialization
    await run(
      "INSERT INTO order_counters (id, lastMonth, count, lastResetDate) VALUES (?, ?, ?, ?)",
      ["order_counter", currentMonthKey, 0, now.toISOString()],
    );
  } else if (counter.lastMonth !== currentMonthKey) {
    // New month detected - reset counter
    await run(
      "UPDATE order_counters SET lastMonth = ?, count = ?, lastResetDate = ? WHERE id = ?",
      [currentMonthKey, 0, now.toISOString(), "order_counter"],
    );
  }

  // Atomically increment and get the next ID
  const result = await run(
    "UPDATE order_counters SET count = count + 1 WHERE id = ?",
    ["order_counter"],
  );

  const updatedCounter = await getRow(
    "SELECT * FROM order_counters WHERE id = ?",
    ["order_counter"],
  );

  const nextNum = updatedCounter.count;
  return `ORD${String(nextNum).padStart(3, "0")}`;
};

// Create new order
router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      noOfSets,
      shirtAmount,
      pantAmount,
      advanceAmount,
      paymentMethod,
      shirt,
      pant,
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    // Generate order ID atomically - only increments when order is actually created
    const orderId = await generateOrderIdAtomic();

    const totalAmount =
      ((parseFloat(shirtAmount) || 500) + (parseFloat(pantAmount) || 400)) *
      (parseInt(noOfSets) || 1);
    const advancePaid = parseFloat(advanceAmount) || 0;
    const remainingAmount = Math.max(0, totalAmount - advancePaid);

    const now = new Date().toISOString();
    const date = now.split("T")[0];

    const result = await run(
      `INSERT INTO orders (
        orderId, name, phone, email, noOfSets, shirtAmount, pantAmount,
        totalAmount, advanceAmount, remainingAmount, paymentMethod,
        shirt, pant, status, date, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        name,
        phone,
        email || "",
        parseInt(noOfSets) || 1,
        parseFloat(shirtAmount) || 500,
        parseFloat(pantAmount) || 400,
        totalAmount,
        advancePaid,
        remainingAmount,
        paymentMethod || "Cash",
        JSON.stringify(shirt || {}),
        JSON.stringify(pant || {}),
        "Pending",
        date,
        now,
        now,
      ],
    );

    const defaultQty = parseInt(noOfSets) || 1;
    const itemTypes = ["Shirt", "Pant", "Ironing", "Embroidery"];
    for (const t of itemTypes) {
      await runQuery(
        "INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        [result.id, t, defaultQty, now, now],
      );
    }

    const newOrder = {
      id: result.id,
      orderId,
      name,
      phone,
      email: email || "",
      noOfSets: parseInt(noOfSets) || 1,
      shirtAmount: parseFloat(shirtAmount) || 500,
      pantAmount: parseFloat(pantAmount) || 400,
      totalAmount,
      advanceAmount: advancePaid,
      remainingAmount,
      paymentMethod: paymentMethod || "Cash",
      shirt: shirt || {},
      pant: pant || {},
      status: "Pending",
      date,
      createdAt: now,
      updatedAt: now,
    };

    // Send email notification for civil orders (orders without company_id)
    if (newOrder.email && newOrder.email.trim()) {
      const emailResult = await sendOrderStatusEmail(newOrder, "Pending");
      console.log("\n📧 Order Creation Email Result:");
      console.log(`   Success: ${emailResult.success}`);
      console.log(`   Message: ${emailResult.message}`);
      if (!emailResult.success && emailResult.error) {
        console.log(`   Error Code: ${emailResult.error}`);
      }
      console.log();
    }

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = [
      "Pending",
      "In Progress",
      "Ready",
      "Delivered",
      "Completed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Fetch the order first to get all details for email
    const order = await getRow("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order status in database
    const now = new Date().toISOString();
    const result = await run(
      "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?",
      [status, now, req.params.id],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send email notification for civil orders (orders without company_id)
    if (!order.company_id) {
      const emailResult = await sendOrderStatusEmail(order, status);
      console.log("\n📧 Email Result:");
      console.log(`   Success: ${emailResult.success}`);
      console.log(`   Message: ${emailResult.message}`);
      if (!emailResult.success && emailResult.error) {
        console.log(`   Error Code: ${emailResult.error}`);
      }
      console.log();
    }

    res.json({
      message: "Status updated successfully",
      emailSent: !order.company_id,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Update entire order
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
      `UPDATE orders SET ${setClause} WHERE id = ?`,
      values,
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Delete order
router.delete("/:id", async (req, res) => {
  try {
    const result = await run("DELETE FROM orders WHERE id = ?", [
      req.params.id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
