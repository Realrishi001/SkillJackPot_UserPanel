"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, Calendar, Play, RotateCcw, Printer, Zap, TrendingUp, Target } from "lucide-react";
import Navbar from "@/Components/Navbar/Navbar";
import ShowResult from "@/Components/ShowResult/ShowResult";
import { FP_SETS } from "@/data/fpSets";

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

  const [activeTypeFilter, setActiveTypeFilter] = useState(null); // 'all', 'odd', 'even', 'fp', or null
  const [activeColFilter, setActiveColFilter] = useState(null);   // '10-19', '30-39', '50-59', or null


  // Constant Quantity and Points for demo (change values as needed)
const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);  
const [points, setPoints] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);  // Initial points for each row
const totalQuantity = quantities.reduce((a, b) => a + b, 0);
const totalPoints = points.reduce((a, b) => a + b, 0);
const [isFPMode, setIsFPMode] = useState(false); 
const [activeFPSetIndex, setActiveFPSetIndex] = useState(null);



const COLS = 10, ROWS = 10; // or 9 if that's your grid size

const [columnHeaders, setColumnHeaders] = useState(Array(COLS).fill(""));
const [rowHeaders, setRowHeaders] = useState(Array(ROWS).fill(""));
const [grid, setGrid] = useState(Array(ROWS).fill().map(() => Array(COLS).fill("")));
const [cellOverrides, setCellOverrides] = useState({});

// Handlers:
const handleColumnHeaderChange = (col, value) => {
  if (!/^\d*$/.test(value)) return;

  setColumnHeaders(headers =>
    headers.map((v, i) => (i === col ? value : v))
  );

  // Remove overrides for this column
  setCellOverrides(overrides => {
    const updated = { ...overrides };
    Object.keys(updated).forEach(key => {
      const [row, column] = key.split("-");
      if (parseInt(column, 10) === col) delete updated[key];
    });
    return updated;
  });
};

const handleRowHeaderChange = (row, value) => {
  if (!/^\d*$/.test(value)) return;

  setRowHeaders(headers =>
    headers.map((v, i) => (i === row ? value : v))
  );

  // Remove overrides for this row
  setCellOverrides(overrides => {
    const updated = { ...overrides };
    Object.keys(updated).forEach(key => {
      const [r, column] = key.split("-");
      if (parseInt(r, 10) === row) delete updated[key];
    });
    return updated;
  });
};




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
    copy[row][col] = !copy[row][col];  // Toggle the checkbox

    // Update quantity for that row
    setQuantities((prevQuantities) => {
      const updatedQuantities = [...prevQuantities];

      // Count how many checkboxes are selected in the row
      const selectedCount = copy[row].filter((selected) => selected).length;

      // Set quantity as the number of selected checkboxes in the row
      updatedQuantities[row] = selectedCount;  // Quantity = number of selected checkboxes

      // Update points for that row based on quantity
      setPoints((prevPoints) => {
        const updatedPoints = [...prevPoints];
        updatedPoints[row] = updatedQuantities[row] * 2;  // Points = quantity * 2
        return updatedPoints;
      });

      return updatedQuantities;
    });

    return copy;
  });
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
const handleFilter = (colKey) => {
  if (activeColFilter === colKey) {
    setActiveColFilter(null);
    if (!activeTypeFilter) resetCheckboxes();
    else applyFilter(activeTypeFilter, null);
    return;
  }
  setActiveColFilter(colKey);
  applyFilter(activeTypeFilter, colKey);
};

const handleOddEvenFP = (type) => {
  if (activeTypeFilter === type) {
    setActiveTypeFilter(null);
    // If both filters are off, reset all
    if (!activeColFilter) resetCheckboxes();
    else applyFilter(null, activeColFilter);
    return;
  }
  setActiveTypeFilter(type);
  applyFilter(type, activeColFilter);
};


const resetCheckboxes = () => {
  setSelected(Array(10).fill(null).map(() => Array(3).fill(false)));
  setQuantities(Array(10).fill(0));  // Reset quantities
  setPoints(Array(10).fill(0));  // Reset points
  setActiveTypeFilter(null);
  setActiveColFilter(null);
};

useEffect(() => {
  // 1. Quantities per row
  console.log("Quantities per row:", quantities);

  // 2. Sum of all input values (totalValue)
  let totalValue = 0;
  Object.values(cellOverrides).forEach(v => {
    const num = parseInt(v, 10);
    if (!isNaN(num)) totalValue += num;
  });
  console.log("Total value:", totalValue);

  // 3. Updated quantity column: [totalValue * q for each q in quantities]
  const updatedQuantity = quantities.map(q => totalValue * q);
  console.log("Updated quantity:", updatedQuantity);

}, [quantities, cellOverrides]);


