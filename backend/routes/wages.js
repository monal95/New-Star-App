const express = require("express");
const router = express.Router();
const { runQuery, getRow, run } = require("../config/db");

// Standard wage rates (default configuration)
const DEFAULT_WAGES = {
  pant: 110,
  shirt: 100,
  ironing_pant: 12,
  ironing_shirt: 10,
  embroidery: 25,
};

// Initialize wage configuration in database
const initializeWages = async () => {
  const existing = await getRow("SELECT * FROM wages WHERE id = 'default'");
  if (!existing) {
    await run(
      "INSERT INTO wages (id, pant, shirt, ironing_pant, ironing_shirt, embroidery, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "default",
        110,
        100,
        12,
        10,
        25,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );
  }
};

// Get wage configuration
router.get("/", async (req, res) => {
  try {
    await initializeWages();

    const wages = await getRow("SELECT * FROM wages WHERE id = 'default'");
    res.json(wages || DEFAULT_WAGES);
  } catch (error) {
    console.error("Error fetching wages:", error);
    res.status(500).json({ error: "Failed to fetch wage configuration" });
  }
});

// Update wage configuration
router.put("/", async (req, res) => {
  try {
    const { pant, shirt, ironing_pant, ironing_shirt, embroidery } = req.body;

    // Validation
    if (
      pant === undefined ||
      shirt === undefined ||
      ironing_pant === undefined ||
      ironing_shirt === undefined ||
      embroidery === undefined
    ) {
      return res.status(400).json({
        error: "All wage fields are required",
      });
    }

    // Ensure all values are positive numbers
    const wages = {
      pant: parseFloat(pant),
      shirt: parseFloat(shirt),
      ironing_pant: parseFloat(ironing_pant),
      ironing_shirt: parseFloat(ironing_shirt),
      embroidery: parseFloat(embroidery),
    };

    if (Object.values(wages).some((v) => isNaN(v) || v < 0)) {
      return res.status(400).json({
        error: "All wages must be positive numbers",
      });
    }

    const now = new Date().toISOString();
    const result = await run(
      "UPDATE wages SET pant = ?, shirt = ?, ironing_pant = ?, ironing_shirt = ?, embroidery = ?, updatedAt = ? WHERE id = ?",
      [
        wages.pant,
        wages.shirt,
        wages.ironing_pant,
        wages.ironing_shirt,
        wages.embroidery,
        now,
        "default",
      ],
    );

    if (result.changes === 0) {
      // Create if doesn't exist
      await run(
        "INSERT INTO wages (id, pant, shirt, ironing_pant, ironing_shirt, embroidery, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "default",
          wages.pant,
          wages.shirt,
          wages.ironing_pant,
          wages.ironing_shirt,
          wages.embroidery,
          now,
          now,
        ],
      );
    }

    res.json({
      message: "Wage configuration updated successfully",
      wages,
    });
  } catch (error) {
    console.error("Error updating wages:", error);
    res.status(500).json({ error: "Failed to update wage configuration" });
  }
});

// Reset to default wages
router.post("/reset", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = await run(
      "UPDATE wages SET pant = ?, shirt = ?, ironing_pant = ?, ironing_shirt = ?, embroidery = ?, updatedAt = ? WHERE id = ?",
      [110, 100, 12, 10, 25, now, "default"],
    );

    if (result.changes === 0) {
      // Create if doesn't exist
      await run(
        "INSERT INTO wages (id, pant, shirt, ironing_pant, ironing_shirt, embroidery, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ["default", 110, 100, 12, 10, 25, now, now],
      );
    }

    res.json({
      message: "Wages reset to default values",
      wages: DEFAULT_WAGES,
    });
  } catch (error) {
    console.error("Error resetting wages:", error);
    res.status(500).json({ error: "Failed to reset wages" });
  }
});

module.exports = router;
