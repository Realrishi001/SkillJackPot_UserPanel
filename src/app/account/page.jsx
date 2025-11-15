"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import Link from "next/link";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

// Tabs
const TABS = [
  { label: "Points Summary", key: "points" },
  { label: "Net To Pay Summary", key: "net" },
  { label: "Claimed Tickets", key: "claimed" },
];

// Table configs
const TABLE_CONFIG = {
  points: {
    columns: [
      { label: "Sr. No.", key: "sr" },
      { label: "Name", key: "name" },
      { label: "Username", key: "username" },
      { label: "Play Amount", key: "playAmount" },
      { label: "Winning Amount", key: "winningAmount" },
      { label: "Commission", key: "commission" },
      { label: "Net Amount", key: "netAmount" },
    ],
    totalLabel: "Total",
  },
  net: {
    columns: [
      { label: "Sr. No.", key: "sr" },
      { label: "Name", key: "name" },
      { label: "Username", key: "username" },
      { label: "Play Points", key: "playPoints" },
      { label: "Commission", key: "commission" },
      { label: "Purchase Points", key: "purchasePoints" },
      { label: "Winning Points", key: "winningPoints" },
      { label: "Net To Pay", key: "netToPay" },
    ],
    data: [],
    totalLabel: "Net Pay Total",
    getTotals: (data) => ({
      playPoints: data.reduce((a, b) => a + Number(b.playPoints || 0), 0),
      commission: data.reduce((a, b) => a + Number(b.commission || 0), 0),
      purchasePoints: data.reduce((a, b) => a + Number(b.purchasePoints || 0), 0),
      winningPoints: data.reduce((a, b) => a + Number(b.winningPoints || 0), 0),
      netToPay: data.reduce((a, b) => a + Number(b.netToPay || 0), 0),
    }),
  },
  claimed: {
    columns: [
      { label: "Sr. No.", key: "sr" },
      { label: "Ticket ID", key: "ticketId" },
      { label: "Draw Date", key: "drawDate" },
      { label: "Draw Time", key: "drawTime" },
      { label: "Claimed Date", key: "claimedDate" },
      { label: "Total Quantity", key: "totalQuantity" },
      { label: "Winning Tickets", key: "winningTickets" },
    ],
    totalLabel: "Total",
  },
};

// extract loginId from token
function getLoginIdFromToken() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.id;
      } catch {
        return null;
      }
    }
  }
  return null;
}