const handleGridChange = (row, col, value) => {
  if (!/^\d*$/.test(value)) return;

  const numStr = String(row * 10 + col).padStart(2, "0");
  if (isFPMode && activeFPSetIndex !== null && FP_SETS[activeFPSetIndex].includes(numStr)) {
    // Update all cells in the active FP set
    setCellOverrides(overrides => {
      const updated = { ...overrides };
      FP_SETS[activeFPSetIndex].forEach(setNum => {
        // Find all cells in the grid matching this setNum
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if (String(r * 10 + c).padStart(2, "0") === setNum) {
              updated[`${r}-${c}`] = value;
            }
          }
        }
      });
      // --- Calculate sum of all input values and print ---
      let sum = 0;
      Object.values(updated).forEach(v => {
        const num = parseInt(v, 10);
        if (!isNaN(num)) sum += num;
      });
      console.log("Sum of all input values:", sum);
      return updated;
    });
  } else {
    setCellOverrides(overrides => {
      const updated = {
        ...overrides,
        [`${row}-${col}`]: value
      };
      // --- Calculate sum of all input values and print ---
      let sum = 0;
      Object.values(updated).forEach(v => {
        const num = parseInt(v, 10);
        if (!isNaN(num)) sum += num;
      });
      console.log("Sum of all input values:", sum);
      return updated;
    });
  }
};




function getCellValue(row, col) {
  const key = `${row}-${col}`;
  if (cellOverrides[key] !== undefined && cellOverrides[key] !== "") {
    return cellOverrides[key];
  }

  const rowValue = parseInt(rowHeaders[row] || "0", 10);
  const colValue = parseInt(columnHeaders[col] || "0", 10);
  const sum = rowValue + colValue;
  return sum === 0 ? "" : sum; // Display empty if sum is zero, else sum
}

function getFPSetIndexForNumber(numStr) {
  return FP_SETS.findIndex(set => set.includes(numStr));
}


function applyFilter(type, colKey) {
  const colIndexes = { "10-19": 0, "30-39": 1, "50-59": 2 };
  const newSelected = Array(10).fill(null).map(() => Array(3).fill(false));

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const num = allNumbers[col][row];
      let matchType = false;

      if (!type || type === "all") matchType = true;
      else if (type === "even") matchType = isEven(num);
      else if (type === "odd") matchType = isOdd(num);
      else if (type === "fp") matchType = isPrime(num);

      let matchCol = !colKey || col === colIndexes[colKey];

      if (matchType && matchCol) newSelected[row][col] = true;
    }
  }
  setSelected(newSelected);
}

// Calculate total value (sum of all input boxes)
let totalValue = 0;
Object.values(cellOverrides).forEach(v => {
  const num = parseInt(v, 10);
  if (!isNaN(num)) totalValue += num;
});


// Calculate updatedQuantity array
const updatedQuantity = quantities.map(q => totalValue * q);

