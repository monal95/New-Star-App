const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const https = require("https");

/**
 * Virtual Try-On Service
 * Applies virtual try-on using external API
 */
class TryonService {
  constructor() {
    this.apiKey = process.env.TRYON_API_KEY;
    // Common try-on API endpoint (configure based on your service)
    this.apiEndpoint =
      process.env.TRYON_API_ENDPOINT || "https://api.deepfashion.ai/v1/try-on"; // Replace with actual endpoint
  }

  /**
   * Apply virtual try-on to user image with garment
   *
   * @param {String} userImageUrl - User's photo (base64 data URL or image URL)
   * @param {String} garmentImageUrl - Generated garment image URL
   * @returns {Promise<String>} - URL of final try-on result
   */
  async applyTryOn(userImageUrl, garmentImageUrl) {
    try {
      console.log("   🌐 Connecting to Try-On API...");
      console.log(`   📍 Endpoint: ${this.apiEndpoint}`);

      // For demonstration: Using a mock try-on API structure
      // In production, replace with actual try-on API provider (e.g., DeepFashion, ZMO.AI, etc.)

      // Option 1: If using an API that accepts image URLs
      const response = await axios.post(
        this.apiEndpoint,
        {
          model_image: userImageUrl,
          garment_image: garmentImageUrl,
          api_key: this.apiKey,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 second timeout
        },
      );

      if (response.data?.result_url) {
        console.log(`   ✅ Try-on applied successfully`);
        console.log(`   🖼️  Result URL: ${response.data.result_url}`);
        return response.data.result_url;
      } else if (response.data?.output) {
        console.log(`   ✅ Try-on applied successfully`);
        return response.data.output;
      } else {
        throw new Error("Invalid response format from try-on API");
      }
    } catch (error) {
      console.error(`   ❌ Error in applyTryOn: ${error.message}`);

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Invalid or missing TRYON_API_KEY");
      }

      if (error.code === "ECONNREFUSED") {
        throw new Error("Try-on API service is unavailable");
      }

      throw new Error(`Failed to apply try-on: ${error.message}`);
    }
  }

  /**
   * Alternative: Apply try-on using FormData (for APIs that require multipart)
   * Use this if the API doesn't accept JSON
   *
   * @param {String} userImageUrl - User's photo URL or base64
   * @param {String} garmentImageUrl - Generated garment image URL
   * @returns {Promise<String>} - URL of final try-on result
   */
  async applyTryOnFormData(userImageUrl, garmentImageUrl) {
    try {
      console.log("   📤 Uploading images using FormData...");

      // Download images to buffers (if they are URLs)
      const userImageBuffer = await this.downloadImage(userImageUrl);
      const garmentImageBuffer = await this.downloadImage(garmentImageUrl);

      const form = new FormData();
      form.append("model_image", userImageBuffer, "model.jpg");
      form.append("garment_image", garmentImageBuffer, "garment.jpg");
      form.append("api_key", this.apiKey);

      console.log("   🚀 Sending FormData to Try-On API...");

      const response = await axios.post(this.apiEndpoint, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 60000,
      });

      if (response.data?.result_url) {
        console.log(`   ✅ Try-on applied successfully`);
        return response.data.result_url;
      } else if (response.data?.output) {
        console.log(`   ✅ Try-on applied successfully`);
        return response.data.output;
      } else {
        throw new Error("Invalid response from try-on API");
      }
    } catch (error) {
      console.error(`   ❌ Error in applyTryOnFormData: ${error.message}`);
      throw new Error(`Failed to apply try-on: ${error.message}`);
    }
  }

  /**
   * Download image from URL and return as buffer
   *
   * @param {String} imageUrl - URL of image to download
   * @returns {Promise<Buffer>} - Image buffer
   */
  async downloadImage(imageUrl) {
    try {
      // If it's already a data URL, extract the buffer
      if (imageUrl.startsWith("data:image")) {
        const base64 = imageUrl.split(",")[1];
        return Buffer.from(base64, "base64");
      }

      // Download from URL
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Get try-on API status
   * @returns {Promise<Object>} - Status information
   */
  async getStatus() {
    try {
      const response = await axios.get(`${this.apiEndpoint}/status`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.warn(`Try-on API status check failed: ${error.message}`);
      return { status: "unknown", error: error.message };
    }
  }
}

module.exports = new TryonService();
