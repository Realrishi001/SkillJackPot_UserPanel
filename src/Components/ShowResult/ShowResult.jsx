"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar, Target } from "lucide-react";

// Gradient themes for 6 rows (repeat as needed)
const gradientThemes = [
  "from-emerald-500 to-emerald-600",
  "from-blue-500 to-blue-600", 
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
];

const TIMER_KEY = "draw_remain_time_end";

// Timer helper: persistent and exactly like main page
function getRemainTime() {
  if (typeof window === "undefined") return 15 * 60;
  let end = localStorage.getItem(TIMER_KEY);
  if (!end) {
    end = Date.now() + 15 * 60 * 1000;
    localStorage.setItem(TIMER_KEY, end);
  }
  const remainMs = parseInt(end) - Date.now();
  return Math.max(0, Math.floor(remainMs / 1000));
}
function setTimerEnd(secs) {
  localStorage.setItem(TIMER_KEY, Date.now() + secs * 1000);
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
}
function generateRandomNumbers(count) {
  return Array.from({ length: count }, () => Math.floor(1000 + Math.random() * 9000));
}

export default function ShowResult({ isOpen, isClose }) {
  // Timer logic (persistent, synced)
  const [remainSecs, setRemainSecs] = useState(() => getRemainTime());
  const [drawNumbers, setDrawNumbers] = useState(() => generateRandomNumbers(30));
  const [drawTime, setDrawTime] = useState(() =>
    new Date(Date.now() + remainSecs * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // Update timer every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRemainSecs(getRemainTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // On reset, update everything & re-sync localStorage
  useEffect(() => {
    if (remainSecs === 0 && isOpen) {
      setTimerEnd(15 * 60);
      setRemainSecs(15 * 60);
      setDrawNumbers(generateRandomNumbers(30));
      setDrawTime(new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  }, [remainSecs, isOpen]);

  // Formatted time
  const min = String(Math.floor(remainSecs / 60)).padStart(2, "0");
  const sec = String(remainSecs % 60).padStart(2, "0");
  const remainTime = `${min}:${sec}`;
  const drawDate = getTodayDateString();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
        >
          <motion.div
            className="relative w-full h-full max-h-[800px] overflow-y-auto transparent-scrollbar max-w-3xl mx-3 sm:mx-6 md:mx-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-700/50 rounded-2xl px-4 sm:px-8 py-8"
            initial={{ scale: 0.9, y: 64, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white transition-all duration-200 hover:scale-110 border border-slate-600/30"
              onClick={isClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Draw Results</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-red-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-red-400" />
                  </span>
                  <span className="text-slate-300 font-medium">Remain Time</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{remainTime}</div>
                <div className="text-xs text-slate-400 mt-1">Until next draw</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </span>
                  <span className="text-slate-300 font-medium">Draw Time</span>
                </div>
                <div className="text-3xl font-mono font-bold text-white">{drawTime}</div>
                <div className="text-xs text-slate-400 mt-1">Next scheduled draw</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="p-2 bg-purple-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </span>
                  <span className="text-slate-300 font-medium">Draw Date</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white">{drawDate}</div>
                <div className="text-xs text-slate-400 mt-1">Today's results</div>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">Winning Numbers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {drawNumbers.map((num, idx) => (
                  <motion.div
                    key={idx}
                    className={`h-16 sm:h-20 flex items-center justify-center rounded-xl font-mono text-xl sm:text-2xl font-bold shadow-lg border border-slate-600/30
                    bg-gradient-to-br ${gradientThemes[idx % gradientThemes.length]} text-white`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.015 }}
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-2">
              <div className="inline-flex items-center gap-2 bg-slate-800/60 rounded-full px-4 py-2 border border-slate-700/50">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400">
                  Numbers refresh every 15 minutes automatically
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
