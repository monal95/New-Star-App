const express = require("express");
const router = express.Router();
const { runQuery, getRow } = require("../config/db");

// --- NEW EXACT ENDPOINTS PER REQUIREMENTS ---

/**
 * GET /api/analytics/orders-by-type
 * Show total orders grouped by dress type (Shirt, Pant only)
 */
router.get("/orders-by-type", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT item_type, SUM(total_qty) as total
       FROM order_items
       WHERE item_type IN ('Shirt', 'Pant', 'shirt', 'pant')
       GROUP BY item_type`,
      [],
    );
    // Capitalize properly in mapping if needed, but SQL might return original cases.
    res.json(rows);
  } catch (error) {
    console.error("Error fetching orders by type:", error);
    res.status(500).json(error);
  }
});

/**
 * GET /api/analytics/customer-orders
 * Show number of orders per customer
 */
router.get("/customer-orders", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT COALESCE(customer_name, name) as customer_name, COUNT(*) as total_orders
       FROM orders
       WHERE COALESCE(customer_name, name) IS NOT NULL AND COALESCE(customer_name, name) != ''
       GROUP BY COALESCE(customer_name, name)`,
      [],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json(error);
  }
});

/**
 * GET /api/analytics/labour-productivity
 * Show how much work each labour COMPLETED
 */
router.get("/labour-productivity", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT labour_id, l.name as labour_name, SUM(quantity) as total_completed
       FROM work_assignments wa
       JOIN labour l ON wa.labour_id = l.id
       WHERE wa.status = 'Completed' -- Counting only completed work
       GROUP BY labour_id`,
      [],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching labour productivity:", error);
    res.status(500).json(error);
  }
});

/**
 * GET /api/analytics/labour-workload
 * Show how much work was ASSIGNED to each labour
 */
router.get("/labour-workload", async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT labour_id, l.name as labour_name, SUM(quantity) as total_assigned
       FROM work_assignments wa
       JOIN labour l ON wa.labour_id = l.id
       GROUP BY labour_id`,
      [],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching labour workload:", error);
    res.status(500).json(error);
  }
});

// --- KEEPING EXISTING ENDPOINTS FOR OTHER DASHBOARD COMPONENTS ---

/**
 * GET /api/analytics/orders-by-dress-type
 * Get orders grouped by dress type (Shirt, Pant, Shirt & Pant)
 */
router.get("/orders-by-dress-type", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        CASE 
          WHEN (shirt IS NOT NULL AND shirt != '' AND shirt != '{}' AND 
                pant IS NOT NULL AND pant != '' AND pant != '{}') THEN 'Shirt & Pant'
          WHEN (shirt IS NOT NULL AND shirt != '' AND shirt != '{}') THEN 'Shirt'
          WHEN (pant IS NOT NULL AND pant != '' AND pant != '{}') THEN 'Pant'
          ELSE 'Other'
        END as name,
        COUNT(*) as value
      FROM orders
      WHERE status != 'Cancelled'
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` AND date >= ? AND date <= ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY name ORDER BY value DESC`;

    const results = await runQuery(query, params);

    // Filter out 'Other' if no data
    const filteredResults = results.filter(
      (r) => r.name !== "Other" || r.value > 0,
    );

    res.json(filteredResults || []);
  } catch (error) {
    console.error("Error fetching orders by dress type:", error);
    res.status(500).json({ error: "Failed to fetch dress type data" });
  }
});

/**
 * GET /api/analytics/tailor-productivity
 * Get tailor productivity with completed count
 */
