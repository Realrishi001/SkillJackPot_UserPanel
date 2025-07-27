"use client";
import React, { useState,useEffect } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";

// Tabs
const TABS = [
  { label: "Points Summary", key: "points" },
  { label: "Net To Pay Summary", key: "net" },
];

// Table configs for each tab (columns + data + total label)
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
    data: [
      {
        sr: 1,
        name: "m",
        username: "m",
        playPoints: 570,
        commission: 45.6,
        purchasePoints: 524.4,
        winningPoints: 0,
        netToPay: 524.4,
      },
    ],
    totalLabel: "Net Pay Total",
    getTotals: data => ({
      playPoints: data.reduce((a, b) => a + Number(b.playPoints || 0), 0),
      commission: data.reduce((a, b) => a + Number(b.commission || 0), 0),
      purchasePoints: data.reduce((a, b) => a + Number(b.purchasePoints || 0), 0),
      winningPoints: data.reduce((a, b) => a + Number(b.winningPoints || 0), 0),
      netToPay: data.reduce((a, b) => a + Number(b.netToPay || 0), 0),
    }),
  },
};

function getLoginIdFromToken() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}


const ShopAccounts = () => {
  const [activeTab, setActiveTab] = useState("points");
  const [fromDate, setFromDate] = useState("2025-07-25");
  const [toDate, setToDate] = useState("2025-07-27");
  const [pointsSummaryData, setPointsSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginId, setLoginId] = useState(null);

  useEffect(() => {
    const id = getLoginIdFromToken();
    setLoginId(id);
  }, []);

  // For demo, Net tab stays static
  const netConfig = TABLE_CONFIG["net"];
  const netTotals = netConfig.getTotals ? netConfig.getTotals(netConfig.data) : {};

  

  // Fetch dynamic data for Points Summary tab
  const fetchPointsSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/net-summary`, {
        fromDate,
        toDate,
        loginId
      });
      // Build single row for table
      setPointsSummaryData([
        {
          sr: 1,
          name: res.data.fullName,
          username: res.data.userName,
          playAmount: Number(res.data.totalPoints),
          winningAmount: Number(res.data.winningPoints),
          commission: Number(res.data.commission),
          netAmount: Number(res.data.netPoints)
        }
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setPointsSummaryData([]);
    }
    setLoading(false);
  };

  // Totals for the dynamic tab (for a single row, same as the values)
  const pointsTotals = pointsSummaryData && pointsSummaryData.length
    ? {
        playAmount: pointsSummaryData.reduce((a, b) => a + Number(b.playAmount || 0), 0),
        winningAmount: pointsSummaryData.reduce((a, b) => a + Number(b.winningAmount || 0), 0),
        commission: pointsSummaryData.reduce((a, b) => a + Number(b.commission || 0), 0),
        netAmount: pointsSummaryData.reduce((a, b) => a + Number(b.netAmount || 0), 0)
      }
    : {};

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mb-10">
        <Navbar />
      </div>
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">Shop Accounts</h2>
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`
                rounded-t-lg px-5 py-2 text-base font-semibold transition-all duration-150
                ${activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"}
              `}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-slate-300 text-xs mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-xs mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          {activeTab === "points" && (
            <button
              onClick={fetchPointsSummary}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 transition-all text-white font-semibold px-6 py-2 rounded-lg shadow-lg ml-auto"
            >
              {loading ? "Loading..." : "View"}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-red-400 font-bold text-center">{error}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800 shadow">
          <table className="min-w-full text-sm text-center">
            <thead>
              <tr className="bg-gradient-to-r from-purple-800/80 to-pink-800/70 text-white">
                {TABLE_CONFIG[activeTab].columns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-bold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTab === "points" && pointsSummaryData && pointsSummaryData.length > 0 ? (
                <>
                  {pointsSummaryData.map((row, idx) => (
                    <tr
                      key={row.sr}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-all"
                    >
                      {TABLE_CONFIG.points.columns.map(col => (
                        <td key={col.key} className="px-4 py-2 text-white">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-800 border-t border-slate-700 font-bold">
                    <td className="px-4 py-2 text-white">{TABLE_CONFIG.points.totalLabel}</td>
                    <td className="px-4 py-2 text-white"></td>
                    <td className="px-4 py-2 text-white"></td>
                    <td className="px-4 py-2 text-white">{pointsTotals.playAmount || 0}</td>
                    <td className="px-4 py-2 text-white">{pointsTotals.winningAmount || 0}</td>
                    <td className="px-4 py-2 text-white">{pointsTotals.commission || 0}</td>
                    <td className="px-4 py-2 text-white">{pointsTotals.netAmount || 0}</td>
                  </tr>
                </>
              ) : activeTab === "points" && !loading ? (
                <tr>
                  <td colSpan={TABLE_CONFIG.points.columns.length} className="py-8 text-slate-400">No data. Click View.</td>
                </tr>
              ) : activeTab === "net" ? (
                <>
                  {netConfig.data.map((row, idx) => (
                    <tr
                      key={row.sr}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-all"
                    >
                      {netConfig.columns.map(col => (
                        <td key={col.key} className="px-4 py-2 text-white">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-slate-800 border-t border-slate-700 font-bold">
                    <td className="px-4 py-2 text-white">{netConfig.totalLabel}</td>
                    {netConfig.columns.slice(1).map(col => (
                      <td key={col.key} className="px-4 py-2 text-white">
                        {netTotals[col.key] !== undefined ? netTotals[col.key] : ""}
                      </td>
                    ))}
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopAccounts;
