// src/Components/ThreeD/Manual.jsx
"use client";

import React, { useState, useRef, useMemo } from "react";

export default function Manual() {
  // --- Top controls state ---
  const [selection, setSelection] = useState("all");
  const [pick, setPick] = useState("straight");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("10");

  const handleSelectionChangeTop = (e) => setSelection(e.target.value);
  const handlePickChange = (e) => setPick(e.target.value);
  const handleQuantityChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setQuantity(raw.slice(0, 4));
  };
  const handleRateChange = (value) => setRate(value);

  // --- Barcode state ---
  const [barcode, setBarcode] = useState("");

  // --- Grid state ---
  const NUM_COLS = 6;
  const NUM_ROWS = 8;

  const selectionOptions = [
    { value: "straight", label: "Straight" },
    { value: "box", label: "Box" },
    { value: "frontPair", label: "Front Pair" },
    { value: "backPair", label: "Back Pair" },
    { value: "splitPair", label: "Split Pair" },
    { value: "anyPair", label: "Any Pair" },
  ];

  const [selections, setSelections] = useState(() =>
    Array.from({ length: NUM_COLS }, () => Array(NUM_ROWS).fill("straight"))
  );

  const [numbers, setNumbers] = useState(() =>
    Array.from({ length: NUM_COLS }, () =>
      Array.from({ length: NUM_ROWS }, () => ["", "", ""])
    )
  );

  const inputRefs = useRef(
    Array.from({ length: NUM_COLS }, () =>
      Array.from({ length: NUM_ROWS }, () => [null, null, null])
    )
  );

  const handleSelectionChangeGrid = (colIdx, rowIdx, value) => {
    setSelections((prev) => {
      const copy = prev.map((c) => c.slice());
      copy[colIdx][rowIdx] = value;

      // clear disabled inputs when type changes
      const disabledIdx = [0, 1, 2].filter((i) =>
        isDisabled(value, i)
      );
      disabledIdx.forEach((i) => {
        numbers[colIdx][rowIdx][i] = "";
      });

      return copy;
    });
  };

  // Handle digit input
  const handleNumberChange = (colIdx, rowIdx, inputIdx, rawValue) => {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    setNumbers((prev) => {
      const copy = prev.map((c) => c.map((r) => r.slice()));
      copy[colIdx][rowIdx][inputIdx] = digit;
      return copy;
    });

    moveToNext(colIdx, rowIdx, inputIdx);
  };

  const handleKeyDown = (colIdx, rowIdx, inputIdx, e) => {
    if (e.key === "Backspace") {
      setNumbers((prev) => {
        const copy = prev.map((c) => c.map((r) => r.slice()));
        if (copy[colIdx][rowIdx][inputIdx]) {
          copy[colIdx][rowIdx][inputIdx] = "";
        } else {
          moveToPrevious(colIdx, rowIdx, inputIdx);
        }
        return copy;
      });
    }
  };

  // Focus helpers
  const moveToNext = (colIdx, rowIdx, inputIdx) => {
    let nextCol = colIdx;
    let nextRow = rowIdx;
    let nextInput = inputIdx + 1;

    if (nextInput >= 3) {
      nextInput = 0;
      nextRow++;
      if (nextRow >= NUM_ROWS) {
        nextRow = 0;
        nextCol++;
        if (nextCol >= NUM_COLS) return;
      }
    }

    const nextRef = inputRefs.current[nextCol][nextRow][nextInput];
    if (nextRef) nextRef.focus();
  };

  const moveToPrevious = (colIdx, rowIdx, inputIdx) => {
    let prevCol = colIdx;
    let prevRow = rowIdx;
    let prevInput = inputIdx - 1;

    if (prevInput < 0) {
      prevInput = 2;
      prevRow--;
      if (prevRow < 0) {
        prevRow = NUM_ROWS - 1;
        prevCol--;
        if (prevCol < 0) return;
      }
    }

    const prevRef = inputRefs.current[prevCol][prevRow][prevInput];
    if (prevRef) prevRef.focus();
  };

  // disable logic
  const isDisabled = (type, inputIdx) => {
    switch (type) {
      case "frontPair":
        return inputIdx === 2;
      case "backPair":
        return inputIdx === 0;
      case "splitPair":
        return inputIdx === 1;
      case "anyPair":
        return inputIdx === 2;
      default:
        return false;
    }
  };

  const handleReset = () => {
    setSelections(Array.from({ length: NUM_COLS }, () => Array(NUM_ROWS).fill("straight")));
    setNumbers(Array.from({ length: NUM_COLS }, () =>
      Array.from({ length: NUM_ROWS }, () => ["", "", ""])
    ));
    setBarcode("");
  };

  const handleBuy = () => {
    alert(`You are buying tickets!`);
  };

  // --- Grand Total Calculation ---
  const grandTotal = useMemo(() => {
    let tickets = 0;
    numbers.forEach((col, colIdx) => {
      col.forEach((row, rowIdx) => {
        const type = selections[colIdx][rowIdx];
        const activeIdx = [0, 1, 2].filter((i) => !isDisabled(type, i));
        if (activeIdx.every((i) => row[i] !== "")) {
          tickets++;
        }
      });
    });
    return tickets * parseInt(rate, 10);
  }, [numbers, rate, selections]);

  return (
    <div className="w-full max-w-full mt-6 space-y-6 px-1">
      {/* --- Top Controls --- */}
      <div className="rounded-xl bg-white/6 border border-white/10 backdrop-blur-sm p-3">
        <div className="flex flex-wrap items-center gap-4 px-3 py-2 w-full">
          <select
            value={selection}
            onChange={handleSelectionChangeTop}
            className="min-w-[180px] bg-white/5 text-white text-sm rounded-md px-4 py-2 border border-white/10"
          >
            <option value="all">All Selection</option>
            <option value="odds">Odds</option>
            <option value="evens">Evens</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm text-gray-200">LUCKY PICK</span>
            <select
              value={pick}
              onChange={handlePickChange}
              className="min-w-[160px] bg-white/5 text-white text-sm rounded-md px-4 py-2 border border-white/10"
            >
              {selectionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <input
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Enter Quantity"
            className="min-w-[140px] bg-white/5 placeholder-gray-300 text-white text-sm rounded-md px-4 py-2 border border-white/10"
            maxLength={4}
          />

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-200">Rates:</span>
            {["10", "20", "50", "100", "200", "500"].map((r) => (
              <label key={r} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="rate"
                  value={r}
                  checked={rate === r}
                  onChange={() => handleRateChange(r)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className={rate === r ? "text-white font-semibold" : "text-gray-300"}>{r}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* --- Grid Section (6 flex columns, spaced evenly) --- */}
      <div className="rounded-xl bg-white/6 border border-white/10 backdrop-blur-sm p-4">
        <div className="flex justify-between gap-4">
          {Array.from({ length: NUM_COLS }).map((_, colIdx) => (
            <div key={`col-${colIdx}`} className="flex flex-col gap-2">
              {Array.from({ length: NUM_ROWS }).map((__, rowIdx) => {
                const type = selections[colIdx][rowIdx];
                return (
                  <div key={`row-${colIdx}-${rowIdx}`} className="flex items-center gap-1">
                    {/* Selection dropdown */}
                    <div className="bg-yellow-50/90 border-1 rounded flex-shrink-0 md:max-w-15">
                      <select
                        value={type}
                        onChange={(e) => handleSelectionChangeGrid(colIdx, rowIdx, e.target.value)}
                        className="w-full text-xs rounded px-1 py-0.5 border border-yellow-200 bg-yellow-50 text-slate-800"
                      >
                        {selectionOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Three input boxes */}
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((inputIdx) => (
                        <input
                          key={`inp-${colIdx}-${rowIdx}-${inputIdx}`}
                          ref={(el) => (inputRefs.current[colIdx][rowIdx][inputIdx] = el)}
                          value={numbers[colIdx][rowIdx][inputIdx]}
                          onChange={(e) => handleNumberChange(colIdx, rowIdx, inputIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(colIdx, rowIdx, inputIdx, e)}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          disabled={isDisabled(type, inputIdx)}
                          className={`w-7 h-7 text-center rounded border text-xs ${
                            isDisabled(type, inputIdx)
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-white text-slate-700 border-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* --- Bottom Section --- */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="barcode" className="text-sm text-white">Barcode:</label>
          <input
            id="barcode"
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Barcode"
            className="px-3 py-1.5 border border-gray-300 rounded-l-md text-sm"
          />
          <button className="px-3 py-1.5 bg-purple-700 text-white rounded-r-md hover:bg-purple-800">
            🔍
          </button>
        </div>

        <div className="flex items-center gap-3 bg-yellow-50/90 border border-yellow-200 rounded px-4 py-2">
          <span className="text-gray-800 font-semibold">Grand Total:</span>
          <span className="text-black font-bold">{grandTotal}</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md shadow hover:bg-gray-400 transition"
        >
          Reset
        </button>
        <button
          onClick={handleBuy}
          className="px-6 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
        >
          Buy
        </button>
      </div>
    </div>
  );
}
