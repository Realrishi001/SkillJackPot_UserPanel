"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

// Slot-number animation for each cell
function SlotNumber({ value, delay = 0 }) {
  const [display, setDisplay] = useState(value === "" ? "" : Math.floor(Math.random() * 9000 + 1000));
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    if (value === "") {
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
  }, [value, delay]);

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
        color: value === "" ? "#aaa" : "#fff",
        textShadow: value === "" ? "none" : "0 2px 6px #000d",
        opacity: value === "" ? 0.18 : 1,
      }}
    >
      {display}
    </motion.div>
  );
}

// Slot Machine UI as before
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
                width: "100%",
                display: "flex",
                gap: 5,
                alignItems: "center",
                justifyContent: "center",
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

// Main component
export default function ShowResult({drawTime}) {
  const [ticketNumbers, setTicketNumbers] = useState([]);
  const [leverActive, setLeverActive] = useState(false);


  function getBackendDrawTime(drawTime) {
  if (!drawTime) return drawTime;

  const [time, modifier] = drawTime.split(' '); // e.g., "3:00 PM"
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);

  // Subtract 15 minutes
  dt.setMinutes(dt.getMinutes() - 15);

  // Format back to "hh:mm AM/PM"
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


  // Fetch and split numbers by series
useEffect(() => {
  axios
    .post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/get-winning-numbers`, {
      drawTime: getBackendDrawTime(drawTime),
      adminId: 1,
    })
    .then((res) => {
      const nb = res.data.numbersBySeries || {};
      const series10 = (nb["10"] || []).map((t) => t.number ?? "");
      const series30 = (nb["30"] || []).map((t) => t.number ?? "");
      const series50 = (nb["50"] || []).map((t) => t.number ?? "");

      while (series10.length < 10) series10.push("");
      while (series30.length < 10) series30.push("");
      while (series50.length < 10) series50.push("");

      setTicketNumbers([series10, series30, series50]);
    })
    .catch(() => {
      setTicketNumbers([
        Array(10).fill(""),
        Array(10).fill(""),
        Array(10).fill(""),
      ]);
    });
}, [drawTime]);


  // "Lever" - just re-triggers animation, not fetching new numbers
  const handleManualRefresh = () => {
    if (leverActive) return;
    setLeverActive(true);
    // Re-render, triggers SlotNumber animation due to key/val changes
    setTicketNumbers((prev) => [...prev]);
    setTimeout(() => setLeverActive(false), 1200);
  };

  // Prepare rows for UI: [row1, row2, row3] - each is 10 items
  const rows = ticketNumbers.length === 3 ? ticketNumbers : [[], [], []];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        position: "relative",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
          margin: 0,
          padding: 0,
        }}
      >
        <div style={{ margin: 0, padding: 0 }}>
          <CasinoSlotMachine rows={rows} leverActive={leverActive} onLeverPull={handleManualRefresh} />
        </div>
        
      </div>
    </div>
  );
}
