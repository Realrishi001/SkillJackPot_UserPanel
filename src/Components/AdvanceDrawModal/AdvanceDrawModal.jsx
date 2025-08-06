"use client";
import React, { useState, useMemo } from "react";
import { DRAW_TIMES } from "../../data/drawTimes";

function isTimePassed(drawTime) {
  const now = new Date();
  const [time, period] = drawTime.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const drawDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  return drawDate < now;
}

export default function AdvanceDrawModal({
  open,
  onClose,
  selectedTimes,
  setSelectedTimes,
  onConfirm,
}) {
  const [range, setRange] = useState("");

  // List of available (not disabled) draw times
  const availableTimes = useMemo(
    () => DRAW_TIMES.filter((time) => !isTimePassed(time)),
    [open] // update on open to reflect current time
  );

  // Handler: Range input
  const handleRangeChange = (e) => {
    let val = e.target.value.replace(/\D/, "");
    if (val.length > 2) val = val.slice(0, 2); // avoid huge numbers
    setRange(val);

    if (val === "" || isNaN(val)) return;

    // Only select available times up to 'range'
    const toSelect = availableTimes.slice(0, Number(val));
    setSelectedTimes(toSelect);
  };

  // Handler: Select All checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTimes(availableTimes);
    } else {
      setSelectedTimes([]);
    }
  };

  // Is all available times selected?
  const allSelected = availableTimes.length > 0 &&
    availableTimes.every((time) => selectedTimes.includes(time));

  if (!open) return null;

  const toggleTime = (time) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">
          Select Advance Draw Times
        </h2>

        

        <div className="flex justify-between flex-wrap gap-4 mb-6">
          {DRAW_TIMES.map((time) => {
            const disabled = isTimePassed(time);
            return (
              <label
                key={time}
                className={`flex items-center gap-2 cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTimes.includes(time)}
                  onChange={() => toggleTime(time)}
                  className="w-5 h-5 accent-purple-600"
                  disabled={disabled}
                />
                <span className="font-medium">{time}</span>
              </label>
            );
          })}
        </div>
        <div className="flex gap-4 justify-end">
          {/* Range and Select All */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-700">Range:</span>
            <input
              type="text"
              value={range}
              onChange={handleRangeChange}
              placeholder="e.g. 3"
              className="w-16 py-1 px-2 rounded border border-purple-300 focus:border-pink-500 text-purple-700 font-bold"
              inputMode="numeric"
              maxLength={2}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-5 h-5 accent-purple-600"
            />
            <span className="font-semibold text-purple-700">Select All</span>
          </label>
        </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(selectedTimes);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
