
"use client";
import React, { useState, useEffect } from "react";
import { Search, XCircle, Trash2, Home } from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import Link from "next/link";
import axios from "axios";

const getUserToken = () => localStorage.getItem("userToken");
const entryOptions = [10, 20, 50, 100];
function getLoginIdFromToken() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.id;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export default function Page() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntries, setShowEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!getUserToken()) {
      window.location.href = "/";
      return;
    }
    fetchTickets();
    // eslint-disable-next-line
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const loginId = getLoginIdFromToken(); // ✅ dynamic from token
      if (!loginId) {
        console.error("Login ID not found in token");
        return;
      }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/show-tickets`,
        { loginId }
      );

      // Flatten the grouped API response
      const allTickets = [];
      let sr = 1;
      data.forEach((draw) => {
        draw.tickets.forEach((ticket) => {
          allTickets.push({
            sr: sr++,
            drawTime: ticket.drawTime,
            drawDate: ticket.drawDate,
            ticketNo: ticket.ticketNumber,
            point: ticket.totalPoints,
          });
        });
      });
      setTickets(allTickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Delete (Cancel) a ticket
  const handleCancel = async (ticketNo) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ticket? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cancel-ticket`,
        { ticketNo }
      );
      setTickets((prev) => prev.filter((row) => row.ticketNo !== ticketNo));
    } catch (error) {
      alert("Failed to cancel ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filtering & Pagination
  let filtered = tickets;
  if (search.trim() !== "") {
    filtered = filtered.filter((row) =>
      String(row.ticketNo).toLowerCase().includes(search.toLowerCase())
    );
  }

  const totalPages = Math.ceil(filtered.length / showEntries);
  const startIdx = (current - 1) * showEntries;
  const showData = filtered.slice(startIdx, startIdx + showEntries);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

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
              <p className="text-slate-300 text-lg">
                Cancel and manage your lottery tickets
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-pink-500 mt-4 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Table and Controls */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Show entries */}
              <div className="flex items-center gap-3">
                <span className="text-slate-300 text-sm font-medium whitespace-nowrap">
                  Display
                </span>
                <select
                  value={showEntries}
                  onChange={(e) => {
                    setShowEntries(Number(e.target.value));
                    setCurrent(1);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200 min-w-[80px]"
                >
                  {entryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="text-slate-300 text-sm font-medium whitespace-nowrap">
                  per page
                </span>
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
                  onChange={(e) => {
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

        {/* Table */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/30 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700/80 to-slate-600/80 border-b border-slate-600/30">
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Sr No
                  </th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Draw Time
                  </th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Draw Date
                  </th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Ticket No
                  </th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Point
                  </th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-200 uppercase tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600/20">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : showData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-16 h-16 text-slate-500" />
                        <div>
                          <p className="text-xl font-semibold text-slate-300 mb-2">
                            No matching records found
                          </p>
                          <p className="text-sm">
                            Try adjusting your search criteria or filters
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  showData.map((row) => (
                    <tr
                      key={row.sr}
                      className="hover:bg-slate-700/30 transition-all duration-200 group"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-200">
                        {row.sr}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {row.drawTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {row.drawDate}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-blue-300 font-semibold">
                        {row.ticketNo}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-400">
                        {row.point}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-semibold shadow-lg hover:from-red-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 hover:shadow-xl"
                          title="Cancel Ticket"
                          onClick={() => handleCancel(row.ticketNo)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 p-6 mt-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <div className="text-slate-300 text-sm">
              Showing{" "}
              <span className="font-semibold text-white">{startIdx + 1}</span>{" "}
              to{" "}
              <span className="font-semibold text-white">
                {Math.min(startIdx + showEntries, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {filtered.length}
              </span>{" "}
              entries
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
