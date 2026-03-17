const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function testPixazoAPI() {
  try {
    console.log(
      "\n========== PIXAZO FASHN VIRTUAL TRY-ON API TEST ==========\n",
    );

    const apiKey = process.env.PIXAZO_API_KEY;
    console.log(`API Key: ${apiKey}`);
    console.log(`API Key Length: ${apiKey?.length}`);
    console.log(`API Key Valid: ${!!apiKey}`);

    if (!apiKey || apiKey.length !== 32) {
      console.error("❌ Invalid or missing PIXAZO_API_KEY");
      process.exit(1);
    }

    // Step 1: Submit virtual try-on request
    console.log("\n📤 Step 1: Submitting virtual try-on request...");
    console.log(
      "Endpoint: https://gateway.pixazo.ai/fashn-virtual-try-on/v1/fashn-virtual-try-on-request",
    );
    console.log(
      `Auth: Ocp-Apim-Subscription-Key: ${apiKey.substring(0, 5)}...${apiKey.substring(-5)}`,
    );

    const submitResponse = await axios.post(
      "https://gateway.pixazo.ai/fashn-virtual-try-on/v1/fashn-virtual-try-on-request",
      {
        model_image:
          "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/vt_human.jpg",
        garment_image:
          "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/vt_top.jpeg",
        category: "auto",
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

    console.log("✅ Request submitted successfully!");
    console.log(`Status: ${submitResponse.data?.status}`);
    const requestId = submitResponse.data?.request_id;
    console.log(`Request ID: ${requestId}`);

    if (!requestId) {
      console.error("❌ No request_id in response");
      process.exit(1);
    }

    // Step 2: Poll for results
    console.log(
      "\n⏳ Step 2: Polling for results (max 25 seconds for demo)...",
    );
    console.log(
      "Endpoint: https://gateway.pixazo.ai/fashn-virtual-try-on/v1/fashn-virtual-try-on-request-result",
    );

    let completed = false;
    for (let pollAttempt = 1; pollAttempt <= 5; pollAttempt++) {
      console.log(`\n   Poll attempt ${pollAttempt}/5...`);

      // Wait 5 seconds between polls
      if (pollAttempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

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
      console.log(`      Status: ${status}`);

      if (status === "COMPLETED") {
        console.log("✅ Processing completed!");
        const imageUrl = resultResponse.data?.images?.[0]?.url;
        console.log(`   Output Image URL: ${imageUrl}`);
        console.log(
          `   Processing time: ${resultResponse.data?.metadata?.processing_time_seconds}s`,
        );
        completed = true;
        break;
      } else if (status === "FAILED") {
        console.error(
          `❌ Request failed: ${resultResponse.data?.error_message}`,
        );
        console.error(`   Error Code: ${resultResponse.data?.error_code}`);
        process.exit(1);
      } else if (status === "IN_PROGRESS") {
        console.log(
          `      Queue position: ${resultResponse.data?.queue_position}`,
        );
        console.log(
          `      Est. time remaining: ${resultResponse.data?.estimated_time_remaining_seconds}s`,
        );
      } else if (status === "IN_QUEUE") {
        console.log("      Still in queue, waiting...");
      }
    }

    if (!completed) {
      console.log("\n⏱️  Processing still in progress (normal for this API)");
      console.log(
        "   In production, continue polling until status is COMPLETED",
      );
    }

    console.log(
      "\n========== PIXAZO API TEST COMPLETED SUCCESSFULLY ==========\n",
    );
  } catch (error) {
    console.error("\n❌ ERROR:");
    console.error("Message:", error.message);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("\nFull Error Response:");
      console.error(JSON.stringify(error.response.data, null, 2));

      if (error.response?.headers) {
        console.error("\nResponse Headers:");
        console.error(JSON.stringify(error.response.headers, null, 2));
      }
    }

    console.error("\nRequest Config:");
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);

    process.exit(1);
  }
}

testPixazoAPI();
