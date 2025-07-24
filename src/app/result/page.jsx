"use client";
import React, { useState } from "react";
import { Calendar, Clock, Grid3x3, ChevronDown, Home} from "lucide-react";
import Link from "next/link";
import Navbar from "../../Components/Navbar/Navbar";

// Gradients for columns (repeats as needed)
const colGradients = [
  "bg-gradient-to-r from-orange-400 to-orange-600 text-white",
  "bg-gradient-to-r from-pink-600 to-pink-400 text-white",
  "bg-gradient-to-r from-yellow-300 to-yellow-500 text-slate-900",
  "bg-gradient-to-r from-blue-400 to-blue-700 text-white",
  "bg-gradient-to-r from-indigo-500 to-cyan-400 text-white",
  "bg-gradient-to-r from-green-400 to-green-600 text-white",
  "bg-gradient-to-r from-red-400 to-rose-600 text-white",
  "bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-900",
  "bg-gradient-to-r from-emerald-500 to-lime-400 text-white",
  "bg-gradient-to-r from-purple-700 to-pink-600 text-white",
];

const columnRanges = [
  { label: "10-19", start: 10, end: 19 },
  { label: "30-39", start: 30, end: 39 },
  { label: "50-59", start: 50, end: 59 },
];

function getTimeSlots() {
  const slots = [];
  let hour = 10;
  let minute = 0;
  while (!(hour === 16 && minute === 0)) {
    const ampm = hour < 12 ? "AM" : "PM";
    const hr = hour % 12 === 0 ? 12 : hour % 12;
    const min = minute.toString().padStart(2, "0");
    slots.push(`${hr}:${min} ${ampm}`);
    minute += 15;
    if (minute === 60) {
      hour++;
      minute = 0;
    }
  }
  return slots;
}

function getColumns(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function rand2digits() {
  return Math.floor(10 + Math.random() * 90);
}

const Page = () => {
  const [selectedCol, setSelectedCol] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const columns = getColumns(
    columnRanges[selectedCol].start,
    columnRanges[selectedCol].end
  );
  const slots = getTimeSlots();

  // Generate a random 4-digit for each cell, first 2 digits = col
  const tableData = slots.map((slot) =>
    columns.map((col) => `${col}${rand2digits()}`)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Navbar/>
        <div className="max-w-7xl mx-auto pt-6 px-6">
  <Link
    href="/dashboard"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-all duration-150 hover:from-blue-700 hover:to-purple-700"
    title="Go to Dashboard"
  >
    <Home className="w-5 h-5" />
    <span className="hidden sm:inline">Home</span>
  </Link>
</div>
      <div className="max-w-7xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Game Results Table
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Date Picker Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-slate-200 font-medium">Select Date:</span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  className="px-4 py-3 rounded-xl border-2 border-purple-400/50 font-semibold bg-slate-900/80 text-white shadow-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all duration-200 hover:border-purple-300"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ width: 180 }}
                />
              </div>
            </div>

            {/* Range Selector Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-blue-400" />
                <span className="text-slate-200 font-medium">Number Range:</span>
              </div>
              <div className="flex gap-2">
                {columnRanges.map((col, idx) => (
                  <button
                    key={col.label}
                    onClick={() => setSelectedCol(idx)}
                    className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      selectedCol === idx
                        ? "bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-lg border-pink-500 scale-105"
                        : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-pink-400 hover:text-white"
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Container */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm p-6">
          {/* Table Header Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Live Results - Range {columnRanges[selectedCol].label}
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Live Updates</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-xl shadow-xl border border-slate-600/50">
            <table className="w-full min-w-[900px] border-collapse bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl">
              <thead>
                <tr>
                  <th className="py-4 px-4 text-sm font-bold text-left text-white sticky left-0 bg-slate-900 z-10 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      Time Slot
                    </div>
                  </th>
                  {columns.map((col, idx) => (
                    <th>
                      
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
  {slots.map((slot, rowIdx) => (
    <tr key={slot} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-150">
      <td className="font-bold py-4 px-4 text-left text-slate-200 sticky left-0 bg-slate-900 z-10 border-r border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          {slot}
        </div>
      </td>
      {/* Wrap all the number cells in a flex with gap */}
      <td colSpan={columns.length} className="p-0">
        <div className="flex gap-x-1 gap-y-1">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className={`flex-1 py-4 px-4 text-center font-bold text-xl rounded-lg m-1 ${colGradients[colIdx % colGradients.length]} border border-slate-600/30 shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer`}
              style={{ minWidth: "90px" }}
            >
              <span className="text-2xl font-extrabold tracking-wide">
                {tableData[rowIdx][colIdx]}
              </span>
            </div>
          ))}
        </div>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>

          {/* Table Footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              Showing results for <span className="font-semibold text-slate-200">{selectedDate}</span> • 
              Range <span className="font-semibold text-slate-200">{columnRanges[selectedCol].label}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Updates every 15 minutes</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>{slots.length} time slots</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;