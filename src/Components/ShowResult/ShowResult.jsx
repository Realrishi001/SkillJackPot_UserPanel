"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

// Slot-number animation for each cell
function SlotNumber({ value, delay = 0 }) {
  const [display, setDisplay] = useState(Math.floor(Math.random() * 9000 + 1000));
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
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
        fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
        letterSpacing: 1.5,
        color: "#fff",
        textShadow: "0 2px 6px #000d",
      }}
    >
      {display}
    </motion.div>
  );
}

// Generate numbers
function generateRandomNumbers(count) {
  return Array.from({ length: count }, () => Math.floor(1000 + Math.random() * 9000));
}

// Enhanced gold/glossy slot machine frame with lever
function CasinoSlotMachine({ rows, leverActive, onLeverPull, autoRefresh, setAutoRefresh, onManualRefresh, lastRefresh }) {
  return (
<div
  style={{
    position: "relative",
    width: "clamp(320px, 95vw, 1200px)",
    minHeight: "clamp(240px, 40vw, 480px)",
    background: "linear-gradient(135deg, #2a200a 0%, #181510 100%)",
    borderRadius: "clamp(18px, 4vw, 48px)",
    boxShadow: "0 12px 100px #000b, 0 0 25px #ffda9a55",
    border: "clamp(3px, 0.5vw, 6px) solid #ffd700",
    margin: "clamp(16px, 4vw, 32px) auto",
    overflow: "visible",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    border:'2px solid white',
  }}
>

      {/* Enhanced gold frame (outer) */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 44,
        border: "6px solid #fff3be99",
        boxShadow: "0 0 60px #ffd70070, inset 0 0 30px #ffd70020",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Enhanced decorative top lights */}
      <div style={{
        position: "absolute", top: -25, left: "12%", right: "12%", height: 35,
        display: "flex", justifyContent: "space-between", zIndex: 2,
      }}>
        {[...Array(11)].map((_,i)=>(
          <motion.div 
            key={i}
            animate={{
              boxShadow: [
                "0 0 15px #ffd700cc",
                "0 0 25px #ffd700ff",
                "0 0 15px #ffd700cc"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              background: `radial-gradient(circle at 70% 30%, #ffd700 70%, #f1b404 100%)`,
              border: "2.5px solid #fff8",
              opacity: 0.92,
            }} 
          />
        ))}
      </div>

      {/* Enhanced lever (right side) */}
      <motion.div
        animate={{ rotate: leverActive ? 62 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 8 }}
        style={{
          position: "absolute",
          right: -54,
          top: "50%",
          transform: "translateY(-50%)",
          width: 82,
          height: 56,
          zIndex: 7,
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <motion.div
          animate={{
            scale: leverActive ? [1, 1.2, 1] : 1,
            boxShadow: leverActive ? [
              "0 0 18px #ffd700b7",
              "0 0 35px #ffd700ff",
              "0 0 18px #ffd700b7"
            ] : "0 0 18px #ffd700b7",
            transition: { repeat: leverActive ? 2 : 0, duration: 0.8, repeatType: "reverse" }
          }}
          style={{
            width: 26,
            height: 26,
            background: "radial-gradient(circle at 75% 25%, #fff 13%, #ff5b5b 60%, #c00 100%)",
            borderRadius: "50%",
            border: "4px solid #FFD700",
          }}
        />
        <div
          style={{
            width: 40,
            height: 14,
            background: "linear-gradient(90deg,#fff3be 0%, #ffd700 50%, #b4890b 100%)",
            borderRadius: 7,
            marginLeft: 4,
            marginRight: 4,
            boxShadow: "0 0 12px #ffd70050",
            border: "1.5px solid #fff6",
          }}
        />
        <div
          style={{
            width: 18,
            height: 40,
            background: "linear-gradient(120deg,#fff3be 0%,#ffd700 80%,#b4890b 100%)",
            borderRadius: 12,
            border: "1.5px solid #ffd700aa",
            boxShadow: "0 0 10px #FFD70044",
          }}
        />
      </motion.div>

      {/* Main window (inside machine) - wider for horizontal layout */}
<div
  style={{
    position: "absolute",
    left: "clamp(8px, 3vw, 48px)",
    right: "clamp(8px, 3vw, 48px)",
    top: "clamp(10px, 5vw, 60px)",
    bottom: "clamp(10px, 5vw, 60px)",
    background: "radial-gradient(ellipse at 50% 50%, #181e26 65%, #242328 100%)",
    border: "clamp(2px, 0.3vw, 4px) solid #b4890b",
    borderRadius: "clamp(12px, 2.5vw, 32px)",
    boxShadow: "0 2px 32px #000b, inset 0 0 20px #ffd70010",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  }}
>


        {/* 3 rows of 10 columns each */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 5,
          }}
        >
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                width: "100%",
                display: "flex",
                gap: 12,
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
    borderRadius: "clamp(8px, 1.7vw, 18px)",
    boxShadow: "0 0 20px #ffd70025, inset 0 1px 0 #fff3",
    width: "clamp(38px, 7.5vw, 95px)",
    height: "clamp(32px, 6.5vw, 80px)",
    padding: "clamp(2px, 1vw, 6px)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }}
>


                  {/* Enhanced gloss effect */}
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
                  
                  {/* Number cell with enhanced gradient */}
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
                  
                  {/* Bottom shine */}
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

      {/* Enhanced shadow for depth */}
      <div style={{
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 16,
        height: 35,
        borderRadius: "0 0 40px 40px",
        background: "radial-gradient(ellipse at center, #000 60%, #0000 100%)",
        opacity: 0.3,
        filter: "blur(4px)",
        zIndex: 1,
      }} />

      {/* Enhanced controls */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -70,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 20,
          alignItems: "center",
          zIndex: 9,
        }}
      >

      </div>
    </div>
  );
}

// Main component
export default function ShowResult() {
  const [drawNumbers, setDrawNumbers] = useState(() => generateRandomNumbers(30));
  const [leverActive, setLeverActive] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");

  // Arrange numbers in 3 rows of 10 numbers each
  const rows = [[], [], []];
  drawNumbers.forEach((num, idx) => {
    rows[Math.floor(idx / 10)].push(num);
  });

  // Auto refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleManualRefresh();
    }, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [autoRefresh]);

  // Lever and refresh animation logic
  const handleManualRefresh = () => {
    if (leverActive) return;
    setLeverActive(true);
    setTimeout(() => {
      setDrawNumbers(generateRandomNumbers(30));
      setLeverActive(false);
      setLastRefresh(new Date().toLocaleTimeString());
    }, 1200); // lever animation before update
  };

  return (
    <div
      style={{
        minHeight: "fit",
        minWidth: "fit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ 
        width: "100%", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        zIndex: 2,
        padding: "20px"
      }}>
        <div style={{ margin: "0 auto"}}>
          <CasinoSlotMachine
            rows={rows}
            leverActive={leverActive}
            onLeverPull={handleManualRefresh}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            onManualRefresh={handleManualRefresh}
            lastRefresh={lastRefresh}
          />
        </div>
        
       
      </div>
    </div>
  );
}