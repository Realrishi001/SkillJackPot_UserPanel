"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  Play,
  RotateCcw,
  Printer,
  Zap,
  TrendingUp,
  Target,
} from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import ShowResult from "../../Components/ShowResult/ShowResult";
import { FP_SETS } from "../../data/fpSets";
import axios from "axios";
import { DRAW_TIMES } from "../../data/drawTimes";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import AdvanceDrawModal from "../../Components/AdvanceDrawModal/AdvanceDrawModal.jsx";
import TicketStatusModal from '../../Components/TicketStatusModal/TicketStatusModal.jsx'
import { useRouter } from "next/navigation.js";


// Helper for number ranges
const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, k) => k + start);

const numberBoxColors = [
  "bg-gradient-to-r from-red-400 to-red-600",
  "bg-gradient-to-r from-orange-400 to-orange-500",
  "bg-gradient-to-r from-pink-400 to-pink-500",
  "bg-gradient-to-r from-yellow-200 to-yellow-400",
  "bg-gradient-to-r from-cyan-400 to-blue-400",
  "bg-gradient-to-r from-yellow-400 to-yellow-500",
  "bg-gradient-to-r from-blue-400 to-blue-700",
  "bg-gradient-to-r from-gray-400 to-gray-500",
  "bg-gradient-to-r from-green-300 to-green-500",
  "bg-gradient-to-r from-red-400 to-red-600",
];

const allNumbers = [
  range(10, 19), // Col 1
  range(30, 39), // Col 2
  range(50, 59), // Col 3
];

const isOdd = (n) => n % 2 === 1;
const isEven = (n) => n % 2 === 0;
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

