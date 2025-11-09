"use client";

import React, { useState, useEffect, useRef } from "react";
import { Printer, Search, Calendar, Ticket, Filter, Home } from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

const entryOptions = [10, 20, 50, 100];

/* 🧠 Helper to get loginId from JWT in localStorage */
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

function generatePrintReceipt(data, ticketId) {
  const lineHeight = 4;
  const ticketArray = (data.ticketNumber || "").split(", ").filter(Boolean);
  const ticketRows = Math.ceil(ticketArray.length / 3);

  const afterListLineGap = 5;
  const totalsBlock = 5 + 5 + 8;
  const barcodeBlock = 20 + 10;

  let requiredHeight =
    50 +
    ticketRows * lineHeight +
    afterListLineGap +
    totalsBlock +
    barcodeBlock;

  const pageHeight = Math.max(297, requiredHeight);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, pageHeight],
  });

  pdf.setFontSize(10);
  pdf.text("Skill Jackpot", 40, 10, { align: "center" });
  pdf.setFontSize(8);
  pdf.text("This game for Adults Amusement Only", 40, 15, { align: "center" });
  pdf.text("GST No Issued by Govt of India", 40, 20, { align: "center" });
  pdf.text("GST No: In Process", 40, 25, { align: "center" });
  pdf.text(`Date: ${data.gameTime}`, 40, 30, { align: "center" });

  pdf.setLineWidth(0.5);
  pdf.line(5, 33, 75, 33);

  pdf.setFontSize(9);
  const drawTimeText = Array.isArray(data.drawTime)
    ? data.drawTime.length > 1
      ? `Draw Times: ${data.drawTime.join(", ")}`
      : `Draw Time: ${data.drawTime[0]}`
    : `Draw Time: ${data.drawTime}`;
  pdf.text(drawTimeText, 5, 38);
  pdf.text(`Login Id: ${data.loginId || "-"}`, 5, 43);

  pdf.line(5, 45, 75, 45);

  let yPos = 50;
  for (let i = 0; i < ticketArray.length; i += 3) {
    let rowText = "";
    for (let j = 0; j < 3 && i + j < ticketArray.length; j++) {
      const ticket = ticketArray[i + j];
      const formattedTicket = ticket.substring(0, 18);
      rowText += formattedTicket.padEnd(25, " ");
    }
    pdf.setFontSize(7);
    pdf.text(rowText.trim(), 5, yPos);
    yPos += lineHeight;
  }

  pdf.line(5, yPos, 75, yPos);
  yPos += 5;

  pdf.setFontSize(10);
  pdf.text(`Total Quantity : ${data.totalQuatity}`, 5, yPos);
  yPos += 5;
  pdf.text(`Total Amount : ${data.totalPoints}`, 5, yPos);
  yPos += 8;

  /* ✅ Barcode Section — Only ticketNo */
  const barcodeValue = `${ticketId}`; // only the ticket id in barcode

  const canvas = document.createElement("canvas");
  JsBarcode(canvas, barcodeValue, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: false, // hide text below barcode
    margin: 5,
  });

  const barcodeImage = canvas.toDataURL("image/png");
  pdf.addImage(barcodeImage, "PNG", 10, yPos, 60, 20);

  yPos += 28;

  // ✅ Show Ticket No text below barcode
  pdf.setFontSize(12);
  pdf.text(`Ticket No: ${ticketId}`, 40, yPos, { align: "center" });

  pdf.autoPrint();
  const pdfBlob = pdf.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl);
  if (printWindow) {
    printWindow.onload = function () {
      printWindow.print();
    };
  } else {
    toast.error("Please allow pop-ups to print the ticket.");
  }
}

