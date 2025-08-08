"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// ------- Helpers ----------
function getBackendDrawTime(drawTime) {
  if (!drawTime) return drawTime;
  const [time, modifier] = drawTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);
  dt.setMinutes(dt.getMinutes() - 15);

  let outHours = dt.getHours();
  let outMinutes = dt.getMinutes();
  const outModifier = outHours >= 12 ? "PM" : "AM";
  if (outHours === 0) outHours = 12;
  else if (outHours > 12) outHours -= 12;
  const minStr = outMinutes < 10 ? "0" + outMinutes : outMinutes;

  return `${outHours}:${minStr} ${outModifier}`;
}

function getSeriesRows(tickets) {
  const row1 = [];
  const row2 = [];
  const row3 = [];
  tickets.forEach((t) => {
    if (!t || !t.number) return;
    const prefix = Number(String(t.number).slice(0, 2));
    if (prefix >= 10 && prefix <= 19) row1.push(String(t.number));
    else if (prefix >= 30 && prefix <= 39) row2.push(String(t.number));
    else if (prefix >= 50 && prefix <= 59) row3.push(String(t.number));
  });
  function padAndSort(row) {
    const nums = row.filter(x => x !== "").sort((a, b) => Number(a) - Number(b));
    while (nums.length < 10) nums.push("");
    return nums;
  }
  return [padAndSort(row1), padAndSort(row2), padAndSort(row3)];
}

// ------- Slot-number Animation -----------
function SlotNumber({ value, delay = 0 }) {
  const isEmpty = value === "" || value === null || value === undefined;
  const [display, setDisplay] = useState(isEmpty ? "" : Math.floor(Math.random() * 9000 + 1000));
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    if (isEmpty) {
      setDisplay("");
      setRolling(false);
      return;
    }
    let timeout;
    let frame = 0;
    function animateRoll() {
      if (frame < 18) {
        setDisplay(Math.floor(Math.random() * 9000 + 1000));
        frame++;
        timeout = setTimeout(animateRoll, 19 + Math.random() * 26);
      } else {
        setDisplay(value);
        setRolling(false);
      }
    }
    timeout = setTimeout(animateRoll, delay);
    return () => clearTimeout(timeout);
  }, [value, delay, isEmpty]);

  return (
    <motion.div
      key={display}
      initial={{ y: -50, opacity: 0.2, scale: 1.06 }}
      animate={{ y: 0, opacity: 1, scale: rolling ? 1.08 : 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 45,
        duration: 0.14,
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontFamily: "monospace",
        fontSize: "clamp(1.1rem, 3vw, 1.2rem)",
        letterSpacing: 1.5,
        color: isEmpty ? "#aaa" : "#fff",
        textShadow: isEmpty ? "none" : "0 2px 6px #000d",
        opacity: isEmpty ? 0.18 : 1,
      }}
    >
      {display}
    </motion.div>
  );
}

// ------- UI Chips -----------
function LeftGameId({ gameId }) {
  return (
    <div className="flex flex-col items-start w-full md:w-auto mb-4 md:mb-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-700/50 text-xs font-semibold text-white shadow">
        Game ID: <span className="font-mono text-purple-400">{gameId}</span>
      </div>
    </div>
  );
}
function RightGameInfo({ lastPoints, lastTicket, balance }) {
  return (
    <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-700/50 text-xs text-white shadow">
        Last Points: <span className="font-mono text-purple-400">{lastPoints} pts</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-700/50 text-xs text-white shadow">
        Last Ticket: <span className="font-mono text-purple-400">{lastTicket}</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-700/50 text-xs text-white shadow">
        Limit: <span className="font-mono text-purple-400">{balance}</span>
      </div>
    </div>
  );
}