// --- Timer & Date Helpers --- //
function getTodayDateString() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${d.toLocaleString("en", {
    month: "short",
  })} ${d.getFullYear()}`;
}

function parseTimeToToday(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );
}

// draw point function
function getNextDrawSlot(drawTimes) {
  const now = new Date();
  const timeObjects = drawTimes.map((timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );
  });

  for (let i = 0; i < timeObjects.length; i++) {
    if (now < timeObjects[i]) {
      return drawTimes[i];
    }
  }
  return drawTimes[0]; // First slot of next day
}

function getRemainTime() {
  if (typeof window === "undefined") return 0;

  const nextSlot = getNextDrawSlot(DRAW_TIMES); // e.g., "3:00 PM"
  const now = new Date();
  const nextSlotDate = parseTimeToToday(nextSlot);

  // If the current time has passed the slot, assume next day
  if (now > nextSlotDate) {
    nextSlotDate.setDate(nextSlotDate.getDate() + 1);
  }

  const remainMs = nextSlotDate - now;
  return Math.max(0, Math.floor(remainMs / 1000)); // in seconds
}

function setTimerEnd(secs) {
  localStorage.setItem(TIMER_KEY, Date.now() + secs * 1000);
}

export default function Page() {
  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem("userToken")) {
      router.push("/");
    }
  }, []);

  const [selected, setSelected] = useState(
    Array(10)
      .fill(null)
      .map(() => Array(3).fill(false))
  );
  const [activeFilter, setActiveFilter] = useState(null);

  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [activeColFilter, setActiveColFilter] = useState(null);

  const [gameIdBox, setGameIdBox] = useState("-");
  const [lastPoints, setLastPoints] = useState("-");
  const [lastTicket, setLastTicket] = useState("-");
  const [balance, setBalance] = useState("-");

  const isPrintingRef = useRef(false);

  const [ticketStatusModalOpen, setTicketStatusModalOpen] = useState(false);
  const [ticketStatusData, setTicketStatusData] = useState(null);
  const [isClaimable, setIsClaimable] = useState(false);


  // Constant Quantity and Points for demo (change values as needed)
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [points, setPoints] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const totalQuantity = quantities.reduce((a, b) => a + b, 0);
  const totalPoints = points.reduce((a, b) => a + b, 0);
  const [isFPMode, setIsFPMode] = useState(false);
  const [activeFPSetIndex, setActiveFPSetIndex] = useState(null);
  const [currentDrawSlot, setCurrentDrawSlot] = useState(() =>
    getNextDrawSlot(DRAW_TIMES)
  );
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceDrawTimes, setAdvanceDrawTimes] = useState([]);

  const COLS = 10,
    ROWS = 10;

  const [columnHeaders, setColumnHeaders] = useState(Array(COLS).fill(""));
  const [rowHeaders, setRowHeaders] = useState(Array(ROWS).fill(""));
  const [grid, setGrid] = useState(
    Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(""))
  );
  const [cellOverrides, setCellOverrides] = useState({});
  const [showAdvanceDrawModal, setShowAdvanceDrawModal] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const [transactionInput, setTransactionInput] = useState("");
  const [activeFButtons, setActiveFButtons] = useState([]); // Example: ["10-19", "30-39"]

  const [allFColumnsSelected, setAllFColumnsSelected] = useState(false);
  const [activeNumberBox, setActiveNumberBox] = useState({
    row: null,
    col: null,
  });

  const [activeCheckbox, setActiveCheckbox] = useState(null);
  const [checkboxInputs, setCheckboxInputs] = useState({});
  const [activeColGroup, setActiveColGroup] = useState(null);

  // ---- Per-number persistence ----
  const LS_KEY = "sjTicketsV1";

  const [storeByNum, setStoreByNum] = useState({}); // { [num]: { columnHeader: string[10], rowHeader: string[10], tickets: { "num-xx": "val" } } }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setStoreByNum(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(storeByNum));
    } catch {}
  }, [storeByNum]);

  function ensureSlot(num) {
    return (
      storeByNum[num] || {
        columnHeader: Array(10).fill(""),
        rowHeader: Array(10).fill(""),
        tickets: {},
      }
    );
  }

  function expandHeaderTickets(num, cols, rows) {
    const out = {};

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const rv = rows[r]; // "", "3", etc.
        const cv = cols[c]; // "", "4", etc.

        if (rv || cv) {
          const rNum = parseInt(rv || "0", 10);
          const cNum = parseInt(cv || "0", 10);

          // both -> sum; otherwise whichever exists
          const valNum = rv && cv ? rNum + cNum : rv ? rNum : cNum;

          if (!Number.isNaN(valNum) && valNum > 0) {
            const idx = String(r * 10 + c).padStart(2, "0");
            out[`${num}-${idx}`] = String(valNum);
          }
        }
      }
    }

    return out;
  }

  function buildTicketsForNumber(num, cols, rows, checkboxMap) {
    // base: headers (rows+cols; intersection summed)
    const tickets = { ...expandHeaderTickets(num, cols, rows) };

    // add per-cell inputs ON TOP of headers
    if (checkboxMap) {
      Object.entries(checkboxMap).forEach(([cellIndex, v]) => {
        if (v !== "" && v !== "0" && v != null) {
          const idx = String(cellIndex).padStart(2, "0");
          const r = Math.floor(parseInt(cellIndex, 10) / 10);
          const c = parseInt(cellIndex, 10) % 10;

          const rv = rows[r];
          const cv = cols[c];
          const rNum = parseInt(rv || "0", 10);
          const cNum = parseInt(cv || "0", 10);
          const headerSum = (rv ? rNum : 0) + (cv ? cNum : 0);

          const manual = parseInt(v || "0", 10);
          const total = manual + headerSum;

          tickets[`${num}-${idx}`] = String(total);
        }
      });
    }
    return tickets;
  }

  function persistActiveNumber(num) {
    if (!num) return;
    setStoreByNum((prev) => {
      const slot = ensureSlot(num);
      const mergedTickets = buildTicketsForNumber(
        num,
        columnHeaders,
        rowHeaders,
        checkboxInputs[num] || {}
      );
      return {
        ...prev,
        [num]: {
          columnHeader: [...columnHeaders],
          rowHeader: [...rowHeaders],
          tickets: mergedTickets,
        },
      };
    });
  }

  function loadNumberIntoUI(num) {
    const slot = ensureSlot(num);

    // 1) restore this number's headers into the inputs
    const cols = slot.columnHeader || Array(10).fill("");
    const rows = slot.rowHeader || Array(10).fill("");
    setColumnHeaders(cols);
    setRowHeaders(rows);

    // 2) rebuild the per-cell "manual" map from tickets:
    // manual = ticketTotal - (rowHeader + colHeader at that cell)
    const manualMap = {};
    Object.entries(slot.tickets || {}).forEach(([k, v]) => {
      // k = "50-11" -> "11"
      const idxStr = k.split("-")[1];
      if (!idxStr) return;

      const idx = parseInt(idxStr, 10);
      if (Number.isNaN(idx)) return;

      const r = Math.floor(idx / 10);
      const c = idx % 10;

      const rNum = parseInt(rows[r] || "0", 10);
      const cNum = parseInt(cols[c] || "0", 10);
      const headerSum = (rows[r] ? rNum : 0) + (cols[c] ? cNum : 0);

      const total = parseInt(String(v) || "0", 10);
      const manual = total - headerSum;

      if (!Number.isNaN(manual) && manual > 0) {
        manualMap[idx] = String(manual);
      }
    });

    // 3) push manual map for this number (used by getCellValue)
    setCheckboxInputs((prev) => ({ ...prev, [num]: manualMap }));
  }

  const updatedQuantity = range(0, 9).map((rowIndex) => {
    let total = 0;

    // For this visible row, add up the tickets for any selected numbers (10/30/50 columns)
    for (let colIdx = 0; colIdx < 3; colIdx++) {
      if (!selected[rowIndex][colIdx]) continue;

      const num = allNumbers[colIdx][rowIndex];
      const tickets = (storeByNum[num] && storeByNum[num].tickets) || {};

      for (const key in tickets) {
        // key looks like "50-23"
        const parts = key.split("-");
        if (parts.length !== 2) continue;

        const idx = parseInt(parts[1], 10);
        if (Number.isNaN(idx)) continue;

        const r = Math.floor(idx / 10);
        const c = idx % 10;

        // respect Odd/Even disabled cells
        if (isCellDisabled(r, c)) continue;

        const n = parseInt(tickets[key], 10);
        if (!Number.isNaN(n) && n > 0) {
          total += n;
        }
      }
    }

    return total;
  });

  const updatedPoints = updatedQuantity.map((q) => q * 2);

  function toggleNumberBox(row, col) {
    setActiveNumberBox({ row, col });
  }

  const focusCell = (r, c) => {
    if (r < 0 || r > 9 || c < 0 || c > 9) return;
    const el = inputRefs.current?.[r]?.[c];
    if (el) {
      el.focus();
      requestAnimationFrame(() => {
        try {
          el.select();
        } catch {}
      });
    }
  };

  function getNumsForGroup(group) {
    if (group === "10-19") return allNumbers[0];
    if (group === "30-39") return allNumbers[1];
    if (group === "50-59") return allNumbers[2];
    if (group === "ALL")
      return [...allNumbers[0], ...allNumbers[1], ...allNumbers[2]];
    return [];
  }

  function selectByTypeFilter(type) {
    // type: "all" | "odd" | "even"
    setSelected((prev) => {
      return prev.map((rowArr, row) =>
        rowArr.map((_, col) => {
          const num = allNumbers[col][row];
          if (type === "all") return true;
          if (type === "odd") return num % 2 === 1;
          if (type === "even") return num % 2 === 0;
          return false;
        })
      );
    });
    setActiveCheckbox(null);
    setActiveColGroup(null);
  }

  function selectAllInColumn(colIdx) {
    setSelected((prev) => {
      const updated = prev.map((rowArr) =>
        rowArr.map((checked, cIdx) => (cIdx === colIdx ? true : checked))
      );

      // Update quantities and points based on new selection
      const newQuantities = updated.map((row) => row.filter(Boolean).length);
      const newPoints = newQuantities.map((q) => q * 2);

      setQuantities(newQuantities);
      setPoints(newPoints);

      return updated;
    });
  }
  function clearFPHighlights() {
    // Remove highlight class from all cells
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const numStr = String(row * 10 + col).padStart(2, "0");
        // You can use refs or direct DOM manipulation here
        const element = document.querySelector(`[data-index="${numStr}"]`);
        if (element) {
          element.classList.remove("fp-highlight");
        }
      }
    }
  }

  function highlightFPSet(setIndex) {
    // First clear any existing highlights
    clearFPHighlights();

    if (setIndex === -1 || setIndex === null) return;

    // Highlight all cells in the FP set
    FP_SETS[setIndex].forEach((numStr) => {
      const element = document.querySelector(`[data-index="${numStr}"]`);
      if (element) {
        element.classList.add("fp-highlight");
      }
    });
  }
  // kind: "grid" | "colHeader" | "rowHeader"
  const handleArrowNav = (e, kind, row, col) => {
    const k = e.key;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k))
      return;

    const focusGrid = (r, c) => {
      const target = document.querySelector(
        `input[data-grid-cell="1"][data-row="${r}"][data-col="${c}"]`
      );
      if (target && !target.disabled) {
        e.preventDefault();
        target.focus();
        requestAnimationFrame(() => {
          try {
            target.select();
          } catch {}
        });
        return true;
      }
      return false;
    };

    const focusColHeader = (c) => {
      const target = document.querySelector(
        `input[data-colheader="1"][data-col="${c}"]`
      );
      if (target) {
        e.preventDefault();
        target.focus();
        requestAnimationFrame(() => {
          try {
            target.select();
          } catch {}
        });
        return true;
      }
      return false;
    };

    const focusRowHeader = (r) => {
      const target = document.querySelector(
        `input[data-rowheader="1"][data-row="${r}"]`
      );
      if (target) {
        e.preventDefault();
        target.focus();
        requestAnimationFrame(() => {
          try {
            target.select();
          } catch {}
        });
        return true;
      }
      return false;
    };

    // --- Behavior by origin ---
    if (kind === "grid") {
      // move within grid
      if (k === "ArrowRight") {
        if (col < 9 && focusGrid(row, col + 1)) return;
        if (col === 0 && focusRowHeader(row)) return; // (optional) jump back to row header with Left from col 0
      }
      if (k === "ArrowLeft") {
        if (col > 0 && focusGrid(row, col - 1)) return;
        if (col === 0 && focusRowHeader(row)) return;
      }
      if (k === "ArrowDown") {
        if (row < 9 && focusGrid(row + 1, col)) return;
      }
      if (k === "ArrowUp") {
        if (row > 0 && focusGrid(row - 1, col)) return;
        if (row === 0 && focusColHeader(col)) return; // go to top header at same col
      }
      return;
    }

    if (kind === "colHeader") {
      // top headers: Left/Right across headers; Down into grid row 0
      if (k === "ArrowLeft") {
        if (col > 0 && focusColHeader(col - 1)) return;
      }
      if (k === "ArrowRight") {
        if (col < 9 && focusColHeader(col + 1)) return;
      }
      if (k === "ArrowDown") {
        if (focusGrid(0, col)) return;
      }
      // Up from headers: do nothing
      return;
    }

    if (kind === "rowHeader") {
      // left headers: Up/Down across headers; Right into grid col 0
      if (k === "ArrowUp") {
        if (row > 0 && focusRowHeader(row - 1)) return;
      }
      if (k === "ArrowDown") {
        if (row < 9 && focusRowHeader(row + 1)) return;
      }
      if (k === "ArrowRight") {
        if (focusGrid(row, 0)) return;
      }

      return;
    }
  };

const handleCheckTicketStatus = async (ticketNumber) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/is-claim-tickets`,
      { ticketId: ticketNumber.trim() }
    );

    // ✅ Handle "Ticket not found" (backend returns 404)
    if (res.status === 404 || res.data?.message === "Ticket not found") {
      alert("⚠️ Wrong Ticket ID — No such ticket found.");
      setTicketStatusData({ notFound: true });
      setIsClaimable(false);
      setTicketStatusModalOpen(true);
      return;
    }

    // ✅ Normal success flow
    if (res.data && res.data.status === "success") {
      const data = res.data.ticket || {};
      setTicketStatusData({
        ticketNumber: data.ticketNumber,
        drawTime: data.drawTime,
        prizeAmount: data.prizeAmount,
        isWinner: data.isWinner,
        isClaimed: data.isClaimed,
      });

      setIsClaimable(data.isWinner && !data.isClaimed);
      setTicketStatusModalOpen(true);
    } else {
      // ❌ Not a winning ticket
      setTicketStatusData({ isWinner: false });
      setIsClaimable(false);
      setTicketStatusModalOpen(true);
    }
  } catch (error) {
    // ✅ Handle backend 404 from Axios error
    if (error.response && error.response.status === 404) {
      // alert("⚠️ Wrong Ticket ID — No such ticket found.");
      setTicketStatusData({ notFound: true });
      setIsClaimable(false);
      setTicketStatusModalOpen(true);
      return;
    }

    console.error("Error checking ticket:", error);
    alert("Failed to check ticket status. Please try again.");
  }
};


  const handleClaimTicket = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/save-claimed-ticket`,
        { ticketId: transactionInput.trim() }
      );
      if (res.data.status === "success") {
        alert(
          "Claimed Successfully!\n" +
            JSON.stringify(res.data.claimedTicket, null, 2)
        );
      } else {
        alert(res.data.message || "Not a winning ticket");
      }
    } catch (err) {
      alert(
        "Error claiming ticket: " + (err?.response?.data?.error || err.message)
      );
    }
  };

  function activateGroup(colKey) {
    const colIndex = colKeyToIndex[colKey];

    // if you were on a single number, save it before leaving
    if (activeCheckbox) persistActiveNumber(activeCheckbox);

    // only this column’s checkboxes should be selected
    setSelected((prev) =>
      prev.map((rowArr) => rowArr.map((_, idx) => idx === colIndex))
    );

    // mark only this group as active
    setActiveFButtons([colKey]);
    setActiveColGroup(colKey);
    setActiveCheckbox(null);

    // fresh UI (blank inputs) for group editing; existing saved data
    // will still show via getCellValue if present
    setCellOverrides({});
    setColumnHeaders(Array(10).fill(""));
    setRowHeaders(Array(10).fill(""));
  }

  const colKeyToIndex = { "10-19": 0, "30-39": 1, "50-59": 2 };

  function handleColButton(colKey) {
    const colIndex = colKeyToIndex[colKey];
    if (activeCheckbox) persistActiveNumber(activeCheckbox);

    setSelected((prev) => {
      const colAllSelectedPrev = prev.every((rowArr) => rowArr[colIndex]);
      const next = prev.map((rowArr) => rowArr.slice());

      // toggle this whole column ON (add) or OFF (remove) without touching others
      for (let r = 0; r < 10; r++) next[r][colIndex] = !colAllSelectedPrev;

      // keep your quantity/points logic in sync
      const newQuantities = next.map((row) => row.filter(Boolean).length);
      setQuantities(newQuantities);
      setPoints(newQuantities.map((q) => q * 2));

      // active F buttons reflect fully-selected columns
      setActiveFButtons(() => {
        const keys = [];
        if (next.every((r) => r[0])) keys.push("10-19");
        if (next.every((r) => r[1])) keys.push("30-39");
        if (next.every((r) => r[2])) keys.push("50-59");
        return keys;
      });

      // edit target: if we just turned THIS one ON, make it active; if turned OFF, keep last remaining
      setActiveColGroup(() => {
        if (!colAllSelectedPrev) return colKey;
        const keys = [];
        if (next.every((r) => r[0])) keys.push("10-19");
        if (next.every((r) => r[1])) keys.push("30-39");
        if (next.every((r) => r[2])) keys.push("50-59");
        return keys.length ? keys[keys.length - 1] : null;
      });

      setActiveCheckbox(null);

      // refresh UI only when turning this group ON (so grid shows fresh headers like before)
      if (!colAllSelectedPrev) {
        setCellOverrides({});
        setColumnHeaders(Array(10).fill(""));
        setRowHeaders(Array(10).fill(""));
      }

      return next;
    });
  }

  // Handlers:
  // COLUMN HEADER: set/clear and persist + purge column overrides
  const handleColumnHeaderChange = (col, value) => {
    if (!/^\d{0,3}$/.test(value) || parseInt(value || "0", 10) > 999) return;

    setColumnHeaders((headers) => {
      const nextCols = headers.map((v, i) => (i === col ? value : v));

      if (activeCheckbox) {
        setStoreByNum((prev) => {
          const slot = ensureSlot(activeCheckbox);
          const merged = buildTicketsForNumber(
            activeCheckbox,
            nextCols,
            slot.rowHeader ?? Array(10).fill(""),
            checkboxInputs[activeCheckbox] || {}
          );
          return {
            ...prev,
            [activeCheckbox]: {
              ...slot,
              columnHeader: nextCols,
              tickets: merged,
            },
          };
        });
      }

      if (activeColGroup) {
        const nums = getNumsForGroup(activeColGroup); // <<—— supports ALL
        if (nums.length) {
          setStoreByNum((prev) => {
            const next = { ...prev };
            nums.forEach((n) => {
              const slot = ensureSlot(n);
              const merged = buildTicketsForNumber(
                n,
                nextCols,
                slot.rowHeader ?? Array(10).fill(""),
                checkboxInputs[n] || {}
              );
              next[n] = { ...slot, columnHeader: nextCols, tickets: merged };
            });
            return next;
          });
        }
      }
      return nextCols;
    });

    setCellOverrides((overrides) => {
      const updated = { ...overrides };
      for (let r = 0; r < 10; r++) delete updated[`${r}-${col}`];
      return updated;
    });
  };

  // Update your handleRowHeaderChange function:
  // ROW HEADER: set/clear and persist + purge row overrides
  const handleRowHeaderChange = (row, value) => {
    if (!/^\d{0,3}$/.test(value) || parseInt(value || "0", 10) > 999) return;

    setRowHeaders((headers) => {
      const nextRows = headers.map((v, i) => (i === row ? value : v));

      if (activeCheckbox) {
        setStoreByNum((prev) => {
          const slot = ensureSlot(activeCheckbox);
          const merged = buildTicketsForNumber(
            activeCheckbox,
            slot.columnHeader ?? Array(10).fill(""),
            nextRows,
            checkboxInputs[activeCheckbox] || {}
          );
          return {
            ...prev,
            [activeCheckbox]: { ...slot, rowHeader: nextRows, tickets: merged },
          };
        });
      }

      if (activeColGroup) {
        const nums = getNumsForGroup(activeColGroup); // <<—— supports ALL
        if (nums.length) {
          setStoreByNum((prev) => {
            const next = { ...prev };
            nums.forEach((n) => {
              const slot = ensureSlot(n);
              const merged = buildTicketsForNumber(
                n,
                slot.columnHeader ?? Array(10).fill(""),
                nextRows,
                checkboxInputs[n] || {}
              );
              next[n] = { ...slot, rowHeader: nextRows, tickets: merged };
            });
            return next;
          });
        }
      }
      return nextRows;
    });

    setCellOverrides((overrides) => {
      const updated = { ...overrides };
      for (let c = 0; c < 10; c++) delete updated[`${row}-${c}`];
      return updated;
    });
  };

  const BLANK_SELECTION = Array(10)
    .fill(null)
    .map(() => Array(3).fill(false));
  function deselectAllCheckboxes() {
    setSelected(BLANK_SELECTION);
    setQuantities(Array(10).fill(0));
    setPoints(Array(10).fill(0));
    setActiveCheckbox(null);
    setActiveColGroup(null);
  }

  // --- Timer logic ---
  const [remainSecs, setRemainSecs] = useState(() => getRemainTime());
  const timerRef = useRef();

  const inputRefs = useRef(
    Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => null))
  );
// ✅ Barcode Scanner Auto-Claim Hook
useEffect(() => {
  const inputEl = document.querySelector(
    'input[placeholder="Transaction No/Bar Code"]'
  );
  if (!inputEl) return;

  inputEl.focus();

  const handleScanEnter = (e) => {
    if (e.key === "Enter") {
      const scannedValue = e.target.value.trim();
      if (scannedValue) {
        setTransactionInput(scannedValue);
        handleCheckTicketStatus(scannedValue); // ✅ new: check status first
      }
    }
  };

  inputEl.addEventListener("keydown", handleScanEnter);
  return () => inputEl.removeEventListener("keydown", handleScanEnter);
}, []);


  useEffect(() => {
    setRemainSecs(getRemainTime()); // Set initial value
    timerRef.current = setInterval(() => {
      setRemainSecs(getRemainTime());
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);
  useEffect(() => {
    const newQuantities = selected.map((row) => row.filter(Boolean).length);
    const newPoints = newQuantities.map((q) => q * 2);
    setQuantities(newQuantities);
    setPoints(newPoints);
  }, [selected]);

  useEffect(() => {
    if (remainSecs === 0) {
      setCurrentDrawSlot(getNextDrawSlot(DRAW_TIMES)); // Just update the slot
    }
  }, [remainSecs]);

  // update the slots every 5 seconds to keep checking
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDrawSlot(getNextDrawSlot(DRAW_TIMES));
    }, 5000); // check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const min = String(Math.floor(remainSecs / 60)).padStart(2, "0");
  const sec = String(remainSecs % 60).padStart(2, "0");
  const remainTime = `${min}:${sec}`;

  const drawTimeObj = new Date(Date.now() + remainSecs * 1000);
  const drawTime = drawTimeObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const drawDate = getTodayDateString();

  // --- Checkboxes --- //
  const toggle = (row, col) => {
    setSelected((prev) => {
      const copy = prev.map((arr) => arr.slice());
      copy[row][col] = !copy[row][col]; // Toggle the checkbox

      // Update quantity for that row
      setQuantities((prevQuantities) => {
        const updatedQuantities = [...prevQuantities];

        // Count how many checkboxes are selected in the row
        const selectedCount = copy[row].filter((selected) => selected).length;

        // Set quantity as the number of selected checkboxes in the row
        updatedQuantities[row] = selectedCount; // Quantity = number of selected checkboxes

        // Update points for that row based on quantity
        setPoints((prevPoints) => {
          const updatedPoints = [...prevPoints];
          updatedPoints[row] = updatedQuantities[row] * 2; // Points = quantity * 2
          return updatedPoints;
        });

        return updatedQuantities;
      });

      return copy;
    });
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "F10") {
        e.preventDefault();
        window.location.reload();
      }

      // --- Mutually exclusive F7/F8/F9 handlers ---
      const activateGroup = (colIdx, colKey) => {
        if (activeCheckbox) persistActiveNumber(activeCheckbox);

        setSelected((prev) => {
          const colAllSelectedPrev = prev.every((rowArr) => rowArr[colIdx]);
          const next = prev.map((rowArr) => rowArr.slice());

          // toggle this whole column ON/OFF, preserve other columns (so F7 stays when you hit F8)
          for (let r = 0; r < 10; r++) next[r][colIdx] = !colAllSelectedPrev;

          // quantities/points stay correct
          const newQuantities = next.map((row) => row.filter(Boolean).length);
          setQuantities(newQuantities);
          setPoints(newQuantities.map((q) => q * 2));

          // sync F-buttons with fully-selected columns
          setActiveFButtons(() => {
            const keys = [];
            if (next.every((r) => r[0])) keys.push("10-19");
            if (next.every((r) => r[1])) keys.push("30-39");
            if (next.every((r) => r[2])) keys.push("50-59");
            return keys;
          });

          // editing group = the one we just turned ON; if turned OFF, keep last remaining
          setActiveColGroup(() => {
            if (!colAllSelectedPrev) return colKey;
            const keys = [];
            if (next.every((r) => r[0])) keys.push("10-19");
            if (next.every((r) => r[1])) keys.push("30-39");
            if (next.every((r) => r[2])) keys.push("50-59");
            return keys.length ? keys[keys.length - 1] : null;
          });

          setActiveCheckbox(null);

          // refresh grid UI only when turning this group ON
          if (!colAllSelectedPrev) {
            setCellOverrides({});
            setColumnHeaders(Array(10).fill(""));
            setRowHeaders(Array(10).fill(""));
          }

          return next;
        });
      };

      if (e.key === "F7") {
        e.preventDefault();
        activateGroup(0, "10-19");
      }
      if (e.key === "F8") {
        e.preventDefault();
        activateGroup(1, "30-39");
      }
      if (e.key === "F9") {
        e.preventDefault();
        activateGroup(2, "50-59");
      }

      if (e.key === "F6") {
        e.preventDefault();
        if (!isPrinting) handlePrint();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [activeFilter, activeCheckbox, activeColGroup]);

  // --- Column/Range Filters for F7/F8/F9 --- //
  const handleFilter = (colKey) => {
    setActiveColFilter(colKey);
    applyFilter(activeTypeFilter, colKey); // This is fine!
  };

  function handleOddEvenFP(type) {
    if (activeTypeFilter === type) {
      setActiveTypeFilter(null);
      resetCheckboxes(); // optional
      return;
    }

    setActiveTypeFilter(type);

    // Apply only matching numbers
    applyFilter(type, null); // null means apply across all columns
  }

  const resetCheckboxes = () => {
    setSelected(
      Array(10)
        .fill(null)
        .map(() => Array(3).fill(false))
    );
    setQuantities(Array(10).fill(0)); // Reset quantities
    setPoints(Array(10).fill(0)); // Reset points
    setActiveTypeFilter(null);
    setActiveColFilter(null);
    setCellOverrides({});
    setColumnHeaders(Array(10).fill(""));
    setRowHeaders(Array(10).fill(""));
  };

  useEffect(() => {
    // 1. Quantities per row
    // console.log("Quantities per row:", quantities);

    // 2. Sum of all input values (totalValue)
    let totalValue = 0;
    Object.values(cellOverrides).forEach((v) => {
      const num = parseInt(v, 10);
      if (!isNaN(num)) totalValue += num;
    });
    // console.log("Total value:", totalValue);

    // 3. Updated quantity column: [totalValue * q for each q in quantities]
    const updatedQuantity = quantities.map((q) => totalValue * q);
    // console.log("Updated quantity:", updatedQuantity);
  }, [quantities, cellOverrides]);

  const handleGridChange = (row, col, value) => {
    if (!/^\d*$/.test(value)) return;

    const numStr = String(row * 10 + col).padStart(2, "0");

    if (
      isFPMode &&
      activeFPSetIndex !== null &&
      FP_SETS[activeFPSetIndex].includes(numStr)
    ) {
      // Update all cells in the active FP set
      setCellOverrides((overrides) => {
        const updated = { ...overrides };
        FP_SETS[activeFPSetIndex].forEach((setNum) => {
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              if (String(r * 10 + c).padStart(2, "0") === setNum) {
                updated[`${r}-${c}`] = value;
              }
            }
          }
        });
        return updated;
      });
    } else {
      setCellOverrides((prev) => {
        const updated = { ...prev };
        if (value === "") {
          delete updated[`${row}-${col}`];
        } else {
          updated[`${row}-${col}`] = value;
        }
        return updated;
      });
    }
  };

  function getTicketList() {
    const out = [];
    const seen = new Set();

    // collect selected numbers
    const selectedNumbers = [];
    for (let colIdx = 0; colIdx < allNumbers.length; colIdx++) {
      for (let rowIdx = 0; rowIdx < allNumbers[colIdx].length; rowIdx++) {
        if (selected[rowIdx][colIdx]) {
          selectedNumbers.push(allNumbers[colIdx][rowIdx]);
        }
      }
    }

    selectedNumbers.forEach((num) => {
      const slot = ensureSlot(num); // reads from sjTicketsV1
      const headerTickets = expandHeaderTickets(
        num,
        slot.columnHeader || Array(10).fill(""),
        slot.rowHeader || Array(10).fill("")
      );

      // merge this number's per-cell overrides (RAM map)
      const perCell = checkboxInputs[num] || {};
      Object.entries(perCell).forEach(([cellIndex, val]) => {
        if (val && val !== "0") {
          const idx = String(cellIndex).padStart(2, "0");
          headerTickets[`${num}-${idx}`] = String(val);
        }
      });

      // append de-duplicated
      Object.entries(headerTickets).forEach(([k, v]) => {
        if (!seen.has(k)) {
          seen.add(k);
          out.push(`${k} : ${v}`);
        }
      });
    });

    return out;
  }

  function headerValue(row, col) {
    const rowVal = parseInt(rowHeaders[row] || "0", 10);
    const colVal = parseInt(columnHeaders[col] || "0", 10);

    if (
      rowHeaders[row] &&
      rowHeaders[row] !== "" &&
      columnHeaders[col] &&
      columnHeaders[col] !== ""
    ) {
      return (rowVal + colVal).toString();
    } else if (columnHeaders[col] && columnHeaders[col] !== "") {
      return columnHeaders[col];
    } else if (rowHeaders[row] && rowHeaders[row] !== "") {
      return rowHeaders[row];
    }
    return "";
  }

  function getCellValue(row, col) {
    const key = `${row}-${col}`;
    const cellIndex = row * 10 + col;
    const disabled = isCellDisabled(row, col);

    // 1) Visual/manual override layer (used when editing outside checkbox/col-group)
    //    Keep as-is: show exactly what was typed here (no header math).
    if (cellOverrides[key] !== undefined && cellOverrides[key] !== "") {
      return cellOverrides[key];
    }

    // helper: compute header fallback from provided headers
    const headerFallback = (rows, cols) => {
      if (disabled) return "";
      const rHas = rows[row] !== "" && rows[row] != null;
      const cHas = cols[col] !== "" && cols[col] != null;
      const rVal = parseInt(rows[row] || "0", 10);
      const cVal = parseInt(cols[col] || "0", 10);
      if (rHas && cHas) return String(rVal + cVal);
      if (cHas) return String(cVal);
      if (rHas) return String(rVal);
      return "";
    };

    // helper: manual + headerSum using given rows/cols
    const addHeaders = (manualStr, rows, cols) => {
      const rHas = rows[row] !== "" && rows[row] != null;
      const cHas = cols[col] !== "" && cols[col] != null;
      const rVal = parseInt(rows[row] || "0", 10);
      const cVal = parseInt(cols[col] || "0", 10);
      const headerSum = (rHas ? rVal : 0) + (cHas ? cVal : 0);
      const manual = parseInt(manualStr || "0", 10);
      return String(manual + headerSum);
    };

    // 2) Single-number active → use that number's saved headers.
    if (activeCheckbox) {
      const slot = storeByNum[activeCheckbox];
      const effRows = slot?.rowHeader ?? rowHeaders;
      const effCols = slot?.columnHeader ?? columnHeaders;

      const perCell = checkboxInputs[activeCheckbox];
      const manual = perCell ? perCell[cellIndex] : undefined;

      // If there's a manual for this cell, show manual + headers for this number
      if (manual !== undefined && manual !== "") {
        return addHeaders(manual, effRows, effCols);
      }

      // Otherwise, show header fallback for this number
      const hv = headerFallback(effRows, effCols);
      if (hv !== "") return hv;
    }

    // 3) Column group active (F7/F8/F9) → combine any manual with CURRENT UI headers
    // 3) Column group active (F7/F8/F9/ALL) → combine any manual with CURRENT UI headers
    if (activeColGroup) {
      const nums = getNumsForGroup(activeColGroup); // supports ALL too

      if (nums.length) {
        // find first manual for this cell among numbers in the group
        for (const n of nums) {
          const m = checkboxInputs[n]?.[cellIndex];
          if (m !== undefined && m !== "") {
            // manual exists → show manual + (current UI) headers
            return addHeaders(m, rowHeaders, columnHeaders);
          }
        }
      }

      // no manual → show header fallback from current UI headers
      const hv = headerFallback(rowHeaders, columnHeaders);
      if (hv !== "") return hv;
    }

    // 4) None active → don't show header fills in grid
    return "";
  }

  function getFPSetIndexForNumber(numStr) {
    return FP_SETS.findIndex((set) => set.includes(numStr));
  }

  function applyFilter(type, colKey) {
    const colIndexes = { "10-19": 0, "30-39": 1, "50-59": 2 };
    const newSelected = Array(10)
      .fill(null)
      .map(() => Array(3).fill(false));

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 3; col++) {
        const num = allNumbers[col][row];
        let matchType = false;

        if (!type || type === "all") matchType = true;
        else if (type === "even") matchType = isEven(num);
        else if (type === "odd") matchType = isOdd(num);
        else if (type === "fp") matchType = isPrime(num);

        let matchCol = !colKey || col === colIndexes[colKey];

        if (matchType && matchCol) newSelected[row][col] = true;
      }
    }
    setSelected(newSelected);

    const updatedQuantities = newSelected.map(
      (rowArr) => rowArr.filter(Boolean).length
    );
    setQuantities(updatedQuantities);
    setPoints(updatedQuantities.map((q) => q * 2)); // assuming points = quantity * 2
  }

  function getLoginIdFromToken() {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  }

    useEffect(() => {
    const id = getLoginIdFromToken();
    if (!id) return;

    setGameIdBox(String(id));

    axios
      .post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/navbar-details`, {
        loginId: id,
      })
      .then((res) => {
        setLastPoints(res.data.lastTotalPoint ?? "-");
        setLastTicket(res.data.lastTicketNumber ?? "-");
        setBalance(res.data.balance ?? "-");
      })
      .catch(() => {
        setLastPoints("-");
        setLastTicket("-");
        setBalance("-");
      });
  }, []);


  function getFormattedDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now.getFullYear()} ${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}:${pad(now.getSeconds())}`;
  }

  const generatePrintReceipt = (data, ticketId) => {
    // --- dynamic height based on how many ticket lines we print ---
    const lineHeight = 4; // each printed row is +4mm
    const ticketArray = (data.ticketNumber || "").split(", ").filter(Boolean);
    const ticketRows = Math.ceil(ticketArray.length / 3);

    // header ends ~45, list starts at 50
    const afterListLineGap = 5;
    const totalsBlock = 5 + 5 + 8; // "qty" line + "amount" line + spacing
    const barcodeBlock = 20 + 10; // barcode + bottom margin

    let requiredHeight =
      50 +
      ticketRows * lineHeight +
      afterListLineGap +
      totalsBlock +
      barcodeBlock;

    const pageHeight = Math.max(297, requiredHeight); // never smaller than default A4-height

    // Create jsPDF with dynamic height (width fixed at 80mm for thermal)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, pageHeight],
    });

    // Set font
    pdf.setFontSize(10);

    // Header
    pdf.text("Skill Jackpot", 40, 10, { align: "center" });
    pdf.setFontSize(8);
    pdf.text("This game for Adults Amusement Only", 40, 15, {
      align: "center",
    });
    pdf.text("GST No Issued by Govt of India", 40, 20, { align: "center" });
    pdf.text("GST No: In Process", 40, 25, { align: "center" });
    pdf.text(`Date: ${data.gameTime}`, 40, 30, { align: "center" });

    // Separator
    pdf.setLineWidth(0.5);
    pdf.line(5, 33, 75, 33);

    // Draw time + login
    pdf.setFontSize(9);
    const drawTimeText = Array.isArray(data.drawTime)
      ? data.drawTime.length > 1
        ? `Draw Times: ${data.drawTime.join(", ")}`
        : `Draw Time: ${data.drawTime[0]}`
      : `Draw Time: ${data.drawTime}`;
    pdf.text(drawTimeText, 5, 38);
    pdf.text(`Login Id: ${data.loginId}`, 5, 43);

    // Line before list
    pdf.line(5, 45, 75, 45);

    // --- Ticket numbers in grid format (3 per row) ---
    let yPos = 50; // keep your start position
    for (let i = 0; i < ticketArray.length; i += 3) {
      let rowText = "";
      for (let j = 0; j < 3 && i + j < ticketArray.length; j++) {
        const ticket = ticketArray[i + j];
        const formattedTicket = ticket.substring(0, 18); // keep your limit
        rowText += formattedTicket.padEnd(25, " ");
      }
      pdf.setFontSize(7);
      pdf.text(rowText.trim(), 5, yPos);
      yPos += lineHeight;
    }

    // Line before totals
    pdf.line(5, yPos, 75, yPos);
    yPos += 5;

    // Totals
    pdf.setFontSize(10);
    pdf.text(`Total Quantity : ${data.totalQuatity}`, 5, yPos);
    yPos += 5;
    pdf.text(`Total Amount : ${data.totalPoints}`, 5, yPos);
    yPos += 8;

    // Barcode
    // 5-digit printable code (last 5 digits of the numeric part of ticketId)
    const printableId5 = String(ticketId)
      .replace(/\D/g, "")
      .slice(-5)
      .padStart(5, "0");
    const barcodeValue = `${data.ticketNumber}`;

    // If you want only digits (no SJ), use:  const barcodeValue = printableId5;

    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 5,
    });
    const barcodeImage = canvas.toDataURL("image/png");
    pdf.addImage(barcodeImage, "PNG", 10, yPos, 60, 20);

    // Print
    pdf.autoPrint();
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = function () {
        printWindow.print();
      };
    } else {
      alert(
        "Unable to open print window. Please disable popup blocker and try again."
      );
    }
  };

  useEffect(() => {
    const beforeUnload = () => {
      if (activeCheckbox) persistActiveNumber(activeCheckbox);
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [activeCheckbox, columnHeaders, rowHeaders, checkboxInputs]);

const handlePrint = async () => {
  // Synchronous guard: blocks ultra-fast double-clicks
  if (isPrintingRef.current) return;
  isPrintingRef.current = true;
  setIsPrinting(true);

  try {
    const ticketList = getTicketList();

    if (remainSecs <= 30) {
      alert("Print is disabled during the last 30 seconds before draw time!");
      return;
    }

    if (totalUpdatedQuantity === 0) {
      alert("No quantity selected or no tickets to print.");
      return;
    }

    const loginId = getLoginIdFromToken();
    if (!loginId) {
      alert("User not logged in.");
      return;
    }

    const gameTime = getFormattedDateTime();

    const payload = {
      gameTime,
      ticketNumber: ticketList.join(", "),
      totalQuatity: displayTotalQuantity,
      totalPoints: displayTotalPoints,
      loginId,
      drawTime:
        advanceDrawTimes.length > 0
          ? advanceDrawTimes
          : [currentDrawSlot],
    };

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/saveTicket`,
      payload
    );

    setRefreshKey((prev) => prev + 1);

    if (response.status === 201) {
      const data = response.data || {};
      const ticketObjId = data.ticket?.id ?? data.ticket?.ticketId ?? null;
      const rootId = data.ticketId ?? data.id ?? null;
      const ticketId = String(ticketObjId ?? rootId ?? Date.now());

      alert(`Tickets saved successfully! Ticket ID: ${ticketId}`);

      generatePrintReceipt(
        {
          gameTime,
          drawTime:
            advanceDrawTimes.length > 0
              ? advanceDrawTimes
              : [currentDrawSlot],
          loginId,
          ticketNumber: ticketList.join(", "),
          totalQuatity: displayTotalQuantity,
          totalPoints: displayTotalPoints,
        },
        ticketId
      );

      // Clear UI after printing
      resetCheckboxes();
      setCellOverrides({});
      setColumnHeaders(Array(10).fill(""));
      setRowHeaders(Array(10).fill(""));
      setCheckboxInputs({});
      localStorage.removeItem("checkboxInputs");
      setAdvanceDrawTimes([]);
    } else {
      alert(
        "Failed to save tickets: " +
          (response.data?.message || "Unknown error")
      );
    }
  } catch (error) {
    alert(
      "Error saving tickets: " +
        (error?.response?.data?.message ||
          error?.response?.data?.error ||
          error.message)
    );
  } finally {
    // Release lock in ALL cases
    isPrintingRef.current = false;
    setIsPrinting(false);
  }
};

