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
 * Handle order status query
 * Searches by orderId field or numeric id
 */
async function handleOrderQuery(orderIdentifier) {
  try {
    // Try to find by orderId (e.g., "NS-MAR-001") or by numeric id
    let order = await getRow(
      "SELECT id, orderId, name, customer_name, status, dress_type, shirt, pant, delivery_date, totalAmount FROM orders WHERE orderId = ? OR id = ?",
      [orderIdentifier, orderIdentifier],
    );

    if (!order) {
      return `Order "${orderIdentifier}" was not found. Please check the order ID and try again. You can ask your tailor for the correct order ID.`;
    }

    const customerName = order.name || order.customer_name || "N/A";
    const status = order.status || "Unknown";
    const ordId = order.orderId || order.id;
    const deliveryDate = order.delivery_date || "Not set";
    const amount = order.totalAmount ? `Rs.${order.totalAmount}` : "N/A";

    return (
      `Order #${ordId}\n` +
      `Customer: ${customerName}\n` +
      `Status: ${status}\n` +
      `Delivery Date: ${deliveryDate}\n` +
      `Total Amount: ${amount}`
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
 * Handle analytics queries
 */
async function handleAnalyticsQuery(message) {
  try {
    const lowerMsg = message.toLowerCase();

    // Total orders in last 7 days
    if (
      lowerMsg.includes("total") &&
      lowerMsg.includes("order") &&
      (lowerMsg.includes("7 days") ||
        lowerMsg.includes("last week") ||
        lowerMsg.includes("last 7"))
    ) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = await getRow(
        "SELECT COUNT(*) as count FROM orders WHERE createdAt >= ? OR created_at >= ?",
        [sevenDaysAgo.toISOString(), sevenDaysAgo.toISOString()],
      );
      const count = result?.count || 0;
      return `Total orders created in the last 7 days: ${count}`;
    }

    // Total orders today
    if (
      lowerMsg.includes("total") &&
      lowerMsg.includes("order") &&
      lowerMsg.includes("today")
    ) {
      const today = new Date().toDateString();
      const result = await getRow(
        "SELECT COUNT(*) as count FROM orders WHERE DATE(createdAt) = DATE(?) OR DATE(created_at) = DATE(?)",
        [new Date().toISOString(), new Date().toISOString()],
      );
      const count = result?.count || 0;
      return `Total orders created today: ${count}`;
    }

    return null; // Not an analytics query
  } catch (error) {
    console.error("Analytics query error:", error);
    return null;
  }
}

/**
 * Route incoming message to the appropriate handler
 */
async function routeMessage(message) {
  const msg = message.trim();
  const lowerMsg = msg.toLowerCase();

  // 1. Check for analytics queries first
  const analyticsResult = await handleAnalyticsQuery(msg);
  if (analyticsResult) {
    return analyticsResult;
  }

  // 2. Check for "add order" command
  const addOrderMatch = msg.match(/^add\s+order\s+(\S+)\s+(\S+)\s*(\S+)?$/i);
  if (addOrderMatch) {
    const [, name, item, status] = addOrderMatch;
    return await addOrder(name, item, status);
  }

  // 3. Check for order status query - improved patterns
  const orderStatusPatterns = [
    /(?:order\s*(?:status|track|check|details|info|completed|ready|done))\s*[:#]?\s*(\S+)/i,
    /(?:status|track|check|completed|ready|done)\s+(?:order|my order)\s*[:#]?\s*(\S+)/i,
    /(?:is|are)\s+(?:.*?\s+)?order\s+(\S+)\s+(?:completed|ready|done|finished)/i,
    /(?:where is|what about|is)\s+(?:order|my order|the order)\s*[:#]?\s*(\S+)/i,
    /^#?(\d+)$/,
    /\b(ORD\d+)\b/i, // Match order IDs like ORD008
  ];

  for (const pattern of orderStatusPatterns) {
    const match = lowerMsg.match(pattern);
    if (match) {
      return await handleOrderQuery(match[1]);
    }
  }

  // Also check if order-related keywords are present with an ID
  if (
    lowerMsg.includes("order") &&
    (lowerMsg.includes("status") ||
      lowerMsg.includes("track") ||
      lowerMsg.includes("check") ||
      lowerMsg.includes("completed") ||
      lowerMsg.includes("ready") ||
      lowerMsg.includes("done"))
  ) {
    const idMatch =
      msg.match(/\b(\d+)\b/) || msg.match(/\b(ORD\d+|NS-\w+-\d+)\b/i);
    if (idMatch) {
      return await handleOrderQuery(idMatch[1]);
    }
  }

  // 4. General query - use AI
  return await getAIReply(msg);
}

module.exports = {
  getAIReply,
  handleOrderQuery,
  addOrder,
  routeMessage,
};
