"use client";
import React, { useState, useEffect } from "react";
import { Search, XCircle, Trash2, Filter, Download, RefreshCw,Home } from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import Link from "next/link";

// Static sample data
const staticData = Array.from({ length: 40 }, (_, i) => ({
  sr: i + 1,
  drawTime: `${String(10 + Math.floor(i / 4)).padStart(2, "0")}:${(i % 4) * 15 === 0 ? "00" : (i % 4) * 15} ${10 + Math.floor(i / 4) < 12 ? "AM" : "PM"}`,
  drawDate: `2025-07-${String(10 + (i % 10)).padStart(2, "0")}`,
  ticketNo: "TIC" + (100000 + i * 23),
  point: Math.floor(10 + Math.random() * 90),
  status: i % 5 === 0 ? "Cancelled" : "Active",
}));

const entryOptions = [10, 20, 50, 100];

export default function Page() {

    useEffect(() => {
    if (!localStorage.getItem("userToken")) {
      router.push("/");
    }
  }, []);

  const [showEntries, setShowEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");

  // Filtered data
  let filtered = staticData;
  if (search.trim() !== "") {
    filtered = filtered.filter((row) =>
      row.ticketNo.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (statusFilter !== "All") {
    filtered = filtered.filter((row) => row.status === statusFilter);
  }

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / showEntries);
  const startIdx = (current - 1) * showEntries;
  const showData = filtered.slice(startIdx, startIdx + showEntries);

  // Stats
  const totalActive = staticData.filter(item => item.status === "Active").length;
  const totalCancelled = staticData.filter(item => item.status === "Cancelled").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Navbar/>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-b border-slate-600/30 backdrop-blur-sm">
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Ticket Management
              </h1>
              <p className="text-slate-300 text-lg">Cancel and manage your lottery tickets</p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-pink-500 mt-4 rounded-full"></div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl px-6 py-4 backdrop-blur-sm">
                <div className="text-green-400 text-sm font-medium">Active Tickets</div>
                <div className="text-white text-2xl font-bold">{totalActive}</div>
              </div>
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl px-6 py-4 backdrop-blur-sm">
                <div className="text-red-400 text-sm font-medium">Cancelled</div>
                <div className="text-white text-2xl font-bold">{totalCancelled}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Controls */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* Left Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Show entries */}
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium whitespace-nowrap">Display</span>
                <select
                  value={showEntries}
                  onChange={e => {
                    setShowEntries(Number(e.target.value));
                    setCurrent(1);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200 min-w-[80px]"
                >
                  {entryOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="text-slate-300 text-sm font-medium whitespace-nowrap">per page</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrent(1);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200 min-w-[120px]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setCurrent(1);
                  }}
                  className="pl-10 pr-4 py-2.5 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200 w-full"
                  placeholder="Search by ticket number..."
                />
              </div>

              
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border-b border-slate-600/30">
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Sr No</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Draw Time</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Draw Date</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Ticket No</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Point</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600/20">
                {showData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-16 h-16 text-slate-500" />
                        <div>
                          <p className="text-xl font-semibold text-slate-300 mb-2">No matching records found</p>
                          <p className="text-sm">Try adjusting your search criteria or filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  showData.map((row, i) => (
                    <tr key={row.ticketNo} className="hover:bg-slate-700/30 transition-all duration-200 group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-200">{row.sr}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{row.drawTime}</td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">{row.drawDate}</td>
                      <td className="px-6 py-4 text-sm font-mono text-blue-300 font-semibold">{row.ticketNo}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-400">{row.point}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={
                          row.status === "Cancelled"
                            ? "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300"
                            : "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300"
                        }>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            row.status === "Cancelled" ? "bg-red-400" : "bg-green-400"
                          }`}></div>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.status === "Active" ? (
                          <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold shadow-lg hover:from-red-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 hover:shadow-xl"
                            title="Cancel Ticket"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-700/50 text-slate-500 text-sm font-medium">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 p-6 mt-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <div className="text-slate-300 text-sm">
              Showing <span className="font-semibold text-white">{startIdx + 1}</span> to{" "}
              <span className="font-semibold text-white">
                {Math.min(startIdx + showEntries, filtered.length)}
              </span>{" "}
              of <span className="font-semibold text-white">{filtered.length}</span> entries
              {statusFilter !== "All" && (
                <span className="text-slate-400"> (filtered by {statusFilter})</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                disabled={current === 1}
                onClick={() => setCurrent(1)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  current === 1
                    ? "opacity-40 cursor-not-allowed text-slate-500"
                    : "text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                }`}
              >
                First
              </button>
              
              <button
                disabled={current === 1}
                onClick={() => setCurrent((c) => Math.max(1, c - 1))}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  current === 1
                    ? "opacity-40 cursor-not-allowed text-slate-500"
                    : "text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2 mx-2">
                <span className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-red-600 text-white text-sm font-semibold shadow-lg">
                  {current}
                </span>
                <span className="text-slate-400 text-sm">of {totalPages}</span>
              </div>
              
              <button
                disabled={current === totalPages || totalPages === 0}
                onClick={() => setCurrent((c) => Math.min(totalPages, c + 1))}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  current === totalPages || totalPages === 0
                    ? "opacity-40 cursor-not-allowed text-slate-500"
                    : "text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                }`}
              >
                Next
              </button>
              
              <button
                disabled={current === totalPages || totalPages === 0}
                onClick={() => setCurrent(totalPages)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  current === totalPages || totalPages === 0
                    ? "opacity-40 cursor-not-allowed text-slate-500"
                    : "text-white bg-slate-700/50 hover:bg-slate-600/50 hover:scale-105"
                }`}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}