/* 🎟️ Main Page */
const ReprintPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEntries, setShowEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const isPrintingRef = useRef(false);

  /* 🔹 Fetch today’s tickets for this admin */
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const loginId = getLoginIdFromToken();
      if (!loginId) return toast.error("User not logged in.");

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reprint-tickets`,
        { loginId }
      );

      if (res.data?.data?.length > 0) {
        setTickets(res.data.data);
      } else {
        setTickets([]);
        toast("No tickets found for today.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /* 🔹 Print a specific ticket */
  const handlePrint = (ticket) => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    setIsPrinting(true);

    try {
      toast.success(`Printing Ticket #${ticket.ticketNo}`);

      const loginId = getLoginIdFromToken();

generatePrintReceipt(
  {
    gameTime: `${ticket.gameDate} ${ticket.gameTime}`,
    drawTime: ticket.drawTime,
    loginId: getLoginIdFromToken(),
    ticketNumber: ticket.ticketNumber,
    totalQuatity: ticket.totalQuatity,
    totalPoints: ticket.totalPoints,
  },
  ticket.ticketNo
);

    } catch (error) {
      toast.error("Error while printing ticket.");
      console.error(error);
    } finally {
      isPrintingRef.current = false;
      setIsPrinting(false);
    }
  };

  /* 🔎 Search Filter */
  const filtered = tickets.filter((row) => {
    if (!search.trim()) return true;
    return (
      String(row.ticketNo).toLowerCase().includes(search.toLowerCase()) ||
      String(row.gameTime).toLowerCase().includes(search.toLowerCase()) ||
      String(row.gameDate).toLowerCase().includes(search.toLowerCase())
    );
  });

  /* 📄 Pagination */
  const totalPages = Math.ceil(filtered.length / showEntries);
  const startIdx = (current - 1) * showEntries;
  const showData = filtered.slice(startIdx, startIdx + showEntries);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-6 px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-all duration-150 hover:from-blue-700 hover:to-purple-700"
        >
          <Home className="w-5 h-5" />
          Home
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
          Reprint Tickets
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-10"></div>

        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          {/* 🔍 Search Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrent(1);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900/80 text-white border border-slate-600/50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 w-72"
                placeholder="Search ticket/date/time..."
              />
            </div>
            <div>
              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-lime-600 rounded-lg text-white font-semibold shadow hover:scale-105 transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* 📋 Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-600/50">
            <table className="min-w-full text-left bg-slate-800/50 text-white">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Ticket No</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Game Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Game Time</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Draw Time</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Points</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200">Quantity</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-200 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Loading tickets...
                    </td>
                  </tr>
                ) : showData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  showData.map((row) => (
                    <tr key={row.ticketNo} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-blue-400 font-mono">{row.ticketNo}</td>
                      <td className="px-6 py-4">{row.gameDate}</td>
                      <td className="px-6 py-4">{row.gameTime}</td>
                      <td className="px-6 py-4">{Array.isArray(row.drawTime) ? row.drawTime.join(", ") : row.drawTime}</td>
                      <td className="px-6 py-4 text-green-400 font-bold">{row.totalPoints}</td>
                      <td className="px-6 py-4 text-yellow-300 font-bold">{row.totalQuatity}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handlePrint(row)}
                          disabled={isPrinting}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                            isPrinting
                              ? "bg-slate-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          } text-white text-sm font-semibold shadow-lg transition-all duration-200`}
                        >
                          <Printer className="w-4 h-4" />
                          {isPrinting ? "Printing..." : "Print"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 📄 Pagination Footer */}
          <div className="flex justify-between items-center mt-6 text-slate-400 text-sm">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-200">
                {startIdx + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-200">
                {Math.min(startIdx + showEntries, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-200">{filtered.length}</span> entries
            </div>
            <div className="flex items-center gap-3">
              <span>Show</span>
              <select
                value={showEntries}
                onChange={(e) => {
                  setShowEntries(Number(e.target.value));
                  setCurrent(1);
                }}
                className="px-2 py-1 rounded bg-slate-900 text-white border border-slate-600"
              >
                {entryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReprintPage;