useEffect(() => {
}, [refreshKey]); // This will log the updated value of refreshKey

  // Calculate total value (sum of all input boxes)
  let totalValue = 0;
  Object.values(cellOverrides).forEach((v) => {
    const num = parseInt(v, 10);
    if (!isNaN(num)) totalValue += num;
  });

  const totalUpdatedQuantity = updatedQuantity.reduce(
    (sum, val) => sum + val,
    0
  );
  const totalUpdatedPoints = updatedPoints.reduce((sum, val) => sum + val, 0);

  const drawMultiplier =
    advanceDrawTimes && advanceDrawTimes.length > 0
      ? advanceDrawTimes.length
      : 1;

  const displayTotalQuantity = totalUpdatedQuantity * drawMultiplier;
  const displayTotalPoints = totalUpdatedPoints * drawMultiplier;

  // Sum of values in a row
  function getRowSum(row) {
    let sum = 0;
    for (let col = 0; col < 10; col++) {
      const key = `${row}-${col}`;
      const val = parseInt(cellOverrides[key], 10);
      if (!isNaN(val)) sum += val;
    }
    return sum;
  }

  const isOddIndex = (row, col) => (row * 10 + col) % 2 === 1;
  const isEvenIndex = (row, col) => (row * 10 + col) % 2 === 0;

  useEffect(() => {

  }, [activeTypeFilter, activeCheckbox, activeColGroup]);

  function isCellDisabled(row, col) {
    // FP mode: never disable
    if (isFPMode) return false;

    const idx = row * 10 + col; // 00..99

    if (activeTypeFilter === "odd") {
      // disable even cells when Odd is active
      return idx % 2 === 0;
    }
    if (activeTypeFilter === "even") {
      // disable odd cells when Even is active
      return idx % 2 === 1;
    }
    if (activeTypeFilter === "all") {
      return false;
    }
    // default: when no odd/even/all selected, disable unless a checkbox/col-group is active
    return !activeCheckbox && !activeColGroup;
  }

  const canPrint = remainSecs > 30 && displayTotalQuantity > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full h-fit">
        <ShowResult drawTime={currentDrawSlot} refreshKey={refreshKey} />
      </div>

