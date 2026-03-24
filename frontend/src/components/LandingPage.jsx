import React, { useEffect, useState } from "react";
import newStarLogo from "../assets/new-star-logo.svg";
import "../styles/animations.css";

function LandingPage({ onStartTailoring }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show button after text animation (3-5 seconds)
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
      {/* Logo Section */}
      <div className="mb-8 animate-fadeIn">
        <img src={newStarLogo} alt="New Star Logo" className="w-48 h-auto" />
      </div>

      {/* Main Heading with Animation */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-blue-950 mb-4 animate-slideDown">
          NEW STAR
        </h1>
        <p
          className="text-gray-600"
          style={{ fontFamily: "Dancing Script, cursive" }}
        >
          Smart Tailoring Management System
        </p>
      </div>

      {/* Button Section */}
      {showButton && (
        <button
          onClick={onStartTailoring}
          className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 px-12 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg animate-popIn"
        >
          START TAILORING
        </button>
      )}

      {/* Footer */}
      <div className="absolute bottom-8 text-center text-gray-500 text-sm">
        <p>SINCE 1998 | NEW STAR</p>
      </div>
    </div>
  );
}

export default LandingPage;
