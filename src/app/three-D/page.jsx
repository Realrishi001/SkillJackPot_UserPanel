"use client";

import React, { useEffect, useState } from "react";

import Manual from "../../Components/ThreeD/Manual";
import Automatic from "../../Components/ThreeD/Automatic";
import HowToPlay from "../../Components/ThreeD/HowToPlay";

const Page = () => {
  // Date/time (IST)
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Active view
  const [active, setActive] = useState("manual");

  // Modal state for HowToPlay
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      setDate(
        ist.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setTime(
        ist.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleShowManual = () => setActive("manual");
  const handleShowAutomatic = () => setActive("automatic");
  const handleShowHow = () => setShowHowToPlay(true);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden text-white">
      {/* Header */}
      <div className="w-full text-center py-6 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
          3D Contest Dashboard
        </h1>
        <div className="flex flex-col md:flex-row justify-between items-center px-4 gap-4 mt-3 text-lg">
          <p>
            📅 Date: <span className="font-semibold text-purple-300">{date}</span>
          </p>
          <p>
            ⏰ Current Time:{" "}
            <span className="font-semibold text-pink-300">{time}</span>
          </p>
          <p>
            🏆 Next Contest:{" "}
            <span className="font-semibold text-purple-300">
              20th Sept, 6:00 PM
            </span>
          </p>
          <p>
            ⌛ Time Left:{" "}
            <span className="font-semibold text-pink-300">02h : 15m : 30s</span>
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-4 mt-5">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleShowManual}
            aria-pressed={active === "manual"}
            className={`flex-1 py-3 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              active === "manual"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            Manual
          </button>


          <button
            type="button"
            onClick={handleShowHow}
            aria-pressed={showHowToPlay}
            className="flex-1 py-3 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/5 hover:bg-white/10"
          >
            How to Play
          </button>
        </div>

        {/* Main content */}
        <div className="mt-6 min-h-[60vh]">
          {active === "manual" && <Manual />}
          {active === "automatic" && <Automatic />}
        </div>
      </div>

      {/* HowToPlay Modal */}
      <HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};

export default Page;
