"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, Calendar, Play, RotateCcw, Printer, Zap, TrendingUp, Target } from "lucide-react";
import Navbar from "@/Components/Navbar/Navbar";

// Helper for number ranges
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, k) => k + start);

const numberBoxColors = [
  "bg-gradient-to-r from-red-400 to-red-600",
  "bg-gradient-to-r from-orange-400 to-orange-500",
  "bg-gradient-to-r from-pink-400 to-pink-500",
  "bg-gradient-to-r from-yellow-200 to-yellow-400",
  "bg-gradient-to-r from-cyan-400 to-blue-400",
  "bg-gradient-to-r from-yellow-400 to-yellow-500",
  "bg-gradient-to-r from-blue-400 to-blue-700",
  "bg-gradient-to-r from-gray-400 to-gray-500",
  "bg-gradient-to-r from-green-300 to-green-500",
  "bg-gradient-to-r from-red-400 to-red-600",
];

const allNumbers = [
  range(10, 19), // Col 1
  range(30, 39), // Col 2
  range(50, 59), // Col 3
];

const isOdd = (n) => n % 2 === 1;
const isEven = (n) => n % 2 === 0;
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

// --- Timer & Date Helpers --- //
function getTodayDateString() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
}

const TIMER_KEY = "draw_remain_time_end";

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

export default function Page() {
  const [selected, setSelected] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(3).fill(false))
  );
  const [activeFilter, setActiveFilter] = useState(null);
  const [grid, setGrid] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(10).fill(""))
  );

  // Constant Quantity and Points for demo (change values as needed)
