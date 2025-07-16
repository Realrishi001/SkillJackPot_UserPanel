"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

// Gradient themes for each row (repeat as needed)
const gradientThemes = [
  "from-emerald-500 to-emerald-600",
  "from-blue-500 to-blue-600", 
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-pink-500 to-pink-600",
  "from-cyan-500 to-cyan-600",
];

function generateRandomNumbers(count) {
  return Array.from({ length: count }, () => Math.floor(1000 + Math.random() * 9000));
}

export default function ShowResult() {
  const [drawNumbers, setDrawNumbers] = useState(() => generateRandomNumbers(30));

  useEffect(() => {
    setDrawNumbers(generateRandomNumbers(30)); // Generate new numbers on mount
  }, []);

  return (
    <div className="relative w-full mx-auto bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-700/50 rounded-2xl px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-7">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Draw Results</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>

      {/* Numbers Grid */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">Winning Numbers</h3>
        {/* 3 rows with 10 columns */}
        <div className="grid grid-cols-10 gap-3">
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
    </div>
  );
}