const updatedPoints = updatedQuantity.map(q => q * 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div>
            <Navbar/>
        </div>
    

      <div className="w-full h-fit">
        <ShowResult/>
      </div>

      {/* Enhanced Draw Header */}
<div className="w-full flex flex-col sm:flex-row justify-between items-center sm:items-start p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl backdrop-blur-sm">

  {/* Tabs for Filter */}
  <div className="flex gap-3 flex-wrap sm:flex-nowrap sm:w-auto w-full justify-center sm:justify-start mb-4 sm:mb-0">
    {[
      { key: "10-19", label: "F7 (10-19)" },
      { key: "30-39", label: "F8 (30-39)" },
      { key: "50-59", label: "F9 (50-59)" }
    ].map((tab, i) => (
      <button
        key={tab.key}
        onClick={() => handleFilter(tab.key)}
        className={`px-6 py-3 rounded-xl font-bold text-white 
          ${activeFilter === tab.key
            ? "bg-gradient-to-r from-purple-700 to-pink-600 scale-105 shadow-lg"
            : "bg-gradient-to-r from-purple-500 to-pink-500"
          }
          hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95 border border-purple-400/30`}
      >
        {tab.label}
      </button>
    ))}
  </div>

  {/* Remain Time Section */}
  <div className="flex items-center gap-2 px-6 py-3 bg-slate-800/80 rounded-2xl border border-red-500/30 shadow-lg mb-4 sm:mb-0">
    <Clock className="w-6 h-6 text-red-400 animate-pulse" />
    <span className="text-sm sm:text-lg font-bold text-green-400 tracking-wider">
      Remain Time
    </span>
    <span className="text-lg sm:text-xl font-mono font-bold text-red-400 bg-slate-900/50 px-3 py-1 rounded-lg">
      {remainTime}
    </span>
  </div>
  
  {/* Draw Time and Draw Date Sections */}
  <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center sm:justify-start">
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-xl border border-green-500/30 w-full sm:w-auto">
      <Play className="w-5 h-5 text-green-400" />
      <span className="text-sm sm:text-lg font-bold text-green-400">Draw Time</span>
      <span className="text-lg sm:text-xl font-mono font-bold text-red-400">{drawTime}</span>
    </div>
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-xl border border-green-500/30 w-full sm:w-auto">
      <Calendar className="w-5 h-5 text-green-400" />
      <span className="text-sm sm:text-lg font-bold text-green-400">Draw Date</span>
      <span className="text-lg sm:text-xl font-mono font-bold text-red-400">{drawDate}</span>
    </div>
  </div>
</div>



      {/* Main Content Row */}
      <div className="flex flex-wrap p-2 gap-2">
  {/* Left Panel - Number Selectors, ODD EVEN FP */}
  <div className="rounded-2xl shadow-2xl bg-gradient-to-b from-slate-100/95 to-slate-300/80 p-2 border-2 border-gray-300/50 min-h-[700px] w-full lg:max-w-[320px] sm:w-[360px] backdrop-blur-sm">
    {/* Filter Buttons */}
    <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
      <button
        onClick={() => handleOddEvenFP("all")}
        className={`px-3 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
          activeFilter === "all"
            ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
            : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
        }`}
      >
        All
      </button>
      <button
        onClick={() => handleOddEvenFP("even")}
        className={`px-3 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
          activeFilter === "even"
            ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
            : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
        }`}
      >
        Even
      </button>
      <button
        onClick={() => handleOddEvenFP("odd")}
        className={`px-3 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
          activeFilter === "odd"
            ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
            : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
        }`}
      >
        Odd
      </button>
      <button
        onClick={() => {
          setIsFPMode(fp => !fp);
          setActiveFPSetIndex(null); // reset current set highlight on mode toggle
          setActiveTypeFilter("fp");
        }}
        className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
          isFPMode
            ? "text-white bg-gradient-to-r from-green-600 to-lime-600 shadow-lg"
            : "text-[#4A314D] bg-[#ece6fc] border border-[#968edb] hover:bg-[#e5def7] shadow-md"
        }`}
      >
        FP
      </button>
    </div>

    {/* Column Filters (F7, F8, F9) */}
    <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
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
          title={tab.key === "10-19" ? "F7" : tab.key === "30-39" ? "F8" : "F9"}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Number + Checkbox Grid */}
    <div className="grid grid-cols-3 gap-1 mb-4">
      {range(0, 9).map((row) =>
        allNumbers.map((colArray, colIdx) => {
          const num = colArray[row];
          const color = numberBoxColors[row % numberBoxColors.length];
          return (
            <div
              key={num}
              className={`relative flex items-center gap-1 px-2 py-2 ${color} hover:scale-105 transition-all duration-200 cursor-pointer`}
              style={{
                border: "2px solid #fff",
                borderRadius: "12px",
                margin: "1px",
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
                className="w-9 h-9 flex items-center justify-center font-bold text-md text-[#4A314D] bg-white border-2 border-[#4A314D] rounded-lg select-none transition-all duration-200 hover:bg-gray-50"
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
  <div className="flex-1 bg-gradient-to-b from-slate-800/70 to-slate-900/90 rounded-2xl shadow-2xl border-2 border-slate-700/50 transparent-scrollbar p-4 overflow-hidden backdrop-blur-sm">
  {/* Stats Header */}
  <div className="flex justify-between items-center mb-4 p-3 bg-slate-800/50 rounded-xl border border-purple-500/30">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
      <span className="text-lg font-bold text-slate-200">Game Matrix</span>
    </div>
    <div className="flex gap-4">
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-yellow-500/30">
        <Target className="w-4 h-4 text-yellow-400" />
        <span className="text-yellow-400 font-medium">Total Quantity:</span>
        <span className="font-bold text-white">0</span>
      </div>
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/50 rounded-lg border border-pink-500/30">
        <TrendingUp className="w-4 h-4 text-pink-400" />
        <span className="text-pink-400 font-medium">Total Points:</span>
        <span className="font-bold text-white">0</span>
      </div>
    </div>
  </div>

  {/* Enhanced Table */}
  <div className="overflow-x-auto transparent-scrollbar">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-700/50">
          {/* Row header blank */}
          <th className="bg-transparent p-2"></th>
          {/* 10 col headers */}
          {range(0, 9).map((n) => (
            <th
              key={n}
              className="p-2 text-center text-sm font-bold text-purple-300 bg-slate-800/30 border-r border-slate-700/30 last:border-r-0"
            >
              {/* Blank for column headers */}
            </th>
          ))}
          {/* Spacer, Quantity, Points headers */}
          <th className="bg-transparent p-2"></th>
          <th className="bg-transparent p-2"></th>
        </tr>
      </thead>
      <tbody>
        {/* Column Header Input Row */}
        <tr>
          <td className="bg-transparent"></td>
          {range(0, 9).map((col) => (
            <td key={`col-header-${col}`} className="p-1 text-center border-r border-slate-700/20 last:border-r-0">
              <input
                type="text"
                className="w-10 h-8 rounded-lg bg-cyan-900/80 text-cyan-200 border-2 border-cyan-400/40 text-center font-bold shadow focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 hover:border-cyan-300"
                maxLength={2}
                value={columnHeaders[col]}
                onChange={(e) => handleColumnHeaderChange(col, e.target.value)}
              />
            </td>
          ))}
          <td className="bg-transparent"></td>
          <td className="p-1 text-center font-bold text-yellow-400">Quantity</td>
          <td className="p-1 text-center font-bold text-pink-400">Points</td>
        </tr>
        {/* Main Grid Rows */}
        {range(0, 9).map((row) => (
          <tr key={row} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
            <td className="p-1 text-center border-r border-slate-700/20">
              <input
                type="text"
                className="w-10 h-8 rounded-lg bg-lime-900/80 text-lime-200 border-2 border-lime-400/40 text-center font-bold shadow focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 outline-none transition-all duration-200 hover:border-lime-300"
                maxLength={2}
                value={rowHeaders[row]}
                onChange={(e) => handleRowHeaderChange(row, e.target.value)}
              />
            </td>

            {/* main input box */}
            {range(0, 9).map((col) => (
              <td key={col} className="p-1 text-center border-r border-slate-700/20 last:border-r-0">
                <div className="text-xs text-white font-bold">{String(row * 10 + col).padStart(2, '0')}</div>
                <input
                  type="text"
                  className={`w-10 h-8 rounded-lg bg-slate-900/90 text-white border-2 border-purple-600/40 text-center font-bold shadow-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all duration-200 hover:border-purple-400
                    ${isFPMode && activeFPSetIndex !== null && FP_SETS[activeFPSetIndex].includes(String(row * 10 + col).padStart(2, "0"))
                      ? 'bg-green-600/80 border-green-300 ring-2 ring-green-300'
                      : ''
                  }`}
                  maxLength={2}
                  value={getCellValue(row, col)}
                  onChange={(e) => handleGridChange(row, col, e.target.value)}
                  onClick={() => {
                    if (isFPMode) {
                      const numStr = String(row * 10 + col).padStart(2, "0");
                      const setIdx = getFPSetIndexForNumber(numStr);
                      setActiveFPSetIndex(setIdx !== -1 ? setIdx : null);
                    }
                  }}
                />
              </td>
            ))}
            <td className="bg-transparent"></td>
            <td className="p-1 text-center">
  <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-yellow-200 to-yellow-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-yellow-400">
    {updatedQuantity[row]}
  </div>
</td>

<td className="p-1 text-center">
  <div className="w-16 h-8 rounded-lg bg-gradient-to-r from-pink-200 to-pink-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-pink-400">
    {updatedPoints[row]}
  </div>
</td>

          </tr>
        ))}
        {/* Totals Row */}
        <tr className="bg-slate-800/40 border-t-2 border-purple-500/50">
          <td colSpan={10 + 2} className="p-1 text-center font-bold text-purple-300">
            TOTALS
          </td>
          <td className="p-1 text-center">
            <div className="font-extrabold text-lg text-yellow-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-yellow-500/50">
              0
            </div>
          </td>
          <td className="p-1 text-center">
            <div className="font-extrabold text-lg text-pink-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-pink-500/50">
              0
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Enhanced Footer */}
  <div className="flex items-center mt-6 gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
    <div className="flex-1">
      <input
        type="text"
        placeholder="Transaction No/Bar Code"
        className="w-full py-3 px-5 rounded-xl bg-slate-700/90 text-white font-semibold placeholder-purple-300 border-2 border-purple-500/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 outline-none shadow-lg transition-all duration-200 hover:border-purple-400"
      />
    </div>
    <div className="flex-none">
      <button className="flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 text-lg hover:scale-105 active:scale-95 hover:shadow-purple-500/25">
        <Zap className="w-5 h-5" />
        Advance Draw
      </button>
    </div>
  </div>
</div>

</div>

    </div>
  );
}
