const Groq = require("groq-sdk");
const { runQuery, getRow, run } = require("../config/db");

// Initialize Groq client (gracefully handles missing key)
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// System prompt for the tailoring assistant
const SYSTEM_PROMPT = `You are "Tailor Assistant", a friendly and knowledgeable AI assistant for a Smart Tailoring Management System called "New Star Tailors".

Your expertise includes:
- Tailoring services: shirts, pants, suits, alterations, embroidery
- Pricing information: Shirt stitching starts at Rs.500, Pant stitching starts at Rs.400, Ironing services available
- Order management: helping customers check order status, place new orders
- Measurement guidance: explaining how to take body measurements
- Fabric recommendations and care tips
- Delivery timelines: typically 5-7 working days for standard orders

Be concise, helpful, and professional. Use simple language. If asked about something outside tailoring, politely redirect the conversation.`;

// Application usage guide
const APP_USAGE_GUIDE = `📚 NEW STAR SMART TAILORING SYSTEM - USER GUIDE

🏠 CIVIL DASHBOARD:
- View all customer orders
- Track order status (Pending, In Progress, Completed, Delivered)
- See order details, delivery dates, and amounts
- Update order statuses

👥 COMPANY DASHBOARD:
- Manage company accounts and bulk orders
- View company-wise order analytics
- Track company performance

👷 LABOUR DASHBOARD:
- Manage tailor/worker information
- Assign work to labour
- Track labour performance and productivity

💰 WAGE CONFIGURATION:
- Set wage rates for different tasks
- Configure payment for shirts, pants, ironing, embroidery

📊 ANALYTICS DASHBOARD:
- View comprehensive business statistics
- Track total income and order trends
- Monitor labour productivity

💬 CHATBOT (Me!):
- Check order status by Order ID
- Get business statistics
- Learn about services and pricing
- Ask for application help

How can I assist you today?`;

const STATISTICS_HELP = `📊 STATISTICS QUERIES YOU CAN ASK:
- "Show statistics" or "Get stats"
- "How many orders today?"
- "Total income?" or "Sales data"
- "Orders by status"
- "Labour count" or "Total tailors"
- "Recent orders"

Example: "Statistics" or "How many pending orders?"`;

const ORDER_HELP = `🛒 ORDER QUERIES YOU CAN ASK:
- "Order 006" or "Order ID 006"
- "Check order status 006"
- "Where is order NS-MAR-006?"
- "Track order ORD-001"
- "Order details for 006"

Just mention the Order ID and I'll get you the details!`;

/**
 * Get AI-generated reply using Groq
 */
async function getAIReply(userMessage) {
  if (!groq) {
    return "I'm your Tailor Assistant! I can help you with order management, pricing, and tailoring queries. However, my AI features require a Groq API key to be configured. Please contact the administrator to enable full AI capabilities.";
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq API error:", error.message);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact support.";
  }
}

/**
 * Get comprehensive statistics
 */