const ShopAccounts = () => {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState("points");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [pointsSummaryData, setPointsSummaryData] = useState([]);
  const [claimedTicketsData, setClaimedTicketsData] = useState([]);
  const [loginId, setLoginId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // load loginId
  useEffect(() => {
    const id = getLoginIdFromToken();
    setLoginId(id);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("userToken")) {
      router.push("/");
    }
  }, [router]);

  // fetch points summary
  const fetchPointsSummary = async () => {
    if (!loginId) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/net-summary`,
        {
          fromDate,
          toDate,
          loginId,
        }
      );

      setPointsSummaryData([
        {
          sr: 1,
          name: res.data.fullName,
          username: res.data.userName,
          playAmount: Number(res.data.totalPoints),
          winningAmount: Number(res.data.winningPoints),
          commission: Number(res.data.commission),
          netAmount: Number(res.data.netPoints),
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setPointsSummaryData([]);
    }

    setLoading(false);
  };

  // fetch claimed tickets
  const fetchClaimedTickets = async () => {
    if (!loginId) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user-claimed-tickets`,
        {
          adminId: loginId,
          fromDate,
          toDate,
        }
      );

      console.log("Claimed tickets response:", res.data);

      const mapped = res.data.data?.map((item, idx) => ({
        sr: idx + 1,
        ticketId: item.ticketId,
        drawDate: item.drawDate || "N/A",
        drawTime: item.drawTime || "N/A",
        claimedDate: item.claimedDate || "N/A",
        totalQuantity: item.totalQuantity || 0,
        winningTickets: Array.isArray(item.ticketNumbers) 
          ? item.ticketNumbers
              .filter(ticket => ticket !== null && ticket !== undefined && ticket !== "")
              .join(", ") || "No winning tickets"
          : "No winning tickets",
      })) || [];

      setClaimedTicketsData(mapped);
    } catch (err) {
      console.error("Error fetching claimed tickets:", err);
      setError(err.response?.data?.message || "Something went wrong");
      setClaimedTicketsData([]);
    }

    setLoading(false);
  };

  const pointsTotals =
    pointsSummaryData.length > 0
      ? {
          playAmount: pointsSummaryData.reduce((a, b) => a + Number(b.playAmount || 0), 0),
          winningAmount: pointsSummaryData.reduce((a, b) => a + Number(b.winningAmount || 0), 0),
          commission: pointsSummaryData.reduce((a, b) => a + Number(b.commission || 0), 0),
          netAmount: pointsSummaryData.reduce((a, b) => a + Number(b.netAmount || 0), 0),
        }
      : {};

  const claimedTotals =
    claimedTicketsData.length > 0
      ? {
          totalQuantity: claimedTicketsData.reduce(
            (a, b) => a + Number(b.totalQuantity || 0),
            0
          ),
        }
      : {};

  // Handle tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setError("");
    
    // Clear data when switching tabs
    if (tabKey === "points") {
      setClaimedTicketsData([]);
    } else if (tabKey === "claimed") {
      setPointsSummaryData([]);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-10">
        <Navbar />
        <div className="max-w-7xl mx-auto pt-6 px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Shop Accounts</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-t-lg px-5 py-2 font-semibold ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-slate-300 text-xs mb-1">From Date</label>
            <input
              type="date"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs mb-1">To Date</label>
            <input
              type="date"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 ml-auto">
            {activeTab === "points" && (
              <button
                onClick={fetchPointsSummary}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Loading..." : "View"}
              </button>
            )}

            {activeTab === "claimed" && (
              <button
                onClick={fetchClaimedTickets}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Loading..." : "View"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-400 font-bold mb-4 p-3 bg-red-900/20 rounded-lg border border-red-800">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <table className="min-w-full text-sm text-center text-white">
            <thead>
              <tr className="bg-gradient-to-r from-purple-800 to-pink-800">
                {TABLE_CONFIG[activeTab].columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-bold whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Points Summary */}
              {activeTab === "points" && (
                <>
                  {pointsSummaryData.map((row) => (
                    <tr key={row.sr} className="border-b border-slate-700 hover:bg-slate-800/50">
                      {TABLE_CONFIG.points.columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {pointsSummaryData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={TABLE_CONFIG.points.columns.length} className="py-8 text-slate-400">
                        No points summary data found. Click "View" to load data.
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* Claimed Tickets */}
              {activeTab === "claimed" && (
                <>
                  {claimedTicketsData.map((row) => (
                    <tr key={row.sr} className="border-b border-slate-700 hover:bg-slate-800/50">
                      {TABLE_CONFIG.claimed.columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  {claimedTicketsData.length > 0 && (
                    <tr className="bg-slate-800 font-bold border-t-2 border-purple-600">
                      <td colSpan={5} className="px-4 py-3 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-3">{claimedTotals.totalQuantity || 0}</td>
                      <td></td>
                    </tr>
                  )}

                  {/* No Data */}
                  {claimedTicketsData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={TABLE_CONFIG.claimed.columns.length} className="py-8 text-slate-400">
                        No claimed tickets found. Click "View" to load data.
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* Loading State */}
              {loading && (
                <tr>
                  <td colSpan={TABLE_CONFIG[activeTab].columns.length} className="py-8 text-slate-400">
                    Loading data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Info */}
        {activeTab === "claimed" && claimedTicketsData.length > 0 && (
          <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
            <p className="text-slate-300">
              Total Records: <span className="text-white font-semibold">{claimedTicketsData.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopAccounts;
