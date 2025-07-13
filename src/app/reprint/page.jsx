"use client";

import React, { useState } from "react";
import { Printer, Search, Calendar, Ticket, Filter, ChevronLeft, ChevronRight, Home } from "lucide-react";
import Navbar from "@/Components/Navbar/Navbar";
import Link from "next/link";

const staticData = Array.from({ length: 50 }, (_, i) => ({
  sr: i + 1,
  gameTime: `${Math.floor(1 + Math.random() * 12)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0")} ${Math.random() > 0.5 ? "AM" : "PM"}`,
  gameDate: `2024-0${Math.floor(1 + Math.random() * 9)}-${Math.floor(
    10 + Math.random() * 19
  )}`,
  ticketNo: "TIC" + Math.floor(100000 + Math.random() * 900000),
  points: Math.floor(10 + Math.random() * 90),
}));

const entryOptions = [10, 20, 50, 100];

const Page = () => {
  const [showEntries, setShowEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(1);
  const [ticketSearch, setTicketSearch] = useState("");
  const [dateSearch, setDateSearch] = useState("");

  // Filter data
  let filtered = staticData;
  if (ticketSearch.trim() !== "") {
    filtered = filtered.filter((row) =>
      row.ticketNo.toLowerCase().includes(ticketSearch.toLowerCase())
    );
  }
  if (dateSearch.trim() !== "") {
    filtered = filtered.filter((row) => row.gameDate === dateSearch);
  }
  if (search.trim() !== "") {
    filtered = filtered.filter(
      (row) =>
        row.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
        row.gameDate.includes(search) ||
        row.gameTime.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / showEntries);
  const startIdx = (current - 1) * showEntries;
  const showData = filtered.slice(startIdx, startIdx + showEntries);

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

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            Reprint Ticket
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-sm">
          {/* Search Filters Section */}
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Search Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Ticket Number Search */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Ticket className="w-4 h-4" />
                  Ticket Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Enter ticket number"
                  />
                </div>
              </div>

              {/* Date Search */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Calendar className="w-4 h-4" />
                  Draw Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                  value={dateSearch}
                  onChange={(e) => setDateSearch(e.target.value)}
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setCurrent(1)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 items-center">
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium">Show</span>
                <select
                  value={showEntries}
                  onChange={(e) => {
                    setShowEntries(Number(e.target.value));
                    setCurrent(1);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-blue-400 transition-all duration-200"
                >
                  {entryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="text-slate-300 text-sm font-medium">entries</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium">Quick Search:</span>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrent(1);
                    }}
                    className="pl-10 pr-4 py-2 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 w-64"
                    placeholder="Type to search..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-8">
            <div className="overflow-x-auto rounded-xl border border-slate-600/50">
              <table className="min-w-full text-left bg-slate-800/50 text-white">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50">
                      Sr No
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50">
                      Game Time
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50">
                      Game Date
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50">
                      Ticket No
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50">
                      Points
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-200 border-b border-slate-600/50 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="w-12 h-12 text-slate-500" />
                          <p className="text-lg font-medium">No matching records found</p>
                          <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    showData.map((row, i) => (
                      <tr
                        key={row.ticketNo}
                        className="hover:bg-slate-700/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-200 border-b border-slate-700/30">
                          {row.sr}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300 border-b border-slate-700/30">
                          {row.gameTime}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300 border-b border-slate-700/30">
                          {row.gameDate}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-blue-300 border-b border-slate-700/30">
                          {row.ticketNo}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-400 border-b border-slate-700/30">
                          {row.points}
                        </td>
                        <td className="px-6 py-4 text-center border-b border-slate-700/30">
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
                            title="Print Ticket"
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-8 gap-4">
              <div className="text-slate-400 text-sm">
                Showing <span className="font-semibold text-slate-200">{startIdx + 1}</span> to{" "}
                <span className="font-semibold text-slate-200">
                  {Math.min(startIdx + showEntries, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-200">{filtered.length}</span> entries
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={current === 1}
                  onClick={() => setCurrent((c) => Math.max(1, c - 1))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border text-sm transition-all duration-200 ${
                    current === 1
                      ? "opacity-40 cursor-not-allowed border-slate-700/40 text-slate-500"
                      : "border-slate-600/50 text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  <span className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">
                    {current}
                  </span>
                  <span className="text-slate-400 text-sm">of {totalPages}</span>
                </div>
                
                <button
                  disabled={current === totalPages || totalPages === 0}
                  onClick={() => setCurrent((c) => Math.min(totalPages, c + 1))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border text-sm transition-all duration-200 ${
                    current === totalPages || totalPages === 0
                      ? "opacity-40 cursor-not-allowed border-slate-700/40 text-slate-500"
                      : "border-slate-600/50 text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;