router.get("/tailor-productivity", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        l.id,
        l.name as tailor,
        COUNT(CASE WHEN wa.status = 'Completed' THEN 1 END) as completed,
          COUNT(wa.id) as assigned,
          COUNT(wa.id) - COUNT(CASE WHEN wa.status = 'Completed' THEN 1 END) as pending
      LIMIT 10`;

    const results = await runQuery(query, params);

    res.json(results || []);
  } catch (error) {
    console.error("Error fetching tailor productivity:", error);
    res.status(500).json({ error: "Failed to fetch tailor productivity" });
  }
});

/**
 * GET /api/analytics/orders-summary
 * Get orders with tailor information
 */
router.get("/orders-summary", async (req, res) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;

    let query = `
      SELECT 
        o.id,
        o.orderId,
        o.name as customerName,
        CASE 
          WHEN (o.shirt IS NOT NULL AND o.shirt != '' AND o.shirt != '{}' AND 
                o.pant IS NOT NULL AND o.pant != '' AND o.pant != '{}') THEN 'Shirt & Pant'
          WHEN (o.shirt IS NOT NULL AND o.shirt != '' AND o.shirt != '{}') THEN 'Shirt'
          WHEN (o.pant IS NOT NULL AND o.pant != '' AND o.pant != '{}') THEN 'Pant'
          ELSE 'Other'
        END as dressType,
        o.totalAmount as price,
        o.status,
        o.date as deliveryDate,
        GROUP_CONCAT(DISTINCT l.name) as tailor
      FROM orders o
      LEFT JOIN work_assignments wa ON o.id = wa.order_id
      LEFT JOIN labour l ON wa.labour_id = l.id
      WHERE o.status != 'Cancelled'
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` AND o.date >= ? AND o.date <= ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY o.id, o.orderId
      ORDER BY o.date DESC
      LIMIT ?`;

    params.push(parseInt(limit));

    const results = await runQuery(query, params);

    res.json(results || []);
  } catch (error) {
    console.error("Error fetching orders summary:", error);
    res.status(500).json({ error: "Failed to fetch orders summary" });
  }
});

/**
 * GET /api/analytics/customer-analysis
 * Get customer analysis with order counts and total spending
 */
router.get("/customer-analysis", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        o.name as customerName,
        o.phone,
        COUNT(*) as totalOrders,
        SUM(o.totalAmount) as totalSpent,
        MAX(o.date) as lastOrderDate,
        COUNT(CASE WHEN o.status = 'Completed' THEN 1 END) as completedOrders
      FROM orders o
      WHERE o.company_id IS NULL AND o.status != 'Cancelled'
    `;

    const params = [];

    if (startDate && endDate) {
      query += ` AND o.date >= ? AND o.date <= ?`;
      params.push(startDate, endDate);
    }

    query += ` 
      GROUP BY o.name
      ORDER BY totalSpent DESC
      LIMIT 20`;

    const results = await runQuery(query, params);

    res.json(results || []);
  } catch (error) {
    console.error("Error fetching customer analysis:", error);
    res.status(500).json({ error: "Failed to fetch customer analysis" });
  }
});

/**
 * GET /api/analytics/monthly-revenue
 * Get monthly revenue data
 */
router.get("/monthly-revenue", async (req, res) => {
  try {
    const query = `
      SELECT 
        strftime('%Y-%m', o.date) as month,
        SUM(o.totalAmount) as revenue,
        COUNT(*) as orders
      FROM orders o
      WHERE o.status != 'Cancelled'
      GROUP BY strftime('%Y-%m', o.date)
      ORDER BY month DESC
      LIMIT 12
    `;

    const results = await runQuery(query, []);

    res.json(results || []);
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ error: "Failed to fetch monthly revenue" });
  }
});

/**
 * GET /api/analytics/kpi
 * Get key performance indicators
 */
router.get("/kpi", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = "WHERE o.status != 'Cancelled'";
    const params = [];

    if (startDate && endDate) {
      whereClause += " AND o.date >= ? AND o.date <= ?";
      params.push(startDate, endDate);
    }

    // Total Orders
    const totalOrdersResult = await runQuery(
      `SELECT COUNT(*) as count FROM orders o ${whereClause}`,
      params,
    );

    // Total Revenue
    const totalRevenueResult = await runQuery(
      `SELECT SUM(totalAmount) as revenue FROM orders o ${whereClause}`,
      params,
    );

    // Active Customers (orders without company_id in the period)
    const activeCustomersResult = await runQuery(
      `SELECT COUNT(DISTINCT name) as count FROM orders o ${whereClause} AND company_id IS NULL`,
      params,
    );

    // Pending Orders
    const pendingOrdersResult = await runQuery(
      `SELECT COUNT(*) as count FROM orders o WHERE (status = 'Pending' OR status = 'In Progress') AND o.status != 'Cancelled'`,
      [],
    );

    // Completed Orders
    const completedOrdersResult = await runQuery(
      `SELECT COUNT(*) as count FROM orders o WHERE status = 'Completed' AND o.status != 'Cancelled'`,
      [],
    );

    res.json({
      totalOrders: totalOrdersResult[0]?.count || 0,
      totalRevenue: totalRevenueResult[0]?.revenue || 0,
      activeCustomers: activeCustomersResult[0]?.count || 0,
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      completedOrders: completedOrdersResult[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching KPI data:", error);
    res.status(500).json({ error: "Failed to fetch KPI data" });
  }
});

module.exports = router;
