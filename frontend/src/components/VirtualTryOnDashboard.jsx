import React, { useState, useRef } from "react";
import {
  Upload,
  Loader,
  Download,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Camera,
  Shirt,
} from "lucide-react";
import axios from "axios";
import Toast from "./Toast";

/**
 * Virtual Try-On Studio Dashboard
 *
 * Full-featured AI-powered virtual try-on component using Fashn AI
 * Features:
 * - Upload user photo and textile image
 * - Select garment type (Shirt, Pant)
 * - Generate garment preview using Fashn AI
 * - Apply virtual try-on
 * - Before/After comparison slider
 * - Toast notifications
 * - Download functionality
 */
const FASHN_API_URL = "/api/fashn-proxy";

const VirtualTryOnDashboard = () => {
  // State Management
  const [userImage, setUserImage] = useState(null);
  const [userImagePreview, setUserImagePreview] = useState(null);
  const [textileImage, setTextileImage] = useState(null);
  const [textileImagePreview, setTextileImagePreview] = useState(null);
  const [garmentType, setGarmentType] = useState("shirt");
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [finalOutput, setFinalOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("upload");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [sliderPosition, setSliderPosition] = useState(50);

  const userImageInputRef = useRef(null);
  const textileImageInputRef = useRef(null);
  const sliderRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Handle user image upload
  const handleUserImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be less than 10MB", "error");
      return;
    }

    setUserImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setUserImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setError(null);
  };

  // Handle textile image upload
  const handleTextileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be less than 10MB", "error");
      return;
    }

    setTextileImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setTextileImagePreview(e.target.result);
    reader.readAsDataURL(file);
    setError(null);
  };

  // Generate garment preview using Fashn AI
  const handleGenerateGarment = async () => {
    if (!userImage || !textileImage) {
      showToast("Please upload both images first", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep("preview");

    try {
      const formData = new FormData();
      formData.append("modelImage", userImage);
      formData.append("garmentImage", textileImage);
      // Map local garment types to Fashn API categories
      const categoryMap = {
        shirt: "dress",
        pant: "pants",
      };
      formData.append("category", categoryMap[garmentType] || "dress");

      console.log("📤 Sending request to backend Pixazo proxy...");
      const response = await axios.post(FASHN_API_URL, formData, {
        timeout: 120000,
      });

      if (response.data && response.data.image_url) {
        const imageUrl = response.data.image_url;
        setGarmentPreview(imageUrl);
        showToast("✨ Garment preview generated successfully!", "success");
        console.log("✅ Fashn API Response:", response.data);
      } else if (response.data?.success) {
        // Handle alternative response structure
        const imageUrl =
          response.data.image_url ||
          response.data.full_response?.data?.image_url;
        setGarmentPreview(imageUrl);
        showToast("✨ Garment preview generated successfully!", "success");
        console.log("✅ Fashn API Response:", response.data);
      } else {
        throw new Error(response.data?.error || "Failed to generate garment");
      }
    } catch (err) {
      console.error("❌ Fashn API Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || err.message;
      setError(errorMessage);
      showToast(errorMessage, "error");
      setCurrentStep("upload");
    } finally {
      setLoading(false);
    }
  };

  // Apply virtual try-on using Pixazo API
  const handleApplyTryOn = async () => {
    if (!garmentPreview) {
      showToast("Please generate garment preview first", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep("tryon");

    try {
      const formData = new FormData();
      formData.append("modelImage", userImage);
      formData.append("garmentImage", textileImage);
      // Map local garment types to Pixazo API categories
      const categoryMap = {
        shirt: "dress",
        pant: "pants",
      };
      formData.append("category", categoryMap[garmentType] || "dress");

      console.log("👗 Applying virtual try-on via backend Pixazo proxy...");
      const response = await axios.post(FASHN_API_URL, formData, {
        timeout: 120000,
      });

      if (response.data && response.data.image_url) {
        const imageUrl = response.data.image_url;
        setFinalOutput(imageUrl);
        showToast("👗 Virtual try-on completed!", "success");
        console.log("✅ Try-on Result:", response.data);
      } else if (response.data?.success) {
        // Handle alternative response structure
        const imageUrl =
          response.data.image_url ||
          response.data.full_response?.data?.image_url;
        setFinalOutput(imageUrl);
        showToast("👗 Virtual try-on completed!", "success");
        console.log("✅ Try-on Result:", response.data);
      } else {
        throw new Error(response.data?.error || "Failed to apply try-on");
      }
    } catch (err) {
      console.error("❌ Fashn API Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || err.message;
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Download image
  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`, "success");
    } catch {
      showToast("Failed to download image", "error");
    }
  };

  // Reset all
  const handleReset = () => {
    setUserImage(null);
    setUserImagePreview(null);
    setTextileImage(null);
    setTextileImagePreview(null);
    setGarmentType("shirt");
    setGarmentPreview(null);
    setFinalOutput(null);
    setCurrentStep("upload");
    setError(null);
    setSliderPosition(50);
    showToast("All cleared!", "success");
  };

  // Handle slider movement
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            border: "1px solid #fca5a5",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* LEFT PANEL - INPUT SECTION */}
        <div>
          {/* User Photo Upload */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">
                <Camera size={20} />
                Your Photo
              </h3>
            </div>
            <div
              className="card-body"
              onClick={() => userImageInputRef.current?.click()}
              style={{
                cursor: "pointer",
                padding: "2rem",
                textAlign: "center",
                borderRadius: "8px",
                border: "2px dashed #cbd5e0",
                backgroundColor: "#f7fafc",
              }}
            >
              {userImagePreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={userImagePreview}
                    alt="User"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "240px",
                      borderRadius: "8px",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserImage(null);
                      setUserImagePreview(null);
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "0.5rem",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ padding: "1rem" }}>
                  <Upload
                    size={32}
                    style={{ margin: "0 auto 0.5rem", color: "#64748b" }}
                  />
                  <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                    Upload Your Photo
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    Clear front-facing photo works best
                  </p>
                </div>
              )}
              <input
                ref={userImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleUserImageUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Textile Image Upload */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">
                <Shirt size={20} />
                Textile Fabric
              </h3>
            </div>
            <div
              className="card-body"
              onClick={() => textileImageInputRef.current?.click()}
              style={{
                cursor: "pointer",
                padding: "2rem",
                textAlign: "center",
                borderRadius: "8px",
                border: "2px dashed #cbd5e0",
                backgroundColor: "#f7fafc",
              }}
            >
              {textileImagePreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={textileImagePreview}
                    alt="Textile"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "240px",
                      borderRadius: "8px",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextileImage(null);
                      setTextileImagePreview(null);
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "0.5rem",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ padding: "1rem" }}>
                  <Upload
                    size={32}
                    style={{ margin: "0 auto 0.5rem", color: "#64748b" }}
                  />
                  <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                    Upload Fabric Image
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    Flat fabric for pattern extraction
                  </p>
                </div>
              )}
              <input
                ref={textileImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleTextileImageUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Garment Type Selector */}
          <div className="card mb-4">
            <div className="card-body">
              <label className="form-label">Garment Type</label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="form-input"
              >
                <option value="shirt">Shirt</option>
                <option value="pant">Pant</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={handleGenerateGarment}
              disabled={loading || !userImage || !textileImage}
              className={`btn ${loading || !userImage || !textileImage ? "btn-secondary" : "btn-primary"}`}
              style={{
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading && currentStep === "preview" ? (
                <>
                  <Loader
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Preview
                </>
              )}
            </button>

            <button
              onClick={handleApplyTryOn}
              disabled={loading || !garmentPreview}
              className={`btn ${loading || !garmentPreview ? "btn-secondary" : "btn-primary"}`}
              style={{
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading && currentStep === "tryon" ? (
                <>
                  <Loader
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Try On
                </>
              )}
            </button>
          </div>

          {/* Utility Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <button
              onClick={handleReset}
              className="btn btn-secondary"
              style={{
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              onClick={() =>
                handleDownload(
                  garmentPreview || finalOutput,
                  "tryon-result.png",
                )
              }
              disabled={!garmentPreview && !finalOutput}
              className={`btn ${!garmentPreview && !finalOutput ? "btn-secondary" : "btn-secondary"}`}
              style={{
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                opacity: !garmentPreview && !finalOutput ? 0.5 : 1,
                cursor:
                  !garmentPreview && !finalOutput ? "not-allowed" : "pointer",
              }}
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - OUTPUT SECTION */}
        <div>
          {/* Garment Preview */}
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title">
                <Sparkles size={20} />
                Garment Preview
              </h3>
            </div>
            <div
              className="card-body"
              style={{
                textAlign: "center",
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {loading && currentStep === "preview" ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <Loader
                      size={40}
                      style={{
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                        color: "#1e40af",
                      }}
                    />
                  </div>
                  <p style={{ fontWeight: "600", color: "#334155" }}>
                    Generating garment preview...
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                    }}
                  >
                    This may take 2-3 minutes
                  </p>
                </div>
              ) : garmentPreview ? (
                <div>
                  <img
                    src={garmentPreview}
                    alt="Garment Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  />
                  <span
                    className="badge badge-success"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle size={14} /> Preview Ready
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <Sparkles
                    size={40}
                    style={{ margin: "0 auto 1rem", opacity: 0.5 }}
                  />
                  <p>Generate a garment preview to see it here</p>
                </div>
              )}
            </div>
          </div>

          {/* Try-On Result */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Shirt size={20} />
                Try-On Result
              </h3>
            </div>
            <div
              className="card-body"
              style={{
                minHeight: "320px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {loading && currentStep === "tryon" ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <Loader
                      size={40}
                      style={{
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                        color: "#1e40af",
                      }}
                    />
                  </div>
                  <p style={{ fontWeight: "600", color: "#334155" }}>
                    Applying virtual try-on...
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginTop: "0.5rem",
                    }}
                  >
                    This may take 1-2 minutes
                  </p>
                </div>
              ) : finalOutput && userImagePreview ? (
                <div style={{ width: "100%" }}>
                  {/* Before/After Slider */}
                  <div
                    ref={sliderRef}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "300px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#e2e8f0",
                      cursor: "col-resize",
                      marginBottom: "1rem",
                    }}
                    onMouseMove={handleSliderMove}
                    onTouchMove={(e) => handleSliderMove(e.touches[0])}
                  >
                    {/* Before Image */}
                    <img
                      src={userImagePreview}
                      alt="Before"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />

                    {/* After Image */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${sliderPosition}%`,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={finalOutput}
                        alt="After"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Slider Handle */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: `${sliderPosition}%`,
                        height: "100%",
                        width: "2px",
                        backgroundColor: "#1e40af",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: "#1e40af",
                          color: "white",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Drag
                      </div>
                    </div>

                    {/* Labels */}
                    <div
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "white",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      Before
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "1rem",
                        right: "1rem",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "white",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      After
                    </div>
                  </div>

                  <span
                    className="badge badge-success"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle size={14} /> Try-On Complete
                  </span>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <Shirt
                    size={40}
                    style={{ margin: "0 auto 1rem", opacity: 0.5 }}
                  />
                  <p>Click "Try On" to see the virtual fitting result</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VirtualTryOnDashboard;
