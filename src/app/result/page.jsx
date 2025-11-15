"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Clock, Grid3x3, Home } from "lucide-react";
import Link from "next/link";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";

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

function getColumns(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function filterNumbersByColumn(numbers, colStart, colEnd) {
  return numbers.filter((numObj) => {
    const nStr = String(numObj.number);
    const prefix = Number(nStr.slice(0, 2));
    return prefix >= colStart && prefix <= colEnd;
  });
}

const Page = () => {
  const [selectedCol, setSelectedCol] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [rowLabels, setRowLabels] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = getColumns(
    columnRanges[selectedCol].start,
    columnRanges[selectedCol].end
  );

  const todayDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoading(true);

    axios
      .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/get-winning-slots`)
      .then((res) => {
        const records = Array.isArray(res.data.results)
          ? res.data.results
          : [];

        // Filter results for today
        const filteredRecords = records.filter(
          (rec) => rec.drawDate === todayDate
        );

        // Collect all unique draw times
        const allDrawTimes = Array.from(
          new Set(
            filteredRecords
              .map((rec) =>
                typeof rec.DrawTime === "string"
                  ? rec.DrawTime.replace(/['"]+/g, "").trim()
                  : rec.DrawTime
              )
              .filter(Boolean)
          )
        );

        setRowLabels(allDrawTimes);

        // Group numbers by draw time
        const timeToNumbers = {};
        filteredRecords.forEach((rec) => {
          let numbers = rec.winningNumbers;
          if (typeof numbers === "string") {
            try {
              numbers = JSON.parse(numbers);
            } catch {
              numbers = [];
            }
          }
          let t = rec.DrawTime;
          if (typeof t === "string") {
            t = t.replace(/['"]+/g, "").trim();
          }
          timeToNumbers[t] = numbers;
        });

        // Prepare final table data
        const newTableData = allDrawTimes.map((drawTime) => {
          const slotNumbers = timeToNumbers[drawTime] || [];
          const filtered = filterNumbersByColumn(
            slotNumbers,
            columnRanges[selectedCol].start,
            columnRanges[selectedCol].end
          );
          return {
            drawTime,
            numbersByCol: columns.map((col, i) =>
              filtered[i] ? String(filtered[i].number) : "--"
            ),
          };
        });

        setTableData(newTableData);
        setLoading(false);
      })
      .catch(() => {
        setTableData([]);
        setRowLabels([]);
        setLoading(false);
      });
  }, [selectedCol]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">


      <div className="max-w-7xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Game Results Table
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
        </div>

        {/* Range Selector */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
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

        {/* Table */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">
                Live Results - Range {columnRanges[selectedCol].label}
              </h2>
            </div>
          </div>

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
                  {columns.map((col) => (
                    <th key={col}>
                      <span className="font-bold text-slate-200">{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="text-center py-8 text-slate-400"
                    >
                      No data found.
                    </td>
                  </tr>
                )}
                {tableData.map((row) => (
                  <tr
                    key={row.drawTime}
                    className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-150"
                  >
                    <td className="font-bold py-4 px-4 text-left text-slate-200 sticky left-0 bg-slate-900 z-10 border-r border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {row.drawTime}
                      </div>
                    </td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx}>
                        <div
                          className={`flex-1 py-4 px-4 text-center font-bold text-xl rounded-lg m-1 ${colGradients[colIdx % colGradients.length]} border border-slate-600/30 shadow-lg transition-all duration-200`}
                          style={{ minWidth: "90px" }}
                        >
                          <span className="text-2xl font-extrabold tracking-wide">
                            {loading ? (
                              <span className="animate-pulse text-slate-400">...</span>
                            ) : (
                              row.numbersByCol[colIdx] ?? "--"
                            )}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              Showing results for{" "}
              <span className="font-semibold text-slate-200">{todayDate}</span>{" "}
              • Range{" "}
              <span className="font-semibold text-slate-200">
                {columnRanges[selectedCol].label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
