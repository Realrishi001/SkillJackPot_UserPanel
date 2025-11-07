"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

/* ---------- Helpers ---------- */
function getBackendDrawTime(drawTime) {
  if (!drawTime) return drawTime;
  const [time, modifier] = drawTime.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
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
  const row1 = [],
    row2 = [],
    row3 = [];
  tickets.forEach((t) => {
    if (!t?.number) return;
    const prefix = Number(String(t.number).slice(0, 2));
    if (prefix >= 10 && prefix <= 19) row1.push(String(t.number));
    else if (prefix >= 30 && prefix <= 39) row2.push(String(t.number));
    else if (prefix >= 50 && prefix <= 59) row3.push(String(t.number));
  });
  const padAndSort = (row) => {
    const nums = row.filter(Boolean).sort((a, b) => Number(a) - Number(b));
    while (nums.length < 10) nums.push("");
    return nums;
  };
  return [padAndSort(row1), padAndSort(row2), padAndSort(row3)];
}

/* ---------- Slot Number Animation ---------- */
function SlotNumber({ value, delay = 0 }) {
  const isEmpty = !value;
  const [display, setDisplay] = useState(
    isEmpty ? "" : Math.floor(Math.random() * 9000 + 1000)
  );
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    if (isEmpty) {
      setDisplay("");
      setRolling(false);
      return;
    }
    let frame = 0;
    const animateRoll = () => {
      if (frame < 18) {
        setDisplay(Math.floor(Math.random() * 9000 + 1000));
        frame++;
        setTimeout(animateRoll, 19 + Math.random() * 26);
      } else {
        setDisplay(value);
        setRolling(false);
      }
    };
    setTimeout(animateRoll, delay);
  }, [value, delay, isEmpty]);

  return (
    <motion.div
      key={display}
      initial={{ y: -40, opacity: 0.3, scale: 1.05 }}
      animate={{ y: 0, opacity: 1, scale: rolling ? 1.08 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="font-mono font-bold text-white text-[clamp(0.9rem,2.2vw,1.25rem)] tracking-wider select-none"
      style={{
        textShadow: isEmpty ? "none" : "0 2px 5px #0009",
        opacity: isEmpty ? 0.25 : 1,
      }}
    >
      {display}
    </motion.div>
  );
}

/* ---------- Slot Machine Box ---------- */
function CasinoSlotMachine({ rows }) {
  return (
    <div className="relative flex justify-center items-center    md:w-[100%] max-w-[1100px]">
      <div
        className="rounded-2xl border-[3px] border-yellow-500 lg:w-[100%] sm:w-[90%] 
                   shadow-[0_2px_25px_#000a,inset_0_0_20px_#ffd70020]
                   bg-gradient-radial from-[#181e26] to-[#242328] p-3"
      >
        <div className="flex flex-col gap-[6px] items-center justify-center">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex gap-[6px] justify-center flex-wrap sm:flex-nowrap"
            >
              {row.map((num, j) => (
                <div
                  key={j}
                  className="flex justify-center items-center rounded-lg
                             border-[2px] border-yellow-400 shadow-[0_0_10px_#ffd70040_inset]
                             w-[clamp(50px,7vw,100px)] h-[clamp(32px,5vw,42px)] 
                             sm:w-[clamp(40px,6vw,100px)] sm:h-[clamp(36px,5vw,42px)]
                             overflow-hidden"
                  style={{
                    background: [
                      "linear-gradient(135deg,#25e37b,#067269)",
                      "linear-gradient(135deg,#32aaff,#1725ed)",
                      "linear-gradient(135deg,#b267fa,#6c23ed)",
                      "linear-gradient(135deg,#f5a242,#ea580c)",
                      "linear-gradient(135deg,#ec4899,#be185d)",
                      "linear-gradient(135deg,#00d2d3,#098790)",
                      "linear-gradient(135deg,#ef4444,#dc2626)",
                      "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                      "linear-gradient(135deg,#06b6d4,#0891b2)",
                      "linear-gradient(135deg,#10b981,#059669)",
                    ][j % 10],
                  }}
                >
                  <SlotNumber value={num} delay={i * 150 + j * 50} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function ShowResult({ drawTime }) {
  const [ticketNumbers, setTicketNumbers] = useState([[], [], []]);
  const [gameId, setGameId] = useState("-");

  useEffect(() => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      setGameId(payload?.id || "-");
    } catch {
      setGameId("-");
    }
  }, []);

  useEffect(() => {
    if (!drawTime || gameId === "-") return;
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
        const [s10, s30, s50] = getSeriesRows(tickets);
        setTicketNumbers([s10, s30, s50]);
      })
      .catch(() => {
        setTicketNumbers([
          Array(10).fill(""),
          Array(10).fill(""),
          Array(10).fill(""),
        ]);
      });
  }, [drawTime, gameId]);

  return (
    <div
      className="flex flex-col md:flex-row justify-center md:justify-between items-center 
                 w-full px-4 md:px-10 py-6 gap-6 md:gap-10
                 md:space-x-6 lg:space-x-10"
    >
      {/* Left Logo */}
      <div className="flex justify-center md:justify-end items-center w-full md:w-[20%]">
        <img
          src="/logo.png"
          alt="Skill King"
          className="w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] h-auto 
                     drop-shadow-[0_0_12px_#000a] transition-all duration-300"
        />
      </div>

      {/* Right Slot Box */}
      <CasinoSlotMachine rows={ticketNumbers} />
    </div>
  );
}
