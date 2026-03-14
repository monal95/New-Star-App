import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader, Scissors } from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

function ForgotPassword({ onBack, onPasswordReset }) {
  const [step, setStep] = useState("email"); // email, otp, reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle step-1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!email) {
        setError("Please enter your email address");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess("OTP has been sent to your email address");
      setOtpSent(true);
      setStep("otp"); // Move to OTP verification step
      setTimer(60); // 60 seconds timer
      setIsLoading(false);

      // Start countdown timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
      console.error("Forgot password error:", err);
      setIsLoading(false);
    }
  };

  // Handle step-2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!otp) {
        setError("Please enter the OTP");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess("OTP verified successfully");
      setStep("reset");
      setIsLoading(false);
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
      console.error("OTP verification error:", err);
      setIsLoading(false);
    }
  };

  // Handle step-3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validation
      if (!newPassword || !confirmPassword) {
        setError("Please enter both password fields");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess("Password reset successfully!");
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        onPasswordReset();
      }, 2000);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
      console.error("Password reset error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-950 rounded-lg flex items-center justify-center">
            <Scissors size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            New Star Tailors Admin
          </h2>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-950 font-bold text-sm">👤</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {/* Forgot Password Card */}
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-950 rounded-2xl mb-4">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === "email"
                ? "Forgot Password?"
                : step === "otp"
                  ? "Verify OTP"
                  : "Reset Password"}
            </h1>
            <p className="text-gray-600 text-sm">
              {step === "email"
                ? "Enter your email address and we'll send you a link to reset your password."
                : step === "otp"
                  ? "Enter the 6-digit code sent to your email"
                  : "Create your new password"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@newstartailors.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent text-gray-700 placeholder-gray-400"
                  disabled={isLoading || otpSent}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpSent}
                className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={18} className="animate-spin" />}
                {isLoading ? "Sending..." : "Send OTP"} {!isLoading && "→"}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-semibold text-gray-700 mb-3"
                >
                  Enter the 6-digit code sent to your email
                </label>
                <div className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength="1"
                      inputMode="numeric"
                      className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent disabled:bg-gray-100"
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const newOtp = otp.split("");
                        newOtp[i] = e.target.value;
                        setOtp(newOtp.join(""));
                        if (e.target.value && i < 5) {
                          document.getElementById(`otp-${i + 1}`).focus();
                        }
                      }}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <div className="text-center mt-4">
                  <p className="text-gray-600 text-sm">
                    {timer > 0 ? (
                      <>
                        Resend code in{" "}
                        <span className="font-bold text-blue-950">
                          {timer}s
                        </span>
                      </>
                    ) : (
                      <>
                        Didn't receive the code?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                            setStep("email");
                          }}
                          className="text-blue-950 font-bold hover:underline"
                        >
                          Resend OTP
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={18} className="animate-spin" />}
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent text-gray-700"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-transparent text-gray-700"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <p className="text-red-600 text-xs mt-2">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={
                  isLoading || newPassword !== confirmPassword || !newPassword
                }
                className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={18} className="animate-spin" />}
                {isLoading ? "Resetting..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center pb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-blue-950 hover:text-blue-900 font-semibold text-sm flex items-center gap-2 transition-colors"
        >
          ← BACK TO LOGIN
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
