import React, { useState } from "react";
import { ArrowLeft, Lock, Mail, Loader } from "lucide-react";
import ForgotPassword from "./ForgotPassword";

const API_BASE_URL = "/api";

function AdminLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store admin auth info in localStorage
      localStorage.setItem("adminAuth", JSON.stringify(data.admin));

      // Clear form
      setEmail("");
      setPassword("");

      // Call success callback
      onLoginSuccess();
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <>
      {showForgotPassword ? (
        <ForgotPassword
          onBack={() => setShowForgotPassword(false)}
          onPasswordReset={() => {
            setShowForgotPassword(false);
            setEmail("");
            setPassword("");
          }}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-blue-950 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-950 rounded-lg mb-4">
                <Lock size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-blue-950 mb-2">
                Admin Login
              </h1>
              <p className="text-gray-600">
                Enter your credentials to access the dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader size={18} className="animate-spin" />}
                {isLoading ? "Logging in..." : "Log In"}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-950 font-semibold text-sm hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-gray-600 text-sm">
              <p>Secure admin access for NEW STAR TAILORS</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminLogin;
