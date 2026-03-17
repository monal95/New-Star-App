const axios = require("axios");

/**
 * AI Garment Generation Service
 * Converts textile images to garment images using Replicate API
 */
class AIGarmentService {
  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN;
    this.baseUrl = "https://api.replicate.com/v1";
    this.model = "stability-ai/sdxl";
    this.modelVersion =
      "39ed52f2a60c3b36b96a383941b0b1d91feda60025f1f60ae8e89ba3fef6f8fe";
  }

  /**
   * Generate a garment image from textile
   * Uses Replicate API (Stability AI SDXL) to generate realistic garments
   *
   * @param {String} textileBase64 - Base64 encoded textile image
   * @param {String} garmentType - Type of garment (shirt/kurti/blazer)
   * @param {String} quality - Quality level (low/medium/high)
   * @returns {Promise<String>} - URL of generated garment image
   */
  async generateGarment(textileBase64, garmentType, quality = "high") {
    try {
      console.log("   📡 Calling Replicate API...");

      // Build dynamic prompt based on garment type
      const garmentSpecifications = {
        shirt:
          "A realistic, well-tailored shirt with this fabric pattern. Front view, neatly stitched seams, collar and buttons visible, professional photography, clean white background, high quality, 4K resolution.",
        kurti:
          "A beautiful, elegant kurti dress with this fabric texture. Front view, flowing design, intricate embroidery, waist belt, professional quality, traditional Indian style, clean white background.",
        blazer:
          "A high-end professional blazer with this fabric. Front view, perfectly tailored, lapels and buttons visible, business formal wear, clean stitching, white background, luxury quality.",
      };

      const garmentSpec =
        garmentSpecifications[garmentType.toLowerCase()] ||
        garmentSpecifications.shirt;
      const prompt = `Create a realistic ${garmentType} using this fabric texture. ${garmentSpec} Fully stitched, front view, professional photography, clean white background, preserve exact fabric pattern and color.`;

      console.log(`   📝 Prompt: ${prompt.substring(0, 100)}...`);

      // Step 1: Create prediction
      const prediction = await axios.post(
        `${this.baseUrl}/predictions`,
        {
          version: this.modelVersion,
          input: {
            prompt: prompt,
            negative_prompt:
              "blurry, low quality, distorted, ugly, bad seams, amateur",
            num_outputs: 1,
            num_inference_steps: 50,
            guidance_scale: 7.5,
            scheduler: "K_EULER_ANCESTRAL",
            width: 768,
            height: 1024,
          },
        },
        {
          headers: {
            Authorization: `Token ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const predictionId = prediction.data.id;
      console.log(`   🔄 Prediction ID: ${predictionId}`);
      console.log(`   📊 Status: ${prediction.data.status}`);

      // Step 2: Poll for completion
      let result = prediction.data;
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes with 5-second intervals

      while (
        (result.status === "starting" || result.status === "processing") &&
        attempts < maxAttempts
      ) {
        console.log(
          `   ⏳ Waiting for generation (${attempts + 1}/${maxAttempts})...`,
        );
        await this.sleep(5000); // Wait 5 seconds

        const statusResponse = await axios.get(
          `${this.baseUrl}/predictions/${predictionId}`,
          {
            headers: {
              Authorization: `Token ${this.apiToken}`,
            },
          },
        );

        result = statusResponse.data;
        attempts++;
      }

      // Step 3: Handle result
      if (
        result.status === "succeeded" &&
        result.output &&
        result.output.length > 0
      ) {
        const generatedImageUrl = result.output[0];
        console.log(`   ✅ Generation succeeded`);
        console.log(`   🖼️  Image URL: ${generatedImageUrl}`);
        return generatedImageUrl;
      } else if (result.status === "failed") {
        throw new Error(
          `Replicate API failed: ${result.error || "Unknown error"}`,
        );
      } else {
        throw new Error(
          `Generation timeout after ${maxAttempts} attempts. Status: ${result.status}`,
        );
      }
    } catch (error) {
      console.error(`   ❌ Error in generateGarment: ${error.message}`);

      if (error.response?.data) {
        console.error(`   📋 API Response:`, error.response.data);
      }

      throw new Error(`Failed to generate garment: ${error.message}`);
    }
  }

  /**
   * Helper function to sleep
   * @param {Number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new AIGarmentService();