// ---------- Slot Machine UI -----------
function CasinoSlotMachine({ rows }) {
  return (
    <div
      style={{
        position: "relative",
        width: "clamp(320px, 95vw, 1200px)",
        minHeight: "clamp(140px, 40vw, 180px)",
        borderRadius: "clamp(18px, 4vw, 48px)",
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          background: "radial-gradient(ellipse at 50% 50%, #181e26 65%, #242328 100%)",
          border: "clamp(2px, 0.3vw, 4px) solid #b4890b",
          borderRadius: "clamp(12px, 2.5vw, 10px)",
          boxShadow: "0 2px 32px #000b, inset 0 0 20px #ffd70010",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4,
          padding: 10,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%", 
            display: "flex",
            flexDirection: "column",
            gap: 5,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            zIndex: 5,
          }}
        >
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                minWidth: "max-content",
                display: "flex",
                gap: 5,
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              {row.map((num, colIdx) => (
                <div
                  key={colIdx}
                  style={{
                    background: "linear-gradient(120deg, #efe3be 10%, #e7b100 90%)",
                    border: "clamp(1.5px, 0.25vw, 3px) solid #ffd700",
                    borderRadius: "clamp(8px, 1.7vw, 10px)",
                    boxShadow: "0 0 20px #ffd70025, inset 0 1px 0 #fff3",
                    width: "clamp(38px, 7.5vw, 75px)",
                    height: "clamp(32px, 6.5vw, 40px)",
                    padding: "clamp(0, 0, 1px)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 10,
                      right: 10,
                      height: 12,
                      background: "linear-gradient(90deg,#fff9 15%,#fff5 60%,#fff0 95%)",
                      borderRadius: "8px",
                      opacity: 0.25,
                      filter: "blur(1px)",
                      zIndex: 2,
                    }}
                  />
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      background: [
                        "linear-gradient(135deg, #25e37b 0%, #067269 100%)",
                        "linear-gradient(135deg, #32aaff 0%, #1725ed 100%)",
                        "linear-gradient(135deg, #b267fa 0%, #6c23ed 100%)",
                        "linear-gradient(135deg, #f5a242 0%, #ea580c 100%)",
                        "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                        "linear-gradient(135deg, #00d2d3 0%, #098790 100%)",
                        "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      ][colIdx % 10],
                      boxShadow: "0 2px 12px #00000030, inset 0 1px 0 #ffffff20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 3,
                    }}
                  >
                    <SlotNumber value={num} delay={rowIdx * 150 + colIdx * 50} />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 6,
                      right: 6,
                      bottom: 6,
                      height: 8,
                      background: "linear-gradient(90deg, #fff4 15%, #fff0 95%)",
                      borderRadius: "6px",
                      opacity: 0.18,
                      filter: "blur(1.2px)",
                      zIndex: 1,
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ----------- Main Component --------------
export default function ShowResult({ drawTime }) {
  const [ticketNumbers, setTicketNumbers] = useState([]);
  const [leverActive, setLeverActive] = useState(false);

  // Game Info States
  const [gameId, setGameId] = useState("-");
  const [lastPoints, setLastPoints] = useState("-");
  const [lastTicket, setLastTicket] = useState("-");
  const [balance, setBalance] = useState("-");

  // Game ID from JWT
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("userToken");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.id) setGameId(payload.id);
        }
      } catch (err) {
        setGameId("-");
      }
    }
  }, []);

  // Fetch Points/Ticket/Limit
  useEffect(() => {
    if (gameId && gameId !== "-") {
      axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/navbar-details`, { loginId: gameId })
        .then(res => {
          setLastPoints(res.data.lastTotalPoint ?? "-");
          setLastTicket(res.data.lastTicketNumber ?? "-");
          setBalance(res.data.balance ?? "-");
        })
        .catch(() => {
          setLastPoints("-");
          setLastTicket("-");
          setBalance("-");
        });
    }
  }, [gameId]);

  useEffect(() => {
    axios
      .post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/get-winning-numbers`, {
        drawTime: getBackendDrawTime(drawTime),
        adminId: gameId,
      })
      .then((res) => {
        let tickets = [];
        if (Array.isArray(res.data.selectedTickets)) {
          tickets = res.data.selectedTickets;
        } else if (res.data.numbersBySeries) {
          tickets = Object.values(res.data.numbersBySeries).flat();
        }
        const [series10, series30, series50] = getSeriesRows(tickets);
        setTicketNumbers([series10, series30, series50]);
      })
      .catch((err) => {
        setTicketNumbers([
          Array(10).fill(""),
          Array(10).fill(""),
          Array(10).fill(""),
        ]);
      });
  }, [drawTime]);

  const handleManualRefresh = () => {
    if (leverActive) return;
    setLeverActive(true);
    setTicketNumbers((prev) => [...prev]);
    setTimeout(() => setLeverActive(false), 1200);
  };

  const rows = ticketNumbers.length === 3 ? ticketNumbers : [[], [], []];

  return (
    <div className="w-full px-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 ">
      {/* LEFT: Game ID */}
      <div className="w-full md:w-auto flex justify-center ">
        <LeftGameId gameId={gameId} />
      </div>
      {/* CENTER: Slot Machine */}
      <div className="w-full md:max-w-2xl flex justify-center">
        <CasinoSlotMachine rows={rows} />
      </div>
      {/* RIGHT: Points, Ticket, Limit */}
      <div className="w-full md:w-auto flex justify-center md:justify-start">
        <RightGameInfo lastPoints={lastPoints} lastTicket={lastTicket} balance={balance} />
      </div>
    </div>
  );
}