const [quantities] = useState([2, 5, 7, 4, 6, 3, 1, 8, 9, 2]);
const [points] = useState([25, 50, 35, 44, 12, 62, 30, 49, 55, 21]);
const totalQuantity = quantities.reduce((a, b) => a + b, 0);
const totalPoints = points.reduce((a, b) => a + b, 0);


  // --- Timer logic ---
  const [remainSecs, setRemainSecs] = useState(() => getRemainTime());
  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainSecs(getRemainTime());
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (remainSecs === 0) {
      setTimerEnd(15 * 60);
      setRemainSecs(15 * 60);
    }
  }, [remainSecs]);

  const min = String(Math.floor(remainSecs / 60)).padStart(2, "0");
  const sec = String(remainSecs % 60).padStart(2, "0");
  const remainTime = `${min}:${sec}`;

  const drawTimeObj = new Date(Date.now() + remainSecs * 1000);
  const drawTime = drawTimeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const drawDate = getTodayDateString();

  // --- Checkboxes --- //
  const toggle = (row, col) => {
    setSelected((prev) => {
      const copy = prev.map((arr) => arr.slice());
      copy[row][col] = !copy[row][col];
      return copy;
    });
    setActiveFilter(null);
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F10") {
        e.preventDefault();
        resetCheckboxes();
      }
      if (e.key === "F7") {
        e.preventDefault();
        handleFilter("10-19");
      }
      if (e.key === "F8") {
        e.preventDefault();
        handleFilter("30-39");
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleFilter("50-59");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [activeFilter]);

  // --- Column/Range Filters for F7/F8/F9 --- //
  const handleFilter = (type) => {
    let colIdx = null;
    if (type === "10-19") colIdx = 0;
    if (type === "30-39") colIdx = 1;
    if (type === "50-59") colIdx = 2;

    if (activeFilter === type) {
      setSelected(
        Array(10)
          .fill(null)
          .map(() => Array(3).fill(false))
      );
      setActiveFilter(null);
      return;
    }
    const newSelected = Array(10)
      .fill(null)
      .map(() => Array(3).fill(false));
    if (colIdx !== null) {
      for (let row = 0; row < 10; row++) {
        newSelected[row][colIdx] = true;
      }
    }
    setSelected(newSelected);
    setActiveFilter(type);
  };

  const handleOddEvenFP = (type) => {
  if (activeFilter === type) {
    setSelected(
      Array(10)
        .fill(null)
        .map(() => Array(3).fill(false))
    );
    setActiveFilter(null);
    return;
  }
  const newSelected = Array(10)
    .fill(null)
    .map(() => Array(3).fill(false));
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const num = allNumbers[col][row];
      if (
        (type === "all") ||
        (type === "even" && isEven(num)) ||
        (type === "odd" && isOdd(num)) ||
        (type === "fp" && isPrime(num))
      ) {
        newSelected[row][col] = true;
      }
    }
  }
  setSelected(newSelected);
  setActiveFilter(type);
};


  const resetCheckboxes = () => {
    setSelected(
      Array(10)
        .fill(null)
        .map(() => Array(3).fill(false))
    );
    setActiveFilter(null);
  };

  const handleGridChange = (row, col, value) => {
    if (/^\d{0,2}$/.test(value)) {
      setGrid((prev) => {
        const copy = prev.map((arr) => arr.slice());
        copy[row][col] = value;
        return copy;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div>
            <Navbar/>
        </div>
      {/* Enhanced Draw Header */}
      <div className="w-full flex justify-between items-center p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl backdrop-blur-sm">
        <div className="flex gap-3">
          {[
            { key: "10-19", label: "F7 (10-19)" },
            { key: "30-39", label: "F8 (30-39)" },
            { key: "50-59", label: "F9 (50-59)" }
          ].map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => handleFilter(tab.key)}
              className={`px-6 py-3 rounded-xl font-bold text-white 
                ${
                  activeFilter === tab.key
                    ? "bg-gradient-to-r from-purple-700 to-pink-600 scale-105 shadow-lg"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }
                hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95 border border-purple-400/30`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-800/80 rounded-2xl border border-red-500/30 shadow-lg">
          <Clock className="w-6 h-6 text-red-400 animate-pulse" />
          <span className="text-xl font-bold text-green-400 tracking-wider">
            Remain Time
          </span>
          <span className="text-2xl font-mono font-bold text-red-400 bg-slate-900/50 px-3 py-1 rounded-lg">
            {remainTime}
          </span>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-xl border border-green-500/30">
            <Play className="w-5 h-5 text-green-400" />
            <span className="text-lg font-bold text-green-400">Draw Time</span>
            <span className="text-xl font-mono font-bold text-red-400">{drawTime}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-xl border border-green-500/30">
            <Calendar className="w-5 h-5 text-green-400" />
            <span className="text-lg font-bold text-green-400">Draw Date</span>
            <span className="text-xl font-mono font-bold text-red-400">{drawDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="flex flex-row p-6 gap-6">
        {/* Left Panel - Number Selectors, ODD EVEN FP */}
        <div className="rounded-2xl shadow-2xl bg-gradient-to-b from-slate-100/95 to-slate-300/80 p-4 border-2 border-gray-300/50 min-h-[700px] w-[360px] backdrop-blur-sm">
          {/* Filter Buttons */}
          {/* Filter Buttons */}
<div className="flex gap-2 mb-4">
  <button
    onClick={() => handleOddEvenFP("all")}
    className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
      activeFilter === "all"
        ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
        : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
    }`}
  >
    All
  </button>
  <button
    onClick={() => handleOddEvenFP("even")}
    className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
      activeFilter === "even"
        ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
        : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
    }`}
  >
    Even
  </button>
  <button
    onClick={() => handleOddEvenFP("odd")}
    className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
      activeFilter === "odd"
        ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
        : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
    }`}
  >
    Odd
  </button>
  <button
    onClick={() => handleOddEvenFP("fp")}
    className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
      activeFilter === "fp"
        ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
        : "text-[#4A314D] bg-[#ece6fc] border border-[#968edb] hover:bg-[#e5def7] shadow-md"
    }`}
  >
    FP
  </button>
</div>

          {/* Column Filters (F7, F8, F9) */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "10-19", label: "10-19", color: "from-purple-600 to-pink-600" },
              { key: "30-39", label: "30-39", color: "from-purple-600 to-pink-600" },
              { key: "50-59", label: "50-59", color: "from-purple-600 to-pink-600" }
            ].map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => handleFilter(tab.key)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  activeFilter === tab.key
                    ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
                    : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
                }`}
                title={
                  tab.key === "10-19"
                    ? "F7"
                    : tab.key === "30-39"
                    ? "F8"
                    : "F9"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Number + Checkbox Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {range(0, 9).map((row) =>
              allNumbers.map((colArray, colIdx) => {
                const num = colArray[row];
                const color = numberBoxColors[row % numberBoxColors.length];
                return (
                  <div
                    key={num}
                    className={`relative flex items-center gap-2 px-2 py-2 ${color} hover:scale-105 transition-all duration-200 cursor-pointer`}
                    style={{
                      border: "2px solid #fff",
                      borderRadius: "12px",
                      margin: "2px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                    }}
                    onClick={() => toggle(row, colIdx)}
                  >
                    {/* Custom Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected[row][colIdx]}
                      onChange={() => toggle(row, colIdx)}
                      className="peer appearance-none w-6 h-6 rounded-md bg-white border-2 border-[#4A314D] checked:bg-gradient-to-r checked:from-purple-600 checked:to-pink-600 checked:border-purple-600 flex-shrink-0 transition-all duration-200 hover:scale-110"
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    />
                    {/* Enhanced Checkmark */}
                    <span
                      className={`absolute left-3 top-3 text-white text-sm font-bold pointer-events-none transition-all duration-200 ${
                        selected[row][colIdx] ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      }`}
                    >
                      ✓
                    </span>
                    {/* Enhanced Number Box */}
                    <span
                      className="w-9 h-9 flex items-center justify-center font-bold text-lg text-[#4A314D] bg-white border-2 border-[#4A314D] rounded-lg select-none transition-all duration-200 hover:bg-gray-50"
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    >
                      {num}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg hover:shadow-purple-500/25 hover:from-purple-500 hover:to-blue-400 transition-all duration-300 hover:scale-105 active:scale-95">
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={resetCheckboxes}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 shadow-lg hover:shadow-pink-500/25 hover:from-pink-400 hover:to-red-400 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Reset (F10)
            </button>
          </div>
        </div>

        {/* Main Table (unchanged from before) */}
        <div className="flex-1 bg-gradient-to-b from-slate-800/70 to-slate-900/90 rounded-2xl shadow-2xl border-2 border-slate-700/50 p-6 overflow-auto backdrop-blur-sm">
          
          {/* Stats Header */}
          <div className="flex justify-between items-center mb-6 p-4 bg-slate-800/50 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <span className="text-xl font-bold text-slate-200">Game Matrix</span>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-yellow-500/30">
                <Target className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Total Quantity:</span>
                <span className="font-bold text-white">{totalQuantity}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-pink-500/30">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <span className="text-pink-400 font-medium">Total Points:</span>
                <span className="font-bold text-white">{totalPoints}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {range(0, 9).map((n) => (
                    <th
                      key={n}
                      className="p-3 text-center text-sm font-bold text-purple-300 bg-slate-800/30 first:rounded-tl-lg last:rounded-tr-lg border-r border-slate-700/30 last:border-r-0"
                    >
                      0{n}
                    </th>
                  ))}
                  <th className="p-3 text-center text-sm font-bold text-yellow-300 bg-slate-800/30 border-r border-slate-700/30">
                    Quantity
                  </th>
                  <th className="p-3 text-center text-sm font-bold text-pink-300 bg-slate-800/30 rounded-tr-lg">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {range(0, 9).map((row) => (
                  <tr key={row} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                    {range(0, 9).map((col) => (
                      <td key={col} className="p-2 text-center border-r border-slate-700/20 last:border-r-0">
                        <input
                          type="text"
                          className="w-16 h-10 rounded-lg bg-slate-900/90 text-white border-2 border-purple-600/40 text-center font-bold shadow-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all duration-200 hover:border-purple-400"
                          maxLength={2}
                          value={grid[row][col]}
                          onChange={(e) =>
                            handleGridChange(row, col, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    {/* Enhanced Quantity and Points */}
                    <td className="p-2 text-center border-r border-slate-700/20">
                      <div className="w-18 h-10 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-yellow-400">
                        {quantities[row]}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="w-18 h-10 rounded-lg bg-gradient-to-r from-pink-200 to-pink-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-pink-400">
                        {points[row]}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Enhanced Totals Row */}
                <tr className="bg-slate-800/40 border-t-2 border-purple-500/50">
                  <td colSpan={10} className="p-2 text-center font-bold text-purple-300">
                    TOTALS
                  </td>
                  <td className="p-2 text-center">
                    <div className="font-extrabold text-xl text-yellow-400 bg-slate-900/50 px-4 py-2 rounded-lg border border-yellow-500/50">
                      {totalQuantity}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="font-extrabold text-xl text-pink-400 bg-slate-900/50 px-4 py-2 rounded-lg border border-pink-500/50">
                      {totalPoints}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Enhanced Footer */}
          <div className="flex items-center mt-8 gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Transaction No/Bar Code"
                className="w-full py-4 px-6 rounded-xl bg-slate-700/90 text-white font-semibold placeholder-purple-300 border-2 border-purple-500/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 outline-none shadow-lg transition-all duration-200 hover:border-purple-400"
              />
            </div>
            <div className="flex-none">
              <button className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 text-lg hover:scale-105 active:scale-95 hover:shadow-purple-500/25">
                <Zap className="w-6 h-6" />
                Advance Draw
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