{/* Enhanced Professional Draw Header */}
<div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 px-4">

  {/* LEFT: Number Filters */}
  <div className="w-full lg:w-auto flex flex-col gap-3">
    <div className="flex flex-wrap gap-2 justify-center text-sm  lg:justify-start">
      {[
        { label: "All", value: "all", activeClass: "from-purple-600 to-pink-600" },
        { label: "Even", value: "even", activeClass: "from-blue-600 to-indigo-600" },
        { label: "Odd", value: "odd", activeClass: "from-rose-600 to-red-500" },
      ].map((btn) => (
        <button
          key={btn.value}
          onClick={() => {
            const turningOff = activeTypeFilter === btn.value;
            if (turningOff) {
              setActiveTypeFilter(null);
              setSelected(Array(10).fill(null).map(() => Array(3).fill(false)));
              setQuantities(Array(10).fill(0));
              setPoints(Array(10).fill(0));
              setActiveCheckbox(null);
              setActiveColGroup(null);
            } else {
              setActiveTypeFilter(btn.value);
              selectByTypeFilter(btn.value);
              setActiveCheckbox(null);
              setActiveColGroup(btn.label.toUpperCase());
            }
          }}
          className={`px-1 py-2 rounded-sm font-semibold transition-all duration-200 flex items-center gap-2 min-w-[80px] justify-center ${
            activeTypeFilter === btn.value
              ? `text-white bg-gradient-to-r ${btn.activeClass} shadow-lg`
              : "text-[#4A314D] bg-[#f3e7ef] hover:bg-[#ede1eb] shadow-md"
          }`}
        >
          {btn.label}
        </button>
      ))}

      {/* FP Mode */}
      <button
        onClick={() => {
          setIsFPMode(!isFPMode);
          if (isFPMode) {
            clearFPHighlights();
            setActiveFPSetIndex(null);
          }
        }}
        className={`px-2 py-1 text-sm rounded-sm font-semibold transition-all duration-200 flex items-center gap-2 min-w-[80px] justify-center ${
          isFPMode
            ? "text-white bg-gradient-to-r from-green-600 to-lime-600 shadow-lg"
            : "text-[#4A314D] bg-[#ece6fc] border border-[#968edb] hover:bg-[#e5def7] shadow-md"
        }`}
      >
        FP Mode
      </button>
    </div>
  </div>

  {/* CENTER + RIGHT: Combined Section */}
  <div className="w-full lg:flex-1 flex flex-col lg:flex-row items-center justify-between gap-4">
    
    {/* Timer + Draw Info */}
    <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
      {/* Time Remaining */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/90 border border-slate-700/60 rounded-sm shadow-md min-w-[180px]">
        <Clock className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">Time Remaining</span>
          <span className="text-lg font-mono font-bold text-red-400">{remainTime}</span>
        </div>
      </div>

      {/* Draw Date & Time */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/90 border border-slate-700/60 rounded-sm shadow-md min-w-[200px]">
        <Calendar className="w-4 h-4 text-green-400 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">Draw Date & Time</span>
          <span className="text-sm font-mono font-bold text-red-400">{drawDate} | {currentDrawSlot}</span>
        </div>
      </div>
    </div>

    {/* Game Status */}
    <div className="w-full lg:w-auto">
      <div className="grid grid-cols-4 gap-2 min-w-[400px]">
        <div className="p-2 bg-slate-800/70 rounded-sm border border-slate-700/50 shadow-md flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Game ID</span>
          <span className="text-xs font-mono font-bold text-purple-400 truncate">{gameIdBox}</span>
        </div>
        <div className="p-2 bg-slate-800/70 rounded-sm border border-slate-700/50 shadow-md flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Last Points</span>
          <span className="text-xs font-mono font-bold text-pink-400">{lastPoints}</span>
        </div>
        <div className="p-2 bg-slate-800/70 rounded-sm border border-slate-700/50 shadow-md flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Last Ticket</span>
          <span className="text-xs font-mono font-bold text-cyan-400 truncate">{lastTicket}</span>
        </div>
        <div className="p-2 bg-slate-800/70 rounded-sm border border-slate-700/50 shadow-md flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium">Balance Limit</span>
          <span className="text-xs font-mono font-bold text-emerald-400">{balance}</span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Main Content Row */}
      <div className="flex flex-wrap p-2 gap-2">
        {/* Left Panel - Number Selectors, ODD EVEN FP */}
        <div className="rounded-sm shadow-2xl bg-gradient-to-b from-slate-100/95 to-slate-300/80 p-2 border-2 border-gray-300/50 min-h-[600px] w-full lg:max-w-[320px] sm:w-[360px] backdrop-blur-sm">
          {/* Tabs for Filter */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap sm:w-auto w-full lg:justify-between sm:justify-start mb-2 sm:mb-0">
            {[
              { key: "10-19", label: "F7 (10-19)" },
              { key: "30-39", label: "F8 (30-39)" },
              { key: "50-59", label: "F9 (50-59)" },
            ].map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => handleColButton(tab.key)}
                className={`px-2 py-1 rounded font-bold text-sm w-full  text-white
          ${
            activeFilter === tab.key
              ? "bg-gradient-to-r from-purple-700 to-pink-600 scale-105 shadow-lg"
              : "bg-gradient-to-r from-purple-500 to-pink-500"
          }
          hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95 border border-purple-400/30`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Number + Checkbox Grid */}
          <div className="grid grid-cols-3 gap-1 mb-4 mt-5">
            {range(0, 9).map((row) =>
              allNumbers.map((colArray, colIdx) => {
                const num = colArray[row];
                const color = numberBoxColors[row % numberBoxColors.length];
                return (
                  <div
                    key={num}
                    className={`relative flex items-center gap-1 px-2 py-1 ${color} hover:scale-105 transition-all duration-200 cursor-pointer`}
                    style={{
                      border: "2px solid #fff",
                      borderRadius: "12px",
                      margin: "0",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* Custom Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected[row][colIdx]}
                      onChange={() => {
                        const checkboxNum = allNumbers[colIdx][row];
                        const wasChecked = selected[row][colIdx];

                        // keep visual toggle
                        toggle(row, colIdx);

                        if (!wasChecked) {
                          // save previous active number (if any)
                          if (activeCheckbox)
                            persistActiveNumber(activeCheckbox);

                          // switch active
                          setActiveCheckbox(checkboxNum);
                          setActiveColGroup(null);

                          // IMPORTANT: blank the UI before loading this number
                          setCellOverrides({});
                          setColumnHeaders(Array(10).fill(""));
                          setRowHeaders(Array(10).fill(""));

                          // load saved state for this number (headers + manual deltas)
                          loadNumberIntoUI(checkboxNum);
                        } else {
                          // unchecking this number
                          setCheckboxInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[checkboxNum];
                            return updated;
                          });

                          if (activeCheckbox === checkboxNum) {
                            persistActiveNumber(checkboxNum);
                            setActiveCheckbox(null);
                            setActiveColGroup(null);

                            // optional: clear UI
                            setColumnHeaders(Array(10).fill(""));
                            setRowHeaders(Array(10).fill(""));
                            setCellOverrides({});
                          }
                        }
                      }}
                      className="peer appearance-none w-6 h-6 rounded bg-white border-2 border-[#4A314D] checked:bg-gradient-to-r checked:from-purple-600 checked:to-pink-600 checked:border-purple-600 flex-shrink-0 transition-all duration-200 hover:scale-110"
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    />

                    {/* Enhanced Checkmark */}
                    <span
                      className={`absolute left-3 top-3 text-white text-sm font-bold pointer-events-none transition-all duration-200 ${
                        selected[row][colIdx]
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-50"
                      }`}
                    >
                      ✓
                    </span>
                    {/* Enhanced Number Box */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNumberBox(row, colIdx);
                        setActiveCheckbox(num);
                        setActiveColGroup(null);
                      }}
                      className={`w-10 h-7 flex items-center justify-center font-bold text-md border-2 border-[#4A314D] rounded select-none transition-all duration-200 cursor-pointer
                      ${
                        activeNumberBox.row === row &&
                        activeNumberBox.col === colIdx
                          ? "bg-purple-700 text-white"
                          : "bg-white text-[#4A314D]"
                      }
                    `}
                      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                    >
                      {num}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint || isPrinting}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2 rounded-sm font-semibold
                text-white bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg
                hover:shadow-purple-500/25 hover:from-purple-500 hover:to-blue-400
                transition-all duration-300 hover:scale-105 active:scale-95
                ${(!canPrint || isPrinting) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
              `}
            >
              <Printer className="w-5 h-5" />
              {isPrinting ? "Printing..." : "Print"}
            </button>


            <button
              onClick={() => {
                window.location.reload();
                setCheckboxInputs({});
                localStorage.removeItem("checkboxInputs");
                setStoreByNum({});
                localStorage.removeItem(LS_KEY);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-red-500 shadow-lg hover:shadow-pink-500/25 hover:from-pink-400 hover:to-red-400 transition-all duration-300 hover:scale-105 active:scale-95 text-sm"
            >
              <RotateCcw className="w-5 h-5" />
              Reset (F10)
            </button>
          </div>
        </div>

        {/* Main Table (unchanged from before) */}
        <div className="flex-1 bg-gradient-to-b from-slate-800/70 to-slate-900/90 rounded-sm shadow-2xl border-2 border-slate-700/50 transparent-scrollbar p-4 overflow-hidden backdrop-blur-sm">
          {/* Enhanced Table */}
          <div className="overflow-x-auto transparent-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {/* Row header blank */}
                  <th className="bg-transparent p-0"></th>
                  {/* 10 col headers */}
                  {range(0, 9).map((n) => (
                    <th
                      key={n}
                      className="p-2 text-center text-sm font-bold text-purple-300 bg-slate-800/30 border-r border-slate-700/30 last:border-r-0"
                    >
                      {/* Blank for column headers */}
                    </th>
                  ))}
                  {/* Spacer, Quantity, Points headers */}
                  <th className="bg-transparent p-2"></th>
                  <th className="bg-transparent p-2"></th>
                </tr>
              </thead>
              <tbody>
                {/* Column Header Input Row */}
                <tr>
                  <td className="bg-transparent"></td>
                  {range(0, 9).map((col) => (
                    <td
                      key={`col-header-${col}`}
                      className="p-1 text-center border-r border-slate-700/20 last:border-r-0"
                    >
                      <input
                        type="text"
                        className="w-16 h-6 rounded bg-cyan-900/80 text-cyan-200 border-2 border-cyan-400/40 text-center font-bold shadow focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200 hover:border-cyan-300"
                        maxLength={3}
                        value={columnHeaders[col]}
                        onChange={(e) =>
                          handleColumnHeaderChange(col, e.target.value)
                        }
                        data-colheader="1"
                        data-col={col}
                        onKeyDownCapture={(e) =>
                          handleArrowNav(e, "colHeader", 0, col)
                        }
                      />
                    </td>
                  ))}
                  <td className="bg-transparent"></td>
                  <td className="p-1 text-center font-bold text-yellow-400">
                    Quantity
                  </td>
                  <td className="p-1 text-center font-bold text-pink-400">
                    Amounts
                  </td>
                </tr>
                {/* Main Grid Rows */}
                {range(0, 9).map((row) => (
                  <tr
                    key={row}
                    className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-1 text-center border-r border-slate-700/20">
                      <div className="text-xs text-white font-bold py-2"></div>
                      <input
                        type="text"
                        className="w-16 h-6 rounded bg-lime-900/80 text-lime-200 border-2 border-lime-400/40 text-center font-bold shadow focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 outline-none transition-all duration-200 hover:border-lime-300"
                        maxLength={3}
                        value={rowHeaders[row]}
                        onChange={(e) =>
                          handleRowHeaderChange(row, e.target.value)
                        }
                        data-rowheader="1"
                        data-row={row}
                        onKeyDownCapture={(e) =>
                          handleArrowNav(e, "rowHeader", row, 0)
                        }
                      />
                    </td>

                    {/* main input box */}
                    {range(0, 9).map((col) => (
                      <td
                        key={col}
                        className="p-1 text-center border-r border-slate-700/20 last:border-r-0"
                      >
                        <div className="text-[11px] text-white font-bold">
                          {String(row * 10 + col).padStart(2, "0")}
                        </div>
                        <input
                          type="text"
                          data-index={String(row * 10 + col).padStart(2, "0")}
                          data-grid-cell="1"
                          data-row={row}
                          data-col={col}
                          onKeyDownCapture={(e) =>
                            handleArrowNav(e, "grid", row, col)
                          }
                          className={`
    w-14 h-6 rounded-sm bg-slate-900/90 text-white border-2 border-purple-600/40
    text-center font-bold shadow-lg focus:border-pink-500 focus:ring-2
    focus:ring-pink-500/20 outline-none transition-all duration-200
    hover:border-purple-400
    ${
      isFPMode &&
      activeFPSetIndex !== null &&
      FP_SETS[activeFPSetIndex].includes(
        String(row * 10 + col).padStart(2, "0")
      )
        ? "fp-highlight"
        : ""
    }
    ${
      (
        isFPMode
          ? false
          : activeTypeFilter === "odd"
          ? !isOddIndex(row, col)
          : activeTypeFilter === "even"
          ? !isEvenIndex(row, col)
          : false
      )
        ? "bg-gray-200 text-transparent cursor-not-allowed opacity-70"
        : ""
    }
  `}
                          maxLength={3}
                          value={getCellValue(row, col)}
                          onClick={() => {
                            if (isFPMode) {
                              const numStr = String(row * 10 + col).padStart(
                                2,
                                "0"
                              );
                              const setIdx = getFPSetIndexForNumber(numStr);
                              if (setIdx !== -1) {
                                setActiveFPSetIndex(setIdx);
                                highlightFPSet(setIdx);
                              } else {
                                setActiveFPSetIndex(null);
                                clearFPHighlights();
                              }
                            }
                          }}
                          onChange={(e) => {
                            const input = e.target.value;
                            if (!/^\d{0,3}$/.test(input)) return;

                            const inputIndex = `${row * 10 + col}`;
                            const numStr = String(row * 10 + col).padStart(
                              2,
                              "0"
                            );

                            const updateOverride = (key, value) => {
                              setCellOverrides((prev) => {
                                const updated = { ...prev };
                                if (value === "" || value == null) {
                                  delete updated[key]; // allow header fallback
                                } else {
                                  updated[key] = value;
                                }
                                return updated;
                              });
                            };

                            if (
                              isFPMode &&
                              activeFPSetIndex !== null &&
                              FP_SETS[activeFPSetIndex].includes(numStr)
                            ) {
                              // FP set: update all cells in the set
                              FP_SETS[activeFPSetIndex].forEach((setNum) => {
                                const r = Math.floor(parseInt(setNum, 10) / 10);
                                const c = parseInt(setNum, 10) % 10;
                                updateOverride(`${r}-${c}`, input);
                              });
                              // --- BEGIN: FP totals sync (inserted; no other lines changed) ---

                              // Build targets inline: single number → current group (incl. "ALL") → all selected
                              const __targets = [];
                              if (activeCheckbox) {
                                __targets.push(activeCheckbox);
                              } else if (activeColGroup) {
                                const __g = getNumsForGroup(activeColGroup); // uses your existing helper
                                for (let __i = 0; __i < __g.length; __i++)
                                  __targets.push(__g[__i]);
                              } else {
                                for (let __c = 0; __c < 3; __c++) {
                                  for (let __r = 0; __r < 10; __r++) {
                                    if (selected[__r][__c])
                                      __targets.push(allNumbers[__c][__r]);
                                  }
                                }
                              }

                              // Keep manuals in memory so getCellValue shows correctly
                              setCheckboxInputs((prev) => {
                                const next = { ...prev };
                                __targets.forEach((n) => {
                                  if (!next[n]) next[n] = {};
                                  FP_SETS[activeFPSetIndex].forEach(
                                    (setNum) => {
                                      const idxNum = parseInt(setNum, 10); // 0..99
                                      if (input === "" || input == null)
                                        delete next[n][idxNum];
                                      else next[n][idxNum] = input;
                                    }
                                  );
                                });
                                return next;
                              });

                              // Persist to storeByNum so updatedQuantity/updatedPoints are recalculated
                              setStoreByNum((prev) => {
                                const copy = { ...prev };

                                __targets.forEach((n) => {
                                  const slot = ensureSlot(n);
                                  const t = { ...(slot.tickets || {}) };

                                  FP_SETS[activeFPSetIndex].forEach(
                                    (setNum) => {
                                      const idxNum = parseInt(setNum, 10);
                                      const r = Math.floor(idxNum / 10);
                                      const c = idxNum % 10;
                                      const idxKey = String(idxNum).padStart(
                                        2,
                                        "0"
                                      );

                                      // Use saved headers for this number, else current UI headers
                                      const rv =
                                        slot.rowHeader?.[r] ??
                                        rowHeaders[r] ??
                                        "";
                                      const cv =
                                        slot.columnHeader?.[c] ??
                                        columnHeaders[c] ??
                                        "";
                                      const rNum = parseInt(rv || "0", 10);
                                      const cNum = parseInt(cv || "0", 10);
                                      const headerSum =
                                        (rv ? rNum : 0) + (cv ? cNum : 0);

                                      if (input === "" || input == null) {
                                        delete t[`${n}-${idxKey}`];
                                      } else {
                                        const manual = parseInt(
                                          input || "0",
                                          10
                                        );
                                        t[`${n}-${idxKey}`] = String(
                                          manual + headerSum
                                        );
                                      }
                                    }
                                  );

                                  copy[n] = { ...slot, tickets: t };
                                });

                                return copy;
                              });

                              // --- END: FP totals sync ---
                            } else if (activeColGroup) {
                              // Column group edit → write to every number in that column
                              const nums = getNumsForGroup(activeColGroup);
                              let colIdx;
                              if (activeColGroup === "10-19") colIdx = 0;
                              else if (activeColGroup === "30-39") colIdx = 1;
                              else if (activeColGroup === "50-59") colIdx = 2;

                              // const nums = allNumbers[colIdx];

                              // 1) Update checkboxInputs
                              setCheckboxInputs((prev) => {
                                const updated = { ...prev };
                                nums.forEach((n) => {
                                  if (!updated[n]) updated[n] = {};
                                  if (input === "" || input == null) {
                                    delete updated[n][inputIndex];
                                  } else {
                                    updated[n][inputIndex] = input;
                                  }
                                });
                                return updated;
                              });

                              // 2) Mirror into storeByNum (persist)
                              const idxKey = String(row * 10 + col).padStart(
                                2,
                                "0"
                              );
                              setStoreByNum((prev) => {
                                const next = { ...prev };
                                nums.forEach((n) => {
                                  const slot = ensureSlot(n);
                                  const t = { ...(slot.tickets || {}) };

                                  const rv =
                                    slot.rowHeader?.[row] ??
                                    rowHeaders[row] ??
                                    "";
                                  const cv =
                                    slot.columnHeader?.[col] ??
                                    columnHeaders[col] ??
                                    "";
                                  const rNum = parseInt(rv || "0", 10);
                                  const cNum = parseInt(cv || "0", 10);
                                  const headerSum =
                                    (rv ? rNum : 0) + (cv ? cNum : 0);

                                  if (input === "" || input == null) {
                                  } else {
                                    const manual = parseInt(input || "0", 10);
                                    t[`${n}-${idxKey}`] = String(
                                      manual + headerSum
                                    );
                                  }

                                  next[n] = { ...slot, tickets: t };
                                });
                                return next;
                              });

                              // 3) Only clear manual override when clearing
                              if (input === "") {
                                setCellOverrides((prev) => {
                                  const copy = { ...prev };
                                  delete copy[`${row}-${col}`];
                                  return copy;
                                });
                              }
                            } else if (activeCheckbox) {
                              // Single-number edit
                              setCheckboxInputs((prev) => {
                                const updated = { ...prev };
                                if (!updated[activeCheckbox])
                                  updated[activeCheckbox] = {};
                                if (input === "" || input == null) {
                                  delete updated[activeCheckbox][inputIndex];
                                } else {
                                  updated[activeCheckbox][inputIndex] = input;
                                }
                                return updated;
                              });

                              // Mirror into storeByNum (persist)
                              const idxKey = String(row * 10 + col).padStart(
                                2,
                                "0"
                              );
                              setStoreByNum((prev) => {
                                const slot = ensureSlot(activeCheckbox);
                                const t = { ...(slot.tickets || {}) };

                                const rv =
                                  slot.rowHeader?.[row] ??
                                  rowHeaders[row] ??
                                  "";
                                const cv =
                                  slot.columnHeader?.[col] ??
                                  columnHeaders[col] ??
                                  "";
                                const rNum = parseInt(rv || "0", 10);
                                const cNum = parseInt(cv || "0", 10);
                                const headerSum =
                                  (rv ? rNum : 0) + (cv ? cNum : 0);

                                if (input === "" || input == null) {
                                  // remove the manual+header value (header-only still comes from expandHeaderTickets at save time)
                                  delete t[`${activeCheckbox}-${idxKey}`];
                                } else {
                                  const manual = parseInt(input || "0", 10);
                                  t[`${activeCheckbox}-${idxKey}`] = String(
                                    manual + headerSum
                                  );
                                }

                                return {
                                  ...prev,
                                  [activeCheckbox]: { ...slot, tickets: t },
                                };
                              });

                              // Only clear manual override when clearing
                              if (input === "") {
                                setCellOverrides((prev) => {
                                  const copy = { ...prev };
                                  delete copy[`${row}-${col}`];
                                  return copy;
                                });
                              }
                            } else {
                              // Manual override (no checkbox/col-group)
                              updateOverride(`${row}-${col}`, input);
                            }
                          }}
                          disabled={
                            isFPMode
                              ? false
                              : activeTypeFilter === "odd"
                              ? !isOddIndex(row, col)
                              : activeTypeFilter === "even"
                              ? !isEvenIndex(row, col)
                              : activeTypeFilter === "all"
                              ? false
                              : !activeCheckbox && !activeColGroup
                          }
                        />
                      </td>
                    ))}
                    <td className="bg-transparent"></td>
                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-sm bg-gradient-to-r from-yellow-200 to-yellow-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-yellow-400">
                        {updatedQuantity[row]}
                      </div>
                    </td>

                    <td className="p-1 text-center">
                      <div className="w-16 h-8 rounded-sm bg-gradient-to-r from-pink-200 to-pink-300 text-slate-900 font-bold flex items-center justify-center mx-auto shadow-lg border border-pink-400">
                        {updatedPoints[row]}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-800/40 border-t-2 border-purple-500/50">
                  <td
                    colSpan={10 + 2}
                    className="p-1 text-center font-bold text-purple-300"
                  >
          <div className="flex items-center mt-1 gap-3 ">
            <div className="flex-1 ">
              <input
                type="text"
                placeholder="Transaction No/Bar Code"
                value={transactionInput}
                onChange={(e) => setTransactionInput(e.target.value)}
                className="w-full py-1 px-5 rounded-sm bg-slate-700/90 text-white font-semibold placeholder-purple-300 border-2 border-purple-500/50 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 outline-none shadow-lg transition-all duration-200 hover:border-purple-400"
              />
            </div>
            <div className="flex-none flex gap-2">
              <button
  className="flex items-center gap-3 px-6 rounded-sm font-bold h-10 text-white bg-gradient-to-r from-green-600 to-lime-500 shadow-xl hover:from-lime-500 hover:to-green-600 transition-all duration-300 text-sm hover:scale-105 active:scale-95 hover:shadow-green-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
  disabled={!isClaimable}
  onClick={handleClaimTicket}
>
                <TrendingUp className="w-5 h-5" />
                Claim Ticket
              </button>

              <button
                className="flex items-center gap-3 px-6 py-1 rounded-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 text-sm hover:scale-105 active:scale-95 hover:shadow-purple-500/25"
                onClick={() => setAdvanceModalOpen(true)}
              >
                <Zap className="w-5 h-5" />
                Advance Draw
              </button>
            </div>
          </div>
                  </td>
                  <td className="p-1 text-center">
                    <div className="font-extrabold text-lg text-yellow-400 bg-slate-900/50 px-3 py-2 rounded-sm border border-yellow-500/50">
                      {displayTotalQuantity}
                    </div>
                  </td>
                  <td className="p-1 text-center">
                    <div className="font-extrabold text-lg text-pink-400 bg-slate-900/50 px-3 py-2 rounded-sm border border-pink-500/50">
                      {displayTotalPoints}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdvanceDrawModal
        open={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        selectedTimes={advanceDrawTimes}
        setSelectedTimes={setAdvanceDrawTimes}
        onConfirm={(selected) => setAdvanceDrawTimes(selected)}
      />
      <style jsx>{`
        .fp-highlight {
          background-color: rgba(34, 197, 94, 0.3) !important;
          border: 2px solid #22c55e !important;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5) !important;
        }
      `}</style>

      <div>
        <TicketStatusModal
          open={ticketStatusModalOpen}
          onClose={() => setTicketStatusModalOpen(false)}
          statusData={ticketStatusData}
        />

        <Navbar />
      </div>
    </div>
  );
}
