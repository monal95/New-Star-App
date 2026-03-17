const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const aiGarmentService = require("../services/aiGarmentService");
const tryonService = require("../services/tryonService");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

/**
 * POST /api/tryon-ai
 *
 * Virtual Try-On API Endpoint
 *
 * Step 1: Generate garment from textile using Replicate AI
 * Step 2: Apply try-on using external try-on API
 * Step 3: Return both preview and final output
 *
 * @param {File} userImage - Person's photo
 * @param {File} textileImage - Plain cloth/fabric image
 * @param {String} garmentType - Type (shirt/kurti/blazer)
 *
 * @returns {Object} { success, garmentPreview, finalOutput }
 */
router.post(
  "/api/tryon-ai",
  upload.fields([
    { name: "userImage", maxCount: 1 },
    { name: "textileImage", maxCount: 1 },
  ]),
  async (req, res) => {
    let tempFiles = [];

    try {
      console.log("\n========== VIRTUAL TRY-ON PROCESS STARTED ==========");

      // 1. Validate inputs
      if (!req.files?.userImage || !req.files?.textileImage) {
        console.error("❌ Missing required images");
        return res.status(400).json({
          success: false,
          error: "Both userImage and textileImage are required",
        });
      }

      const { garmentType } = req.body;
      if (!garmentType) {
        console.error("❌ Missing garment type");
        return res.status(400).json({
          success: false,
          error: "Garment type is required (shirt/kurti/blazer)",
        });
      }

      const userImageBuffer = req.files.userImage[0].buffer;
      const textileImageBuffer = req.files.textileImage[0].buffer;

      console.log("✅ Step 1: Inputs validated");
      console.log(`   - User Image Size: ${userImageBuffer.length} bytes`);
      console.log(
        `   - Textile Image Size: ${textileImageBuffer.length} bytes`,
      );
      console.log(`   - Garment Type: ${garmentType}`);

      // 2. Convert textile image to base64
      console.log("\n📥 Step 2: Converting textile image to base64...");
      const textileBase64 = textileImageBuffer.toString("base64");
      console.log("✅ Textile image converted to base64");

      // 3. Generate garment using Replicate API
      console.log(
        "\n🎨 Step 3: Generating garment using Replicate AI (stability-ai/sdxl)...",
      );
      let garmentPreview;
      try {
        garmentPreview = await aiGarmentService.generateGarment(
          textileBase64,
          garmentType,
          req.body.quality || "high",
        );
        console.log("✅ Garment generated successfully");
        console.log(`   - Preview URL: ${garmentPreview}`);
      } catch (error) {
        console.warn("⚠️  First attempt failed, retrying...");
        console.log(`   - Error: ${error.message}`);

        // Retry logic
        garmentPreview = await aiGarmentService.generateGarment(
          textileBase64,
          garmentType,
          req.body.quality || "high",
        );
        console.log("✅ Garment generated successfully on retry");
        console.log(`   - Preview URL: ${garmentPreview}`);
      }

      // 4. Convert user image to base64 for try-on API
      console.log("\n👤 Step 4: Preparing user image for try-on...");
      const userImageBase64 = userImageBuffer.toString("base64");
      const userImageDataUrl = `data:image/png;base64,${userImageBase64}`;
      console.log("✅ User image prepared");

      // 5. Apply virtual try-on
      console.log("\n👗 Step 5: Applying virtual try-on using external API...");
      let finalOutput;
      try {
        finalOutput = await tryonService.applyTryOn(
          userImageDataUrl,
          garmentPreview,
        );
        console.log("✅ Virtual try-on applied successfully");
        console.log(`   - Final Output URL: ${finalOutput}`);
      } catch (error) {
        console.warn("⚠️  First try-on attempt failed, retrying...");
        console.log(`   - Error: ${error.message}`);

        // Retry logic for try-on
        finalOutput = await tryonService.applyTryOn(
          userImageDataUrl,
          garmentPreview,
        );
        console.log("✅ Virtual try-on applied successfully on retry");
        console.log(`   - Final Output URL: ${finalOutput}`);
      }

      // 6. Success response
      console.log(
        "\n========== VIRTUAL TRY-ON COMPLETED SUCCESSFULLY ==========\n",
      );
      res.json({
        success: true,
        garmentPreview,
        finalOutput,
        message: "Virtual try-on completed",
      });
    } catch (error) {
      console.error("\n❌ ERROR IN VIRTUAL TRY-ON PROCESS:");
      console.error(`   - ${error.message}`);
      console.error(`   - Stack: ${error.stack}`);

      // Cleanup temp files
      tempFiles.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   🗑️  Deleted temp file: ${filePath}`);
          }
        } catch (cleanupError) {
          console.warn(`   ⚠️  Could not delete temp file: ${filePath}`);
        }
      });

      res.status(500).json({
        success: false,
        error: error.message || "Virtual try-on failed",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

/**
 * GET /api/tryon-ai/health
 * Health check endpoint for try-on service
 */
router.get("/api/tryon-ai/health", (req, res) => {
  const replicateToken = !!process.env.REPLICATE_API_TOKEN;
  const tryOnKey = !!process.env.TRYON_API_KEY;

  res.json({
    status: "ok",
    services: {
      replicate: replicateToken ? "✅ Configured" : "❌ Not configured",
      tryonApi: tryOnKey ? "✅ Configured" : "❌ Not configured",
    },
  });
});

/**
 * POST /api/fashn-proxy
 *
 * Backend proxy for Fashn AI Virtual Try-On API
 * This endpoint receives images from frontend and forwards to Fashn AI
 * Solves CORS issues by keeping API key secure on backend
 *
 * @param {File} modelImage - User/person photo
 * @param {File} garmentImage - Garment/textile image
 * @param {String} category - Garment category (dress, pants, etc.)
 *
 * @returns {Object} { success, image_url }
 */
router.post(
  "/api/fashn-proxy",
  upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "garmentImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("\n========== FASHN AI PROXY REQUEST ==========");

      // Validate inputs
      if (!req.files?.modelImage || !req.files?.garmentImage) {
        console.error("❌ Missing required images");
        return res.status(400).json({
          success: false,
          error: "Both modelImage and garmentImage are required",
        });
      }

      const { category } = req.body;
      if (!category) {
        console.error("❌ Missing category");
        return res.status(400).json({
          success: false,
          error: "Category is required (dress, pants, etc.)",
        });
      }

      const modelImageBuffer = req.files.modelImage[0].buffer;
      const garmentImageBuffer = req.files.garmentImage[0].buffer;

      console.log(`✅ Images received:`);
      console.log(`   - Model Image Size: ${modelImageBuffer.length} bytes`);
      console.log(
        `   - Garment Image Size: ${garmentImageBuffer.length} bytes`,
      );
      console.log(`   - Category: ${category}`);

      // Upload images to temporary storage to get URLs
      // For now, we'll use base64 encoding which Pixazo also supports
      const modelImageBase64 = modelImageBuffer.toString("base64");
      const garmentImageBase64 = garmentImageBuffer.toString("base64");

      // Call Pixazo API with secure backend API key
      console.log(
        "🌐 Submitting request to Pixazo Fashn Virtual Try-On API...",
      );

      // Debug: Log API key details
      const apiKey = process.env.PIXAZO_API_KEY;
      console.log(`   - API Key Present: ${!!apiKey}`);
      console.log(`   - API Key Length: ${apiKey?.length || 0}`);
      console.log(
        `   - API Key Preview: ${apiKey?.substring(0, 5)}...${apiKey?.substring(-5)}`,
      );

      // Step 1: Submit try-on request to Pixazo
      // Note: Pixazo Fashn API expects image URLs, but also supports base64
      // For production, you should upload images to a storage service first
      let requestId;
      try {
        console.log(
          "   📍 Submitting virtual try-on request to Pixazo gateway...",
        );
        const submitResponse = await axios.post(
          "https://gateway.pixazo.ai/fashn-virtual-try-on/v1/fashn-virtual-try-on-request",
          {
            model_image: `data:image/jpeg;base64,${modelImageBase64}`,
            garment_image: `data:image/jpeg;base64,${garmentImageBase64}`,
            category: category || "auto",
            mode: "balanced",
            garment_photo_type: "auto",
            moderation_level: "permissive",
            num_samples: 1,
            segmentation_free: true,
            output_format: "png",
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "Ocp-Apim-Subscription-Key": apiKey,
            },
            timeout: 60000,
          },
        );

        console.log("   ✅ Request submitted successfully!");
        console.log(`   - Response Status: ${submitResponse.status}`);
        requestId = submitResponse.data?.request_id;

        if (!requestId) {
          throw new Error(
            `No request_id in response: ${JSON.stringify(submitResponse.data)}`,
          );
        }

        console.log(`   - Request ID: ${requestId}`);
        console.log(`   - Status: ${submitResponse.data?.status}`);
      } catch (error) {
        console.error(`   ❌ Failed to submit request: ${error.message}`);
        if (error.response?.data) {
          console.error(
            `   - API Response: ${JSON.stringify(error.response.data)}`,
          );
        }
        throw error;
      }

      // Step 2: Poll for results (max 20 attempts, 5 seconds apart)
      console.log(
        "\n⏳ Step 7: Polling for results (this may take up to 100 seconds)...",
      );
      let imageUrl;
      let pollAttempt = 0;
      const maxAttempts = 20;
      const pollInterval = 5000; // 5 seconds

      while (pollAttempt < maxAttempts) {
        try {
          pollAttempt++;
          console.log(`   📍 Poll attempt ${pollAttempt}/${maxAttempts}...`);

          const resultResponse = await axios.post(
            "https://gateway.pixazo.ai/fashn-virtual-try-on/v1/fashn-virtual-try-on-request-result",
            { request_id: requestId },
            {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "Ocp-Apim-Subscription-Key": apiKey,
              },
              timeout: 30000,
            },
          );

          const status = resultResponse.data?.status;
          console.log(`      - Status: ${status}`);

          if (status === "COMPLETED") {
            const images = resultResponse.data?.images;
            if (!images || images.length === 0) {
              throw new Error("No images in completed response");
            }

            imageUrl = images[0].url;
            console.log("   ✅ Processing completed!");
            console.log(`   - Output URL: ${imageUrl}`);
            console.log(
              `   - Processing time: ${resultResponse.data?.metadata?.processing_time_seconds}s`,
            );
            break;
          } else if (status === "FAILED") {
            throw new Error(
              `Request failed: ${resultResponse.data?.error_message || "Unknown error"}`,
            );
          } else if (status === "IN_PROGRESS") {
            const queuePos = resultResponse.data?.queue_position;
            const estimatedTime =
              resultResponse.data?.estimated_time_remaining_seconds;
            console.log(
              `      - Queue position: ${queuePos}, Est. time: ${estimatedTime}s`,
            );
          }

          // Wait before next poll
          if (pollAttempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
          }
        } catch (error) {
          if (error.response?.status === 429) {
            console.log("      - Rate limited, waiting 10 seconds...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
          } else {
            throw error;
          }
        }
      }

      if (!imageUrl) {
        throw new Error(
          `Processing timeout after ${maxAttempts * (pollInterval / 1000)} seconds`,
        );
      }

      console.log(`✅ Try-on completed successfully`);
      console.log(
        "\n========== PIXAZO FASHN VIRTUAL TRY-ON SUCCESSFUL ==========\n",
      );

      res.json({
        success: true,
        image_url: imageUrl,
        request_id: requestId,
      });
    } catch (error) {
      console.error("\n❌ PIXAZO FASHN VIRTUAL TRY-ON ERROR:");
      console.error(`   - Message: ${error.message}`);
      console.error(`   - Status: ${error.response?.status}`);

      if (error.response?.data) {
        console.error(
          `   - Response Data: ${JSON.stringify(error.response.data)}`,
        );
      }

      if (error.response?.status === 401) {
        console.error("   - Issue: Invalid or missing API key");
      } else if (error.response?.status === 400) {
        console.error(
          `   - Issue: Bad request - ${error.response.data?.error_message || "Invalid input"}`,
        );
      } else if (error.response?.status === 404) {
        console.error(
          "   - Issue: API endpoint not found (check Pixazo API URL)",
        );
      } else if (error.code === "ECONNREFUSED") {
        console.error("   - Issue: Cannot reach Pixazo API");
      }

      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.error_message || error.message,
        details: error.response?.data,
      });
    }
  },
);

module.exports = router;
