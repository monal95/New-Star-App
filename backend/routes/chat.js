const express = require("express");
const router = express.Router();
const { routeMessage } = require("../services/chatService");

/**
 * POST /api/chat
 * Accept: { message: string }
 * Return: { reply: string }
 */
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        reply: "Please provide a valid message.",
        error: "Message is required and must be a non-empty string.",
      });
    }

    // Route message and get reply
    const reply = await routeMessage(message);

    return res.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      reply: "Sorry, something went wrong. Please try again later.",
      error: "Internal server error",
    });
  }
});

module.exports = router;
