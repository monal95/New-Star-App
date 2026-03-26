const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Position types for company employees
const POSITION_TYPES = [
  "Employee",
  "Watchman",
  "Security",
  "HR",
  "Manager",
  "Senior Manager",
  "Housekeeping",
  "Other",
];

// Get all employees for a company
router.get("/company/:companyId", async (req, res) => {
  try {
    const employees = await runQuery(
      "SELECT * FROM employees WHERE company_id = ? ORDER BY createdAt DESC",
      [req.params.companyId],
    );

    // Parse JSON measurements fields if they exist
    const parsedEmployees = employees.map((emp) => ({
      ...emp,
      orderId:
        emp.orderId && emp.orderId.toLowerCase() !== "auto"
          ? emp.orderId
          : `EMP${emp.id}`,
      shirt: emp.shirt ? JSON.parse(emp.shirt) : {},
      pant: emp.pant ? JSON.parse(emp.pant) : {},
    }));

    res.json(parsedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Get single employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await getRow("SELECT * FROM employees WHERE id = ?", [
      req.params.id,
    ]);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Parse JSON measurements fields if they exist
    const parsedEmployee = {
      ...employee,
      orderId:
        employee.orderId && employee.orderId.toLowerCase() !== "auto"
          ? employee.orderId
          : `EMP${employee.id}`,
      shirt: employee.shirt ? JSON.parse(employee.shirt) : {},
      pant: employee.pant ? JSON.parse(employee.pant) : {},
    };

    res.json(parsedEmployee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// Create new employee order
router.post("/", async (req, res) => {
  try {
    const { companyId, orderId, name, phone, position, noOfSets, shirt, pant } =
      req.body;

    // Validate required fields
    if (!companyId || !name) {
      console.log("❌ Missing required fields:", { companyId, name });
      return res
        .status(400)
        .json({ error: "Company ID and name are required" });
    }

    // Validate position
    const validPosition = POSITION_TYPES.includes(position)
      ? position
      : "Employee";

    // Map position to category prefix for OrderID generation
    const positionPrefixMap = {
      Watchman: "WTM",
      Employee: "EMP",
      HR: "HR",
      Manager: "MGR",
      Security: "SEC",
      "Senior Manager": "SMR",
      Housekeeping: "HK",
      Other: "OTH",
    };

    const prefix = positionPrefixMap[validPosition] || "OTH";
    const counterKey = `employee_counter_${prefix}`;

    // Generate position-specific incremental OrderID
    const counter = await getRow("SELECT * FROM order_counters WHERE id = ?", [
      counterKey,
    ]);

    if (!counter) {
      // First time initialization for this category
      const now = new Date().toISOString();
      await run(
        "INSERT INTO order_counters (id, lastMonth, count, lastResetDate) VALUES (?, ?, ?, ?)",
        [counterKey, new Date().getFullYear() + "-01", 0, now],
      );
    }

    // Atomically increment counter for this position category
    await run("UPDATE order_counters SET count = count + 1 WHERE id = ?", [
      counterKey,
    ]);

    const updatedCounter = await getRow(
      "SELECT * FROM order_counters WHERE id = ?",
      [counterKey],
    );

    const generatedOrderId = `${prefix}${String(updatedCounter.count).padStart(3, "0")}`;
    const now = new Date().toISOString();

    console.log("📝 Creating employee order:", {
      name,
      companyId,
      position: validPosition,
      noOfSets,
      orderId: generatedOrderId,
    });

    // First, create an order record (required for order_items foreign key)
    const orderResult = await run(
      `INSERT INTO orders (
        orderId, name, phone, email, noOfSets, shirtAmount, pantAmount,
        totalAmount, advanceAmount, remainingAmount, paymentMethod,
        shirt, pant, status, company_id, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedOrderId,
        name,
        phone,
        "",
        parseInt(noOfSets) || 1,
        500,
        400,
        (parseInt(noOfSets) || 1) * 900,
        0,
        (parseInt(noOfSets) || 1) * 900,
        "Cash",
        JSON.stringify(shirt || {}),
        JSON.stringify(pant || {}),
        "Pending",
        companyId,
        now,
        now,
      ],
    );

    // Now create the employee record
    const result = await run(
      `INSERT INTO employees (name, role, position, company_id, email, phone, joinDate, status, createdAt, updatedAt, orderId, noOfSets, shirt, pant)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        validPosition,
        validPosition,
        companyId,
        "",
        phone,
        now.split("T")[0],
        "Pending",
        now,
        now,
        generatedOrderId,
        parseInt(noOfSets) || 1,
        JSON.stringify(shirt || {}),
        JSON.stringify(pant || {}),
      ],
    );

    // Update company's total orders count
    await run(
      "UPDATE companies SET totalOrders = totalOrders + 1 WHERE id = ?",
      [companyId],
    );

    // Insert order items (using the order ID, not employee ID)
    const defaultQty = parseInt(noOfSets) || 1;
    const itemTypes = ["Shirt", "Pant", "Ironing", "Embroidery"];
    for (const t of itemTypes) {
      await run(
        "INSERT INTO order_items (order_id, item_type, total_qty, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        [orderResult.id, t, defaultQty, now, now],
      );
    }

    res.status(201).json({
      message: "Employee order created successfully",
      employee: {
        id: result.id,
        companyId,
        orderId: generatedOrderId,
        name,
        position: validPosition,
        noOfSets: parseInt(noOfSets) || 1,
        shirt: shirt || {},
        pant: pant || {},
        status: "Pending",
        date: now.split("T")[0],
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("❌ Error creating employee order:", error);
    res.status(500).json({
      error: "Failed to create employee order",
      details: error.message,
    });
  }
});

// Update employee status
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
      "Moved to Stitching",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const now = new Date().toISOString();
    const result = await run(
      "UPDATE employees SET status = ?, updatedAt = ? WHERE id = ?",
      [status, now, req.params.id],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Update employee order
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.company_id;
    delete updateData.companyId;

    // Build dynamic SET clause
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    values.push(new Date().toISOString()); // For updatedAt
    values.push(req.params.id); // For WHERE clause

    const setClause =
      fields.map((field) => `${field} = ?`).join(", ") + ", updatedAt = ?";

    const result = await run(
      `UPDATE employees SET ${setClause} WHERE id = ?`,
      values,
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    // Get employee first to update company count
    const employee = await getRow("SELECT * FROM employees WHERE id = ?", [
      req.params.id,
    ]);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await run("DELETE FROM employees WHERE id = ?", [req.params.id]);

    // Update company's total orders count
    if (employee.company_id) {
      await run(
        "UPDATE companies SET totalOrders = totalOrders - 1 WHERE id = ?",
        [employee.company_id],
      );
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// Generate next order ID for a company
router.get("/company/:companyId/next-id", async (req, res) => {
  try {
    const employees = await runQuery(
      "SELECT * FROM employees WHERE company_id = ? ORDER BY createdAt DESC LIMIT 1",
      [req.params.companyId],
    );

    let nextId = "EMP001";
    if (employees.length > 0 && employees[0].orderId) {
      const lastNum = parseInt(employees[0].orderId.replace("EMP", "")) || 0;
      nextId = `EMP${String(lastNum + 1).padStart(3, "0")}`;
    }

    res.json({ nextId });
  } catch (error) {
    console.error("Error generating order ID:", error);
    res.status(500).json({ error: "Failed to generate order ID" });
  }
});

// Get position types
router.get("/positions/list", async (req, res) => {
  res.json({ positions: POSITION_TYPES });
});

module.exports = router;