async function getStatistics() {
  try {
    // Total orders
    const totalOrdersResult = await getRow(
      "SELECT COUNT(*) as count FROM orders",
      [],
    );
    const totalOrders = totalOrdersResult?.count || 0;

    // Orders by status
    const statusDistribution = await runQuery(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status",
      [],
    );

    // Total income
    const incomeResult = await getRow(
      "SELECT SUM(totalAmount) as total FROM orders WHERE status IN ('Completed', 'Delivered')",
      [],
    );
    const totalIncome = incomeResult?.total || 0;

    // Pending income
    const pendingResult = await getRow(
      "SELECT SUM(remainingAmount) as total FROM orders WHERE status != 'Delivered'",
      [],
    );
    const pendingIncome = pendingResult?.total || 0;

    // Today's orders
    const todayResult = await getRow(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(createdAt) = DATE('now') OR DATE(created_at) = DATE('now')",
      [],
    );
    const todayOrders = todayResult?.count || 0;

    // Total labour
    const labourResult = await getRow(
      "SELECT COUNT(*) as count FROM labour WHERE status = 'Active'",
      [],
    );
    const totalLabour = labourResult?.count || 0;

    // Build status distribution string
    let statusStr = "";
    if (statusDistribution && statusDistribution.length > 0) {
      statusStr = statusDistribution
        .map((s) => `${s.status}: ${s.count}`)
        .join("\n");
    }

    const stats =
      `📊 BUSINESS STATISTICS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 Total Orders: ${totalOrders}\n` +
      `📅 Orders Today: ${todayOrders}\n` +
      `💰 Completed Income: Rs.${totalIncome.toFixed(2)}\n` +
      `💳 Pending Income: Rs.${pendingIncome.toFixed(2)}\n` +
      `👷 Active Tailors: ${totalLabour}\n` +
      `\n` +
      `ORDER STATUS BREAKDOWN:\n` +
      (statusStr || "No orders yet") +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━`;

    return stats;
  } catch (error) {
    console.error("Statistics query error:", error);
    return "Sorry, I couldn't fetch statistics. Please try again.";
  }
}

/**
 * Handle order status query
 * Searches by orderId field or numeric id
 */
async function handleOrderQuery(orderIdentifier) {
  try {
    // Clean the identifier - remove common prefixes
    let searchId = orderIdentifier.toString().trim();

    // Try to find by orderId (e.g., "NS-MAR-001") or by numeric id
    let order = await getRow(
      "SELECT id, orderId, name, customer_name, status, dress_type, shirt, pant, delivery_date, totalAmount, advanceAmount, remainingAmount, paymentMethod FROM orders WHERE orderId = ? OR id = ? OR orderId LIKE ? OR id = ?",
      [searchId, searchId, `%${searchId}%`, parseInt(searchId) || searchId],
    );

    if (!order) {
      return `Order "${orderIdentifier}" was not found. Please check the order ID and try again. You can ask "Order help" for examples.`;
    }

    const customerName = order.name || order.customer_name || "N/A";
    const status = order.status || "Unknown";
    const ordId = order.orderId || order.id;
    const deliveryDate = order.delivery_date || "Not set";
    const amount = order.totalAmount ? `Rs.${order.totalAmount}` : "N/A";
    const advance = order.advanceAmount ? `Rs.${order.advanceAmount}` : "0";
    const remaining = order.remainingAmount
      ? `Rs.${order.remainingAmount}`
      : "0";

    // Determine status emoji
    const statusEmoji =
      status === "Completed"
        ? "✅"
        : status === "Delivered"
          ? "🚚"
          : status === "In Progress"
            ? "⏳"
            : "📋";

    return (
      `${statusEmoji} ORDER #${ordId}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Customer: ${customerName}\n` +
      `📊 Status: ${status}\n` +
      `📅 Delivery: ${deliveryDate}\n` +
      `💰 Total: ${amount}\n` +
      `💳 Advance: ${advance}\n` +
      `▪️ Remaining: ${remaining}\n` +
      `💵 Payment: ${order.paymentMethod || "Cash"}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  } catch (error) {
    console.error("Order query error:", error);
    return "Sorry, I couldn't look up that order. Please try again.";
  }
}

/**
 * Add a new order via chat command
 * Format: "add order <customer_name> <item> <status>"
 */
async function addOrder(customerName, item, status) {
  try {
    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO orders (customer_name, dress_type, status, createdAt, updatedAt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerName, item, status || "Pending", now, now, now, now],
    );

    return `Order created successfully!\nOrder ID: ${result.id}\nCustomer: ${customerName}\nItem: ${item}\nStatus: ${status || "Pending"}`;
  } catch (error) {
    console.error("Add order error:", error);
    return "Sorry, I couldn't create the order. Please try again or use the order form.";
  }
}

/**
 * Route incoming message to the appropriate handler
 */
async function routeMessage(message) {
  const msg = message.trim();
  const lowerMsg = msg.toLowerCase();

  // 1. Check for help/guide requests
  if (
    lowerMsg.includes("help") ||
    lowerMsg.includes("how to use") ||
    lowerMsg.includes("guide") ||
    lowerMsg.includes("tutorial")
  ) {
    if (lowerMsg.includes("order") || lowerMsg.includes("track")) {
      return ORDER_HELP;
    } else if (lowerMsg.includes("stat") || lowerMsg.includes("analyt")) {
      return STATISTICS_HELP;
    } else {
      return APP_USAGE_GUIDE;
    }
  }

  // 2. Check for statistics/analytics queries
  if (
    lowerMsg.includes("statistics") ||
    lowerMsg.includes("stats") ||
    lowerMsg.includes("analytics") ||
    (lowerMsg.includes("how many") &&
      (lowerMsg.includes("order") ||
        lowerMsg.includes("income") ||
        lowerMsg.includes("tailor") ||
        lowerMsg.includes("labour"))) ||
    lowerMsg.includes("business summary") ||
    lowerMsg.includes("total income") ||
    lowerMsg.includes("sales data") ||
    lowerMsg.includes("pending orders") ||
    lowerMsg.includes("completed orders")
  ) {
    return await getStatistics();
  }

  // 3. Check for "add order" command
  const addOrderMatch = msg.match(/^add\s+order\s+(\S+)\s+(\S+)\s*(\S+)?$/i);
  if (addOrderMatch) {
    const [, name, item, status] = addOrderMatch;
    return await addOrder(name, item, status);
  }

  // 4. Check for order status query - improved patterns
  const orderStatusPatterns = [
    // "order 006", "order id 006", "order NS-MAR-006"
    /order\s+(?:id|#|:)?\s*([A-Z0-9\-]+|\d+)/i,
    // "check order status 006", "track order 006"
    /(?:check|track|check status of|status of)\s+order\s+([A-Z0-9\-]+|\d+)/i,
    // "is order 006 ready", "where is order 006"
    /(?:is|where is|what about)\s+order\s+(?:id)?\s*([A-Z0-9\-]+|\d+)/i,
    // "006 status", "#006"
    /^#?([A-Z0-9\-]{2,}|\d+)$/i,
    // "ORD008", "NS-MAR-001"
    /\b((?:ORD|NS)[A-Z0-9\-]*|\d{3,})\b/i,
    // Just a number like "006"
    /(?:^|\s)(\d{2,})(?:\s|$)/i,
  ];

  for (const pattern of orderStatusPatterns) {
    const match = lowerMsg.match(pattern);
    if (match && match[1]) {
      return await handleOrderQuery(match[1]);
    }
  }

  // Also check if order-related keywords are present with an ID
  if (
    (lowerMsg.includes("order") ||
      lowerMsg.includes("track") ||
      lowerMsg.includes("check") ||
      lowerMsg.includes("status")) &&
    !lowerMsg.includes("all order") &&
    !lowerMsg.includes("total order")
  ) {
    const idMatch =
      msg.match(/\b(\d+)\b/) || msg.match(/\b(ORD\d+|NS[\w\-]*\d+)\b/i);
    if (idMatch) {
      return await handleOrderQuery(idMatch[1]);
    }
  }

  // 5. General query - use AI
  return await getAIReply(msg);
}

module.exports = {
  getAIReply,
  handleOrderQuery,
  getStatistics,
  addOrder,
  routeMessage,
};
